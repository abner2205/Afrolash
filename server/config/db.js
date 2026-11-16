const path = require('path');
// Se importa la librería mysql2 con soporte para promesas (async/await)
const mysql = require('mysql2/promise');

// Carga las variables de entorno de forma resiliente desde cualquier directorio de trabajo
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Construye las opciones de conexión SSL para bases de datos MySQL en la nube (Aiven, TiDB).
 * @param {Object} [env=process.env] Objeto con variables de entorno.
 * @returns {Object|undefined} Opciones SSL si DB_SSL es 'true', o undefined en caso contrario.
 */
function construirOpcionesSSL(env = process.env) {
    if (!env) return undefined;
    if (String(env.DB_SSL).toLowerCase() === 'true') {
        return {
            rejectUnauthorized: String(env.DB_SSL_REJECT_UNAUTHORIZED).toLowerCase() === 'true'
        };
    }
    return undefined;
}

// Configuración base del pool de conexiones
const configuracionPool = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Adjunta opciones SSL condicionales únicamente cuando DB_SSL esté habilitado
const opcionesSSL = construirOpcionesSSL(process.env);
if (opcionesSSL) {
    configuracionPool.ssl = opcionesSSL;
}

// Pool de conexiones para manejar múltiples peticiones
const pool = mysql.createPool(configuracionPool);

// Verifica si la conexión es exitosa al arrancar el servidor
pool.getConnection()
    .then(connection => {
        console.log('Conexión exitosa a la base de datos afrolash_db');
        connection.release(); // Libera la conexión para que otros procesos la usen
    })
    .catch(err => {
        console.error('Error conectando a la base de datos:', err.message);
    });

// Expone la función de construcción de opciones SSL para pruebas unitarias
pool.construirOpcionesSSL = construirOpcionesSSL;

// Exporta el pool para usarlo en otras partes del sistema (rutas y controladores)
module.exports = pool;
