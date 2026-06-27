const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Define la ruta POST para procesar el registro
router.post('/registro', authController.registrarUsuario);

// Define la ruta POST para procesar el inicio de sesión
router.post('/login', authController.loginUsuario);

router.put('/perfil', authMiddleware, authController.actualizarPerfil);

router.post('/recuperar-password', authController.solicitarRecuperacion);
router.post('/restablecer-password/:id/:token', authController.restablecerPassword);

module.exports = router;