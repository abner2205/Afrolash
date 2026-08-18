// middleware/verificarPersonal.js
module.exports = function(req, res, next) {
    // Verifica si el usuario existe y si su rol es 'admin' o 'empleado'
    if (req.usuario && (req.usuario.rol === 'admin' || req.usuario.rol === 'empleado')) {
        // Permite que la petición continúe hacia el controlador
        next();
    } else {
        // Bloquea la petición
        res.status(403).json({ mensaje: 'Acceso denegado. Permisos de personal insuficientes.' });
    }
};