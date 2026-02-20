// Importa las dependencias necesarias de React y Axios
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Catalogo = () => {
    // Define el estado local para almacenar el arreglo de productos
    const [productos, setProductos] = useState([]);

    // Ejecuta la petición al servidor una vez que el componente se carga
    useEffect(() => {
        const obtenerDatos = async () => {
            try {
                // Solicita los datos a la ruta del backend
                const respuesta = await axios.get('http://localhost:5000/api/productos');
                // Actualiza el estado con los datos recibidos desde MySQL
                setProductos(respuesta.data);
            } catch (error) {
                console.error('Error al cargar el catálogo de Afrolash:', error);
            }
        };

        obtenerDatos();
    }, []);

    // Renderiza la interfaz visual recorriendo el arreglo de productos
    return (
        <div>
            <h2>Nuestro Catálogo</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
                {productos.map((producto) => (
                    <div key={producto.id_producto} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', width: '250px' }}>
                        <img src={producto.imagen_url} alt={producto.nombre} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                        <h3>{producto.nombre}</h3>
                        <p style={{ fontSize: '14px', color: '#555' }}>{producto.descripcion}</p>
                        <p style={{ fontWeight: 'bold' }}>Precio: ${producto.precio}</p>
                        <p style={{ fontSize: '12px', color: producto.stock > 0 ? 'green' : 'red' }}>
                            Stock disponible: {producto.stock}
                        </p>
                        <button style={{ width: '100%', padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', cursor: 'pointer' }}>
                            Agregar al Carrito
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Catalogo;