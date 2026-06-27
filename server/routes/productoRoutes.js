const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Configuración para recibir múltiples imágenes desde el formulario
const cpUpload = uploadMiddleware.fields([
    { name: 'imagen', maxCount: 1 }, 
    { name: 'imagen_instrucciones', maxCount: 1 }, 
    { name: 'imagen_consejos', maxCount: 1 }
]);

// RUTAS PÚBLICAS GENERALES
router.get('/', productoController.obtenerProductos); 

// RUTAS PRIVADAS (Solo Administradores)
// IMPORTANTE: Deben declararse antes de cualquier ruta dinámica con /:id
router.get('/admin', authMiddleware, adminMiddleware, productoController.obtenerTodosLosProductos);
router.post('/', authMiddleware, adminMiddleware, cpUpload, productoController.crearProducto);
router.put('/:id', authMiddleware, adminMiddleware, cpUpload, productoController.actualizarProducto);
router.patch('/:id/estado', authMiddleware, adminMiddleware, productoController.cambiarEstadoProducto);
router.delete('/:id', authMiddleware, adminMiddleware, productoController.eliminarProducto);

// RUTAS PÚBLICAS INDIVIDUALES
// Se coloca al final para evitar que intercepte palabras clave como "admin"
router.get('/:id', productoController.obtenerProductoPorId); 

module.exports = router;