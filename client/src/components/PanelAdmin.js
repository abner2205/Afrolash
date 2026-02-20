import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PanelAdmin = () => {
    // Estados para el CRUD
    const [inventario, setInventario] = useState([]);
    const [productoData, setProductoData] = useState({ nombre: '', descripcion: '', precio: '', stock: '' });
    const [imagen, setImagen] = useState(null);
    const [mensaje, setMensaje] = useState('');
    
    // Estado para saber si estamos creando o editando
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);

    const token = localStorage.getItem('token');
    const configHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

    // Carga inicial del inventario completo
    const cargarInventario = async () => {
        try {
            const respuesta = await axios.get('http://localhost:5000/api/productos/admin', configHeaders);
            setInventario(respuesta.data);
        } catch (error) {
            console.error('Error al cargar inventario:', error);
        }
    };

    useEffect(() => {
        cargarInventario();
    }, []);

    const handleChange = (e) => {
        setProductoData({ ...productoData, [e.target.name]: e.target.value });
        setMensaje('');
    };

    const handleImageChange = (e) => {
        setImagen(e.target.files[0]);
    };

    // Función unificada para CREAR o ACTUALIZAR
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (modoEdicion) {
                // Lógica de ACTUALIZACIÓN (PUT)
                await axios.put(`http://localhost:5000/api/productos/${idEdicion}`, productoData, configHeaders);
                setMensaje('Producto actualizado correctamente.');
                setModoEdicion(false);
                setIdEdicion(null);
            } else {
                // Lógica de CREACIÓN (POST con FormData)
                if (!imagen) return setMensaje('Error: Selecciona una fotografía.');
                
                const formData = new FormData();
                formData.append('nombre', productoData.nombre);
                formData.append('descripcion', productoData.descripcion);
                formData.append('precio', productoData.precio);
                formData.append('stock', productoData.stock);
                formData.append('imagen', imagen); 

                await axios.post('http://localhost:5000/api/productos', formData, {
                    headers: { ...configHeaders.headers, 'Content-Type': 'multipart/form-data' }
                });
                setMensaje('Producto creado exitosamente.');
            }

            // Limpiar formulario y recargar tabla
            setProductoData({ nombre: '', descripcion: '', precio: '', stock: '' });
            setImagen(null);
            if (document.getElementById('inputImagen')) document.getElementById('inputImagen').value = '';
            cargarInventario();

        } catch (error) {
            console.error('Error en la operación:', error);
            setMensaje(error.response?.data?.mensaje || 'Error al procesar la solicitud.');
        }
    };

    // Prepara el formulario para editar un producto
    const iniciarEdicion = (producto) => {
        setModoEdicion(true);
        setIdEdicion(producto.id_producto);
        setProductoData({
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio,
            stock: producto.stock
        });
        window.scrollTo(0, 0); // Sube la pantalla hasta el formulario
    };

    // Cambia la visibilidad del producto (Borrado Lógico o Reactivación)
    const alternarEstado = async (id, estadoActual) => {
        const nuevoEstado = estadoActual === 1 ? 0 : 1;
        try {
            await axios.patch(`http://localhost:5000/api/productos/${id}/estado`, { estado: nuevoEstado }, configHeaders);
            cargarInventario();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            {/* SECCIÓN 1: FORMULARIO */}
            <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '40px', backgroundColor: '#f9f9f9' }}>
                <h2 style={{ textAlign: 'center' }}>{modoEdicion ? 'Editar Producto' : 'Agregar Nuevo Cosmético'}</h2>
                {mensaje && <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#e2e3e5', textAlign: 'center', fontWeight: 'bold' }}>{mensaje}</div>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" name="nombre" placeholder="Nombre" value={productoData.nombre} onChange={handleChange} required style={{ padding: '10px' }} />
                    <textarea name="descripcion" placeholder="Descripción" value={productoData.descripcion} onChange={handleChange} required style={{ padding: '10px', minHeight: '80px' }} />
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <input type="number" name="precio" placeholder="Precio" step="0.01" value={productoData.precio} onChange={handleChange} required style={{ padding: '10px', flex: 1 }} />
                        <input type="number" name="stock" placeholder="Stock" value={productoData.stock} onChange={handleChange} required style={{ padding: '10px', flex: 1 }} />
                    </div>
                    
                    {/* Ocultar selector de imagen en modo edición temporalmente por simplicidad */}
                    {!modoEdicion && (
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Fotografía:</label>
                            <input type="file" id="inputImagen" accept="image/*" onChange={handleImageChange} required />
                        </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: modoEdicion ? '#ffc107' : '#17a2b8', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                            {modoEdicion ? 'Guardar Cambios' : 'Registrar Producto'}
                        </button>
                        {modoEdicion && (
                            <button type="button" onClick={() => { setModoEdicion(false); setProductoData({ nombre: '', descripcion: '', precio: '', stock: '' }); }} style={{ padding: '10px', backgroundColor: '#6c757d', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* SECCIÓN 2: TABLA DE INVENTARIO */}
            <h2>Gestión de Inventario</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#343a40', color: 'white' }}>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nombre</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Precio</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Stock</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Estado</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {inventario.map(item => (
                        <tr key={item.id_producto} style={{ textAlign: 'center', backgroundColor: item.estado === 1 ? '#fff' : '#f8d7da' }}>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.id_producto}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.nombre}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>${item.precio}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.stock}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: item.estado === 1 ? 'green' : 'red' }}>
                                {item.estado === 1 ? 'Activo' : 'Oculto'}
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                <button onClick={() => iniciarEdicion(item)} style={{ padding: '5px 10px', backgroundColor: '#ffc107', border: 'none', cursor: 'pointer', borderRadius: '3px' }}>
                                    Editar
                                </button>
                                <button 
                                    onClick={() => alternarEstado(item.id_producto, item.estado)} 
                                    style={{ padding: '5px 10px', backgroundColor: item.estado === 1 ? '#dc3545' : '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '3px' }}
                                >
                                    {item.estado === 1 ? 'Ocultar' : 'Activar'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PanelAdmin;