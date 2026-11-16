/**
 * Suite Automatizada de Pruebas de Producción, Despliegue en la Nube y Portafolio
 * Spec: 004 - Preparación para Producción, Despliegue en la Nube y Estándar de Portafolio
 * Cubre: RF-02, RF-03, RF-04, RF-05, RF-07.1, RF-07.2
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'jwt-test-secret';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const request = require('supertest');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = require('./index');
const db = require('./config/db');

jest.setTimeout(30000);

const SCHEMA_PATH = path.resolve(__dirname, '../database/schema.sql');
const SEED_PATH = path.resolve(__dirname, '../database/seed.sql');
const IMG_DIR = path.resolve(__dirname, '../client/public/img');
const TEST_DB_NAME = 'afrolash_schema_test';

/**
 * Divide sentencias SQL por punto y coma respetando cadenas literales y caracteres de escape.
 */
function dividirSentenciasSQL(sqlText) {
    const sentencias = [];
    let enCadena = false;
    let escape = false;
    let buffer = '';

    for (let i = 0; i < sqlText.length; i++) {
        const char = sqlText[i];

        if (escape) {
            buffer += char;
            escape = false;
            continue;
        }

        if (char === '\\') {
            buffer += char;
            escape = true;
            continue;
        }

        if (char === "'") {
            buffer += char;
            enCadena = !enCadena;
            continue;
        }

        if (char === ';' && !enCadena) {
            const trimmed = buffer.trim();
            if (trimmed) {
                sentencias.push(trimmed);
            }
            buffer = '';
            continue;
        }

        buffer += char;
    }

    const resto = buffer.trim();
    if (resto) {
        sentencias.push(resto);
    }

    return sentencias;
}

/**
 * Parsea un script SQL que pueda contener bloques DELIMITER // para triggers,
 * adaptándolo al contexto de ejecución de mysql2 y reemplazando el nombre del esquema destino.
 */
