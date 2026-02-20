// Importa la librería jsonwebtoken
const jwt = require('jsonwebtoken');

// Define y exporta la función del middleware
module.exports = function(req, res, next) {
    // Extrae el encabezado de autorización de la petición HTTP
    const authHeader = req.header('Authorization');

    // Verifica si el encabezado existe
    if (!authHeader) {
        return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó un token.' });
    }

    // Separa la palabra "Bearer" del token real
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado. Formato de token inválido.' });
    }

    try {
        // Verifica la firma del token utilizando la clave secreta del archivo .env
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // Inyecta los datos del usuario decodificado en el objeto de la petición (req)
        req.usuario = decodificado;
        
        // Permite que la petición continúe hacia el controlador
        next();
    } catch (error) {
        res.status(400).json({ mensaje: 'Token inválido o expirado.' });
    }
};