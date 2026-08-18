import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [formData, setFormData] = useState({
        nombre_completo: '', correo: '', telefono: '', direccion: ''
    });
    const [modalMensaje, setModalMensaje] = useState({ visible: false, texto: '', tipo: 'info' });

    const token = localStorage.getItem('token');
    const configHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

    useEffect(() => {
        cargarUsuarios();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargarUsuarios = async () => {
        try {
            const respuesta = await axios.get('http://localhost:5000/api/usuarios/admin/todos', configHeaders);
            setUsuarios(respuesta.data);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            setModalMensaje({ visible: true, texto: 'Error al obtener la lista de usuarios del sistema.', tipo: 'error' });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/usuarios/admin/empleado', formData, configHeaders);
            
            setModalMensaje({ visible: true, texto: 'Empleado creado exitosamente. Se ha enviado un correo con sus credenciales de acceso.', tipo: 'exito' });
            setMostrarFormulario(false);
            setFormData({ nombre_completo: '', correo: '', telefono: '', direccion: '' });
            cargarUsuarios();
        } catch (error) {
            setModalMensaje({ visible: true, texto: error.response?.data?.mensaje || 'Error al registrar al empleado.', tipo: 'error' });
        }
    };

    const eliminarEmpleado = async (id, nombre) => {
        const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el acceso del empleado ${nombre}?`);
        if (!confirmar) return;

        try {
            await axios.delete(`http://localhost:5000/api/usuarios/admin/empleado/${id}`, configHeaders);
            setModalMensaje({ visible: true, texto: 'Cuenta de empleado eliminada correctamente.', tipo: 'exito' });
            cargarUsuarios();
        } catch (error) {
            setModalMensaje({ visible: true, texto: error.response?.data?.mensaje || 'Error al intentar eliminar la cuenta.', tipo: 'error' });
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Gestión de Personal y Usuarios</h2>
                {!mostrarFormulario && (
                    <button onClick={() => setMostrarFormulario(true)} style={{ padding: '10px 20px', backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        + Registrar Nuevo Empleado
                    </button>
                )}
            </div>

            {mostrarFormulario && (
                <div style={{ padding: '30px', border: '1px solid #1A1A1A', borderRadius: '8px', marginBottom: '40px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ textAlign: 'center', marginTop: 0, color: '#1A1A1A', marginBottom: '25px' }}>Alta de Nuevo Empleado</h2>
                    <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>El sistema generará una contraseña segura y la enviará automáticamente al correo proporcionado.</p>
                    
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input type="text" name="nombre_completo" placeholder="Nombre Completo del Empleado" value={formData.nombre_completo} onChange={handleChange} required style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#1A1A1A' }} />
                        <input type="email" name="correo" placeholder="Correo Electrónico Válido" value={formData.correo} onChange={handleChange} required style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#1A1A1A' }} />
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <input type="text" name="telefono" placeholder="Teléfono de Contacto" value={formData.telefono} onChange={handleChange} required style={{ padding: '12px', flex: 1, borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#1A1A1A' }} />
                        </div>
                        
                        <textarea name="direccion" placeholder="Dirección de Residencia (Opcional)" value={formData.direccion} onChange={handleChange} style={{ padding: '12px', minHeight: '60px', borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#1A1A1A' }} />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button type="submit" style={{ flex: 1, padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                                Generar Credenciales y Registrar
                            </button>
                            <button type="button" onClick={() => { setMostrarFormulario(false); setFormData({ nombre_completo: '', correo: '', telefono: '', direccion: '' }); }} style={{ padding: '15px 30px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
                <thead>
                    <tr style={{ backgroundColor: '#1A1A1A', color: 'white' }}>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>ID</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Nombre</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Correo</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Rol</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Teléfono</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map(usuario => (
                        <tr key={usuario.id_usuario} style={{ textAlign: 'center' }}>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{usuario.id_usuario}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>{usuario.nombre_completo}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{usuario.correo}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <span style={{ 
                                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                    backgroundColor: usuario.rol === 'admin' ? '#1A1A1A' : usuario.rol === 'empleado' ? '#CFA144' : '#e9ecef',
                                    color: usuario.rol === 'admin' || usuario.rol === 'empleado' ? 'white' : '#333'
                                }}>
                                    {usuario.rol.toUpperCase()}
                                </span>
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{usuario.telefono || 'N/A'}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                {usuario.rol === 'empleado' ? (
                                    <button onClick={() => eliminarEmpleado(usuario.id_usuario, usuario.nombre_completo)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                                        Revocar Acceso
                                    </button>
                                ) : (
                                    <span style={{ color: '#aaa', fontSize: '12px' }}>Protegido</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {modalMensaje.visible && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: modalMensaje.tipo === 'exito' ? '#28a745' : '#dc3545', fontSize: '20px' }}>
                            {modalMensaje.tipo === 'exito' ? 'Operacion Exitosa' : 'Atencion Requerida'}
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

export default AdminUsuarios;