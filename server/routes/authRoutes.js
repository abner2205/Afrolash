const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define la ruta POST para procesar el registro
router.post('/registro', authController.registrarUsuario);

// Define la ruta POST para procesar el inicio de sesión
router.post('/login', authController.loginUsuario);

module.exports = router;