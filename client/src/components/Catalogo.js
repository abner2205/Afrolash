import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Ahora recibe usuarioActual además de agregarAlCarrito
const Catalogo = ({ agregarAlCarrito, usuarioActual }) => {
    const [productos, setProductos] = useState([]);

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

    return (
        <div>
            <h2>Nuestro Catálogo</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
                {productos.map((producto) => (
                    <div key={producto.id_producto} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', width: '250px', position: 'relative' }}>
                        <img src={producto.imagen_url} alt={producto.nombre} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                        <h3>{producto.nombre}</h3>
                        <p style={{ fontSize: '14px', color: '#555' }}>{producto.descripcion}</p>
                        <p style={{ fontWeight: 'bold' }}>Precio: ${producto.precio}</p>
                        <p style={{ fontSize: '12px', color: producto.stock > 0 ? 'green' : 'red' }}>
                            Stock disponible: {producto.stock}
                        </p>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button
                                onClick={() => agregarAlCarrito(producto)}
                                style={{ flex: 1, padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                            >
                                Agregar al Carrito
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Catalogo;