function parsearSentenciasSQL(sqlContent, targetDb) {
    let adapted = sqlContent.replace(/afrolash_db/g, targetDb);
    const sinComentariosLinea = adapted.replace(/--[^\r\n]*/g, '');

    const sentencias = [];
    const partes = sinComentariosLinea.split(/DELIMITER\s*\/\//i);

    // DDL o DML regular inicial
    const ddlInicial = partes[0];
    const lineasIniciales = dividirSentenciasSQL(ddlInicial);
    for (let l of lineasIniciales) {
        if (!l.toUpperCase().startsWith('DELIMITER')) {
            sentencias.push(l);
        }
    }

    // Triggers con delimitador //
    for (let i = 1; i < partes.length; i++) {
        const bloque = partes[i];
        const subPartes = bloque.split(/\/\/\s*DELIMITER\s*;/i);
        if (subPartes.length > 0) {
            const triggerSql = subPartes[0].trim();
            if (triggerSql) {
                sentencias.push(triggerSql);
            }
        }
        if (subPartes.length > 1) {
            const ddlRestante = subPartes[1];
            const lineasRestantes = dividirSentenciasSQL(ddlRestante);
            for (let l of lineasRestantes) {
                if (!l.toUpperCase().startsWith('DELIMITER')) {
                    sentencias.push(l);
                }
            }
        }
    }

    return sentencias.filter(s => s.length > 0);
}

describe('Suite de Producción, Despliegue en la Nube y Verificación Integral (Spec 004)', () => {
    let adminConnection;

    beforeAll(async () => {
        // Conexión administrativa para validación aislada de schema.sql y seed.sql
        try {
            adminConnection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                port: process.env.DB_PORT || 3306,
                multipleStatements: true
            });

            await adminConnection.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
            await adminConnection.query(`CREATE DATABASE ${TEST_DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            await adminConnection.query(`USE ${TEST_DB_NAME}`);
        } catch (err) {
            console.error('Error inicializando conexión administrativa de prueba:', err.message);
        }
    });

    afterAll(async () => {
        if (adminConnection) {
            try {
                await adminConnection.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
            } catch (_) {}
            await adminConnection.end();
        }
        await db.end();
    });

    // =========================================================================
    // 1. Endpoint /api/health y CORS dual (RF-04, RF-07.1)
    // =========================================================================
    describe('1. Endpoint de Salud /api/health y CORS Dual', () => {
        it('GET /api/health responde HTTP 200 OK JSON con { status: "ok", database: "connected" } y timestamp ISO válido', async () => {
            const res = await request(app).get('/api/health');

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.database).toBe('connected');
            expect(res.body.timestamp).toBeDefined();
            expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
        });

        it('GET /api/health admite orígenes externos arbitrarios sin bloqueo CORS emitiendo access-control-allow-origin: *', async () => {
            const resHealth = await request(app)
                .get('/api/health')
                .set('Origin', 'https://uptimerobot.com');

            expect(resHealth.status).toBe(200);
            expect(resHealth.headers['access-control-allow-origin']).toBe('*');
            expect(resHealth.body.status).toBe('ok');
            expect(resHealth.body.database).toBe('connected');
        });

        it('Rutas de negocio rechazan orígenes no listados con HTTP 403 Forbidden preservando CORS restrictivo', async () => {
            const resNegocio = await request(app)
                .get('/api/productos')
                .set('Origin', 'https://uptimerobot.com');

            expect(resNegocio.status).toBe(403);
            expect(resNegocio.headers['access-control-allow-origin']).toBeUndefined();
            expect(resNegocio.body.mensaje).toBe('Acceso denegado por política de origen (CORS).');
        });

        it('GET /api/health responde HTTP 503 Service Unavailable y oculta detalles internos ante fallas de base de datos', async () => {
            const spyDb = jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('Simulated DB Failure secret_pass_123'));

            try {
                const res = await request(app).get('/api/health');

                expect(res.status).toBe(503);
                expect(res.body.status).toBe('error');
                expect(res.body.database).toBe('disconnected');
                expect(res.body.timestamp).toBeDefined();
                expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);

                const cuerpoTexto = JSON.stringify(res.body);
                expect(cuerpoTexto).not.toContain('secret_pass_123');
                expect(cuerpoTexto).not.toContain('Simulated DB Failure');
                expect(res.body.stack).toBeUndefined();
            } finally {
                spyDb.mockRestore();
            }
        });
    });

    // =========================================================================
    // 2. Servido estático público de imágenes bajo /img con CORP (RF-02.1, RF-07.1)
    // =========================================================================
    describe('2. Servido Estático de Imágenes bajo /img con Cabecera CORP', () => {
        it('GET /img/rimel.png responde HTTP 200 OK con cabeceras CORP y CORS permisivas', async () => {
            const res = await request(app)
                .get('/img/rimel.png')
                .set('Origin', 'https://plataforma-externa.com');

            expect(res.status).toBe(200);
            expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
            expect(res.headers['access-control-allow-origin']).toBe('*');
            expect(res.headers['content-type']).toMatch(/image\/(png|webp|jpeg)/);
            expect(res.body.length).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // 3. Helpers de Configuración en la Nube (RF-02.2, RF-03.1, RF-07.1)
    // =========================================================================
    describe('3. Helpers Unitarios de Configuración en la Nube', () => {
        it('app.parsearTrustProxy parsea de forma segura enteros positivos o desactiva en local', () => {
            const parsear = app.parsearTrustProxy;
            expect(typeof parsear).toBe('function');

            // Valores verdaderos / numéricos
            expect(parsear('true')).toBe(1);
            expect(parsear('TRUE')).toBe(1);
            expect(parsear(' 1 ')).toBe(1);
            expect(parsear('1')).toBe(1);
            expect(parsear(1)).toBe(1);
            expect(parsear('2')).toBe(2);
            expect(parsear(2)).toBe(2);
            expect(parsear('3')).toBe(3);

            // Valores falsos / nulos / no configurados
            expect(parsear('false')).toBe(false);
            expect(parsear('FALSE')).toBe(false);
            expect(parsear('0')).toBe(false);
            expect(parsear(0)).toBe(false);
            expect(parsear(undefined)).toBe(false);
            expect(parsear(null)).toBe(false);
            expect(parsear('')).toBe(false);
            expect(parsear('invalid')).toBe(false);
            expect(parsear('-1')).toBe(false);
        });

        it('db.construirOpcionesSSL construye configuración TLS/SSL estricta sólo cuando DB_SSL="true"', () => {
            const construirSSL = db.construirOpcionesSSL;
            expect(typeof construirSSL).toBe('function');

            // DB_SSL activado sin rejectUnauthorized explícito (default false para clouds gratuitos)
            expect(construirSSL({ DB_SSL: 'true' })).toEqual({ rejectUnauthorized: false });
            expect(construirSSL({ DB_SSL: 'TRUE' })).toEqual({ rejectUnauthorized: false });

            // DB_SSL activado con rejectUnauthorized explícito
            expect(construirSSL({ DB_SSL: 'true', DB_SSL_REJECT_UNAUTHORIZED: 'true' })).toEqual({ rejectUnauthorized: true });
            expect(construirSSL({ DB_SSL: 'true', DB_SSL_REJECT_UNAUTHORIZED: 'false' })).toEqual({ rejectUnauthorized: false });

            // DB_SSL desactivado o ausente
            expect(construirSSL({ DB_SSL: 'false' })).toBeUndefined();
            expect(construirSSL({})).toBeUndefined();
            expect(construirSSL(null)).toBeUndefined();
            expect(construirSSL(undefined)).toBeUndefined();
        });
    });

    // =========================================================================
    // 4. Tablas SQL en Minúsculas y Cero Regresiones DML (RF-03.3, RF-07.1)
    // =========================================================================
    describe('4. Estandarización de Tablas SQL en Minúsculas', () => {
        it('Ejecuta lecturas sobre productos y usuarios en minúsculas en MySQL sin errores', async () => {
            const [prodRows] = await db.query('SELECT COUNT(*) as total FROM productos');
            expect(Number(prodRows[0].total)).toBeGreaterThanOrEqual(0);

            const [userRows] = await db.query('SELECT COUNT(*) as total FROM usuarios');
            expect(Number(userRows[0].total)).toBeGreaterThanOrEqual(0);
        });

        it('Verificación estática: los controladores no contienen nombres físicos de tablas SQL con mayúscula', () => {
            const controladoresDir = path.resolve(__dirname, 'controllers');
            const archivos = fs.readdirSync(controladoresDir).filter(f => f.endsWith('.js'));

            const regexMayus = /\b(?:FROM|INTO|UPDATE|JOIN)\s+`?(Usuarios|Productos|Pedidos|Detalles_pedido|Auditoria)`?\b/;

            for (const archivo of archivos) {
                const contenido = fs.readFileSync(path.join(controladoresDir, archivo), 'utf8');
                const match = contenido.match(regexMayus);
                expect(match).toBeNull();
            }
        });
    });

    // =========================================================================
    // 5. Consolidación de Pruebas SQL de schema.sql y seed.sql (RF-05, RF-07.2)
    // =========================================================================
    describe('5. Consolidación de Scripts SQL: database/schema.sql y database/seed.sql', () => {
        it('Ejecuta database/schema.sql dos veces seguidas sin errores (idempotencia DDL y triggers)', async () => {
            const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
            const sentencias = parsearSentenciasSQL(schemaSql, TEST_DB_NAME);

            // Primera ejecución
            for (const sql of sentencias) {
                await adminConnection.query(sql);
            }

            // Segunda ejecución (prueba de idempotencia estricta)
            for (const sql of sentencias) {
                await expect(adminConnection.query(sql)).resolves.toBeDefined();
            }

            // Verificar existencia de las 5 tablas físicas en minúsculas
            const [tablas] = await adminConnection.query(
                `SELECT table_name FROM information_schema.tables WHERE table_schema = ?`,
                [TEST_DB_NAME]
            );
            const nombresTablas = tablas.map(t => t.TABLE_NAME || t.table_name);
            expect(nombresTablas).toContain('usuarios');
            expect(nombresTablas).toContain('productos');
            expect(nombresTablas).toContain('pedidos');
            expect(nombresTablas).toContain('detalles_pedido');
            expect(nombresTablas).toContain('auditoria');
        });

        it('Ejecuta database/seed.sql dos veces seguidas sin duplicaciones ni errores (idempotencia DML)', async () => {
            const seedSql = fs.readFileSync(SEED_PATH, 'utf8');
            const sentencias = parsearSentenciasSQL(seedSql, TEST_DB_NAME);

            // Primera ejecución
            for (const sql of sentencias) {
                await adminConnection.query(sql);
            }

            // Segunda ejecución (prueba de idempotencia DML)
            for (const sql of sentencias) {
                await expect(adminConnection.query(sql)).resolves.toBeDefined();
            }

            // Verificar que hay exactamente 3 usuarios creados
            const [usuarios] = await adminConnection.query(`SELECT correo, rol, password FROM usuarios ORDER BY id_usuario`);
            expect(usuarios.length).toBe(3);

            // Verificar que hay exactamente 4 productos creados
            const [productos] = await adminConnection.query(`SELECT nombre, stock, precio, imagen_url FROM productos ORDER BY id_producto`);
            expect(productos.length).toBe(4);
        });

        it('Valida que las contraseñas de demostración coinciden con sus hashes mediante bcrypt.compare sin alterar el archivo en disco', async () => {
            const [admin] = await adminConnection.query(`SELECT password FROM usuarios WHERE correo = 'admin@afrolash.com' AND rol = 'admin'`);
            expect(admin.length).toBe(1);
            expect(await bcrypt.compare('AdminAfro2026', admin[0].password)).toBe(true);

            const [empleado] = await adminConnection.query(`SELECT password FROM usuarios WHERE correo = 'empleado@afrolash.com' AND rol = 'empleado'`);
            expect(empleado.length).toBe(1);
            expect(await bcrypt.compare('EmpleadoAfro2026', empleado[0].password)).toBe(true);

            const [cliente] = await adminConnection.query(`SELECT password FROM usuarios WHERE correo = 'cliente@afrolash.com' AND rol = 'cliente'`);
            expect(cliente.length).toBe(1);
            expect(await bcrypt.compare('ClienteAfro2026', cliente[0].password)).toBe(true);
        });

        it('Valida que los productos semilla tienen los datos requeridos y sus imágenes existen en disco', async () => {
            const [productos] = await adminConnection.query(`SELECT nombre, precio, stock, imagen_url, imagen_instrucciones FROM productos`);

            const mapa = {};
            for (const p of productos) {
                mapa[p.nombre] = p;
            }

            expect(mapa['Rímel Volumen Extremo']).toBeDefined();
            expect(Number(mapa['Rímel Volumen Extremo'].precio)).toBe(12.50);
            expect(Number(mapa['Rímel Volumen Extremo'].stock)).toBe(32);
            expect(mapa['Rímel Volumen Extremo'].imagen_url).toBe('/img/rimel.png');

            expect(mapa['Lápiz Perfilador de Cejas']).toBeDefined();
            expect(Number(mapa['Lápiz Perfilador de Cejas'].precio)).toBe(8.00);
            expect(Number(mapa['Lápiz Perfilador de Cejas'].stock)).toBe(21);

            expect(mapa['Sérum Crecimiento']).toBeDefined();
            expect(Number(mapa['Sérum Crecimiento'].precio)).toBe(24.00);
            expect(Number(mapa['Sérum Crecimiento'].stock)).toBe(39);

            expect(mapa['Uñas Postizas 48u']).toBeDefined();
            expect(Number(mapa['Uñas Postizas 48u'].precio)).toBe(7.15);
            expect(Number(mapa['Uñas Postizas 48u'].stock)).toBe(47);

            // Verificar existencia física en client/public/img/
            for (const p of productos) {
                if (p.imagen_url && p.imagen_url.startsWith('/img/')) {
                    const nombreArchivo = p.imagen_url.replace('/img/', '');
                    const rutaFisica = path.join(IMG_DIR, nombreArchivo);
                    expect(fs.existsSync(rutaFisica)).toBe(true);
                }
                if (p.imagen_instrucciones && p.imagen_instrucciones.startsWith('/img/')) {
                    const nombreArchivo = p.imagen_instrucciones.replace('/img/', '');
                    const rutaFisica = path.join(IMG_DIR, nombreArchivo);
                    expect(fs.existsSync(rutaFisica)).toBe(true);
                }
            }
        });

        it('Valida que los 6 disparadores de auditoría registran eventos correctamente con formato estricto', async () => {
            // 1. trg_productos_update (verificación de Stock anterior: ... -> Nuevo: ...)
            const [prod] = await adminConnection.query(`SELECT id_producto, stock FROM productos WHERE nombre = 'Rímel Volumen Extremo'`);
            const idProd = prod[0].id_producto;
            const stockViejo = prod[0].stock;

            await adminConnection.query(`UPDATE productos SET stock = ? WHERE id_producto = ?`, [stockViejo + 5, idProd]);

            const [audStock] = await adminConnection.query(
                `SELECT * FROM auditoria WHERE tabla_afectada = 'Productos' AND accion = 'UPDATE' AND registro_id = ? ORDER BY id_auditoria DESC LIMIT 1`,
                [idProd]
            );
            expect(audStock.length).toBe(1);
            expect(audStock[0].detalles).toContain(`Stock anterior: ${stockViejo} -> Nuevo: ${stockViejo + 5}`);

            // 2. trg_productos_insert
            const [nuevoProd] = await adminConnection.query(
                `INSERT INTO productos (nombre, precio, stock, estado) VALUES ('Producto Trigger Test', 15.00, 10, 1)`
            );
            const [audProdIns] = await adminConnection.query(
                `SELECT * FROM auditoria WHERE tabla_afectada = 'Productos' AND accion = 'INSERT' AND registro_id = ?`,
                [nuevoProd.insertId]
            );
            expect(audProdIns.length).toBe(1);
            expect(audProdIns[0].detalles).toContain('Producto creado: Producto Trigger Test');

            // 3. trg_productos_delete
            await adminConnection.query(`DELETE FROM productos WHERE id_producto = ?`, [nuevoProd.insertId]);
            const [audProdDel] = await adminConnection.query(
                `SELECT * FROM auditoria WHERE tabla_afectada = 'Productos' AND accion = 'DELETE' AND registro_id = ?`,
                [nuevoProd.insertId]
            );
            expect(audProdDel.length).toBe(1);
            expect(audProdDel[0].detalles).toContain('Producto eliminado: Producto Trigger Test');

            // 4. trg_usuarios_update (cambio de rol)
            const [userCli] = await adminConnection.query(`SELECT id_usuario FROM usuarios WHERE correo = 'cliente@afrolash.com'`);
            const idUser = userCli[0].id_usuario;
            await adminConnection.query(`UPDATE usuarios SET rol = 'empleado' WHERE id_usuario = ?`, [idUser]);
            const [audUserUpd] = await adminConnection.query(
                `SELECT * FROM auditoria WHERE tabla_afectada = 'Usuarios' AND accion = 'UPDATE' AND registro_id = ?`,
                [idUser]
            );
            expect(audUserUpd.length).toBe(1);
            expect(audUserUpd[0].detalles).toContain('Rol anterior: cliente -> Nuevo: empleado');

            // 5. trg_usuarios_delete
            const [tempUser] = await adminConnection.query(
                `INSERT INTO usuarios (nombre_completo, correo, password, rol) VALUES ('Temp Borrar', 'temp@borrar.com', 'pwd123', 'cliente')`
            );
            await adminConnection.query(`DELETE FROM usuarios WHERE id_usuario = ?`, [tempUser.insertId]);
            const [audUserDel] = await adminConnection.query(
                `SELECT * FROM auditoria WHERE tabla_afectada = 'Usuarios' AND accion = 'DELETE' AND registro_id = ?`,
                [tempUser.insertId]
            );
            expect(audUserDel.length).toBe(1);
            expect(audUserDel[0].detalles).toContain('Usuario eliminado: Temp Borrar');

            // 6. trg_pedidos_update
            const [nuevoPed] = await adminConnection.query(
                `INSERT INTO pedidos (id_usuario, total, estado) VALUES (?, 50.00, 'pendiente')`,
                [idUser]
            );
            await adminConnection.query(`UPDATE pedidos SET estado = 'pagado' WHERE id_pedido = ?`, [nuevoPed.insertId]);
            const [audPedUpd] = await adminConnection.query(
                `SELECT * FROM auditoria WHERE tabla_afectada = 'Pedidos' AND accion = 'UPDATE' AND registro_id = ?`,
                [nuevoPed.insertId]
            );
            expect(audPedUpd.length).toBe(1);
            expect(audPedUpd[0].detalles).toContain('Estado anterior: pendiente -> Nuevo: pagado');
        });
    });
});
