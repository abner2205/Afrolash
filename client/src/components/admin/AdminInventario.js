import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const AdminInventario = ({ usuarioActual }) => {
    const [inventario, setInventario] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [productoData, setProductoData] = useState({ 
        nombre: '', descripcion: '', precio: '', stock: '',
        ingredientes: '', instrucciones_uso: '', consejos: '', precauciones: ''
    });
    const [imagen, setImagen] = useState(null);
    const [imagenInstrucciones, setImagenInstrucciones] = useState(null);
    const [imagenConsejos, setImagenConsejos] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    const [modalMensaje, setModalMensaje] = useState({ visible: false, texto: '', tipo: 'info' });

    const token = localStorage.getItem('token');
    const configHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

    useEffect(() => {
        cargarInventario();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargarInventario = async () => {
        try {
            const respuesta = await axios.get('http://localhost:5000/api/productos/admin', configHeaders);
            setInventario(respuesta.data);
        } catch (error) {
            console.error('Error al cargar inventario:', error);
            setModalMensaje({ visible: true, texto: 'Ocurrió un problema al cargar el inventario.', tipo: 'error' });
        }
    };

    const handleChange = (e) => { 
        setProductoData({ ...productoData, [e.target.name]: e.target.value }); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('nombre', productoData.nombre);
            formData.append('descripcion', productoData.descripcion);
            formData.append('precio', productoData.precio);
            formData.append('stock', productoData.stock);
            formData.append('ingredientes', productoData.ingredientes);
            formData.append('instrucciones_uso', productoData.instrucciones_uso);
            formData.append('consejos', productoData.consejos);
            formData.append('precauciones', productoData.precauciones);
            
            if (imagen) formData.append('imagen', imagen); 
            if (imagenInstrucciones) formData.append('imagen_instrucciones', imagenInstrucciones);
            if (imagenConsejos) formData.append('imagen_consejos', imagenConsejos);

            if (modoEdicion) {
                await axios.put(`http://localhost:5000/api/productos/${idEdicion}`, formData, {
                    headers: { ...configHeaders.headers, 'Content-Type': 'multipart/form-data' }
                });
                setModalMensaje({ visible: true, texto: 'Producto actualizado correctamente, incluyendo las imágenes.', tipo: 'exito' });
            } else {
                if (!imagen) return setModalMensaje({ visible: true, texto: 'Error: Selecciona la fotografía principal para el cosmético.', tipo: 'error' });
                await axios.post('http://localhost:5000/api/productos', formData, {
                    headers: { ...configHeaders.headers, 'Content-Type': 'multipart/form-data' }
                });
                setModalMensaje({ visible: true, texto: 'Producto creado y publicado exitosamente.', tipo: 'exito' });
            }
            
            setModoEdicion(false);
            setMostrarFormulario(false);
            setIdEdicion(null);
            setProductoData({ nombre: '', descripcion: '', precio: '', stock: '', ingredientes: '', instrucciones_uso: '', consejos: '', precauciones: '' });
            setImagen(null);
            setImagenInstrucciones(null);
            setImagenConsejos(null);
            
            if (document.getElementById('inputImagen')) document.getElementById('inputImagen').value = '';
            if (document.getElementById('inputImagenInstrucciones')) document.getElementById('inputImagenInstrucciones').value = '';
            if (document.getElementById('inputImagenConsejos')) document.getElementById('inputImagenConsejos').value = '';
            
            cargarInventario();
        } catch (error) {
            setModalMensaje({ visible: true, texto: error.response?.data?.mensaje || 'Error procesando solicitud.', tipo: 'error' });
        }
    };

    const iniciarEdicion = (producto) => {
        setModoEdicion(true);
        setMostrarFormulario(true);
        setIdEdicion(producto.id_producto);
        setProductoData({ 
            nombre: producto.nombre, 
            descripcion: producto.descripcion, 
            precio: producto.precio, 
            stock: producto.stock,
            ingredientes: producto.ingredientes || '',
            instrucciones_uso: producto.instrucciones_uso || '',
            consejos: producto.consejos || '',
            precauciones: producto.precauciones || ''
        });
        window.scrollTo(0, 0);
    };

    const alternarEstado = async (id, estadoActual) => {
        const nuevoEstado = estadoActual === 1 ? 0 : 1;
        try {
            await axios.patch(`http://localhost:5000/api/productos/${id}/estado`, { estado: nuevoEstado }, configHeaders);
            cargarInventario();
        } catch (error) { 
            setModalMensaje({ visible: true, texto: 'No se pudo cambiar la visibilidad del producto.', tipo: 'error' });
        }
    };

    const exportarInventarioExcel = async () => {
        if (inventario.length === 0) {
            setModalMensaje({ visible: true, texto: 'El inventario está vacío, no hay datos para exportar.', tipo: 'info' });
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventario');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nombre del Cosmético', key: 'nombre', width: 40 },
            { header: 'Precio ($)', key: 'precio', width: 15 },
            { header: 'Stock Físico', key: 'stock', width: 15 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Descripción General', key: 'descripcion', width: 60 }
        ];

        const filaCabecera = worksheet.getRow(1);
        filaCabecera.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        filaCabecera.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A1A1A' }
        };
        filaCabecera.alignment = { vertical: 'middle', horizontal: 'center' };

        inventario.forEach(item => {
            worksheet.addRow({
                id: item.id_producto,
                nombre: item.nombre,
                precio: parseFloat(item.precio).toFixed(2),
                stock: item.stock,
                estado: item.estado === 1 ? 'ACTIVO' : 'OCULTO',
                descripcion: item.descripcion
            });
        });

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
                
                if (rowNumber > 1) {
                    cell.alignment = { 
                        vertical: 'middle', 
                        horizontal: colNumber === 2 || colNumber === 6 ? 'left' : 'center',
                        wrapText: true 
                    };
                }
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'Inventario_Afrolash.xlsx');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Gestión de Inventario</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                        onClick={exportarInventarioExcel}
                        style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Descargar Inventario Excel
                    </button>
                    {!mostrarFormulario && usuarioActual?.rol === 'admin' && (
                        <button onClick={() => { setMostrarFormulario(true); setModoEdicion(false); }} style={{ padding: '10px 20px', backgroundColor: '#D97A8C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            + Agregar Nuevo Cosmético
                        </button>
                    )}
                </div>
            </div>

            {mostrarFormulario && (
                <div style={{ padding: '30px', border: '1px solid #F7CDD5', borderRadius: '8px', marginBottom: '40px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ textAlign: 'center', marginTop: 0, color: '#1A1A1A', marginBottom: '25px' }}>{modoEdicion ? 'Editar Producto' : 'Agregar Nuevo Cosmético'}</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        
                        <h3 style={{ margin: '0 0 5px 0', borderBottom: '1px solid #eee', color: '#1A1A1A', paddingBottom: '5px', fontSize: '16px' }}>Información Básica (Obligatoria)</h3>
                        <input type="text" name="nombre" placeholder="Nombre del Producto" value={productoData.nombre} onChange={handleChange} required style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#D97A8C' }} />
                        <textarea name="descripcion" placeholder="Descripción General" value={productoData.descripcion} onChange={handleChange} required style={{ padding: '12px', minHeight: '80px', borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#D97A8C' }} />
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <input type="number" name="precio" placeholder="Precio ($)" step="0.01" value={productoData.precio} onChange={handleChange} required style={{ padding: '12px', flex: 1, borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#D97A8C' }} />
                            <input type="number" name="stock" placeholder="Unidades en Stock" value={productoData.stock} onChange={handleChange} required style={{ padding: '12px', flex: 1, borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#D97A8C' }} />
                        </div>
                        
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#1A1A1A' }}>
                                Fotografía Principal {modoEdicion ? '(Opcional: Subir archivo para reemplazar actual)' : '(Obligatoria)'}:
                            </label>
                            <input type="file" id="inputImagen" accept="image/*" onChange={(e) => setImagen(e.target.files[0])} required={!modoEdicion} style={{ color: '#555' }} />
                        </div>

                        <h3 style={{ margin: '15px 0 5px 0', borderBottom: '1px solid #eee', color: '#1A1A1A', paddingBottom: '5px', fontSize: '16px' }}>Información Detallada (Opcional)</h3>
                        
                        <textarea name="ingredientes" placeholder="Listado de ingredientes..." value={productoData.ingredientes} onChange={handleChange} style={{ padding: '12px', minHeight: '60px', borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#D97A8C' }} />
                        
                        <textarea name="instrucciones_uso" placeholder="Instrucciones paso a paso..." value={productoData.instrucciones_uso} onChange={handleChange} style={{ padding: '12px', minHeight: '60px', borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#D97A8C' }} />
                        
                        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px dashed #ccc' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#1A1A1A', fontSize: '13px' }}>
                                Imagen Complementaria para Instrucciones {modoEdicion && '(Opcional: Reemplazar actual)'}:
                            </label>
                            <input type="file" id="inputImagenInstrucciones" accept="image/*" onChange={(e) => setImagenInstrucciones(e.target.files[0])} style={{ color: '#555', fontSize: '13px' }} />
                        </div>

                        <textarea name="consejos" placeholder="Consejos adicionales de uso..." value={productoData.consejos} onChange={handleChange} style={{ padding: '12px', minHeight: '60px', borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#D97A8C' }} />
                        
                        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px dashed #ccc' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#1A1A1A', fontSize: '13px' }}>
                                Imagen Complementaria para Consejos {modoEdicion && '(Opcional: Reemplazar actual)'}:
                            </label>
                            <input type="file" id="inputImagenConsejos" accept="image/*" onChange={(e) => setImagenConsejos(e.target.files[0])} style={{ color: '#555', fontSize: '13px' }} />
                        </div>

                        <textarea name="precauciones" placeholder="Precauciones y advertencias..." value={productoData.precauciones} onChange={handleChange} style={{ padding: '12px', minHeight: '60px', borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#D97A8C' }} />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button type="submit" style={{ flex: 1, padding: '15px', backgroundColor: modoEdicion ? '#CFA144' : '#D97A8C', color: modoEdicion ? '#1A1A1A' : 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                                {modoEdicion ? 'Guardar Cambios del Producto' : 'Registrar Nuevo Producto'}
                            </button>
                            
                            <button type="button" onClick={() => { 
                                setMostrarFormulario(false); 
                                setModoEdicion(false); 
                                setProductoData({ nombre: '', descripcion: '', precio: '', stock: '', ingredientes: '', instrucciones_uso: '', consejos: '', precauciones: '' }); 
                            }} style={{ padding: '15px 30px', backgroundColor: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <thead>
                    <tr style={{ backgroundColor: '#1A1A1A', color: 'white' }}>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>ID</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Nombre</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Precio</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Stock</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Estado</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd' }}>Acciones</th>
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
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                    {/* Los botones operativos solo se muestran al administrador */}
                                    {usuarioActual?.rol === 'admin' ? (
                                        <>
                                            <button onClick={() => iniciarEdicion(item)} style={{ padding: '6px 12px', backgroundColor: '#CFA144', color: '#1A1A1A', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>Editar</button>
                                            <button onClick={() => alternarEstado(item.id_producto, item.estado)} style={{ padding: '6px 12px', backgroundColor: item.estado === 1 ? '#dc3545' : '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                                                {item.estado === 1 ? 'Ocultar' : 'Activar'}
                                            </button>
                                        </>
                                    ) : (
                                        <span style={{ color: '#888', fontSize: '12px' }}>Solo Lectura</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
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

export default AdminInventario;