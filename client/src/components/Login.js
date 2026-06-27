import React, { useState } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.correo || !formData.password) {
            setMensaje('Por favor, completa todos los campos para poder ingresar.');
            return;
        }

        setCargando(true);

        try {
            const respuesta = await axios.post('http://localhost:5000/api/auth/login', {
                correo: formData.correo,
                password: formData.password
            });
            
            localStorage.setItem('token', respuesta.data.token);
            localStorage.setItem('usuario', JSON.stringify(respuesta.data.usuario));
            
            window.location.reload();
            
        } catch (error) {
            console.error('Intento de acceso fallido interceptado.');
            setMensaje('El correo electrónico o la contraseña son incorrectos. Por favor, verifica tus datos e inténtalo nuevamente.');
            setFormData({ ...formData, password: '' });
            setCargando(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', border: '1px solid #F7CDD5', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#1A1A1A' }}>Iniciar Sesión</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#1A1A1A' }}>Correo Electrónico:</label>
                    <input 
                        type="email" 
                        name="correo" 
                        value={formData.correo} 
                        onChange={handleChange} 
                        required 
                        autoComplete="email"
                        style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', outlineColor: '#D97A8C' }} 
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#1A1A1A' }}>Contraseña:</label>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type={mostrarPassword ? "text" : "password"} 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                            style={{ width: '100%', padding: '12px 50px 12px 12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', outlineColor: '#D97A8C' }} 
                        />
                        <button 
                            type="button" 
                            onClick={() => setMostrarPassword(!mostrarPassword)}
                            style={{ 
                                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', 
                                background: 'none', border: 'none', color: '#666', cursor: 'pointer', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center' 
                            }}
                            tabIndex="-1" 
                        >
                            {mostrarPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={cargando}
                    style={{ 
                        marginTop: '10px', padding: '12px', 
                        backgroundColor: cargando ? '#6c757d' : '#D97A8C', 
                        color: 'white', border: 'none', borderRadius: '4px', 
                        cursor: cargando ? 'not-allowed' : 'pointer', 
                        fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.3s'
                    }}
                >
                    {cargando ? 'Iniciando Sesión...' : 'Ingresar'}
                </button>
            </form>
            
            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
                <span onClick={() => navegarA('recuperar')} style={{ color: '#4682B4', cursor: 'pointer', textDecoration: 'underline' }}>¿Olvidaste tu contraseña?</span>
            </p>
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                ¿No tienes una cuenta? <span onClick={() => navegarA('registro')} style={{ color: '#4682B4', cursor: 'pointer', textDecoration: 'underline' }}>Regístrate aquí</span>
            </p>

            {/* MODAL DE ERROR */}
            {mensaje && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: '50px', height: '50px', backgroundColor: '#f8d7da', color: '#dc3545', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', margin: '0 auto 15px auto', fontWeight: 'bold' }}>!</div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1A1A1A', fontSize: '20px' }}>No se pudo acceder</h3>
                        <p style={{ margin: '0 0 25px 0', color: '#555', fontSize: '15px' }}>
                            {mensaje}
                        </p>
                        <button 
                            onClick={() => setMensaje('')} 
                            style={{ width: '100%', padding: '12px', backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;