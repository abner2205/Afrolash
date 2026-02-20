// Importa el pool de conexión a la base de datos
const db = require('../config/db');

// Función para obtener todos los productos del catálogo
exports.obtenerProductos = async (req, res) => {
    try {
        // Ejecuta una consulta SQL asíncrona para traer los productos activos
        const [rows] = await db.query('SELECT * FROM Productos WHERE estado = 1');
        
        // Responde al frontend con los datos en formato JSON
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener el catálogo:', error.message);
        res.status(500).json({ mensaje: 'Error interno del servidor al consultar productos' });
    }
};