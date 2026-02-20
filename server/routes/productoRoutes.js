const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// RUTAS PÚBLICAS
router.get('/', productoController.obtenerProductos); // Solo trae estado = 1

// RUTAS PRIVADAS (Solo Administradores)
router.get('/admin', authMiddleware, adminMiddleware, productoController.obtenerTodosLosProductos); // Trae todos
router.post('/', authMiddleware, adminMiddleware, uploadMiddleware.single('imagen'), productoController.crearProducto);
router.put('/:id', authMiddleware, adminMiddleware, productoController.actualizarProducto);
router.patch('/:id/estado', authMiddleware, adminMiddleware, productoController.cambiarEstadoProducto);

// Actualmente inactiva pero presente por si llega a hacer falta
router.delete('/:id', authMiddleware, adminMiddleware, productoController.eliminarProducto);

module.exports = router;