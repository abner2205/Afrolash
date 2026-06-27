import React, { useState } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const RestablecerPassword = ({ navegarA, id, token }) => {
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    
    // Estado centralizado para el Modal Inteligente
    const [modalMensaje, setModalMensaje] = useState({ visible: false, texto: '', tipo: 'info', accionPosterior: null });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password.length < 8) {
            return setModalMensaje({ 
                visible: true, 
                texto: 'Por motivos de seguridad, tu nueva contraseña debe tener al menos 8 caracteres.', 
                tipo: 'error' 
            });
        }
        
        setCargando(true);
        try {
            const respuesta = await axios.post(`http://localhost:5000/api/auth/restablecer-password/${id}/${token}`, { nuevaPassword: password });
            
            // Éxito: Modal que redirige al login al cerrarse
            setModalMensaje({ 
                visible: true, 
                texto: respuesta.data.mensaje || 'Tu contraseña ha sido actualizada con éxito.', 
                tipo: 'exito',
                accionPosterior: () => navegarA('login')
            });
        } catch (error) {
            // Error: Modal informativo (ej. token expirado)
            setModalMensaje({ 
                visible: true, 
                texto: error.response?.data?.mensaje || 'Error al restablecer la contraseña. Es posible que el enlace haya expirado o sea inválido.', 
                tipo: 'error' 
            });
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', border: '1px solid #F7CDD5', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#1A1A1A' }}>Crear nueva contraseña</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#1A1A1A' }}>Nueva Contraseña:</label>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type={mostrarPassword ? "text" : "password"} 
                            placeholder="Mínimo 8 caracteres" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '12px 50px 12px 12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', outlineColor: '#D97A8C' }} 
                        />
                        <button 
                            type="button" 
                            onClick={() => setMostrarPassword(!mostrarPassword)}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                        padding: '12px', 
                        backgroundColor: cargando ? '#6c757d' : '#D97A8C', 
                        color: 'white', border: 'none', borderRadius: '4px', 
                        cursor: cargando ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px',
                        transition: 'background-color 0.3s'
                    }}
                >
                    {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
                </button>
            </form>

            {/* MODAL INTELIGENTE (ÉXITO / ERROR) */}
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
                            {modalMensaje.tipo === 'exito' ? '¡Contraseña Actualizada!' : 'Atención Requerida'}
                        </h3>
                        
                        <p style={{ margin: '0 0 25px 0', color: '#555', fontSize: '15px' }}>
                            {modalMensaje.texto}
                        </p>
                        
                        <button 
                            onClick={() => {
                                setModalMensaje({ visible: false, texto: '', tipo: 'info', accionPosterior: null });
                                if (modalMensaje.accionPosterior) modalMensaje.accionPosterior();
                            }} 
                            style={{ width: '100%', padding: '12px', backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                        >
                            {modalMensaje.tipo === 'exito' ? 'Ir al Login' : 'Entendido'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestablecerPassword;