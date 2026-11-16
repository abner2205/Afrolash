const multer = require('multer');
const path = require('path');
const fs = require('fs');

const destinoImagenes = path.join(__dirname, '../../client/public/img');

// Asegura la existencia del directorio de almacenamiento en disco
fs.mkdirSync(destinoImagenes, { recursive: true });

// Configura el motor de almacenamiento físico
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, destinoImagenes);
    },
    filename: function (req, file, cb) {
        const sufijoUnico = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname || '').toLowerCase();
        const nombreArchivo = sufijoUnico + extension;

        if (!Array.isArray(req._archivosSubidosEnPeticion)) {
            req._archivosSubidosEnPeticion = [];
        }
        req._archivosSubidosEnPeticion.push(path.join(destinoImagenes, nombreArchivo));

        cb(null, nombreArchivo);
    }
});

// Configura un filtro de seguridad para aceptar exclusivamente imágenes
const fileFilter = (req, file, cb) => {
    const extensionValida = /^\.(jpeg|jpg|png|webp)$/i.test(path.extname(file.originalname || '').toLowerCase());
    const mimeValido = /^image\/(jpeg|jpg|png|webp)$/i.test(file.mimetype || '');

    if (extensionValida && mimeValido) {
        cb(null, true);
    } else {
        const err = new Error('Formato no válido. El sistema solo permite imágenes (JPEG, JPG, PNG, WEBP).');
        err.status = 400;
        err.statusCode = 400;
        cb(err);
    }
};

// Límites estrictos de subida: 2 MB por archivo y máximo 3 archivos
const limits = {
    fileSize: 2 * 1024 * 1024,
    files: 3
};

// Inicializa el middleware con las configuraciones establecidas
const upload = multer({ storage, fileFilter, limits });

// Limpieza física garantizada de archivos huérfanos o parciales en disco
async function limpiarArchivosSubidos(req) {
    if (!req) return;
    const rutas = new Set();

    if (Array.isArray(req._archivosSubidosEnPeticion)) {
        for (const ruta of req._archivosSubidosEnPeticion) {
            if (ruta && typeof ruta === 'string') {
                rutas.add(ruta);
            }
        }
    }

    if (req.file && req.file.path) {
        rutas.add(req.file.path);
    }

    if (req.files) {
        if (Array.isArray(req.files)) {
            for (const f of req.files) {
                if (f && f.path) rutas.add(f.path);
            }
        } else if (typeof req.files === 'object') {
            for (const campo of Object.keys(req.files)) {
                const arr = req.files[campo];
                if (Array.isArray(arr)) {
                    for (const f of arr) {
                        if (f && f.path) rutas.add(f.path);
                    }
                }
            }
        }
    }

    for (const ruta of rutas) {
        try {
            await fs.promises.unlink(ruta);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error al eliminar archivo residual:', error.message);
            }
        }
    }

    req._archivosSubidosEnPeticion = [];
}

upload.limpiarArchivosSubidos = limpiarArchivosSubidos;

module.exports = upload;
