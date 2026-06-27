import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductoDetalle = ({ idProducto, agregarAlCarrito, navegarA }) => {
    const [producto, setProducto] = useState(null);
    const [cantidad, setCantidad] = useState(1);
    const [cargando, setCargando] = useState(true);
    const [modalConfirmacion, setModalConfirmacion] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        const obtenerProducto = async () => {
            try {
                // Se asume que el backend tiene una ruta GET para un producto individual
                const respuesta = await axios.get(`http://localhost:5000/api/productos/${idProducto}`);
                setProducto(respuesta.data);
            } catch (error) {
                console.error('Error al cargar detalles del producto:', error);
            } finally {
                setCargando(false);
            }
        };
        obtenerProducto();
    }, [idProducto]);

    const manejarAjusteCantidad = (incremento) => {
        let nuevaCantidad = cantidad + incremento;
        if (nuevaCantidad < 1) nuevaCantidad = 1;
        if (nuevaCantidad > producto.stock) nuevaCantidad = producto.stock;
        setCantidad(nuevaCantidad);
    };

    const procesarAgregado = () => {
        const exito = agregarAlCarrito(producto, cantidad);
        if (exito) {
            setModalConfirmacion(true);
            setCantidad(1);
        }
    };

    if (cargando) return <div style={{ textAlign: 'center', padding: '50px', color: '#1A1A1A' }}>Cargando información del producto...</div>;
    if (!producto) return <div style={{ textAlign: 'center', padding: '50px', color: '#dc3545' }}>Producto no encontrado.</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            
            <button onClick={() => navegarA('tienda')} style={{ marginBottom: '20px', padding: '8px 15px', backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                ← Volver al Catálogo
            </button>

            {/* SECCIÓN PRINCIPAL: IMAGEN Y COMPRA */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginBottom: '40px' }}>
                <div style={{ flex: '1 1 400px' }}>
                    <img src={producto.imagen_url} alt={producto.nombre} style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #ddd', objectFit: 'cover' }} />
                </div>
                
                <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h1 style={{ color: '#1A1A1A', margin: '0 0 10px 0', fontSize: '2.5rem' }}>{producto.nombre}</h1>
                    <p style={{ color: '#28a745', fontSize: '2rem', fontWeight: 'bold', margin: '0 0 20px 0' }}>${producto.precio}</p>
                    <p style={{ color: '#555', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '30px' }}>{producto.descripcion}</p>
                    
                    {producto.stock > 0 ? (
                        <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
                            <p style={{ margin: '0 0 15px 0', color: '#1A1A1A', fontWeight: 'bold' }}>Stock disponible: {producto.stock} unidades</p>
                            
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#fff' }}>
                                    <button onClick={() => manejarAjusteCantidad(-1)} style={{ padding: '12px 15px', border: 'none', backgroundColor: '#f8f9fa', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>-</button>
                                    <span style={{ width: '50px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>{cantidad}</span>
                                    <button onClick={() => manejarAjusteCantidad(1)} style={{ padding: '12px 15px', border: 'none', backgroundColor: '#f8f9fa', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>+</button>
                                </div>
                                
                                <button onClick={procesarAgregado} style={{ flex: 1, padding: '15px', backgroundColor: '#D97A8C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.3s' }}>
                                    Agregar al Carrito
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '20px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #f5c6cb' }}>
                            Producto actualmente agotado.
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN DETALLADA: INGREDIENTES, INSTRUCCIONES, ETC. */}
            <div style={{ borderTop: '2px solid #F7CDD5', paddingTop: '30px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                
                {producto.ingredientes && (
                    <div style={{ backgroundColor: '#fdfdfd', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #1A1A1A' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1A1A1A' }}>Ingredientes Principales</h3>
                        <p style={{ color: '#555', lineHeight: '1.6', margin: 0 }}>{producto.ingredientes}</p>
                    </div>
                )}

                {producto.instrucciones_uso && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'center' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#1A1A1A', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Instrucciones de Uso</h3>
                            <p style={{ color: '#555', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{producto.instrucciones_uso}</p>
                        </div>
                        {producto.imagen_instrucciones && (
                            <div style={{ flex: '1 1 300px' }}>
                                <img src={producto.imagen_instrucciones} alt="Instrucciones" style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
                            </div>
                        )}
                    </div>
                )}

                {producto.consejos && (
                    <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: '30px', alignItems: 'center', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
                        {producto.imagen_consejos && (
                            <div style={{ flex: '1 1 300px' }}>
                                <img src={producto.imagen_consejos} alt="Consejos de uso" style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
                            </div>
                        )}
                        <div style={{ flex: '1 1 300px' }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#CFA144', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Consejos de Afrolash</h3>
                            <p style={{ color: '#555', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{producto.consejos}</p>
                        </div>
                    </div>
                )}

                {producto.precauciones && (
                    <div style={{ backgroundColor: '#fff3cd', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>Precauciones y Advertencias</h3>
                        <p style={{ color: '#856404', lineHeight: '1.6', margin: 0 }}>{producto.precauciones}</p>
                    </div>
                )}

            </div>

            {/* MODAL DE CONFIRMACIÓN */}
            {modalConfirmacion && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: '50px', height: '50px', backgroundColor: '#d4edda', color: '#28a745', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', margin: '0 auto 15px auto' }}>✓</div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1A1A1A' }}>¡Añadido con éxito!</h3>
                        <p style={{ margin: '0 0 25px 0', color: '#555', fontSize: '15px' }}>El producto fue agregado a su carrito de compras.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button onClick={() => navegarA('carrito')} style={{ width: '100%', padding: '12px', backgroundColor: '#D97A8C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Ver mi carrito</button>
                            <button onClick={() => setModalConfirmacion(false)} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#1A1A1A', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Seguir leyendo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductoDetalle;