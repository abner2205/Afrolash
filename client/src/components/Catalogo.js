import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Catalogo = ({ agregarAlCarrito }) => {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    
    // Estados para paginación y ordenamiento
    const [paginaActual, setPaginaActual] = useState(1);
    const [productosPorPagina] = useState(10); // Configurado a 10 productos por vista
    const [criterioOrden, setCriterioOrden] = useState('alfabetico');

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

    // Reinicia la página a 1 cada vez que el usuario busca o cambia el orden
    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, criterioOrden]);

    // 1. Aplicar filtro de búsqueda
    let productosProcesados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    // 2. Aplicar ordenamiento
    if (criterioOrden === 'alfabetico') {
        productosProcesados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (criterioOrden === 'precio_asc') {
        productosProcesados.sort((a, b) => parseFloat(a.precio) - parseFloat(b.precio));
    } else if (criterioOrden === 'precio_desc') {
        productosProcesados.sort((a, b) => parseFloat(b.precio) - parseFloat(a.precio));
    }

    // 3. Aplicar paginación
    const indiceUltimoProducto = paginaActual * productosPorPagina;
    const indicePrimerProducto = indiceUltimoProducto - productosPorPagina;
    const productosPaginados = productosProcesados.slice(indicePrimerProducto, indiceUltimoProducto);

    // Calcular el total de páginas necesarias
    const totalPaginas = Math.ceil(productosProcesados.length / productosPorPagina);

    return (
        <div>
            {/* Controles superiores: Búsqueda y Ordenamiento */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                <h2>Nuestro Catálogo</h2>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select 
                        value={criterioOrden} 
                        onChange={(e) => setCriterioOrden(e.target.value)}
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                    >
                        <option value="alfabetico">Orden Alfabético (A-Z)</option>
                        <option value="precio_asc">Menor a Mayor Precio</option>
                        <option value="precio_desc">Mayor a Menor Precio</option>
                    </select>

                    <input 
                        type="text" 
                        placeholder="Buscar cosmético..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        style={{ padding: '10px 15px', width: '250px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none', fontSize: '15px' }}
                    />
                </div>
            </div>

            {/* Renderizado de Productos */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', minHeight: '400px' }}>
                {productosPaginados.length > 0 ? (
                    productosPaginados.map((producto) => (
                        <div key={producto.id_producto} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', width: '250px', position: 'relative', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <img src={producto.imagen_url} alt={producto.nombre} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                                <h3 style={{ margin: '10px 0', fontSize: '18px' }}>{producto.nombre}</h3>
                                <p style={{ fontSize: '14px', color: '#555', minHeight: '40px' }}>{producto.descripcion}</p>
                            </div>
                            <div>
                                <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>${producto.precio}</p>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: producto.stock > 0 ? '#28a745' : '#dc3545' }}>
                                    {producto.stock > 0 ? `Stock disponible: ${producto.stock}` : 'Agotado'}
                                </p>
                                <button
                                    onClick={() => agregarAlCarrito(producto)}
                                    disabled={producto.stock === 0}
                                    style={{ 
                                        width: '100%', padding: '10px', marginTop: '10px', 
                                        backgroundColor: producto.stock > 0 ? '#333' : '#ccc', 
                                        color: 'white', border: 'none', 
                                        cursor: producto.stock > 0 ? 'pointer' : 'not-allowed', 
                                        borderRadius: '4px', fontWeight: 'bold'
                                    }}
                                >
                                    {producto.stock > 0 ? 'Agregar al Carrito' : 'Sin Inventario'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ width: '100%', textAlign: 'center', padding: '40px', color: '#777', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                        <p style={{ fontSize: '18px' }}>No se encontraron productos.</p>
                    </div>
                )}
            </div>

            {/* Controles Inferiores: Paginación */}
            {totalPaginas > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '30px', padding: '20px 0', borderTop: '1px solid #eee' }}>
                    
                    {/* Botón Anterior */}
                    <button 
                        onClick={() => setPaginaActual(paginaActual - 1)}
                        disabled={paginaActual === 1}
                        style={{ padding: '8px 15px', border: '1px solid #ccc', backgroundColor: paginaActual === 1 ? '#f9f9f9' : '#fff', color: paginaActual === 1 ? '#aaa' : '#333', borderRadius: '4px', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        Anterior
                    </button>

                    {/* Números de página */}
                    {Array.from({ length: totalPaginas }, (_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => setPaginaActual(index + 1)}
                            style={{ 
                                padding: '8px 12px', 
                                border: '1px solid #ccc', 
                                backgroundColor: paginaActual === index + 1 ? '#007bff' : '#fff', 
                                color: paginaActual === index + 1 ? 'white' : '#333', 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                fontWeight: paginaActual === index + 1 ? 'bold' : 'normal'
                            }}
                        >
                            {index + 1}
                        </button>
                    ))}

                    {/* Botón Siguiente */}
                    <button 
                        onClick={() => setPaginaActual(paginaActual + 1)}
                        disabled={paginaActual === totalPaginas}
                        style={{ padding: '8px 15px', border: '1px solid #ccc', backgroundColor: paginaActual === totalPaginas ? '#f9f9f9' : '#fff', color: paginaActual === totalPaginas ? '#aaa' : '#333', borderRadius: '4px', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer' }}
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
};

export default Catalogo;