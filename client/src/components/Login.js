import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ navegarA }) => {
    const [formData, setFormData] = useState({
        correo: '',
        password: ''
    });
    const [mensaje, setMensaje] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMensaje(''); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Prevención de envío de campos vacíos en el cliente
        if (!formData.correo || !formData.password) {
            setMensaje('Por favor, completa todos los campos.');
            return;
        }

        setCargando(true);

        try {
            const respuesta = await axios.post('http://localhost:5000/api/auth/login', {
                correo: formData.correo,
                password: formData.password
            });
            
            // Guardamos las credenciales criptográficas
            localStorage.setItem('token', respuesta.data.token);
            localStorage.setItem('usuario', JSON.stringify(respuesta.data.usuario));
            
            // Recargamos el estado global de la aplicación para que el interceptor reconozca la sesión
            window.location.reload();
            
        } catch (error) {
            console.error('Intento de acceso fallido interceptado.');
            
            // SEGURIDAD: Mensaje genérico absoluto, sin importar lo que responda el backend
            setMensaje('Correo electrónico o contraseña incorrectos.');
            
            // Limpiamos el campo de la contraseña por seguridad, obligando a teclear de nuevo
            setFormData({ ...formData, password: '' });
            setCargando(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#333' }}>Iniciar Sesión</h2>
            
            {/* Contenedor de Alertas Genéricas */}
            {mensaje && (
                <div style={{ padding: '10px', marginBottom: '20px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                    {mensaje}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Correo Electrónico:</label>
                    <input 
                        type="email" 
                        name="correo" 
                        value={formData.correo} 
                        onChange={handleChange} 
                        required 
                        autoComplete="email"
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Contraseña:</label>
                    <div style={{ position: 'relative' }}>
                        <input 
                            // El tipo cambia dinámicamente según el estado
                            type={mostrarPassword ? "text" : "password"} 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                            // Se añade padding derecho para que el texto no se superponga con el botón
                            style={{ width: '100%', padding: '10px 50px 10px 10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
                        />
                        <button 
                            type="button" 
                            onClick={() => setMostrarPassword(!mostrarPassword)}
                            style={{ 
                                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', 
                                background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' 
                            }}
                            // Evitamos que al hacer clic en el botón se envíe el formulario
                            tabIndex="-1" 
                        >
                            {mostrarPassword ? 'OCULTAR' : 'VER'}
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={cargando}
                    style={{ 
                        marginTop: '10px', padding: '12px', 
                        backgroundColor: cargando ? '#6c757d' : '#28a745', 
                        color: 'white', border: 'none', borderRadius: '4px', 
                        cursor: cargando ? 'not-allowed' : 'pointer', 
                        fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.3s'
                    }}
                >
                    {cargando ? 'Verificando credenciales...' : 'Ingresar'}
                </button>
            </form>
            
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                ¿No tienes una cuenta? <span onClick={() => navegarA('registro')} style={{ color: '#007bff', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Regístrate aquí</span>
            </p>
        </div>
    );
};

export default Login;