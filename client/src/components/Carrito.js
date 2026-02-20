// Importa la librería de React y Axios para las peticiones HTTP
import React from 'react';
import axios from 'axios';

// Recibe el estado del carrito como propiedad
const Carrito = ({ carrito }) => {
    // Calcula el total 
    const total = carrito.reduce((acumulador, producto) => acumulador + parseFloat(producto.precio), 0);

    // Define la función para procesar la compra 
    const procesarCompra = async () => {
        try {
            const respuesta = await axios.post('http://localhost:5000/api/pedidos/procesar', {
                id_usuario: 1, // Identificador temporal hasta implementar el inicio de sesión
                carrito: carrito,
                total: total
            });
            alert('Compra exitosa. Número de orden: ' + respuesta.data.id_pedido);
        } catch (error) {
            console.error('Error en la transacción:', error);
            alert('Ocurrió un error al procesar el pago.');
        }
    };

    // Renderiza el resumen de la compra
    return (
        <div style={{ marginTop: '40px', padding: '20px', borderTop: '2px solid #eee' }}>
            <h2>Resumen de Compra</h2>
            {carrito.length === 0 ? (
                <p>El carrito está vacío.</p>
            ) : (
                <div>
                    {carrito.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span>{item.nombre}</span>
                            <span>${item.precio}</span>
                        </div>
                    ))}
                    <h3 style={{ textAlign: 'right', marginTop: '20px' }}>Total a pagar: ${total.toFixed(2)}</h3>
                    {/* Vincula la función de compra al evento clic del botón */}
                    <button onClick={procesarCompra} style={{ float: 'right', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Proceder al Pago
                    </button>
                </div>
            )}
        </div>
    );
};

export default Carrito;