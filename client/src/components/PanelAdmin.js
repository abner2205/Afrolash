import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PanelAdmin = () => {
    const [pestañaActiva, setPestañaActiva] = useState('inventario');

    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const [inventario, setInventario] = useState([]);
    const [productoData, setProductoData] = useState({ 
        nombre: '', descripcion: '', precio: '', stock: '',
        ingredientes: '', instrucciones_uso: '', consejos: '', precauciones: ''
    });
    const [imagen, setImagen] = useState(null);
    const [imagenInstrucciones, setImagenInstrucciones] = useState(null);
    const [imagenConsejos, setImagenConsejos] = useState(null);
    
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    
    // Estados para Ventas
    const [ventas, setVentas] = useState([]);
    const [modalMensaje, setModalMensaje] = useState({ visible: false, texto: '', tipo: 'info' });

    // NUEVOS ESTADOS PARA BÚSQUEDA Y PAGINACIÓN DE VENTAS
    const [busquedaVentas, setBusquedaVentas] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [paginaVentas, setPaginaVentas] = useState(1);
    const ventasPorPagina = 10;

    const token = localStorage.getItem('token');
    const configHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

    useEffect(() => {
        if (pestañaActiva === 'inventario') {
            cargarInventario();
        } else if (pestañaActiva === 'ventas' || pestañaActiva === 'metricas') {
            cargarVentas();
        }
    }, [pestañaActiva]);

    // Reinicia la página a 1 cuando el usuario busca o filtra
    useEffect(() => {
        setPaginaVentas(1);
    }, [busquedaVentas, filtroEstado]);

    const cargarInventario = async () => {
        try {
            const respuesta = await axios.get('http://localhost:5000/api/productos/admin', configHeaders);
            setInventario(respuesta.data);
        } catch (error) {
            console.error('Error al cargar inventario:', error);
            setModalMensaje({ visible: true, texto: 'Ocurrió un problema al cargar el inventario.', tipo: 'error' });
        }
    };

    const cargarVentas = async () => {
        try {
            const respuesta = await axios.get('http://localhost:5000/api/pedidos/admin/todos', configHeaders);
            setVentas(respuesta.data);
        } catch (error) {
            console.error('Error al cargar ventas:', error);
            setModalMensaje({ visible: true, texto: 'Error al cargar el registro de ventas.', tipo: 'error' });
        }
    };

    const cambiarEstadoPedido = async (id_pedido, nuevoEstado) => {
        try {
            await axios.patch(`http://localhost:5000/api/pedidos/admin/${id_pedido}/estado`, 
                { estado: nuevoEstado }, configHeaders
            );
            cargarVentas();
        } catch (error) {
            setModalMensaje({ visible: true, texto: 'No se pudo actualizar el estado del pedido.', tipo: 'error' });
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
            console.error('Error:', error);
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

    // --- LÓGICA DE PROCESAMIENTO DE MÉTRICAS ---
    const ingresosTotales = ventas.reduce((acumulador, venta) => acumulador + parseFloat(venta.total), 0);
    const totalPedidos = ventas.length;

    const ingresosPorMes = {};
    ventas.forEach(venta => {
        const fecha = new Date(venta.fecha_pedido);
        const mesFormat = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`; 
        if (ingresosPorMes[mesFormat]) {
            ingresosPorMes[mesFormat] += parseFloat(venta.total);
        } else {
            ingresosPorMes[mesFormat] = parseFloat(venta.total);
        }
    });

    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const datosMensuales = Object.keys(ingresosPorMes)
        .sort()
        .map(llave => {
            const [año, mes] = llave.split('-');
            return {
                mes: `${mesesNombres[parseInt(mes) - 1]} ${año}`,
                ingresos: parseFloat(ingresosPorMes[llave].toFixed(2))
            };
        });

    const conteoProductos = {};
    ventas.forEach(venta => {
        if (venta.detalles) {
            venta.detalles.forEach(detalle => {
                if (conteoProductos[detalle.nombre]) {
                    conteoProductos[detalle.nombre] += detalle.cantidad;
                } else {
                    conteoProductos[detalle.nombre] = detalle.cantidad;
                }
            });
        }
    });

    const datosTopProductos = Object.keys(conteoProductos)
        .map(nombre => ({ nombre: nombre, cantidad: conteoProductos[nombre] }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

    // --- LÓGICA DE FILTRADO Y PAGINACIÓN PARA VENTAS ---
    let ventasProcesadas = ventas.filter(venta => {
        const termino = busquedaVentas.toLowerCase();
        const coincideBusqueda = 
            venta.id_pedido.toString().includes(termino) ||
            (venta.cliente_nombre && venta.cliente_nombre.toLowerCase().includes(termino)) ||
            (venta.cliente_email && venta.cliente_email.toLowerCase().includes(termino));

        const coincideEstado = filtroEstado === 'todos' || venta.estado === filtroEstado;

        return coincideBusqueda && coincideEstado;
    });

    const indiceUltimaVenta = paginaVentas * ventasPorPagina;
    const indicePrimeraVenta = indiceUltimaVenta - ventasPorPagina;
    const ventasPaginadas = ventasProcesadas.slice(indicePrimeraVenta, indiceUltimaVenta);
    const totalPaginasVentas = Math.ceil(ventasProcesadas.length / ventasPorPagina);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
                <button 
                    onClick={() => setPestañaActiva('inventario')}
                    style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', border: 'none', backgroundColor: pestañaActiva === 'inventario' ? '#1A1A1A' : '#F7CDD5', color: pestañaActiva === 'inventario' ? 'white' : '#1A1A1A', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Gestión de Inventario
                </button>
                <button 
                    onClick={() => setPestañaActiva('ventas')}
                    style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', border: 'none', backgroundColor: pestañaActiva === 'ventas' ? '#1A1A1A' : '#F7CDD5', color: pestañaActiva === 'ventas' ? 'white' : '#1A1A1A', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Registro de Ventas
                </button>
                <button 
                    onClick={() => setPestañaActiva('metricas')}
                    style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', border: 'none', backgroundColor: pestañaActiva === 'metricas' ? '#1A1A1A' : '#F7CDD5', color: pestañaActiva === 'metricas' ? 'white' : '#1A1A1A', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Métricas y Rendimiento
                </button>
            </div>

            {pestañaActiva === 'inventario' && (
                <>
                    {!mostrarFormulario && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            <button 
                                onClick={() => { setMostrarFormulario(true); setModoEdicion(false); }} 
                                style={{ padding: '12px 25px', backgroundColor: '#D97A8C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 2px 8px rgba(217, 122, 140, 0.4)' }}
                            >
                                + Agregar Nuevo Cosmético
                            </button>
                        </div>
                    )}

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
                                            <button onClick={() => iniciarEdicion(item)} style={{ padding: '6px 12px', backgroundColor: '#CFA144', color: '#1A1A1A', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>Editar</button>
                                            <button onClick={() => alternarEstado(item.id_producto, item.estado)} style={{ padding: '6px 12px', backgroundColor: item.estado === 1 ? '#dc3545' : '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                                                {item.estado === 1 ? 'Ocultar' : 'Activar'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {pestañaActiva === 'ventas' && (
                <div>
                    {/* BARRA DE BÚSQUEDA Y FILTROS */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Buscar Pedido:</label>
                            <input 
                                type="text" 
                                placeholder="ID, Nombre o Correo del cliente..." 
                                value={busquedaVentas}
                                onChange={(e) => setBusquedaVentas(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#D97A8C', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Filtrar por Estado:</label>
                            <select 
                                value={filtroEstado} 
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#D97A8C', boxSizing: 'border-box', backgroundColor: '#fff' }}
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="pagado">Pagado</option>
                                <option value="enviado">Enviado</option>
                                <option value="entregado">Entregado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    {ventasProcesadas.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                            <p style={{ fontSize: '18px', color: '#666' }}>No se encontraron ventas que coincidan con la búsqueda.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {ventasPaginadas.map((venta) => (
                                    <div key={venta.id_pedido} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                                        <div style={{ backgroundColor: '#F7CDD5', padding: '15px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '12px', color: '#1A1A1A', fontWeight: 'bold' }}>ORDEN #{venta.id_pedido}</span>
                                                <span style={{ fontSize: '14px', color: '#333' }}>{new Date(venta.fecha_pedido).toLocaleDateString('es-VE')}</span>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '12px', color: '#1A1A1A', fontWeight: 'bold' }}>CLIENTE</span>
                                                <span style={{ fontSize: '14px', color: '#333' }}>{venta.cliente_nombre} ({venta.cliente_email})</span>
                                            </div>

                                            <div>
                                                <span style={{ display: 'block', fontSize: '12px', color: '#1A1A1A', fontWeight: 'bold', marginBottom: '5px' }}>ESTADO</span>
                                                <select 
                                                    value={venta.estado || 'pendiente'} 
                                                    onChange={(e) => cambiarEstadoPedido(venta.id_pedido, e.target.value)}
                                                    style={{ 
                                                        padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold', color: '#333', outlineColor: '#D97A8C',
                                                        backgroundColor: venta.estado === 'entregado' ? '#d4edda' : venta.estado === 'enviado' ? '#cce5ff' : venta.estado === 'pagado' ? '#d1ecf1' : venta.estado === 'cancelado' ? '#f8d7da' : '#fff3cd' 
                                                    }}
                                                >
                                                    <option value="pendiente">Pendiente</option>
                                                    <option value="pagado">Pagado</option>
                                                    <option value="enviado">Enviado</option>
                                                    <option value="entregado">Entregado</option>
                                                    <option value="cancelado">Cancelado</option>
                                                </select>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ display: 'block', fontSize: '12px', color: '#1A1A1A', fontWeight: 'bold' }}>INGRESOS</span>
                                                <span style={{ fontWeight: 'bold', color: '#28a745', fontSize: '16px' }}>${parseFloat(venta.total).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div style={{ padding: '15px', backgroundColor: '#fff' }}>
                                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#1A1A1A' }}>Artículos Vendidos:</h4>
                                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#555', fontSize: '14px' }}>
                                                {venta.detalles && venta.detalles.map((detalle, idx) => (
                                                    <li key={idx} style={{ marginBottom: '5px' }}>
                                                        {detalle.cantidad}x <strong>{detalle.nombre}</strong> - ${(parseFloat(detalle.precio_unitario) * detalle.cantidad).toFixed(2)}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div style={{ padding: '15px', borderTop: '1px solid #eee', backgroundColor: '#fdfdfd', display: 'flex', gap: '40px' }}>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '12px', color: '#666', fontWeight: 'bold', marginBottom: '5px' }}>DIRECCIÓN DE ENTREGA</span>
                                                <span style={{ display: 'block', fontSize: '14px', color: '#333' }}>{venta.direccion_envio || 'Dato no registrado en esta orden'}</span>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '12px', color: '#666', fontWeight: 'bold', marginBottom: '5px' }}>TELÉFONO</span>
                                                <span style={{ display: 'block', fontSize: '14px', color: '#333' }}>{venta.telefono_contacto || 'No registrado'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CONTROLES DE PAGINACIÓN */}
                            {totalPaginasVentas > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
                                    <button 
                                        onClick={() => setPaginaVentas(paginaVentas - 1)} 
                                        disabled={paginaVentas === 1} 
                                        style={{ padding: '8px 15px', border: '1px solid #ccc', backgroundColor: paginaVentas === 1 ? '#f9f9f9' : '#fff', color: paginaVentas === 1 ? '#aaa' : '#333', borderRadius: '4px', cursor: paginaVentas === 1 ? 'not-allowed' : 'pointer' }}
                                    >
                                        Anterior
                                    </button>
                                    
                                    {Array.from({ length: totalPaginasVentas }, (_, index) => (
                                        <button 
                                            key={index + 1} 
                                            onClick={() => setPaginaVentas(index + 1)} 
                                            style={{ padding: '8px 12px', border: '1px solid #ccc', backgroundColor: paginaVentas === index + 1 ? '#1A1A1A' : '#fff', color: paginaVentas === index + 1 ? 'white' : '#333', borderRadius: '4px', cursor: 'pointer', fontWeight: paginaVentas === index + 1 ? 'bold' : 'normal' }}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                    
                                    <button 
                                        onClick={() => setPaginaVentas(paginaVentas + 1)} 
                                        disabled={paginaVentas === totalPaginasVentas} 
                                        style={{ padding: '8px 15px', border: '1px solid #ccc', backgroundColor: paginaVentas === totalPaginasVentas ? '#f9f9f9' : '#fff', color: paginaVentas === totalPaginasVentas ? '#aaa' : '#333', borderRadius: '4px', cursor: paginaVentas === totalPaginasVentas ? 'not-allowed' : 'pointer' }}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {pestañaActiva === 'metricas' && (
                <div>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Ingresos Brutos</h3>
                            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>${ingresosTotales.toFixed(2)}</span>
                        </div>
                        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Total de Pedidos</h3>
                            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#D97A8C' }}>{totalPedidos}</span>
                        </div>
                        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Ticket Promedio</h3>
                            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#CFA144' }}>
                                ${totalPedidos > 0 ? (ingresosTotales / totalPedidos).toFixed(2) : '0.00'}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center', color: '#1A1A1A' }}>Evolución de Ingresos Mensuales</h3>
                            {datosMensuales.length > 0 ? (
                                <div style={{ height: '350px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={datosMensuales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="mes" tick={{fontSize: 12, fill: '#666'}} tickMargin={10} />
                                            <YAxis tickFormatter={(value) => `$${value}`} tick={{fontSize: 12, fill: '#666'}} width={80} />
                                            <Tooltip formatter={(value) => [`$${value}`, 'Ingresos Brutos']} cursor={{fill: '#f8f9fa'}} />
                                            <Bar dataKey="ingresos" fill="#D97A8C" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: '#666' }}>No hay suficientes datos de ventas registrados.</p>
                            )}
                        </div>

                        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center', color: '#1A1A1A' }}>Top 5: Productos Más Vendidos</h3>
                            {datosTopProductos.length > 0 ? (
                                <div style={{ height: '300px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={datosTopProductos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="nombre" tick={{fontSize: 12, fill: '#666'}} tickMargin={10} />
                                            <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#666'}} />
                                            <Tooltip formatter={(value) => [value, 'Unidades Vendidas']} cursor={{fill: '#f8f9fa'}} />
                                            <Bar dataKey="cantidad" fill="#1A1A1A" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: '#666' }}>No hay suficientes datos de ventas registrados.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

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

export default PanelAdmin;