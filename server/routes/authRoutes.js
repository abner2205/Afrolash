const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define la ruta para registrar un nuevo cliente
router.post('/registro', authController.registrarUsuario);

module.exports = router;