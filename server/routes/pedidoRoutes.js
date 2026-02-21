const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// Importa el middleware de seguridad
const authMiddleware = require('../middleware/authMiddleware');

// Procesar una nueva compra
router.post('/procesar', authMiddleware, pedidoController.procesarPedido);

// Obtener el historial del usuario logueado
router.get('/mis-pedidos', authMiddleware, pedidoController.obtenerMisPedidos);

module.exports = router;