import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Perfil = () => {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo: '',
        direccion: '',
        telefono: ''
    });
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        // Cargar los datos actuales desde la memoria al abrir la pantalla
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const usuario = JSON.parse(usuarioGuardado);
            
            // Añadimos operadores lógicos OR (||) para capturar los datos sin importar cómo los haya llamado el backend antes
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
        setMensaje({ texto: '', tipo: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);

        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/usuarios/perfil', 
                {
                    nombre_completo: formData.nombre_completo,
                    direccion: formData.direccion,
                    telefono: formData.telefono
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // Actualizar la memoria del navegador con los nuevos datos
            const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
            const usuarioActualizado = { 
                ...usuarioGuardado, 
                nombre_completo: formData.nombre_completo,
                direccion: formData.direccion,
                telefono: formData.telefono
            };
            localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

            setMensaje({ texto: 'Tus datos han sido actualizados correctamente.', tipo: 'exito' });
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            setMensaje({ texto: 'No se pudo actualizar la información. Intenta de nuevo.', tipo: 'error' });
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '15px', color: '#333' }}>Mi Perfil</h2>
            
            {mensaje.texto && (
                <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '4px', fontWeight: 'bold', textAlign: 'center',
                    backgroundColor: mensaje.tipo === 'exito' ? '#d4edda' : '#f8d7da',
                    color: mensaje.tipo === 'exito' ? '#155724' : '#721c24',
                    border: `1px solid ${mensaje.tipo === 'exito' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Correo Electrónico (No editable):</label>
                    <input type="email" value={formData.correo} disabled style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#e9ecef', color: '#6c757d', boxSizing: 'border-box' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Nombre Completo:</label>
                    <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Teléfono de Contacto:</label>
                    <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: 0414-1234567" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Dirección de Entrega Predeterminada:</label>
                    <textarea name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Escribe tu dirección completa..." style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px', boxSizing: 'border-box' }} />
                </div>

                <button 
                    type="submit" 
                    disabled={cargando}
                    style={{ marginTop: '10px', padding: '12px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: cargando ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                >
                    {cargando ? 'Guardando cambios...' : 'Guardar Cambios'}
                </button>
            </form>
        </div>
    );
};

export default Perfil;