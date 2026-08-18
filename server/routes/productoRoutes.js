const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const verificarPersonal = require('../middleware/verificarPersonal'); // NUEVO MIDDLEWARE
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Configuración para recibir múltiples imágenes desde el formulario
const cpUpload = uploadMiddleware.fields([
    { name: 'imagen', maxCount: 1 }, 
    { name: 'imagen_instrucciones', maxCount: 1 }, 
    { name: 'imagen_consejos', maxCount: 1 }
]);

// RUTAS PÚBLICAS GENERALES
router.get('/', productoController.obtenerProductos); 

// RUTAS PRIVADAS (Panel de Control)
// IMPORTANTE: Deben declararse antes de cualquier ruta dinámica con /:id

// Lectura de inventario permitida para Administradores y Empleados
router.get('/admin', authMiddleware, verificarPersonal, productoController.obtenerTodosLosProductos);

// Escritura y eliminación exclusivas para Administradores
router.post('/', authMiddleware, adminMiddleware, cpUpload, productoController.crearProducto);
router.put('/:id', authMiddleware, adminMiddleware, cpUpload, productoController.actualizarProducto);
router.patch('/:id/estado', authMiddleware, adminMiddleware, productoController.cambiarEstadoProducto);
router.delete('/:id', authMiddleware, adminMiddleware, productoController.eliminarProducto);

// RUTAS PÚBLICAS INDIVIDUALES
// Se coloca al final para evitar que intercepte palabras clave como "admin"
router.get('/:id', productoController.obtenerProductoPorId); 

module.exports = router;