import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PanelAdmin = () => {
    // Estado para la navegación interna: 'inventario', 'ventas' o 'metricas'
    const [pestañaActiva, setPestañaActiva] = useState('inventario');

    // Estados para Inventario
    const [inventario, setInventario] = useState([]);
    const [productoData, setProductoData] = useState({ nombre: '', descripcion: '', precio: '', stock: '' });
    const [imagen, setImagen] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState(null);
    
    // Estados para Ventas y Mensajes del sistema
    const [ventas, setVentas] = useState([]);
    const [mensaje, setMensaje] = useState('');

    const token = localStorage.getItem('token');
    const configHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

   // Carga inicial de datos según la pestaña activa
    useEffect(() => {
        if (pestañaActiva === 'inventario') {
            cargarInventario();
        } else if (pestañaActiva === 'ventas' || pestañaActiva === 'metricas') {
            // Se cargan las ventas también para las métricas
            cargarVentas();
        }
    }, [pestañaActiva]);

    const cargarInventario = async () => {
        try {
            const respuesta = await axios.get('http://localhost:5000/api/productos/admin', configHeaders);
            setInventario(respuesta.data);
        } catch (error) {
            console.error('Error al cargar inventario:', error);
        }
    };

    const cargarVentas = async () => {
        try {
            const respuesta = await axios.get('http://localhost:5000/api/pedidos/admin/todos', configHeaders);
            setVentas(respuesta.data);
        } catch (error) {
            console.error('Error al cargar ventas:', error);
            setMensaje('Error al cargar el registro de ventas.');
        }
    };

    // Cambiar estado de pedidos existente
    const cambiarEstadoPedido = async (id_pedido, nuevoEstado) => {
        try {
            await axios.patch(`http://localhost:5000/api/pedidos/admin/${id_pedido}/estado`, 
                { estado: nuevoEstado }, // Se envía con el nombre correcto de la columna
                configHeaders
            );
            cargarVentas();
        } catch (error) {
            console.error('Error al cambiar el estado del pedido:', error);
            setMensaje('No se pudo actualizar el estado del pedido.');
        }
    };

    // --- FUNCIONES DE INVENTARIO (Se mantienen iguales) ---
    const handleChange = (e) => { setProductoData({ ...productoData, [e.target.name]: e.target.value }); setMensaje(''); };
    const handleImageChange = (e) => { setImagen(e.target.files[0]); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modoEdicion) {
                await axios.put(`http://localhost:5000/api/productos/${idEdicion}`, productoData, configHeaders);
                setMensaje('Producto actualizado correctamente.');
                setModoEdicion(false);
                setIdEdicion(null);
            } else {
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
            setProductoData({ nombre: '', descripcion: '', precio: '', stock: '' });
            setImagen(null);
            if (document.getElementById('inputImagen')) document.getElementById('inputImagen').value = '';
            cargarInventario();
        } catch (error) {
            console.error('Error:', error);
            setMensaje(error.response?.data?.mensaje || 'Error procesando solicitud.');
        }
    };

    const iniciarEdicion = (producto) => {
        setModoEdicion(true);
        setIdEdicion(producto.id_producto);
        setProductoData({ nombre: producto.nombre, descripcion: producto.descripcion, precio: producto.precio, stock: producto.stock });
        window.scrollTo(0, 0);
    };

    const alternarEstado = async (id, estadoActual) => {
        const nuevoEstado = estadoActual === 1 ? 0 : 1;
        try {
            await axios.patch(`http://localhost:5000/api/productos/${id}/estado`, { estado: nuevoEstado }, configHeaders);
            cargarInventario();
        } catch (error) { console.error('Error al cambiar estado:', error); }
    };

