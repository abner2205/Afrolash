const express = require('express');
const router = express.Router();

// Importa el controlador
const productoController = require('../controllers/productoController');

// Define que al hacer una petición GET a la ruta base, se ejecute 'obtenerProductos'
router.get('/', productoController.obtenerProductos);

module.exports = router;