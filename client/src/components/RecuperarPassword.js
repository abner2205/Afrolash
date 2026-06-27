import React, { useState } from 'react';
import axios from 'axios';

const RecuperarPassword = ({ navegarA }) => {
    const [correo, setCorreo] = useState('');
    const [cargando, setCargando] = useState(false);
    
    // NUEVO: Estado centralizado para el Modal Inteligente
    const [modalMensaje, setModalMensaje] = useState({ visible: false, texto: '', tipo: 'info' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            await axios.post('http://localhost:5000/api/auth/recuperar-password', { correo });
            setModalMensaje({ 
                visible: true, 
                texto: 'Si el correo está registrado, recibirás un enlace de recuperación en los próximos minutos.', 
                tipo: 'exito' 
            });
        } catch (error) {
            setModalMensaje({ 
                visible: true, 
                texto: 'Ocurrió un error al procesar la solicitud. Verifica tu conexión e intenta nuevamente.', 
                tipo: 'error' 
            });
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', border: '1px solid #F7CDD5', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1A1A1A' }}>Recuperar Contraseña</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#1A1A1A' }}>Correo Electrónico:</label>
                    <input 
                        type="email" 
                        placeholder="Ingresa tu correo electrónico" 
                        value={correo} 
                        onChange={(e) => setCorreo(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', outlineColor: '#D97A8C' }} 
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={cargando} 
                    style={{ 
                        padding: '12px', 
                        backgroundColor: cargando ? '#6c757d' : '#D97A8C', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: cargando ? 'not-allowed' : 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: '16px',
                        transition: 'background-color 0.3s'
                    }}
                >
                    {cargando ? 'Enviando...' : 'Enviar enlace'}
                </button>
            </form>
            
            <p 
                style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px', cursor: 'pointer', color: '#4682B4', textDecoration: 'underline', fontWeight: 'bold' }} 
                onClick={() => navegarA('login')}
            >
                Volver al inicio de sesión
            </p>

            {/* MODAL DE CONFIRMACIÓN / ERROR */}
            {modalMensaje.visible && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        
                        <div style={{ 
                            width: '50px', height: '50px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', margin: '0 auto 15px auto', fontWeight: 'bold',
                            backgroundColor: modalMensaje.tipo === 'exito' ? '#d4edda' : '#f8d7da',
                            color: modalMensaje.tipo === 'exito' ? '#28a745' : '#dc3545'
                        }}>
                            {modalMensaje.tipo === 'exito' ? '✓' : '!'}
                        </div>
                        
                        <h3 style={{ margin: '0 0 10px 0', color: '#1A1A1A', fontSize: '20px' }}>
                            {modalMensaje.tipo === 'exito' ? 'Solicitud Enviada' : 'Atención Requerida'}
                        </h3>
                        
                        <p style={{ margin: '0 0 25px 0', color: '#555', fontSize: '15px' }}>
                            {modalMensaje.texto}
                        </p>
                        
                        <button 
                            onClick={() => {
                                setModalMensaje({ visible: false, texto: '', tipo: 'info' });
                                if (modalMensaje.tipo === 'exito') {
                                    navegarA('login'); // Redirige opcionalmente si es exitoso
                                }
                            }} 
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

export default RecuperarPassword;