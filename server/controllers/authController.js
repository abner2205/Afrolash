const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registrarUsuario = async (req, res) => {
    const { nombre_completo, correo, password } = req.body;

    try {
        // Genera un nivel de complejidad criptográfica
        const salt = await bcrypt.genSalt(10);
        
        // Encripta la contraseña ingresada
        const hashedPassword = await bcrypt.hash(password, salt);

        // Inserta el usuario en la base de datos
        const [resultado] = await db.query(
            'INSERT INTO Usuarios (nombre_completo, correo, password, rol) VALUES (?, ?, ?, ?)',
            [nombre_completo, correo, hashedPassword, 'cliente']
        );

        res.status(201).json({ mensaje: 'Usuario registrado exitosamente', id: resultado.insertId });
    } catch (error) {
        console.error('Error al registrar usuario:', error.message);
        res.status(500).json({ mensaje: 'Error interno al procesar el registro' });
    }
};

exports.loginUsuario = async (req, res) => {
    const { correo, password } = req.body;

    try {
        // 1. Verifica si el correo existe en la base de datos
        const [usuarios] = await db.query('SELECT * FROM Usuarios WHERE correo = ?', [correo]);
        
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
                direccion: usuario.direccion || '', // Se añade manejo de nulos
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
            'UPDATE Usuarios SET nombre_completo = ?, direccion = ?, telefono = ? WHERE id_usuario = ?',
            [nombre_completo, direccion, telefono, id_usuario]
        );

        res.status(200).json({ mensaje: 'Perfil actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ mensaje: 'Error interno al actualizar los datos' });
    }
};