import React, { useState } from 'react';
import axios from 'axios';

const Registro = () => {
    // Define el estado inicial para los datos del formulario
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo: '',
        password: ''
    });

    // Define un estado para manejar los mensajes de error de validación
    const [mensajeError, setMensajeError] = useState('');

    // Actualiza el estado y limpia los errores mientras el usuario escribe
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setMensajeError('');
    };

    // Aplica mayúscula a la primera letra de cada palabra
    const formatearNombre = (nombre) => {
        return nombre
            .toLowerCase()
            .split(' ')
            .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
            .join(' ');
    };

    // Valida la complejidad de la contraseña mediante Regex
    const validarPassword = (password) => {
        // Al menos 8 caracteres, 1 letra, 1 número y 1 carácter especial
        const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&.])[A-Za-z\d@$!%*#?&.]{8,}$/;
        return regex.test(password);
    };

    // Valida el formato estándar de un correo electrónico
    const validarCorreo = (correo) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(correo);
    };

    // Ejecuta las validaciones y el envío de la información
    const handleSubmit = async (e) => {
        e.preventDefault(); 

        // 1. Validar formato de correo
        if (!validarCorreo(formData.correo)) {
            setMensajeError('Por favor, ingresa un correo electrónico válido.');
            return;
        }

        // 2. Validar complejidad de contraseña
        if (!validarPassword(formData.password)) {
            setMensajeError('La contraseña debe tener al menos 8 caracteres, incluir una letra, un número y un carácter especial.');
            return;
        }

        // 3. Formatear el nombre completo
        const nombreFormateado = formatearNombre(formData.nombre_completo);

        // Prepara los datos finales a enviar
        const datosAEnviar = {
            ...formData,
            nombre_completo: nombreFormateado
        };

        try {
            const respuesta = await axios.post('http://localhost:5000/api/auth/registro', datosAEnviar);
            alert(respuesta.data.mensaje);
            
            // Limpia el formulario tras un registro exitoso
            setFormData({ nombre_completo: '', correo: '', password: '' });
            setMensajeError('');
        } catch (error) {
            console.error('Error en el registro:', error);
            // Muestra error proveniente del servidor si existe, o un mensaje genérico
            setMensajeError(error.response?.data?.mensaje || 'Ocurrió un error al intentar crear la cuenta.');
        }
    };

    // Renderiza la estructura visual del formulario
    return (
        <div style={{ maxWidth: '400px', margin: '0 auto 40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center' }}>Crear Cuenta</h2>
            
            {/* Muestra el mensaje de error si existe */}
            {mensajeError && (
                <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', fontSize: '14px' }}>
                    {mensajeError}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                    type="text"
                    name="nombre_completo"
                    placeholder="Nombre Completo (ej. maría pérez)"
                    value={formData.nombre_completo}
                    onChange={handleChange}
                    required
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                    type="text" // Cambiado a text para que nuestra Regex haga el trabajo principal
                    name="correo"
                    placeholder="Correo Electrónico"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Registrarse
                </button>
            </form>
        </div>
    );
};

export default Registro;