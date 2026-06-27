import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Catalogo = ({ agregarAlCarrito, navegarA, terminoBusqueda }) => {
    const [productos, setProductos] = useState([]);
    
    const [paginaActual, setPaginaActual] = useState(1);
    const [productosPorPagina] = useState(10);
    const [criterioOrden, setCriterioOrden] = useState('alfabetico');

    const [cantidades, setCantidades] = useState({});
    const [modalConfirmacion, setModalConfirmacion] = useState({ visible: false, productoNombre: '', cantidad: 0 });

    const obtenerDatos = async () => {
        try {
            const respuesta = await axios.get('http://localhost:5000/api/productos');
            setProductos(respuesta.data);
        } catch (error) {
            console.error('Error al cargar el catálogo:', error);
        }
    };

    useEffect(() => {
        obtenerDatos();
    }, []);

    // Reinicia la página a 1 cuando el usuario escribe en la barra de búsqueda del Header o cambia el orden
    useEffect(() => {
        setPaginaActual(1);
    }, [terminoBusqueda, criterioOrden]);

    // Lógica de Paginación y Ordenamiento conectada a App.js
    const busquedaSegura = terminoBusqueda || '';
    let productosProcesados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(busquedaSegura.toLowerCase())
    );

    if (criterioOrden === 'alfabetico') {
        productosProcesados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (criterioOrden === 'precio_asc') {
        productosProcesados.sort((a, b) => parseFloat(a.precio) - parseFloat(b.precio));
    } else if (criterioOrden === 'precio_desc') {
        productosProcesados.sort((a, b) => parseFloat(b.precio) - parseFloat(a.precio));
    }

    const indiceUltimoProducto = paginaActual * productosPorPagina;
    const indicePrimerProducto = indiceUltimoProducto - productosPorPagina;
    const productosPaginados = productosProcesados.slice(indicePrimerProducto, indiceUltimoProducto);
    const totalPaginas = Math.ceil(productosProcesados.length / productosPorPagina);

    const obtenerCantidadActual = (id) => {
        return cantidades[id] || 1; 
    };

    const manejarCambioManual = (id, valorStr, stockMaximo) => {
        let valor = parseInt(valorStr);
        if (isNaN(valor)) valor = ''; 
        if (valor !== '' && valor > stockMaximo) valor = stockMaximo;
        
        setCantidades({ ...cantidades, [id]: valor });
    };

    const ajustarCantidad = (id, incremento, stockMaximo) => {
        let actual = obtenerCantidadActual(id);
        if (actual === '') actual = 0;
        
        let nuevaCantidad = actual + incremento;
        if (nuevaCantidad < 1) nuevaCantidad = 1;
        if (nuevaCantidad > stockMaximo) nuevaCantidad = stockMaximo;

        setCantidades({ ...cantidades, [id]: nuevaCantidad });
    };

    const procesarAgregado = (producto) => {
        let cantidadSolicitada = obtenerCantidadActual(producto.id_producto);
        
        if (cantidadSolicitada === '' || cantidadSolicitada < 1) {
            cantidadSolicitada = 1;
            setCantidades({ ...cantidades, [producto.id_producto]: 1 });
        }

        const exito = agregarAlCarrito(producto, cantidadSolicitada);
        
        if (exito) {
            setModalConfirmacion({ 
                visible: true, 
                productoNombre: producto.nombre, 
                cantidad: cantidadSolicitada 
            });
            setCantidades({ ...cantidades, [producto.id_producto]: 1 });
        }
    };

    return (
        <div>
            {/* Cabecera de Opciones */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                <h2 style={{ color: '#1A1A1A', margin: 0 }}>Nuestro Catálogo</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select value={criterioOrden} onChange={(e) => setCriterioOrden(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outlineColor: '#D97A8C', color: '#333' }}>
                        <option value="alfabetico">Orden Alfabético (A-Z)</option>
                        <option value="precio_asc">Menor a Mayor Precio</option>
                        <option value="precio_desc">Mayor a Menor Precio</option>
                    </select>
                </div>
            </div>

            {/* Listado de Productos */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', minHeight: '400px' }}>
                {productosPaginados.length > 0 ? (
                    productosPaginados.map((producto) => (
                        <div key={producto.id_producto} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', width: '250px', position: 'relative', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div>
                                <img 
                                    src={producto.imagen_url} 
                                    alt={producto.nombre} 
                                    onClick={() => navegarA('detalle', producto.id_producto)}
                                    style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px', cursor: 'pointer', transition: 'opacity 0.2s' }} 
                                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                />
                                <h3 style={{ margin: '10px 0', fontSize: '18px', color: '#1A1A1A' }}>{producto.nombre}</h3>
                                <p style={{ fontSize: '14px', color: '#555', minHeight: '40px' }}>{producto.descripcion}</p>
                            </div>
                            <div>
                                <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#1A1A1A' }}>${producto.precio}</p>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: producto.stock > 0 ? '#28a745' : '#dc3545' }}>
                                    {producto.stock > 0 ? `Stock disponible: ${producto.stock}` : 'Agotado'}
                                </p>
                                
                                {producto.stock > 0 ? (
                                    <div style={{ marginTop: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                                            <button onClick={() => ajustarCantidad(producto.id_producto, -1, producto.stock)} style={{ padding: '8px 12px', backgroundColor: '#f8f9fa', border: 'none', borderRight: '1px solid #ddd', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>-</button>
                                            <input 
                                                type="number" 
                                                value={obtenerCantidadActual(producto.id_producto)} 
                                                onChange={(e) => manejarCambioManual(producto.id_producto, e.target.value, producto.stock)}
                                                style={{ width: '100%', textAlign: 'center', border: 'none', outline: 'none', fontSize: '16px', WebkitAppearance: 'none', margin: 0, color: '#1A1A1A' }} 
                                            />
                                            <button onClick={() => ajustarCantidad(producto.id_producto, 1, producto.stock)} style={{ padding: '8px 12px', backgroundColor: '#f8f9fa', border: 'none', borderLeft: '1px solid #ddd', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>+</button>
                                        </div>
                                        
                                        <button onClick={() => procesarAgregado(producto)} style={{ width: '100%', padding: '10px', backgroundColor: '#D97A8C', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', transition: 'background-color 0.3s' }}>
                                            Agregar al Carrito
                                        </button>
                                    </div>
                                ) : (
                                    <button disabled style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: '#ccc', color: 'white', border: 'none', cursor: 'not-allowed', borderRadius: '4px', fontWeight: 'bold' }}>
                                        Sin Inventario
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ width: '100%', textAlign: 'center', padding: '40px', color: '#777', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                        <p style={{ fontSize: '18px' }}>No se encontraron productos para tu búsqueda.</p>
                    </div>
                )}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '30px', padding: '20px 0', borderTop: '1px solid #eee' }}>
                    <button onClick={() => setPaginaActual(paginaActual - 1)} disabled={paginaActual === 1} style={{ padding: '8px 15px', border: '1px solid #ccc', backgroundColor: paginaActual === 1 ? '#f9f9f9' : '#fff', color: paginaActual === 1 ? '#aaa' : '#333', borderRadius: '4px', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer' }}>Anterior</button>
                    {Array.from({ length: totalPaginas }, (_, index) => (
                        <button key={index + 1} onClick={() => setPaginaActual(index + 1)} style={{ padding: '8px 12px', border: '1px solid #ccc', backgroundColor: paginaActual === index + 1 ? '#1A1A1A' : '#fff', color: paginaActual === index + 1 ? 'white' : '#333', borderRadius: '4px', cursor: 'pointer', fontWeight: paginaActual === index + 1 ? 'bold' : 'normal' }}>{index + 1}</button>
                    ))}
                    <button onClick={() => setPaginaActual(paginaActual + 1)} disabled={paginaActual === totalPaginas} style={{ padding: '8px 15px', border: '1px solid #ccc', backgroundColor: paginaActual === totalPaginas ? '#f9f9f9' : '#fff', color: paginaActual === totalPaginas ? '#aaa' : '#333', borderRadius: '4px', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer' }}>Siguiente</button>
                </div>
            )}

            {/* VENTANA EMERGENTE (MODAL) DE CONFIRMACIÓN */}
            {modalConfirmacion.visible && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        
                        <div style={{ width: '50px', height: '50px', backgroundColor: '#d4edda', color: '#28a745', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', margin: '0 auto 15px auto' }}>✓</div>
                        
                        <h3 style={{ margin: '0 0 10px 0', color: '#1A1A1A' }}>¡Añadido con éxito!</h3>
                        
                        <p style={{ margin: '0 0 25px 0', color: '#555', fontSize: '15px' }}>
                            Agregaste <strong>{modalConfirmacion.cantidad}</strong> unidad(es) de <strong>{modalConfirmacion.productoNombre}</strong> a tu carrito de compras.
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button 
                                onClick={() => navegarA('carrito')} 
                                style={{ width: '100%', padding: '12px', backgroundColor: '#D97A8C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                            >
                                Ver mi carrito y Pagar
                            </button>
                            
                            <button 
                                onClick={() => setModalConfirmacion({ visible: false, productoNombre: '', cantidad: 0 })} 
                                style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#1A1A1A', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                            >
                                Seguir comprando
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;