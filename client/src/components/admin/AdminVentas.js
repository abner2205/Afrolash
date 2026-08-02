import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const AdminVentas = () => {
    const [ventas, setVentas] = useState([]);
    const [busquedaVentas, setBusquedaVentas] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    
    const [paginaVentas, setPaginaVentas] = useState(1);
    const ventasPorPagina = 10;
    const [modalMensaje, setModalMensaje] = useState({ visible: false, texto: '', tipo: 'info' });

    useEffect(() => {
        cargarVentas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setPaginaVentas(1);
    }, [busquedaVentas, filtroEstado, fechaInicio, fechaFin]);

    const cargarVentas = async () => {
        try {
            const token = localStorage.getItem('token');
            const configHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            const respuesta = await axios.get('http://localhost:5000/api/pedidos/admin/todos', configHeaders);
            setVentas(respuesta.data);
        } catch (error) {
            console.error('Error al cargar ventas:', error);
        }
    };

    const cambiarEstadoPedido = async (id_pedido, nuevoEstado) => {
        try {
            const token = localStorage.getItem('token');
            const configHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
            await axios.patch(`http://localhost:5000/api/pedidos/admin/${id_pedido}/estado`, 
                { estado: nuevoEstado }, configHeaders
            );
            cargarVentas();
            setModalMensaje({ visible: true, texto: 'Estado logístico actualizado con éxito.', tipo: 'exito' });
        } catch (error) {
            setModalMensaje({ visible: true, texto: 'No se pudo actualizar el estado del pedido.', tipo: 'error' });
        }
    };

    let ventasProcesadas = ventas.filter(venta => {
        const termino = busquedaVentas.toLowerCase();
        const coincideBusqueda = 
            venta.id_pedido.toString().includes(termino) ||
            (venta.cliente_nombre && venta.cliente_nombre.toLowerCase().includes(termino)) ||
            (venta.cliente_email && venta.cliente_email.toLowerCase().includes(termino));

        const coincideEstado = filtroEstado === 'todos' || venta.estado === filtroEstado;

        let coincideFecha = true;
        if (fechaInicio || fechaFin) {
            const fechaVenta = new Date(venta.fecha_pedido);
            fechaVenta.setHours(0, 0, 0, 0);

            if (fechaInicio) {
                const fInicio = new Date(`${fechaInicio}T00:00:00`);
                if (fechaVenta < fInicio) coincideFecha = false;
            }
            if (fechaFin) {
                const fFin = new Date(`${fechaFin}T00:00:00`);
                if (fechaVenta > fFin) coincideFecha = false;
            }
        }

        return coincideBusqueda && coincideEstado && coincideFecha;
    });

    const exportarAExcel = async () => {
        // Validamos sobre la lista completa filtrada
        if (ventasProcesadas.length === 0) {
            setModalMensaje({ visible: true, texto: 'No hay datos para exportar con los filtros actuales.', tipo: 'info' });
            return;
        }

        // 1. Inicializar el libro de trabajo y la hoja
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte de Ventas');

        // 2. Definir las columnas y sus anchos adaptados
        worksheet.columns = [
            { header: 'N° de Orden', key: 'id', width: 15 },
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Cliente', key: 'cliente', width: 25 },
            { header: 'Correo', key: 'correo', width: 30 },
            { header: 'Teléfono', key: 'telefono', width: 18 },
            { header: 'Dirección de Envío', key: 'direccion', width: 40 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Total ($)', key: 'total', width: 15 },
            { header: 'Artículos Adquiridos', key: 'articulos', width: 50 },
        ];

        // 3. Aplicar estilo profesional a la fila de cabecera
        const filaCabecera = worksheet.getRow(1);
        filaCabecera.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        filaCabecera.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A1A1A' }
        };
        filaCabecera.alignment = { vertical: 'middle', horizontal: 'center' };

        // 4. IMPORTANTE: Poblar la hoja utilizando 'ventasProcesadas' para incluir todas las páginas
        ventasProcesadas.forEach(venta => {
            const articulos = venta.detalles ? venta.detalles.map(d => `${d.cantidad}x ${d.nombre}`).join(' |\n') : '';
            
            worksheet.addRow({
                id: venta.id_pedido,
                fecha: new Date(venta.fecha_pedido).toLocaleDateString('es-VE'),
                cliente: venta.cliente_nombre,
                correo: venta.cliente_email,
                telefono: venta.telefono_contacto || 'N/A',
                direccion: venta.direccion_envio || 'N/A',
                estado: venta.estado.toUpperCase(),
                total: parseFloat(venta.total).toFixed(2),
                articulos: articulos
            });
        });

        // 5. Aplicar bordes negros y alinear el texto de todas las celdas utilizadas
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
                        horizontal: colNumber === 6 || colNumber === 9 ? 'left' : 'center',
                        wrapText: true 
                    };
                }
            });
        });

        // 6. Generar el archivo y activar la descarga en el navegador
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'Reporte_Ventas_Afrolash.xlsx');
    };

    const indiceUltimaVenta = paginaVentas * ventasPorPagina;
    const indicePrimeraVenta = indiceUltimaVenta - ventasPorPagina;
    const ventasPaginadas = ventasProcesadas.slice(indicePrimeraVenta, indiceUltimaVenta);
    const totalPaginasVentas = Math.ceil(ventasProcesadas.length / ventasPorPagina);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Registro de Ventas</h2>
                <button 
                    onClick={exportarAExcel}
                    style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Exportar Registro Actual
                </button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
                <div style={{ flex: '1 1 250px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Buscar (ID, Nombre, Correo):</label>
                    <input type="text" placeholder="Término de búsqueda..." value={busquedaVentas} onChange={(e) => setBusquedaVentas(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                </div>
                
                <div style={{ flex: '1 1 150px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Estado:</label>
                    <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}>
                        <option value="todos">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>

                <div style={{ flex: '1 1 150px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Fecha Inicio:</label>
                    <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                </div>

                <div style={{ flex: '1 1 150px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Fecha Fin:</label>
                    <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                </div>
            </div>

            {ventasProcesadas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                    <p style={{ fontSize: '18px', color: '#666' }}>No se encontraron ventas que coincidan con los filtros aplicados.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {ventasPaginadas.map((venta) => (
                        <div key={venta.id_pedido} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: '#F7CDD5', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                <div>
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>ORDEN #{venta.id_pedido}</span>
                                    <span style={{ fontSize: '14px' }}>{new Date(venta.fecha_pedido).toLocaleDateString('es-VE')}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>CLIENTE</span>
                                    <span style={{ fontSize: '14px' }}>{venta.cliente_nombre}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>ESTADO</span>
                                    <select value={venta.estado || 'pendiente'} onChange={(e) => cambiarEstadoPedido(venta.id_pedido, e.target.value)} style={{ padding: '6px', borderRadius: '4px' }}>
                                        <option value="pendiente">Pendiente</option>
                                        <option value="pagado">Pagado</option>
                                        <option value="enviado">Enviado</option>
                                        <option value="entregado">Entregado</option>
                                        <option value="cancelado">Cancelado</option>
                                    </select>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>INGRESOS</span>
                                    <span style={{ fontWeight: 'bold', color: '#28a745', fontSize: '16px' }}>${parseFloat(venta.total).toFixed(2)}</span>
                                </div>
                            </div>
                            <div style={{ padding: '15px', backgroundColor: '#fff' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Artículos Vendidos:</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                                    {venta.detalles && venta.detalles.map((detalle, idx) => (
                                        <li key={idx}>{detalle.cantidad}x <strong>{detalle.nombre}</strong></li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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

            {modalMensaje.visible && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1A1A1A' }}>{modalMensaje.tipo === 'exito' ? 'Operación Exitosa' : 'Atención'}</h3>
                        <p style={{ margin: '0 0 25px 0', color: '#555' }}>{modalMensaje.texto}</p>
                        <button onClick={() => setModalMensaje({ visible: false, texto: '', tipo: 'info' })} style={{ width: '100%', padding: '12px', backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Entendido</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVentas;