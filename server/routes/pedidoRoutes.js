const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// Importa el middleware de seguridad
const authMiddleware = require('../middleware/authMiddleware');

// Define la ruta POST e inserta el middleware antes del controlador
router.post('/procesar', authMiddleware, pedidoController.procesarPedido);

module.exports = router;