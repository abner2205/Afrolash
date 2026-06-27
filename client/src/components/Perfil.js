import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Perfil = () => {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo: '',
        direccion: '',
        telefono: ''
    });
    
    // NUEVO: Estado centralizado para el Modal
    const [modalMensaje, setModalMensaje] = useState({ visible: false, texto: '', tipo: 'info' });
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const usuario = JSON.parse(usuarioGuardado);
            
            setFormData({
                nombre_completo: usuario.nombre_completo || usuario.nombre || '',
                correo: usuario.correo || usuario.email || '', 
                direccion: usuario.direccion || '',
                telefono: usuario.telefono || ''
            });
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);

        try {
            const token = localStorage.getItem('token');
            // Ruta corregida para coincidir con authRoutes.js
            await axios.put('http://localhost:5000/api/auth/perfil', 
                {
                    nombre_completo: formData.nombre_completo,
                    direccion: formData.direccion,
                    telefono: formData.telefono
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            const usuarioActualizado = { 
                ...usuarioGuardado, 
                nombre_completo: formData.nombre_completo,
                direccion: formData.direccion,
                telefono: formData.telefono
            };
            localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

            setModalMensaje({ visible: true, texto: 'Tus datos del perfil han sido actualizados correctamente.', tipo: 'exito' });
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            setModalMensaje({ visible: true, texto: 'No se pudo actualizar la información. Verifica tu conexión e intenta de nuevo.', tipo: 'error' });
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', border: '1px solid #F7CDD5', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginTop: 0, borderBottom: '2px solid #F7CDD5', paddingBottom: '15px', color: '#1A1A1A' }}>Mi Perfil</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#1A1A1A' }}>Correo Electrónico (No editable):</label>
                    <input 
                        type="email" 
                        value={formData.correo} 
                        disabled 
                        style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#e9ecef', color: '#6c757d', boxSizing: 'border-box' }} 
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#1A1A1A' }}>Nombre Completo:</label>
                    <input 
                        type="text" 
                        name="nombre_completo" 
                        value={formData.nombre_completo} 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', outlineColor: '#D97A8C' }} 
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#1A1A1A' }}>Teléfono de Contacto:</label>
                    <input 
                        type="text" 
                        name="telefono" 
                        value={formData.telefono} 
                        onChange={handleChange} 
                        placeholder="Ej: 0414-1234567" 
                        style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', outlineColor: '#D97A8C' }} 
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#1A1A1A' }}>Dirección de Entrega Predeterminada:</label>
                    <textarea 
                        name="direccion" 
                        value={formData.direccion} 
                        onChange={handleChange} 
                        placeholder="Escribe tu dirección completa..." 
                        style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '100px', boxSizing: 'border-box', outlineColor: '#D97A8C' }} 
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={cargando}
                    style={{ marginTop: '10px', padding: '15px 20px', backgroundColor: '#D97A8C', color: 'white', border: 'none', borderRadius: '4px', cursor: cargando ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.3s' }}
                >
                    {cargando ? 'Guardando cambios...' : 'Guardar Cambios'}
                </button>
            </form>

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
                            {modalMensaje.tipo === 'exito' ? 'Operación Exitosa' : 'Atención Requerida'}
                        </h3>
                        
                        <p style={{ margin: '0 0 25px 0', color: '#555', fontSize: '15px' }}>
                            {modalMensaje.texto}
                        </p>
                        
                        <button 
                            onClick={() => setModalMensaje({ visible: false, texto: '', tipo: 'info' })} 
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

export default Perfil;