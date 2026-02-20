import React from 'react';

// Recibe el estado del carrito
const Carrito = ({ carrito }) => {
    // Calcula el total sumando el precio de cada producto
    const total = carrito.reduce((acumulador, producto) => acumulador + parseFloat(producto.precio), 0);

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
                    <button style={{ float: 'right', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Proceder al Pago
                    </button>
                </div>
            )}
        </div>
    );
};

export default Carrito;