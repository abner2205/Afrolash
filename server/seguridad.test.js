/**
 * Suite Automatizada de Pruebas de Integración de Seguridad y Hardening Web
 * Spec: 003 - Seguridad y Hardening Web (RF-01 a RF-07)
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'jwt-test-secret';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const mockSendMail = jest.fn().mockImplementation(() => {
    return Promise.resolve({ messageId: 'mock-email-id-12345' });
});

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: (...args) => mockSendMail(...args)
    }))
}));

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = require('./index');
const db = require('./config/db');
const {
    escaparHtml,
    auditarVariablesEntorno
} = require('./utils/seguridadUtils');

jest.setTimeout(30000);

describe('Suite de Integración: Seguridad y Hardening Web (Spec 003)', () => {
    const imgDir = path.join(__dirname, '../client/public/img');

    // Registro de identificadores y rutas creadas para limpieza atómica garantizada (RF-07)
    const creados = {
        usuarios: new Set(),
        productos: new Set(),
        pedidos: new Set(),
        archivos: new Set()
    };

    let tokenAdminTest;
    let tokenClienteTest;
    let usuarioClienteId;
    let usuarioVictimaId;

    function generarToken(payload, opciones = { expiresIn: '1h' }) {
        return jwt.sign(payload, process.env.JWT_SECRET, opciones);
    }

    async function crearUsuarioEnBD({ nombre, correo, password = 'Password123', rol = 'cliente' }) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const [resultado] = await db.query(
            'INSERT INTO Usuarios (nombre_completo, correo, password, rol, direccion, telefono) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, correo.toLowerCase(), hash, rol, 'Calle Test 123', '04141234567']
        );
        const id = resultado.insertId;
        creados.usuarios.add(id);
        return { id_usuario: id, nombre, correo: correo.toLowerCase(), rol };
    }

    async function crearProductoEnBD({ nombre, precio, stock, estado = 1 }) {
        const [resultado] = await db.query(
            'INSERT INTO Productos (nombre, precio, stock, estado) VALUES (?, ?, ?, ?)',
            [nombre, precio, stock, estado]
        );
        const id = resultado.insertId;
        creados.productos.add(id);
        return { id_producto: id, nombre, precio, stock, estado };
    }

    beforeAll(async () => {
        // Asegurar que el directorio de imágenes exista para las pruebas
        fs.mkdirSync(imgDir, { recursive: true });

        // Crear usuarios iniciales para pruebas
        const admin = await crearUsuarioEnBD({
            nombre: 'Admin Seguridad Test',
            correo: `admin_seg_${Date.now()}@afrolash.test`,
            rol: 'admin'
        });
        tokenAdminTest = generarToken({ id: admin.id_usuario, rol: 'admin' });

        const cliente = await crearUsuarioEnBD({
            nombre: 'Cliente Seguridad Test',
            correo: `cliente_seg_${Date.now()}@afrolash.test`,
            rol: 'cliente'
        });
        usuarioClienteId = cliente.id_usuario;
        tokenClienteTest = generarToken({ id: cliente.id_usuario, rol: 'cliente' });

        const victima = await crearUsuarioEnBD({
            nombre: 'Usuario Víctima Test',
            correo: `victima_seg_${Date.now()}@afrolash.test`,
            rol: 'cliente'
        });
        usuarioVictimaId = victima.id_usuario;
    });

    afterAll(async () => {
        // Limpieza garantizada en orden estricto de claves foráneas
        try {
            const idsPedidos = Array.from(creados.pedidos);
            const idsProductos = Array.from(creados.productos);
            const idsUsuarios = Array.from(creados.usuarios);

            if (idsPedidos.length > 0) {
                const placeholders = idsPedidos.map(() => '?').join(',');
                await db.query(`DELETE FROM Detalles_pedido WHERE id_pedido IN (${placeholders})`, idsPedidos);
            }

            if (idsProductos.length > 0) {
                const placeholders = idsProductos.map(() => '?').join(',');
                await db.query(`DELETE FROM Detalles_pedido WHERE id_producto IN (${placeholders})`, idsProductos);
            }

            if (idsPedidos.length > 0) {
                const placeholders = idsPedidos.map(() => '?').join(',');
                await db.query(`DELETE FROM Pedidos WHERE id_pedido IN (${placeholders})`, idsPedidos);
            }

            if (idsUsuarios.length > 0) {
                const placeholders = idsUsuarios.map(() => '?').join(',');
                await db.query(`DELETE FROM Pedidos WHERE id_usuario IN (${placeholders})`, idsUsuarios);
            }

            if (idsProductos.length > 0) {
                const placeholders = idsProductos.map(() => '?').join(',');
                await db.query(`DELETE FROM auditoria WHERE tabla_afectada = 'Productos' AND registro_id IN (${placeholders})`, idsProductos);
                await db.query(`DELETE FROM Productos WHERE id_producto IN (${placeholders})`, idsProductos);
            }

            if (idsUsuarios.length > 0) {
                const placeholders = idsUsuarios.map(() => '?').join(',');
                await db.query(`DELETE FROM auditoria WHERE tabla_afectada = 'Usuarios' AND registro_id IN (${placeholders})`, idsUsuarios);
                await db.query(`DELETE FROM Usuarios WHERE id_usuario IN (${placeholders})`, idsUsuarios);
            }

            // Limpieza de cualquier archivo físico residual registrado
            for (const ruta of creados.archivos) {
                try {
                    if (fs.existsSync(ruta)) {
                        fs.unlinkSync(ruta);
                    }
                } catch (_) {}
            }
        } catch (errorLimpieza) {
            console.error('Error durante la limpieza de la base de datos:', errorLimpieza);
        } finally {
            // Cierra el pool de conexiones de base de datos
            await db.end();
        }
    });

    // =========================================================================
    // RF-01: Cabeceras HTTP Seguras y Ocultamiento de Huella Tecnológica
    // =========================================================================
    describe('RF-01: Cabeceras HTTP de Seguridad y Ocultamiento de Huella', () => {
        it('debería emitir cabeceras de seguridad Helmet y omitir estrictamente X-Powered-By', async () => {
            const res = await request(app).get('/');

            expect(res.status).toBe(200);
            expect(res.headers['x-frame-options']).toBeDefined();
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['referrer-policy']).toBeDefined();
            expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
            expect(res.headers['x-powered-by']).toBeUndefined();
        });
    });

    // =========================================================================
    // RF-02: Política CORS Restringida por Entorno
    // =========================================================================
    describe('RF-02: Política CORS Restringida por Entorno', () => {
        it('debería admitir peticiones originadas desde http://localhost:3000 con cabeceras de control de acceso', async () => {
            const res = await request(app)
                .get('/')
                .set('Origin', 'http://localhost:3000');

            expect(res.status).toBe(200);
            expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
            expect(res.headers['access-control-allow-credentials']).toBe('true');
        });

        it('debería admitir solicitudes legítimas sin cabecera Origin (curl, CLI, server-to-server)', async () => {
            const res = await request(app).get('/');
            expect(res.status).toBe(200);
            expect(res.text).toContain('Servidor de Afrolash API funcionando correctamente');
        });

        it('debería denegar orígenes no autorizados con HTTP 403 Forbidden JSON y sin cabecera Access-Control-Allow-Origin', async () => {
            const res = await request(app)
                .get('/')
                .set('Origin', 'https://atacante.ejemplo.com');

            expect(res.status).toBe(403);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.body).toEqual({ mensaje: 'Acceso denegado por política de origen (CORS).' });
            expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    // =========================================================================
    // RF-03: Limitación de Tasa contra Fuerza Bruta y Abuso
    // =========================================================================
    describe('RF-03: Limitación de Tasa (Rate Limiting)', () => {
        it('debería permitir pruebas consecutivas en NODE_ENV=test cuando no se envía la cabecera x-test-rate-limit', async () => {
            for (let i = 0; i < 18; i++) {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({ correo: 'test_ordinario@ejemplo.com', password: 'Password123' });

                // No debe ser bloqueado con 429
                expect(res.status).not.toBe(429);
            }
        });

        it('debería bloquear con HTTP 429 Too Many Requests y cabecera Retry-After al superar 15 peticiones con x-test-rate-limit', async () => {
            // Primeras 15 peticiones permitidas por la ventana
            for (let i = 1; i <= 15; i++) {
                const res = await request(app)
                    .post('/api/auth/login')
                    .set('x-test-rate-limit', 'true')
                    .send({ correo: 'fuerza_bruta@ejemplo.com', password: 'PasswordErroneo' });

                expect(res.status).not.toBe(429);
            }

            // La petición #16 debe ser rechazada inmediatamente
            const resBloqueado = await request(app)
                .post('/api/auth/login')
                .set('x-test-rate-limit', 'true')
                .send({ correo: 'fuerza_bruta@ejemplo.com', password: 'PasswordErroneo' });

            expect(resBloqueado.status).toBe(429);
            expect(resBloqueado.headers['content-type']).toMatch(/application\/json/);
            expect(resBloqueado.headers['retry-after']).toBeDefined();
            expect(resBloqueado.body).toEqual({
                mensaje: 'Demasiadas solicitudes realizadas. Por favor, intente nuevamente más tarde.'
            });
        });
    });

    // =========================================================================
    // RF-04: Límites de Tamaño de Solicitud y Carga Segura de Archivos
    // =========================================================================
    describe('RF-04: Límites de Carga Útil JSON y Seguridad en Archivos Multimedia', () => {
        it('debería capturar cuerpos JSON malformados devolviendo HTTP 400 Bad Request JSON sin stack traces ni HTML', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set('Content-Type', 'application/json')
                .send('{"correo": "malformado", ...error_de_sintaxis');

            expect(res.status).toBe(400);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.body).toEqual({ mensaje: 'El formato JSON enviado en la solicitud es inválido.' });
        });

        it('debería rechazar cuerpos JSON mayores a 100 KB con HTTP 413 Payload Too Large JSON', async () => {
            const cargaExcesiva = { data: 'a'.repeat(105 * 1024) };

            const res = await request(app)
                .post('/api/auth/login')
                .send(cargaExcesiva);

            expect(res.status).toBe(413);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.body).toEqual({ mensaje: 'El tamaño de la solicitud excede el límite permitido.' });
        });

        it('debería rechazar archivos mayores a 2 MB en POST /api/productos con HTTP 413 JSON y sin archivos residuales', async () => {
            const archivosPrevios = new Set(fs.readdirSync(imgDir));
            const bufferMayor2MB = Buffer.alloc(2.2 * 1024 * 1024, 'a');

            const res = await request(app)
                .post('/api/productos')
                .set('Authorization', `Bearer ${tokenAdminTest}`)
                .field('nombre', 'Producto Archivo Gigante')
                .field('precio', '19.99')
                .field('stock', '10')
                .attach('imagen', bufferMayor2MB, { filename: 'foto_pesada.jpg', contentType: 'image/jpeg' });

            expect(res.status).toBe(413);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.body).toEqual({ mensaje: 'El archivo excede el tamaño máximo permitido de 2 MB.' });

            const archivosPosteriores = fs.readdirSync(imgDir);
            const nuevosArchivos = archivosPosteriores.filter(f => !archivosPrevios.has(f));
            expect(nuevosArchivos).toEqual([]);
        });

        it('debería rechazar formatos no permitidos (.txt / .svg) con HTTP 400 JSON y sin archivos residuales', async () => {
            const archivosPrevios = new Set(fs.readdirSync(imgDir));

            const res = await request(app)
                .post('/api/productos')
                .set('Authorization', `Bearer ${tokenAdminTest}`)
                .field('nombre', 'Producto SVG No Permitido')
                .field('precio', '12.50')
                .field('stock', '5')
                .attach('imagen', Buffer.from('<svg></svg>'), { filename: 'vector.svg', contentType: 'image/svg+xml' });

            expect(res.status).toBe(400);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.body.mensaje).toMatch(/Formato no válido/);

            const archivosPosteriores = fs.readdirSync(imgDir);
            const nuevosArchivos = archivosPosteriores.filter(f => !archivosPrevios.has(f));
            expect(nuevosArchivos).toEqual([]);
        });

        it('debería rechazar campos de archivo inesperados con HTTP 400 JSON y sin archivos residuales', async () => {
            const archivosPrevios = new Set(fs.readdirSync(imgDir));

            const res = await request(app)
                .post('/api/productos')
                .set('Authorization', `Bearer ${tokenAdminTest}`)
                .field('nombre', 'Producto Campo Extra')
                .field('precio', '15.00')
                .field('stock', '5')
                .attach('campo_no_autorizado', Buffer.from('contenido'), { filename: 'foto.png', contentType: 'image/png' });

            expect(res.status).toBe(400);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.body.mensaje).toMatch(/límite máximo de 3 archivos o se envió un campo de archivo no permitido/);

            const archivosPosteriores = fs.readdirSync(imgDir);
            const nuevosArchivos = archivosPosteriores.filter(f => !archivosPrevios.has(f));
            expect(nuevosArchivos).toEqual([]);
        });

        it('debería limpiar físicamente en disco la primera imagen válida si el segundo archivo es rechazado a mitad de proceso', async () => {
            const archivosPrevios = new Set(fs.readdirSync(imgDir));

            const res = await request(app)
                .post('/api/productos')
                .set('Authorization', `Bearer ${tokenAdminTest}`)
                .field('nombre', 'Producto Mixto Inválido')
                .field('precio', '25.00')
                .field('stock', '8')
                .attach('imagen', Buffer.from([0x89, 0x50, 0x4E, 0x47]), { filename: 'valida.png', contentType: 'image/png' })
                .attach('imagen_instrucciones', Buffer.from('archivo texto'), { filename: 'invalido.txt', contentType: 'text/plain' });

            expect(res.status).toBe(400);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.body.mensaje).toMatch(/Formato no válido/);

            const archivosPosteriores = fs.readdirSync(imgDir);
            const nuevosArchivos = archivosPosteriores.filter(f => !archivosPrevios.has(f));
            expect(nuevosArchivos).toEqual([]);
        });
    });

    // =========================================================================
    // RF-05: Inmunidad IDOR, Anti-Price Tampering y Transaccionalidad Atómica
    // =========================================================================
    describe('RF-05: Transaccionalidad Atómica, Anti-IDOR, Anti-Price Tampering y Pagos', () => {
        it('debería rechazar montos <= 0 o no numéricos en POST /api/pagos/crear-intencion con HTTP 400 JSON', async () => {
            const resCero = await request(app)
                .post('/api/pagos/crear-intencion')
                .set('Authorization', `Bearer ${tokenClienteTest}`)
                .send({ total: 0 });

            expect(resCero.status).toBe(400);
            expect(resCero.body).toEqual({ mensaje: 'El monto total es inválido para procesar el pago.' });

            const resNegativo = await request(app)
                .post('/api/pagos/crear-intencion')
                .set('Authorization', `Bearer ${tokenClienteTest}`)
                .send({ total: -15.5 });

            expect(resNegativo.status).toBe(400);
            expect(resNegativo.body).toEqual({ mensaje: 'El monto total es inválido para procesar el pago.' });

            const resInvalido = await request(app)
                .post('/api/pagos/crear-intencion')
                .set('Authorization', `Bearer ${tokenClienteTest}`)
                .send({ total: 'gratis' });

            expect(resInvalido.status).toBe(400);
            expect(resInvalido.body).toEqual({ mensaje: 'El monto total es inválido para procesar el pago.' });
        });

        it('debería rechazar pedidos con carrito vacío o cantidades no enteras/menores a 1 con HTTP 400 JSON', async () => {
            const resVacio = await request(app)
                .post('/api/pedidos/procesar')
                .set('Authorization', `Bearer ${tokenClienteTest}`)
                .send({ carrito: [], direccion_envio: 'Av Principal', telefono_contacto: '04141112233' });

            expect(resVacio.status).toBe(400);
            expect(resVacio.body.mensaje).toMatch(/inválidos/);

            const resCantidadCero = await request(app)
                .post('/api/pedidos/procesar')
                .set('Authorization', `Bearer ${tokenClienteTest}`)
                .send({
                    carrito: [{ id_producto: 1, cantidad: 0 }],
                    direccion_envio: 'Av Principal',
                    telefono_contacto: '04141112233'
                });

            expect(resCantidadCero.status).toBe(400);
            expect(resCantidadCero.body.mensaje).toMatch(/enteros válidos/);

            const resFaltaDatos = await request(app)
                .post('/api/pedidos/procesar')
                .set('Authorization', `Bearer ${tokenClienteTest}`)
                .send({
                    carrito: [{ id_producto: 1, cantidad: 1 }],
                    direccion_envio: '',
                    telefono_contacto: ''
                });

            expect(resFaltaDatos.status).toBe(400);
        });

        it('debería asociar el pedido al usuario del JWT e ignorar id_usuario ajeno en el cuerpo (Anti-IDOR)', async () => {
            const prod = await crearProductoEnBD({
                nombre: 'Cosmético Anti-IDOR Test',
                precio: 25.00,
                stock: 10
            });

            // El atacante envía usuarioVictimaId en el cuerpo
            const res = await request(app)
                .post('/api/pedidos/procesar')
                .set('Authorization', `Bearer ${tokenClienteTest}`)
                .send({
                    id_usuario: usuarioVictimaId,
                    carrito: [{ id_producto: prod.id_producto, cantidad: 1, precio: 0.01 }],
                    direccion_envio: 'Calle Verdadera 456',
                    telefono_contacto: '04123334455'
                });

            expect(res.status).toBe(201);
            const idPedido = res.body.id_pedido;
            expect(idPedido).toBeDefined();
            creados.pedidos.add(idPedido);

            // Verificar en la BD que el pedido se registró a nombre de usuarioClienteId y NO de usuarioVictimaId
            const [pedidos] = await db.query('SELECT id_usuario FROM Pedidos WHERE id_pedido = ?', [idPedido]);
            expect(pedidos.length).toBe(1);
            expect(pedidos[0].id_usuario).toBe(usuarioClienteId);
            expect(pedidos[0].id_usuario).not.toBe(usuarioVictimaId);
        });

        it('debería recalcular el importe total desde los precios autoritativos de la BD (Anti-Price Tampering)', async () => {
            const precioOficial = 35.50;
            const cantidadComprada = 2;
            const prod = await crearProductoEnBD({
                nombre: 'Cosmético Anti-Tampering Test',
                precio: precioOficial,
                stock: 10
            });

            // El cliente intenta enviar un total manipulado de $0.01 y precio de $0.005
            const res = await request(app)
                .post('/api/pedidos/procesar')
                .set('Authorization', `Bearer ${tokenClienteTest}`)
                .send({
                    total: 0.01,
                    carrito: [{ id_producto: prod.id_producto, cantidad: cantidadComprada, precio: 0.005, subtotal: 0.01 }],
                    direccion_envio: 'Calle Real 789',
                    telefono_contacto: '04169998877'
                });

            expect(res.status).toBe(201);
            const idPedido = res.body.id_pedido;
            creados.pedidos.add(idPedido);

            // Verificar total recalculado en Pedidos
            const [pedidos] = await db.query('SELECT total FROM Pedidos WHERE id_pedido = ?', [idPedido]);
            const totalEsperado = Number((precioOficial * cantidadComprada).toFixed(2));
            expect(Number(pedidos[0].total)).toBe(totalEsperado);
            expect(Number(pedidos[0].total)).not.toBe(0.01);

            // Verificar precio_unitario oficial en Detalles_pedido
            const [detalles] = await db.query('SELECT precio_unitario, cantidad FROM Detalles_pedido WHERE id_pedido = ?', [idPedido]);
            expect(detalles.length).toBe(1);
            expect(Number(detalles[0].precio_unitario)).toBe(precioOficial);
            expect(detalles[0].cantidad).toBe(cantidadComprada);
        });

        it('debería abortar con HTTP 409 Conflict si el stock es insuficiente sin alterar inventario ni crear pedidos', async () => {
            const stockDisponible = 2;
            const prod = await crearProductoEnBD({
                nombre: 'Cosmético Stock Insuficiente Test',
                precio: 18.00,
                stock: stockDisponible
            });

            const res = await request(app)
                .post('/api/pedidos/procesar')
                .set('Authorization', `Bearer ${tokenClienteTest}`)
                .send({
                    carrito: [{ id_producto: prod.id_producto, cantidad: 5 }],
                    direccion_envio: 'Av Bolívar 100',
                    telefono_contacto: '04140001122'
                });

            expect(res.status).toBe(409);
            expect(res.headers['content-type']).toMatch(/application\/json/);
            expect(res.body.mensaje).toMatch(/Stock insuficiente/);

            // Verificar que el stock quedó intacto
            const [filas] = await db.query('SELECT stock FROM Productos WHERE id_producto = ?', [prod.id_producto]);
            expect(filas[0].stock).toBe(stockDisponible);

            // Verificar que no se insertó ninguna fila huérfana en Detalles_pedido
            const [detalles] = await db.query('SELECT * FROM Detalles_pedido WHERE id_producto = ?', [prod.id_producto]);
            expect(detalles.length).toBe(0);
        });

        it('debería representar producto agotado mediante stock = 0 preservando estado numérico 1', async () => {
            const stockInicial = 3;
            const prod = await crearProductoEnBD({
                nombre: 'Cosmético Agotado Test',
                precio: 22.00,
                stock: stockInicial,
                estado: 1
            });

            const res = await request(app)
                .post('/api/pedidos/procesar')
                .set('Authorization', `Bearer ${tokenClienteTest}`)
                .send({
                    carrito: [{ id_producto: prod.id_producto, cantidad: stockInicial }],
                    direccion_envio: 'Calle Comercio 12',
                    telefono_contacto: '04124445566'
                });

            expect(res.status).toBe(201);
            creados.pedidos.add(res.body.id_pedido);

            // El producto debe tener stock = 0 y estado numérico 1 (no 'agotado', no 0)
            const [filas] = await db.query('SELECT stock, estado FROM Productos WHERE id_producto = ?', [prod.id_producto]);
            expect(filas[0].stock).toBe(0);
            expect(Number(filas[0].estado)).toBe(1);
            expect(filas[0].estado).not.toBe('agotado');
        });

        it('debería aislar compras concurrentes del último stock (stock = 1) completando exactamente 1 orden y rechazando la otra con 409', async () => {
            const prodConcurrente = await crearProductoEnBD({
                nombre: 'Cosmético Concurrencia Test',
                precio: 40.00,
                stock: 1,
                estado: 1
            });

            const pedidoPayload = {
                carrito: [{ id_producto: prodConcurrente.id_producto, cantidad: 1 }],
                direccion_envio: 'Zona Concurrente',
                telefono_contacto: '04149991122'
            };

            // Disparar concurrentemente dos solicitudes idénticas
            const [res1, res2] = await Promise.all([
                request(app)
                    .post('/api/pedidos/procesar')
                    .set('Authorization', `Bearer ${tokenClienteTest}`)
                    .send(pedidoPayload),
                request(app)
                    .post('/api/pedidos/procesar')
                    .set('Authorization', `Bearer ${tokenClienteTest}`)
                    .send(pedidoPayload)
            ]);

            const statuses = [res1.status, res2.status].sort();
            expect(statuses).toEqual([201, 409]);

            if (res1.body.id_pedido) creados.pedidos.add(res1.body.id_pedido);
            if (res2.body.id_pedido) creados.pedidos.add(res2.body.id_pedido);

            // El inventario final debe ser 0 exacto, sin llegar jamás a valores negativos
            const [filas] = await db.query('SELECT stock, estado FROM Productos WHERE id_producto = ?', [prodConcurrente.id_producto]);
            expect(filas[0].stock).toBe(0);
            expect(Number(filas[0].estado)).toBe(1);

            // Exactamente un pedido asociado a este producto en Detalles_pedido
            const [detalles] = await db.query('SELECT * FROM Detalles_pedido WHERE id_producto = ?', [prodConcurrente.id_producto]);
            expect(detalles.length).toBe(1);
        });
    });

    // =========================================================================
    // RF-06: Validación de Entradas, Tokens, Sanitización y Secretos
    // =========================================================================
    describe('RF-06: Validación de Entradas, Sanitización contra XSS y Manejo Seguro de Tokens', () => {
        it('debería unificar la respuesta a HTTP 401 Unauthorized ante tokens ausentes, no Bearer, malformados o expirados', async () => {
            // Sin token
            const resSinToken = await request(app).get('/api/pedidos/mis-pedidos');
            expect(resSinToken.status).toBe(401);
            expect(resSinToken.body).toEqual({ mensaje: 'Token inválido o expirado.' });

            // Formato no Bearer
            const resNoBearer = await request(app)
                .get('/api/pedidos/mis-pedidos')
                .set('Authorization', 'Basic dXN1YXJpbzpjb250cmFzZW5h');
            expect(resNoBearer.status).toBe(401);
            expect(resNoBearer.body).toEqual({ mensaje: 'Token inválido o expirado.' });

            // Token manipulado criptográficamente
            const resFalso = await request(app)
                .get('/api/pedidos/mis-pedidos')
                .set('Authorization', 'Bearer token.falso.invalido');
            expect(resFalso.status).toBe(401);
            expect(resFalso.body).toEqual({ mensaje: 'Token inválido o expirado.' });

            // Token expirado (creado con vigencia en el pasado)
            const tokenExpirado = jwt.sign({ id: 1, rol: 'cliente' }, process.env.JWT_SECRET, { expiresIn: -10 });
            const resExpirado = await request(app)
                .get('/api/pedidos/mis-pedidos')
                .set('Authorization', `Bearer ${tokenExpirado}`);
            expect(resExpirado.status).toBe(401);
            expect(resExpirado.body).toEqual({ mensaje: 'Token inválido o expirado.' });
        });

        it('debería rechazar registros con contraseñas débiles o correos malformados con HTTP 400 Bad Request JSON', async () => {
            // Contraseña corta (< 8 caracteres)
            const resCorta = await request(app)
                .post('/api/auth/registro')
                .send({ nombre_completo: 'Test User', correo: 'valido@afrolash.test', password: 'Ab1' });
            expect(resCorta.status).toBe(400);
            expect(resCorta.body.mensaje).toMatch(/al menos 8 caracteres/);

            // Contraseña sin letra mayúscula
            const resSinMayus = await request(app)
                .post('/api/auth/registro')
                .send({ nombre_completo: 'Test User', correo: 'valido@afrolash.test', password: 'password123' });
            expect(resSinMayus.status).toBe(400);
            expect(resSinMayus.body.mensaje).toMatch(/al menos una letra mayúscula/);

            // Contraseña sin número
            const resSinNum = await request(app)
                .post('/api/auth/registro')
                .send({ nombre_completo: 'Test User', correo: 'valido@afrolash.test', password: 'PasswordSoloLetras' });
            expect(resSinNum.status).toBe(400);
            expect(resSinNum.body.mensaje).toMatch(/un número/);

            // Correo no válido
            const resCorreoMalo = await request(app)
                .post('/api/auth/registro')
                .send({ nombre_completo: 'Test User', correo: 'correo-sin-arroba', password: 'Password123' });
            expect(resCorreoMalo.status).toBe(400);
            expect(resCorreoMalo.body.mensaje).toMatch(/correo electrónico válido/);
        });

        it('debería rechazar restablecimiento de contraseña con contraseña débil con HTTP 400 JSON', async () => {
            const res = await request(app)
                .post('/api/auth/restablecer-password/1/tokenfalso')
                .send({ nuevaPassword: 'debil' });

            expect(res.status).toBe(400);
            expect(res.body.mensaje).toMatch(/al menos 8 caracteres/);
        });

        it('debería validar sintaxis en recuperación (400 ante sintaxis mala, 200 genérico si es válida e inexistente)', async () => {
            // Correo malformado -> 400
            const resMalo = await request(app)
                .post('/api/auth/recuperar-password')
                .send({ correo: 'correo_invalido' });
            expect(resMalo.status).toBe(400);
            expect(resMalo.body.mensaje).toMatch(/correo electrónico válido/);

            // Correo sintácticamente válido pero inexistente -> 200 genérico (anti-enumeración)
            const resInexistente = await request(app)
                .post('/api/auth/recuperar-password')
                .send({ correo: 'usuario_totalmente_fantasma_9999@afrolash.test' });
            expect(resInexistente.status).toBe(200);
            expect(resInexistente.body).toEqual({
                mensaje: 'Si el correo existe, se ha enviado un enlace de recuperación.'
            });
        });

        it('debería escapar caracteres HTML y caracteres especiales en escaparHtml', () => {
            const textoMalicioso = '<script>alert("xss")</script> & \'prueba\'';
            const escapado = escaparHtml(textoMalicioso);
            expect(escapado).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;prueba&#39;');
            expect(escaparHtml(null)).toBe('');
            expect(escaparHtml(undefined)).toBe('');
        });

        it('debería ejecutar auditarVariablesEntorno() retornando estado y lista de variables críticas', () => {
            const resultado = auditarVariablesEntorno();
            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado.criticas)).toBe(true);
            expect(Array.isArray(resultado.faltantes)).toBe(true);
            expect(typeof resultado.ok).toBe('boolean');
        });

        it('debería neutralizar inyección HTML en notificaciones por correo salientes de alta de empleado', async () => {
            mockSendMail.mockClear();

            const correoEmpleado = `empleado_xss_${Date.now()}@afrolash.test`;
            const nombreXSS = 'Empleado <script>alert("xss")</script>';

            const res = await request(app)
                .post('/api/usuarios/admin/empleado')
                .set('Authorization', `Bearer ${tokenAdminTest}`)
                .send({
                    nombre_completo: nombreXSS,
                    correo: correoEmpleado,
                    telefono: '04141112233',
                    direccion: 'Calle Segura 10'
                });

            expect(res.status).toBe(201);

            // Registrar ID de empleado para limpieza en afterAll
            const [filas] = await db.query('SELECT id_usuario FROM Usuarios WHERE correo = ?', [correoEmpleado]);
            if (filas.length > 0) {
                creados.usuarios.add(filas[0].id_usuario);
            }

            // Verificar que nodemailer recibió el correo con el HTML escapado
            expect(mockSendMail).toHaveBeenCalled();
            const ultimoLlamado = mockSendMail.mock.calls[mockSendMail.mock.calls.length - 1][0];

            expect(ultimoLlamado.html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
            expect(ultimoLlamado.html).not.toContain('<script>alert("xss")</script>');
            expect(ultimoLlamado.to).toBe(correoEmpleado);
            expect(ultimoLlamado.to).not.toMatch(/[\r\n]/);
        });
    });
});
