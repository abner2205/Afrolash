const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Importar middlewares 
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Todas estas rutas requieren token válido Y privilegios de administrador absoluto
router.get('/admin/todos', authMiddleware, adminMiddleware, usuarioController.obtenerUsuarios);
router.post('/admin/empleado', authMiddleware, adminMiddleware, usuarioController.crearEmpleado);
router.delete('/admin/empleado/:id', authMiddleware, adminMiddleware, usuarioController.eliminarEmpleado);

module.exports = router;