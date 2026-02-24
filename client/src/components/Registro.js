import React, { useState } from 'react';
import axios from 'axios';

const Registro = ({ navegarA }) => {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo: '',
        password: '',
        confirmarPassword: ''
    });
    const [mensaje, setMensaje] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

    // Funciones de validación dinámica en tiempo real
    const tieneLongitud = formData.password.length >= 8;
    const tieneMayuscula = /[A-Z]/.test(formData.password);
    const tieneNumero = /[0-9]/.test(formData.password);
    const contraseñasCoinciden = formData.password.length > 0 && formData.password === formData.confirmarPassword;

    // El formulario solo es válido si TODAS las condiciones son verdaderas
    const formularioValido = tieneLongitud && tieneMayuscula && tieneNumero && contraseñasCoinciden;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMensaje(''); // Limpia mensajes de error al escribir
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Medida de seguridad adicional antes de enviar al backend
        if (!formularioValido) {
            setMensaje('Por favor, cumple con todos los requisitos de seguridad de la contraseña.');
            return;
        }

        setCargando(true);

        try {
            await axios.post('http://localhost:5000/api/auth/registro', {
                nombre_completo: formData.nombre_completo,
                correo: formData.correo,
                password: formData.password
            });
            
            // Redirección automática al Login tras un registro exitoso
            alert('Cuenta creada exitosamente. Por favor, inicia sesión.');
            navegarA('login'); 
            
        } catch (error) {
            console.error('Error en el registro:', error);
            setMensaje(error.response?.data?.mensaje || 'Ocurrió un error al registrar la cuenta.');
            setCargando(false);
        }
    };

    // Función auxiliar para renderizar los elementos de la checklist
    const renderRequisito = (cumplido, texto) => (
        <li style={{ 
            color: cumplido ? '#28a745' : '#6c757d', 
            fontWeight: cumplido ? 'bold' : 'normal',
            marginBottom: '5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }}>
            <span style={{ fontSize: '18px' }}>{cumplido ? '✓' : '○'}</span>
            {texto}
        </li>
    );

    return (
        <div style={{ maxWidth: '450px', margin: '40px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#333' }}>Crear Cuenta en Afrolash</h2>
            
            {mensaje && (
                <div style={{ padding: '10px', marginBottom: '20px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                    {mensaje}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Nombre Completo:</label>
                    <input 
                        type="text" 
                        name="nombre_completo" 
                        value={formData.nombre_completo} 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
                    />
                </div>
                
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Correo Electrónico:</label>
                    <input 
                        type="email" 
                        name="correo" 
                        value={formData.correo} 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Contraseña:</label>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type={mostrarPassword ? "text" : "password"} 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                            style={{ width: '100%', padding: '10px 50px 10px 10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
                        />
                        <button 
                            type="button" 
                            onClick={() => setMostrarPassword(!mostrarPassword)}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                            tabIndex="-1"
                        >
                            {mostrarPassword ? 'OCULTAR' : 'VER'}
                        </button>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Confirmar Contraseña:</label>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type={mostrarConfirmar ? "text" : "password"} 
                            name="confirmarPassword" 
                            value={formData.confirmarPassword} 
                            onChange={handleChange} 
                            required 
                            style={{ 
                                width: '100%', padding: '10px 50px 10px 10px', borderRadius: '4px', boxSizing: 'border-box',
                                border: formData.confirmarPassword.length > 0 
                                    ? (contraseñasCoinciden ? '2px solid #28a745' : '2px solid #dc3545') 
                                    : '1px solid #ccc' 
                            }} 
                        />
                        <button 
                            type="button" 
                            onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                            tabIndex="-1"
                        >
                            {mostrarConfirmar ? 'OCULTAR' : 'VER'}
                        </button>
                    </div>
                </div>

                {/* Checklist dinámica de requisitos */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px', border: '1px solid #eee' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>Requisitos de la contraseña:</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px' }}>
                        {renderRequisito(tieneLongitud, 'Mínimo 8 caracteres')}
                        {renderRequisito(tieneMayuscula, 'Al menos una letra mayúscula')}
                        {renderRequisito(tieneNumero, 'Al menos un número')}
                        {renderRequisito(contraseñasCoinciden, 'Las contraseñas coinciden')}
                    </ul>
                </div>

                <button 
                    type="submit" 
                    disabled={!formularioValido || cargando}
                    style={{ 
                        marginTop: '10px', padding: '12px', 
                        backgroundColor: (formularioValido && !cargando) ? '#007bff' : '#6c757d', 
                        color: 'white', border: 'none', borderRadius: '4px', 
                        cursor: (formularioValido && !cargando) ? 'pointer' : 'not-allowed', 
                        fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.3s'
                    }}
                >
                    {cargando ? 'Procesando...' : 'Crear Cuenta'}
                </button>
            </form>
            
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                ¿Ya tienes una cuenta? <span onClick={() => navegarA('login')} style={{ color: '#007bff', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Inicia Sesión aquí</span>
            </p>
        </div>
    );
};

export default Registro;