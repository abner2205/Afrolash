// Importa la librería jsonwebtoken
const jwt = require('jsonwebtoken');

// Define y exporta la función del middleware de autenticación JWT
module.exports = function(req, res, next) {
    // Extrae el encabezado de autorización de la petición HTTP
    const authHeader = req.header('Authorization');

    // Valida presencia y formato Bearer <token>
    if (!authHeader || typeof authHeader !== 'string') {
        return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
    }

    const partes = authHeader.trim().split(/\s+/);
    if (partes.length !== 2 || partes[0] !== 'Bearer' || !partes[1]) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
    }

    const token = partes[1];

    try {
        // Verifica la firma del token utilizando la clave secreta
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // Inyecta los datos del usuario decodificado en req.usuario
        req.usuario = decodificado;
        
        // Permite que la petición continúe hacia el controlador
        next();
    } catch (error) {
        // Unificación de respuesta 401 Unauthorized ante firmas manipuladas o tokens expirados
        return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
    }
};
