// Importa el framework Express y el enrutador
const express = require('express');
const router = express.Router();

// Importa el controlador de pedidos
const pedidoController = require('../controllers/pedidoController');

// Define la ruta POST para procesar el pago
router.post('/procesar', pedidoController.procesarPedido);

// Exporta el módulo de rutas
module.exports = router;