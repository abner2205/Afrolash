const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const {
    escaparHtml,
    limpiarSaltosLinea,
    esCorreoValido,
    esPasswordRobusta,
    obtenerOrigenFrontend
} = require('../utils/seguridadUtils');

exports.registrarUsuario = async (req, res) => {
    const { nombre_completo, correo, password } = req.body;

    // Validación de obligatoriedad del nombre completo
    if (!nombre_completo || typeof nombre_completo !== 'string' || !nombre_completo.trim()) {
        return res.status(400).json({ mensaje: 'El nombre completo es obligatorio.' });
    }

    // Validación de sintaxis estándar del correo electrónico
    if (!esCorreoValido(correo)) {
        return res.status(400).json({ mensaje: 'Por favor, ingresa un correo electrónico válido.' });
    }

    // Validación de complejidad de contraseña (mínimo 8 caracteres, una mayúscula y un número)
    if (!esPasswordRobusta(password)) {
        return res.status(400).json({ 
            mensaje: 'La contraseña debe tener al menos 8 caracteres, incluir al menos una letra mayúscula y un número.' 
        });
    }

    try {
        const correoNormalizado = correo.trim().toLowerCase();

        // Verificación de correo duplicado antes de intentar insertar
        const [existentes] = await db.query(
            'SELECT id_usuario FROM usuarios WHERE correo = ?',
            [correoNormalizado]
        );

        if (existentes.length > 0) {
            return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado.' });
        }

        // Genera un nivel de complejidad criptográfica
        const salt = await bcrypt.genSalt(10);
        
        // Encripta la contraseña ingresada
        const hashedPassword = await bcrypt.hash(password, salt);

        // Inserta el usuario en la base de datos
        const [resultado] = await db.query(
            'INSERT INTO usuarios (nombre_completo, correo, password, rol) VALUES (?, ?, ?, ?)',
            [nombre_completo.trim(), correoNormalizado, hashedPassword, 'cliente']
        );

        res.status(201).json({ mensaje: 'Usuario registrado exitosamente', id: resultado.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado.' });
        }
        console.error('Error al registrar usuario:', error.message);
        res.status(500).json({ mensaje: 'Error interno al procesar el registro' });
    }
};

exports.loginUsuario = async (req, res) => {
    const { correo, password } = req.body;

    try {
        // 1. Verifica si el correo existe en la base de datos
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        
        if (usuarios.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        const usuario = usuarios[0];

        // 2. Compara la contraseña ingresada con el hash almacenado
        const passwordValido = await bcrypt.compare(password, usuario.password);
        
        if (!passwordValido) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        // 3. Genera el token de sesión válido por 2 horas
        const token = jwt.sign(
            { id: usuario.id_usuario, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        // Envía el token y los datos básicos del usuario al frontend
        res.status(200).json({ 
            mensaje: 'Inicio de sesión exitoso', 
            token: token, 
            usuario: { 
                id: usuario.id_usuario,
                nombre_completo: usuario.nombre_completo, 
                correo: usuario.correo || req.body.correo,
                rol: usuario.rol,
                direccion: usuario.direccion || '',
                telefono: usuario.telefono || ''
            } 
        });

    } catch (error) {
        console.error('Error en el login:', error.message);
        res.status(500).json({ mensaje: 'Error interno al procesar el inicio de sesión' });
    }
};

exports.actualizarPerfil = async (req, res) => {
    // Obtenemos el ID del usuario desde el token desencriptado por el middleware
    const id_usuario = req.usuario.id || req.usuario.id_usuario;
    const { nombre_completo, direccion, telefono } = req.body;

    try {
        await db.query(
            'UPDATE usuarios SET nombre_completo = ?, direccion = ?, telefono = ? WHERE id_usuario = ?',
            [nombre_completo, direccion, telefono, id_usuario]
        );

        res.status(200).json({ mensaje: 'Perfil actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ mensaje: 'Error interno al actualizar los datos' });
    }
};

// Función para solicitar el enlace de recuperación
exports.solicitarRecuperacion = async (req, res) => {
    const { correo } = req.body;

    // Validación de formato antes de consultar la BD
    if (!esCorreoValido(correo)) {
        return res.status(400).json({ mensaje: 'Por favor, ingresa un correo electrónico válido.' });
    }

    try {
        const correoNormalizado = correo.trim().toLowerCase();
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correoNormalizado]);
        
        if (usuarios.length === 0) {
            // Respuesta genérica 200 para prevenir enumeración de correos
            return res.status(200).json({ mensaje: 'Si el correo existe, se ha enviado un enlace de recuperación.' });
        }

        const usuario = usuarios[0];

        // Secreto único combinando el secreto global y el hash de la contraseña actual
        const secretoUnico = process.env.JWT_SECRET + usuario.password;
        
        const token = jwt.sign(
            { id: usuario.id_usuario, correo: usuario.correo },
            secretoUnico,
            { expiresIn: '15m' }
        );

        const origenFrontend = obtenerOrigenFrontend();
        const enlaceRecuperacion = `${origenFrontend}/?vista=restablecer&id=${usuario.id_usuario}&token=${token}`;

        // Configurar el transportador de correo
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const destinatarioLimpio = limpiarSaltosLinea(usuario.correo);
        const asuntoLimpio = limpiarSaltosLinea('Afrolash - Recuperación de Contraseña');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: destinatarioLimpio,
            subject: asuntoLimpio,
            html: `
                <h2>Recuperación de contraseña</h2>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
                <a href="${escaparHtml(enlaceRecuperacion)}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
                <p>Este enlace expirará en 15 minutos.</p>
                <p>Si no solicitaste este cambio, ignora este correo.</p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Error enviando correo de recuperación:', emailError.message);
        }

        res.status(200).json({ mensaje: 'Si el correo existe, se ha enviado un enlace de recuperación.' });

    } catch (error) {
        console.error('Error al solicitar recuperación:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// Función para establecer la contraseña
exports.restablecerPassword = async (req, res) => {
    const { id, token } = req.params;
    const { nuevaPassword } = req.body;

    // Validación estricta de complejidad antes de tocar la base de datos
    if (!esPasswordRobusta(nuevaPassword)) {
        return res.status(400).json({ 
            mensaje: 'La contraseña debe tener al menos 8 caracteres, incluir al menos una letra mayúscula y un número.' 
        });
    }

    try {
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
        
        if (usuarios.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const usuario = usuarios[0];
        const secretoUnico = process.env.JWT_SECRET + usuario.password;

        // Verificar si el token es válido y no ha expirado o sido usado
        try {
            jwt.verify(token, secretoUnico);
        } catch (error) {
            return res.status(400).json({ mensaje: 'El enlace es inválido o ha expirado.' });
        }

        // Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

        // Actualizar la base de datos
        await db.query(
            'UPDATE usuarios SET password = ? WHERE id_usuario = ?',
            [hashedPassword, id]
        );

        res.status(200).json({ mensaje: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });

    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};
