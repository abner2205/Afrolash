const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// Importa los middlewares de seguridad
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const verificarPersonal = require('../middleware/verificarPersonal'); // NUEVO MIDDLEWARE

// Rutas de clientes
router.post('/procesar', authMiddleware, pedidoController.procesarPedido);
router.get('/mis-pedidos', authMiddleware, pedidoController.obtenerMisPedidos);

// Rutas operativas (Acceso para Administradores y Empleados)
router.get('/admin/todos', authMiddleware, verificarPersonal, pedidoController.obtenerTodosLosPedidos);
router.patch('/admin/:id/estado', authMiddleware, verificarPersonal, pedidoController.actualizarEstadoPedido);

module.exports = router;