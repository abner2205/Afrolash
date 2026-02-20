const db = require('../config/db');
const bcrypt = require('bcryptjs');

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