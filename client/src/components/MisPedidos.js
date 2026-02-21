import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MisPedidos = () => {
    const [pedidos, setPedidos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const obtenerHistorial = async () => {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Debes iniciar sesión para ver tus pedidos.');
                setCargando(false);
                return;
            }

            try {
                const respuesta = await axios.get('http://localhost:5000/api/pedidos/mis-pedidos', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setPedidos(respuesta.data);
            } catch (err) {
                console.error('Error al cargar pedidos:', err);
                setError('Hubo un problema al cargar tu historial de compras.');
            } finally {
                setCargando(false);
            }
        };

        obtenerHistorial();
    }, []);

    // Función auxiliar para formatear la fecha de MySQL a un formato legible
    const formatearFecha = (cadenaFecha) => {
        if (!cadenaFecha) return 'Fecha desconocida';
        const opciones = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(cadenaFecha).toLocaleDateString('es-VE', opciones);
    };

    if (cargando) return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando tu historial...</div>;
    if (error) return <div style={{ textAlign: 'center', color: 'red', padding: '20px' }}>{error}</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Mis Pedidos</h2>
            
            {pedidos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <p style={{ fontSize: '18px', color: '#666' }}>Aún no has realizado ninguna compra.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {pedidos.map((pedido) => (
                        <div key={pedido.id_pedido} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                            {/* Cabecera del Pedido */}
                            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', flexWrap: 'wrap', gap: '10px' }}>
                                <div>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Pedido Realizado</span>
                                    <span style={{ fontWeight: 'bold' }}>{formatearFecha(pedido.fecha_pedido)}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Total Pagado</span>
                                    <span style={{ fontWeight: 'bold', color: '#28a745' }}>${parseFloat(pedido.total).toFixed(2)}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>N° de Orden</span>
                                    <span style={{ fontWeight: 'bold' }}>#{pedido.id_pedido}</span>
                                </div>
                                {/* Indicador de estado basado en ENUM */}
                                <div>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Estado</span>
                                    <span style={{ 
                                        fontWeight: 'bold', 
                                        padding: '3px 8px', 
                                        borderRadius: '12px', 
                                        fontSize: '12px',
                                        backgroundColor: pedido.estado === 'entregado' ? '#d4edda' : pedido.estado === 'enviado' ? '#cce5ff' : pedido.estado === 'pagado' ? '#d1ecf1' : pedido.estado === 'cancelado' ? '#f8d7da' : '#fff3cd',
                                        color: pedido.estado === 'entregado' ? '#155724' : pedido.estado === 'enviado' ? '#004085' : pedido.estado === 'pagado' ? '#0c5460' : pedido.estado === 'cancelado' ? '#721c24' : '#856404'
                                    }}>
                                        {/* Capitaliza la primera letra del estado */}
                                        {pedido.estado ? pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1) : 'Pendiente'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Lista de Productos del Pedido */}
                            <div style={{ padding: '15px' }}>
                                {pedido.detalles && pedido.detalles.map((item, index) => (
                                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: index !== pedido.detalles.length - 1 ? '15px' : '0', paddingBottom: index !== pedido.detalles.length - 1 ? '15px' : '0', borderBottom: index !== pedido.detalles.length - 1 ? '1px solid #eee' : 'none' }}>
                                        <img src={item.imagen_url} alt={item.nombre} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: '0 0 5px 0' }}>{item.nombre}</h4>
                                            <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>Cantidad: {item.cantidad}</p>
                                        </div>
                                        <div style={{ fontWeight: 'bold' }}>
                                            ${(parseFloat(item.precio_unitario) * item.cantidad).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MisPedidos;