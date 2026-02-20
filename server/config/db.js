// Se importa la librería mysql2 con soporte para promesas (async/await)
const mysql = require('mysql2/promise');
require('dotenv').config(); // Cargamr las variables del archivo .env

// Pool de conexiones para manejar múltiples peticiones
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verifica si la conexión es exitosa al arrancar el servidor
pool.getConnection()
    .then(connection => {
        console.log('Conexión exitosa a la base de datos afrolash_db');
        connection.release(); // Libera la conexión para que otros procesos la usen
    })
    .catch(err => {
        console.error('Error conectando a la base de datos:', err.message);
    });

// Exporta el pool para usarlo en otras partes del sistema (rutas y controladores)
module.exports = pool;