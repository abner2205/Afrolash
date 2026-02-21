const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// Importa los middlewares de seguridad
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Rutas de clientes
router.post('/procesar', authMiddleware, pedidoController.procesarPedido);
router.get('/mis-pedidos', authMiddleware, pedidoController.obtenerMisPedidos);

// Rutas exclusivas para administradores
router.get('/admin/todos', authMiddleware, adminMiddleware, pedidoController.obtenerTodosLosPedidos);
router.patch('/admin/:id/estado', authMiddleware, adminMiddleware, pedidoController.actualizarEstadoPedido);

module.exports = router;