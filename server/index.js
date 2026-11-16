const path = require('path');
// Carga las variables de entorno con ruta absoluta explícita al inicio del archivo
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Importación de módulos principales
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const multer = require('multer');
const uploadMiddleware = require('./middleware/uploadMiddleware');
const pagoRoutes = require('./routes/pagoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const { auditarVariablesEntorno } = require('./utils/seguridadUtils');

// Audita la presencia de variables de entorno críticas según el entorno de ejecución
auditarVariablesEntorno();

// Importa la conexión a la base de datos
const db = require('./config/db');

// Inicializa la aplicación Express
const app = express();
app.auditarVariablesEntorno = auditarVariablesEntorno;

/**
 * Parsea de forma segura y estricta la directiva trust proxy para balanceadores de carga / proxies inversos.
 * @param {string|number|undefined|null} valor Valor de la variable TRUST_PROXY.
 * @returns {number|boolean} 1 si es 'true', número entero si es >= 1, o false en cualquier otro caso.
 */
function parsearTrustProxy(valor) {
    if (valor === undefined || valor === null) {
        return false;
    }
    const str = String(valor).trim().toLowerCase();
    if (str === '' || str === 'false' || str === '0') {
        return false;
    }
    if (str === 'true') {
        return 1;
    }
    if (/^\d+$/.test(str)) {
        const num = parseInt(str, 10);
        if (num >= 1) {
            return num;
        }
    }
    return false;
}

// Configura la confianza en proxy inverso numéricamente exacta y expone el helper para pruebas
app.set('trust proxy', parsearTrustProxy(process.env.TRUST_PROXY));
app.parsearTrustProxy = parsearTrustProxy;

// Deshabilita la cabecera X-Powered-By para mitigar perfilamiento
app.disable('x-powered-by');

// Cabeceras de seguridad HTTP con Helmet permitiendo recursos cross-origin para assets multimedia
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 1. Endpoint público de diagnóstico y salud con política CORS permisiva dedicada
app.options('/api/health', cors());
app.get('/api/health', cors(), async (req, res) => {
    try {
        await db.query('SELECT 1');
        return res.status(200).json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(503).json({
            status: 'error',
            database: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
});

// 2. Servido estático público de imágenes bajo /img (emite Cross-Origin-Resource-Policy: cross-origin vía helmet)
app.use('/img', cors(), express.static(path.join(__dirname, '../client/public/img')));

// Configuración dinámica de orígenes permitidos por CORS
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const origenesPermitidos = FRONTEND_URL.split(',').map(origen => origen.trim()).filter(Boolean);

const opcionesCors = {
    origin: (origin, callback) => {
        // Permitir solicitudes sin cabecera Origin (curl, server-to-server, tests de backend) o coincidentes
        if (!origin || origenesPermitidos.includes(origin)) {
            callback(null, true);
        } else {
            const err = new Error('Acceso denegado por política de origen (CORS).');
            err.status = 403;
            err.esErrorCors = true;
            callback(err);
        }
    },
    credentials: true
};

// Permite que el frontend autorizado se comunique con este servidor
app.use(cors(opcionesCors)); 

// Permite que el servidor entienda y procese datos en formato JSON con límite estricto de 100 KB
app.use(express.json({ limit: '100kb' })); 

// Limitador de tasa para mitigar fuerza bruta y abuso en rutas sensibles de autenticación
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
    message: { mensaje: 'Demasiadas solicitudes realizadas. Por favor, intente nuevamente más tarde.' },
    handler: (req, res, next, options) => {
        if (!res.getHeader('Retry-After')) {
            res.setHeader('Retry-After', String(Math.ceil(options.windowMs / 1000)));
        }
        return res.status(options.statusCode || 429).json(options.message);
    }
});

// Aplicación del limitador de tasa a endpoints sensibles de autenticación
app.use([
    '/api/auth/login',
    '/api/auth/registro',
    '/api/auth/recuperar-password',
    '/api/auth/restablecer-password'
], authLimiter);

app.use('/api/usuarios', usuarioRoutes);

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

// Middleware centralizado de gestión de errores
app.use(async (err, req, res, next) => {
    // Limpieza segura de archivos temporales o parciales en disco ante cualquier fallo
    try {
        if (uploadMiddleware && typeof uploadMiddleware.limpiarArchivosSubidos === 'function') {
            await uploadMiddleware.limpiarArchivosSubidos(req);
        }
    } catch (_) {
        // Silenciar posibles errores secundarios durante la limpieza de disco
    }

    const estado = err.status || err.statusCode;

    // Error de CORS
    if (err.esErrorCors || estado === 403) {
        res.removeHeader('Access-Control-Allow-Origin');
        return res.status(403).json({ mensaje: 'Acceso denegado por política de origen (CORS).' });
    }

    // Manejo de excepciones de Multer al procesar archivos adjuntos
    if (err instanceof multer.MulterError || err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ mensaje: 'El archivo excede el tamaño máximo permitido de 2 MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ mensaje: 'Se excedió el límite máximo de 3 archivos o se envió un campo de archivo no permitido.' });
        }
        return res.status(400).json({ mensaje: 'Error al procesar los archivos adjuntos.' });
    }

    // Error por exceso de tamaño en el cuerpo de la petición (JSON > 100 KB)
    if (err.type === 'entity.too.large' || estado === 413) {
        return res.status(413).json({ mensaje: 'El tamaño de la solicitud excede el límite permitido.' });
    }

    // Error por sintaxis JSON malformada
    if (err instanceof SyntaxError && estado === 400 && 'body' in err) {
        return res.status(400).json({ mensaje: 'El formato JSON enviado en la solicitud es inválido.' });
    }

    // Otros errores cliente 4xx (incluyendo validación de formato en fileFilter con status 400)
    if (typeof estado === 'number' && estado >= 400 && estado < 500) {
        return res.status(estado).json({ mensaje: err.message || 'Solicitud inválida.' });
    }

    // Errores internos no manejados (500)
    console.error('Error no controlado en el servidor:', err);
    return res.status(500).json({ mensaje: 'Error interno del servidor.' });
});

// Inicialización del Servidor desacoplada para pruebas automatizadas
const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
        console.log(`http://localhost:${PORT}`);
    });
}

module.exports = app;
