const multer = require('multer');
const path = require('path');

// Configura el motor de almacenamiento físico
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Define la ruta exacta: sube dos niveles desde /middleware y entra a client/public/img
        cb(null, path.join(__dirname, '../../client/public/img'));
    },
    filename: function (req, file, cb) {
        // Genera un nombre único concatenando la fecha actual en milisegundos y la extensión original
        const sufijoUnico = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, sufijoUnico + path.extname(file.originalname));
    }
});

// Configura un filtro de seguridad para aceptar exclusivamente imágenes
const fileFilter = (req, file, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|webp/;
    // Verifica la extensión del archivo
    const extensionValida = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
    const mimeValido = tiposPermitidos.test(file.mimetype);

    if (extensionValida && mimeValido) {
        cb(null, true);
    } else {
        cb(new Error('Formato no válido. El sistema solo permite imágenes (JPEG, JPG, PNG, WEBP).'));
    }
};

// Inicializa el middleware con las configuraciones establecidas
const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;