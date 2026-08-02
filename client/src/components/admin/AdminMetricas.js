import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminMetricas = () => {
    const [ventas, setVentas] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const configHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

        const cargarVentas = async () => {
            try {
                const respuesta = await axios.get('http://localhost:5000/api/pedidos/admin/todos', configHeaders);
                setVentas(respuesta.data);
            } catch (error) {
                console.error('Error al cargar ventas para métricas:', error);
            }
        };
        cargarVentas();
    }, []);

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
    const datosMensuales = Object.keys(ingresosPorMes).sort().map(llave => {
        const [año, mes] = llave.split('-');
        return { mes: `${mesesNombres[parseInt(mes) - 1]} ${año}`, ingresos: parseFloat(ingresosPorMes[llave].toFixed(2)) };
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

    return (
        <div>
            <h2 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Métricas y Rendimiento</h2>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Ingresos Brutos</h3>
                    <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>${ingresosTotales.toFixed(2)}</span>
                </div>
                <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Total de Pedidos</h3>
                    <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#D97A8C' }}>{totalPedidos}</span>
                </div>
                <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Ticket Promedio</h3>
                    <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#CFA144' }}>${totalPedidos > 0 ? (ingresosTotales / totalPedidos).toFixed(2) : '0.00'}</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>Evolución de Ingresos Mensuales</h3>
                    {datosMensuales.length > 0 ? (
                        <div style={{ height: '350px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={datosMensuales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="mes" tick={{fontSize: 12, fill: '#666'}} tickMargin={10} />
                                    <YAxis tickFormatter={(value) => `$${value}`} tick={{fontSize: 12, fill: '#666'}} width={80} />
                                    <Tooltip formatter={(value) => [`$${value}`, 'Ingresos Brutos']} />
                                    <Bar dataKey="ingresos" fill="#D97A8C" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <p style={{ textAlign: 'center', color: '#666' }}>Faltan datos de ventas.</p>}
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
    );
};

export default AdminMetricas;