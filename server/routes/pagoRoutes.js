const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

// Importamos el middleware para asegurar que solo usuarios logueados puedan generar cobros
const authMiddleware = require('../middleware/authMiddleware');

// Ruta protegida
router.post('/crear-intencion', authMiddleware, pagoController.crearIntencionDePago);

module.exports = router;