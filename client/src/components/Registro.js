import React, { useState } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import DocumentosLegales from './DocumentosLegales'; // Importamos el componente para usarlo dentro del modal

const Registro = ({ navegarA }) => {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo: '',
        password: '',
        confirmarPassword: ''
    });
    
    const [cargando, setCargando] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
    const [terminosAceptados, setTerminosAceptados] = useState(false);
    
    const [modalMensaje, setModalMensaje] = useState({ visible: false, texto: '', tipo: 'error', accionPosterior: null });
    
    // NUEVO ESTADO: Controla qué documento legal se muestra en el modal (null, 'terminos' o 'privacidad')
    const [modalDocumentoLegal, setModalDocumentoLegal] = useState(null);

    const tieneLongitud = formData.password.length >= 8;
    const tieneMayuscula = /[A-Z]/.test(formData.password);
    const tieneNumero = /[0-9]/.test(formData.password);
    const contraseñasCoinciden = formData.password.length > 0 && formData.password === formData.confirmarPassword;

    const formularioValido = tieneLongitud && tieneMayuscula && tieneNumero && contraseñasCoinciden && terminosAceptados;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formularioValido) {
            setModalMensaje({ 
                visible: true, 
                texto: 'Por favor, asegúrate de cumplir con todos los requisitos de seguridad y aceptar los términos y condiciones.', 
                tipo: 'error' 
            });
            return;
        }

        setCargando(true);

        try {
            await axios.post('http://localhost:5000/api/auth/registro', {
                nombre_completo: formData.nombre_completo,
                correo: formData.correo,
                password: formData.password
            });
            
            setModalMensaje({ 
                visible: true, 
                texto: 'Tu cuenta ha sido creada exitosamente. Ya formas parte de la comunidad Afrolash.', 
                tipo: 'exito',
                accionPosterior: () => navegarA('login')
            });
            
        } catch (error) {
            console.error('Error en el registro:', error);
            setModalMensaje({ 
                visible: true, 
                texto: error.response?.data?.mensaje || 'Ocurrió un error al registrar la cuenta. Es posible que el correo ya esté en uso.', 
                tipo: 'error' 
            });
            setCargando(false);
        }
    };

    const renderRequisito = (cumplido, texto) => (
        <li style={{ color: cumplido ? '#28a745' : '#6c757d', fontWeight: cumplido ? 'bold' : 'normal', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>{cumplido ? '✓' : '○'}</span>
            {texto}
        </li>
    );

    return (
        <div style={{ maxWidth: '450px', margin: '40px auto', padding: '30px', border: '1px solid #F7CDD5', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#1A1A1A' }}>Crear Cuenta en Afrolash</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#1A1A1A' }}>Nombre Completo:</label>
                    <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', outlineColor: '#D97A8C' }} />
                </div>
                
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#1A1A1A' }}>Correo Electrónico:</label>
                    <input type="email" name="correo" value={formData.correo} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', outlineColor: '#D97A8C' }} />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#1A1A1A' }}>Contraseña:</label>
                    <div style={{ position: 'relative' }}>
                        <input type={mostrarPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '12px 50px 12px 12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', outlineColor: '#D97A8C' }} />
                        <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} tabIndex="-1">
                            {mostrarPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#1A1A1A' }}>Confirmar Contraseña:</label>
                    <div style={{ position: 'relative' }}>
                        <input type={mostrarConfirmar ? "text" : "password"} name="confirmarPassword" value={formData.confirmarPassword} onChange={handleChange} required style={{ width: '100%', padding: '12px 50px 12px 12px', borderRadius: '4px', boxSizing: 'border-box', outlineColor: '#D97A8C', border: formData.confirmarPassword.length > 0 ? (contraseñasCoinciden ? '2px solid #28a745' : '2px solid #dc3545') : '1px solid #ccc' }} />
                        <button type="button" onClick={() => setMostrarConfirmar(!mostrarConfirmar)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} tabIndex="-1">
                            {mostrarConfirmar ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                    </div>
                </div>

                <div style={{ backgroundColor: '#fdfdfd', padding: '15px', borderRadius: '4px', border: '1px solid #eee' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#1A1A1A' }}>Requisitos de la contraseña:</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px' }}>
                        {renderRequisito(tieneLongitud, 'Mínimo 8 caracteres')}
                        {renderRequisito(tieneMayuscula, 'Al menos una letra mayúscula')}
                        {renderRequisito(tieneNumero, 'Al menos un número')}
                        {renderRequisito(contraseñasCoinciden, 'Las contraseñas coinciden')}
                    </ul>
                </div>

                {/* Casilla de verificación con enlaces que abren el modal interno */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '5px' }}>
                    <input 
                        type="checkbox" 
                        id="terminos" 
                        checked={terminosAceptados} 
                        onChange={(e) => setTerminosAceptados(e.target.checked)} 
                        style={{ marginTop: '3px', cursor: 'pointer', width: '16px', height: '16px', accentColor: '#D97A8C' }} 
                    />
                    <label htmlFor="terminos" style={{ fontSize: '13px', color: '#555', cursor: 'pointer', lineHeight: '1.4' }}>
                        He leído y acepto los <span onClick={(e) => { e.preventDefault(); setModalDocumentoLegal('terminos'); }} style={{ color: '#4682B4', textDecoration: 'underline', fontWeight: 'bold' }}>Términos y Condiciones</span> y la <span onClick={(e) => { e.preventDefault(); setModalDocumentoLegal('privacidad'); }} style={{ color: '#4682B4', textDecoration: 'underline', fontWeight: 'bold' }}>Política de Privacidad</span> de Afrolash.
                    </label>
                </div>

                <button 
                    type="submit" 
                    disabled={!formularioValido || cargando}
                    style={{ marginTop: '10px', padding: '12px', backgroundColor: (formularioValido && !cargando) ? '#D97A8C' : '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: (formularioValido && !cargando) ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.3s' }}
                >
                    {cargando ? 'Procesando...' : 'Crear Cuenta'}
                </button>
            </form>
            
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                ¿Ya tienes una cuenta? <span onClick={() => navegarA('login')} style={{ color: '#4682B4', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Inicia Sesión aquí</span>
            </p>

            {/* Modal de Validación del Registro */}
            {modalMensaje.visible && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', margin: '0 auto 15px auto', fontWeight: 'bold', backgroundColor: modalMensaje.tipo === 'exito' ? '#d4edda' : '#f8d7da', color: modalMensaje.tipo === 'exito' ? '#28a745' : '#dc3545' }}>
                            {modalMensaje.tipo === 'exito' ? '✓' : '!'}
                        </div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1A1A1A', fontSize: '20px' }}>
                            {modalMensaje.tipo === 'exito' ? '¡Bienvenido a Afrolash!' : 'Atención Requerida'}
                        </h3>
                        <p style={{ margin: '0 0 25px 0', color: '#555', fontSize: '15px' }}>{modalMensaje.texto}</p>
                        <button onClick={() => { setModalMensaje({ visible: false, texto: '', tipo: 'error', accionPosterior: null }); if (modalMensaje.accionPosterior) modalMensaje.accionPosterior(); }} style={{ width: '100%', padding: '12px', backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                            {modalMensaje.tipo === 'exito' ? 'Ir al Login' : 'Entendido'}
                        </button>
                    </div>
                </div>
            )}

            {/* NUEVO: Modal de Lectura de Documentos Legales (No borra el formulario) */}
            {modalDocumentoLegal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ backgroundColor: '#f9f9f9', borderRadius: '8px', maxWidth: '800px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 25px rgba(0,0,0,0.3)' }}>
                        
                        <div style={{ padding: '15px 20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A1A', color: 'white', borderRadius: '8px 8px 0 0' }}>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>
                                {modalDocumentoLegal === 'terminos' ? 'Términos y Condiciones' : 'Política de Privacidad'}
                            </h3>
                            <button onClick={() => setModalDocumentoLegal(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                        </div>
                        
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {/* Reutilizamos el componente legal, pero sin márgenes para que encaje en el modal */}
                            <div style={{ margin: '-40px' }}>
                                <DocumentosLegales tipoDocumento={modalDocumentoLegal} />
                            </div>
                        </div>

                        <div style={{ padding: '15px 20px', borderTop: '1px solid #ddd', backgroundColor: '#fff', textAlign: 'right', borderRadius: '0 0 8px 8px' }}>
                            <button onClick={() => setModalDocumentoLegal(null)} style={{ padding: '10px 25px', backgroundColor: '#D97A8C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Cerrar Documento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Registro;