// Define y exporta el middleware de autorización por roles
module.exports = function(req, res, next) {
    // Verifica si el usuario existe en la petición y si su rol es 'admin'
    if (req.usuario && req.usuario.rol === 'admin') {
        // Permite que la petición continúe hacia el controlador
        next();
    } else {
        // Bloquea la petición devolviendo un error HTTP 403 
        res.status(403).json({ mensaje: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
};