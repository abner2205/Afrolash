require('dotenv').config(); // Carga las variables de .env
// Importación de módulos principales
const express = require('express');
const cors = require('cors');
const pagoRoutes = require('./routes/pagoRoutes');

// Importa la conexión a la base de datos
const db = require('./config/db');

// Inicializa la aplicación Express
const app = express();

// Permite que el frontend se comunique con este servidor
app.use(cors()); 
// Permite que el servidor entienda y procese datos en formato JSON
app.use(express.json()); 

// Rutas de la API
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
const productoRoutes = require('./routes/productoRoutes');
app.use('/api/productos', productoRoutes);
const pedidoRoutes = require('./routes/pedidoRoutes'); 
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/pagos', pagoRoutes);

// Ruta para verificar que el servidor responde
app.get('/', (req, res) => {
    res.send('Servidor de Afrolash API funcionando correctamente');
});

// Inicialización del Servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

module.exports = app;