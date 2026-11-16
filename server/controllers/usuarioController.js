const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../config/db');
const {
    escaparHtml,
    limpiarSaltosLinea,
    esCorreoValido
} = require('../utils/seguridadUtils');

// Configuración del transporter de Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.obtenerUsuarios = async (req, res) => {
    try {
        const [usuarios] = await db.query(
            'SELECT id_usuario, nombre_completo, correo, rol, telefono, direccion FROM usuarios ORDER BY rol ASC, nombre_completo ASC'
        );
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el listado de usuarios.' });
    }
};

exports.crearEmpleado = async (req, res) => {
    const { nombre_completo, correo, telefono, direccion } = req.body;

    // Validación de obligatoriedad del nombre completo
    if (!nombre_completo || typeof nombre_completo !== 'string' || !nombre_completo.trim()) {
        return res.status(400).json({ mensaje: 'El nombre completo es obligatorio.' });
    }

    // Validación de sintaxis estándar del correo electrónico
    if (!esCorreoValido(correo)) {
        return res.status(400).json({ mensaje: 'Por favor, ingresa un correo electrónico válido.' });
    }

    try {
        const correoNormalizado = correo.trim().toLowerCase();

        // 1. Verificar si el correo ya existe
        const [existe] = await db.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correoNormalizado]);
        if (existe.length > 0) {
            return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado en el sistema.' });
        }

        // 2. Generar contraseña aleatoria 
        const passwordPlana = crypto.randomBytes(4).toString('hex'); 
        
        // 3. Encriptar la contraseña utilizando bcryptjs
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(passwordPlana, salt);

        // 4. Guardar en la base de datos forzando el rol 'empleado'
        await db.query(
            'INSERT INTO usuarios (nombre_completo, correo, password, rol, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre_completo.trim(), correoNormalizado, passwordEncriptada, 'empleado', telefono || '', direccion || '']
        );

        // 5. Enviar el correo electrónico con campos escapados y cabeceras limpias
        const destinatarioLimpio = limpiarSaltosLinea(correoNormalizado);
        const nombreEscapado = escaparHtml(nombre_completo.trim());
        const correoEscapado = escaparHtml(correoNormalizado);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: destinatarioLimpio,
            subject: 'Bienvenido al equipo de Afrolash - Credenciales de Acceso',
            html: `
                <h2>Hola ${nombreEscapado},</h2>
                <p>Has sido dado de alta como empleado en el sistema administrativo de Afrolash.</p>
                <p>Tus credenciales de acceso son las siguientes:</p>
                <ul>
                    <li><strong>Correo:</strong> ${correoEscapado}</li>
                    <li><strong>Contraseña temporal:</strong> ${passwordPlana}</li>
                </ul>
                <p>Por motivos de seguridad, te recomendamos iniciar sesión y cambiar esta contraseña desde tu perfil lo antes posible.</p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.error('Error enviando correo de credenciales a empleado:', mailError.message);
        }

        res.status(201).json({ mensaje: 'Empleado registrado exitosamente y credenciales enviadas por correo.' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado en el sistema.' });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno al procesar el registro del empleado.' });
    }
};

exports.eliminarEmpleado = async (req, res) => {
    const { id } = req.params;

    try {
        // Primero verificamos el rol del usuario que se intenta eliminar
        const [usuario] = await db.query('SELECT rol FROM usuarios WHERE id_usuario = ?', [id]);
        
        if (usuario.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        if (usuario[0].rol !== 'empleado') {
            return res.status(403).json({ mensaje: 'Operación denegada. Solo puedes eliminar cuentas de nivel empleado.' });
        }

        // Si es empleado, procedemos con la eliminación
        await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
        res.json({ mensaje: 'Cuenta de empleado eliminada del sistema.' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al intentar eliminar la cuenta.' });
    }
};