// --- LÓGICA DE PROCESAMIENTO DE MÉTRICAS ---
    const ingresosTotales = ventas.reduce((acumulador, venta) => acumulador + parseFloat(venta.total), 0);
    const totalPedidos = ventas.length;

    // 1. Algoritmo para agrupar ingresos por mes de forma cronológica
    const ingresosPorMes = {};
    ventas.forEach(venta => {
        const fecha = new Date(venta.fecha_pedido);
        // Formato YYYY-MM para garantizar un ordenamiento cronológico perfecto
        const mesFormat = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`; 
        
        if (ingresosPorMes[mesFormat]) {
            ingresosPorMes[mesFormat] += parseFloat(venta.total);
        } else {
            ingresosPorMes[mesFormat] = parseFloat(venta.total);
        }
    });

    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Convertir el objeto a un arreglo ordenado para el gráfico
    const datosMensuales = Object.keys(ingresosPorMes)
        .sort() // Ordena las fechas de menor a mayor
        .map(llave => {
            const [año, mes] = llave.split('-');
            return {
                mes: `${mesesNombres[parseInt(mes) - 1]} ${año}`, // Ej: "Feb 2026"
                ingresos: parseFloat(ingresosPorMes[llave].toFixed(2))
            };
        });

    // 2. Algoritmo para el Top de Productos (Se mantiene igual)
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

    // --- RENDERIZADO VISUAL ---
    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            
            {/* Menú de Navegación de Pestañas */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
                <button 
                    onClick={() => setPestañaActiva('inventario')}
                    style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', border: 'none', backgroundColor: pestañaActiva === 'inventario' ? '#343a40' : '#e9ecef', color: pestañaActiva === 'inventario' ? 'white' : '#333', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Gestión de Inventario
                </button>
                <button 
                    onClick={() => setPestañaActiva('ventas')}
                    style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', border: 'none', backgroundColor: pestañaActiva === 'ventas' ? '#343a40' : '#e9ecef', color: pestañaActiva === 'ventas' ? 'white' : '#333', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Registro de Ventas
                </button>
                {/* NUEVO BOTÓN */}
                <button 
                    onClick={() => setPestañaActiva('metricas')}
                    style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', border: 'none', backgroundColor: pestañaActiva === 'metricas' ? '#343a40' : '#e9ecef', color: pestañaActiva === 'metricas' ? 'white' : '#333', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Métricas y Rendimiento
                </button>
            </div>

            {mensaje && <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#e2e3e5', textAlign: 'center', fontWeight: 'bold', borderRadius: '4px' }}>{mensaje}</div>}

            {/* PESTAÑA: INVENTARIO */}
            {pestañaActiva === 'inventario' && (
                <>
                    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '40px', backgroundColor: '#f9f9f9' }}>
                        <h2 style={{ textAlign: 'center', marginTop: 0 }}>{modoEdicion ? 'Editar Producto' : 'Agregar Nuevo Cosmético'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" name="nombre" placeholder="Nombre" value={productoData.nombre} onChange={handleChange} required style={{ padding: '10px' }} />
                            <textarea name="descripcion" placeholder="Descripción" value={productoData.descripcion} onChange={handleChange} required style={{ padding: '10px', minHeight: '80px' }} />
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <input type="number" name="precio" placeholder="Precio" step="0.01" value={productoData.precio} onChange={handleChange} required style={{ padding: '10px', flex: 1 }} />
                                <input type="number" name="stock" placeholder="Stock" value={productoData.stock} onChange={handleChange} required style={{ padding: '10px', flex: 1 }} />
                            </div>
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
                                        <button onClick={() => iniciarEdicion(item)} style={{ padding: '5px 10px', backgroundColor: '#ffc107', border: 'none', cursor: 'pointer', borderRadius: '3px' }}>Editar</button>
                                        <button onClick={() => alternarEstado(item.id_producto, item.estado)} style={{ padding: '5px 10px', backgroundColor: item.estado === 1 ? '#dc3545' : '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '3px' }}>
                                            {item.estado === 1 ? 'Ocultar' : 'Activar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* PESTAÑA: VENTAS */}
            {pestañaActiva === 'ventas' && (
                <div>
                    {ventas.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px' }}>No hay ventas registradas en el sistema.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {ventas.map((venta) => (
                                <div key={venta.id_pedido} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ backgroundColor: '#e9ecef', padding: '15px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>ORDEN #{venta.id_pedido}</span>
                                            <span style={{ fontSize: '14px' }}>{new Date(venta.fecha_pedido).toLocaleDateString('es-VE')}</span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>CLIENTE</span>
                                            <span style={{ fontSize: '14px' }}>{venta.cliente_nombre} ({venta.cliente_email})</span>
                                        </div>

                                        {/* Selector de Estado Logístico (ENUM) */}
                                        <div>
                                            <span style={{ display: 'block', fontSize: '12px', color: '#666', fontWeight: 'bold', marginBottom: '5px' }}>ESTADO</span>
                                            <select 
                                                value={venta.estado || 'pendiente'} 
                                                onChange={(e) => cambiarEstadoPedido(venta.id_pedido, e.target.value)}
                                                style={{ 
                                                    padding: '5px', 
                                                    borderRadius: '4px', 
                                                    border: '1px solid #ccc', 
                                                    fontWeight: 'bold', 
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
                                            <span style={{ display: 'block', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>INGRESOS</span>
                                            <span style={{ fontWeight: 'bold', color: '#28a745', fontSize: '16px' }}>${parseFloat(venta.total).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '15px', backgroundColor: '#fff' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Artículos Vendidos:</h4>
                                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#555', fontSize: '14px' }}>
                                            {venta.detalles && venta.detalles.map((detalle, idx) => (
                                                <li key={idx} style={{ marginBottom: '5px' }}>
                                                    {detalle.cantidad}x <strong>{detalle.nombre}</strong> - ${(parseFloat(detalle.precio_unitario) * detalle.cantidad).toFixed(2)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {/* NUEVO: Bloque de Datos Logísticos para el Administrador */}
                                    <div style={{ padding: '15px', borderBottom: '1px solid #eee', backgroundColor: '#fdfdfd', display: 'flex', gap: '40px' }}>
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
                    )}
                </div>
            )}
            {/* PESTAÑA: MÉTRICAS Y DASHBOARD */}
            {pestañaActiva === 'metricas' && (
                <div>
                    {/* Tarjetas de Indicadores Clave (KPIs) */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                        <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Ingresos Brutos</h3>
                            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>${ingresosTotales.toFixed(2)}</span>
                        </div>
                        <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Total de Pedidos</h3>
                            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>{totalPedidos}</span>
                        </div>
                        <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Ticket Promedio</h3>
                            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#17a2b8' }}>
                                ${totalPedidos > 0 ? (ingresosTotales / totalPedidos).toFixed(2) : '0.00'}
                            </span>
                        </div>
                    </div>

                    {/* Gráficos de Rendimiento */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        
                        {/* NUEVO: Gráfico de Ingresos Mensuales */}
                        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center', color: '#333' }}>Evolución de Ingresos Mensuales</h3>
                            {datosMensuales.length > 0 ? (
                                <div style={{ height: '350px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={datosMensuales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="mes" tick={{fontSize: 12, fill: '#666'}} tickMargin={10} />
                                            <YAxis tickFormatter={(value) => `$${value}`} tick={{fontSize: 12, fill: '#666'}} width={80} />
                                            <Tooltip formatter={(value) => [`$${value}`, 'Ingresos Brutos']} cursor={{fill: '#f8f9fa'}} />
                                            <Bar dataKey="ingresos" fill="#28a745" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: '#666' }}>No hay suficientes datos de ventas registrados.</p>
                            )}
                        </div>

                        {/* Gráfico de Top Productos */}
                        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center', color: '#333' }}>Top 5: Productos Más Vendidos</h3>
                            {datosTopProductos.length > 0 ? (
                                <div style={{ height: '300px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={datosTopProductos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="nombre" tick={{fontSize: 12, fill: '#666'}} tickMargin={10} />
                                            <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#666'}} />
                                            <Tooltip formatter={(value) => [value, 'Unidades Vendidas']} cursor={{fill: '#f8f9fa'}} />
                                            <Bar dataKey="cantidad" fill="#007bff" radius={[4, 4, 0, 0]} barSize={40} />
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
        </div>
    );
};

export default PanelAdmin;