import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
    // Define el estado inicial para las credenciales
    const [formData, setFormData] = useState({
        correo: '',
        password: ''
    });

    // Define un estado para manejar los mensajes de error
    const [mensajeError, setMensajeError] = useState('');

    // Actualiza el estado y limpia los errores mientras el usuario escribe
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setMensajeError('');
    };

    // Ejecuta la peticion de autenticacion al servidor
    const handleSubmit = async (e) => {
        e.preventDefault(); 

        try {
            const respuesta = await axios.post('http://localhost:5000/api/auth/login', formData);
            
            // Extrae el token y los datos del usuario de la respuesta
            const { token, usuario } = respuesta.data;

            // Guarda la llave de acceso y los datos en el almacenamiento local del navegador
            localStorage.setItem('token', token);
            localStorage.setItem('usuario', JSON.stringify(usuario));

            alert('Inicio de sesion exitoso. Bienvenido, ' + usuario.nombre);
            
            // Limpia el formulario tras acceder exitosamente
            setFormData({ correo: '', password: '' });
            setMensajeError('');
            
            // Recarga la pagina para actualizar el estado global de la aplicacion
            window.location.reload();

        } catch (error) {
            console.error('Error en el inicio de sesion:', error);
            // Muestra error proveniente del servidor si existe, o un mensaje generico
            setMensajeError(error.response?.data?.mensaje || 'Credenciales invalidas o error de conexion.');
        }
    };

    // Renderiza la estructura visual del formulario de acceso
    return (
        <div style={{ maxWidth: '400px', margin: '0 auto 40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center' }}>Iniciar Sesion</h2>
            
            {mensajeError && (
                <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', fontSize: '14px' }}>
                    {mensajeError}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                    type="email"
                    name="correo"
                    placeholder="Correo Electronico"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Contrasena"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Acceder
                </button>
            </form>
        </div>
    );
};

export default Login;