const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// Importa los middlewares de seguridad
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware'); // Asegúrate de importar esto

// Rutas de clientes
router.post('/procesar', authMiddleware, pedidoController.procesarPedido);
router.get('/mis-pedidos', authMiddleware, pedidoController.obtenerMisPedidos);

// Ruta para administradores
router.get('/admin/todos', authMiddleware, adminMiddleware, pedidoController.obtenerTodosLosPedidos);

module.exports = router;