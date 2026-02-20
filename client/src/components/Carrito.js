import React from 'react';
import axios from 'axios';

const Carrito = ({ carrito, eliminarDelCarrito }) => {
    
    // El cálculo del total ahora multiplica el precio por la cantidad agrupada
    const total = carrito.reduce((acumulador, producto) => acumulador + (parseFloat(producto.precio) * producto.cantidad), 0);

    const procesarCompra = async () => {
        const usuarioGuardado = localStorage.getItem('usuario');
        const token = localStorage.getItem('token'); 
        
        if (!usuarioGuardado || !token) {
            alert('Por favor, inicia sesión o crea una cuenta para procesar tu compra.');
            return;
        }

        const usuario = JSON.parse(usuarioGuardado);

        try {
            const respuesta = await axios.post('http://localhost:5000/api/pedidos/procesar', 
                {
                    id_usuario: usuario.id, 
                    carrito: carrito,
                    total: total
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}` 
                    }
                }
            );
            alert('Compra exitosa. Número de orden: ' + respuesta.data.id_pedido);
            window.location.reload();
        } catch (error) {
            console.error('Error en la transacción:', error);
            alert('Ocurrió un error al procesar el pago o tu sesión ha expirado.');
        }
    };

    return (
        <div style={{ marginTop: '40px', padding: '20px', borderTop: '2px solid #eee' }}>
            <h2>Resumen de Compra</h2>
            {carrito.length === 0 ? (
                <p>El carrito está vacío.</p>
            ) : (
                <div>
                    {carrito.map((item) => (
                        <div key={item.id_producto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '10px', borderBottom: '1px solid #f9f9f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <img src={item.imagen_url} alt={item.nombre} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                <div>
                                    <span style={{ display: 'block', fontWeight: 'bold' }}>{item.nombre}</span>
                                    {/* Muestra el precio unitario debajo del nombre */}
                                    <span style={{ fontSize: '12px', color: '#666' }}>Precio unitario: ${item.precio}</span>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                {/* Muestra la cantidad acumulada */}
                                <span style={{ backgroundColor: '#e9ecef', padding: '5px 10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                                    Cant: {item.cantidad}
                                </span>
                                
                                {/* Calcula y muestra el subtotal de esa fila */}
                                <span style={{ fontWeight: 'bold', minWidth: '70px', textAlign: 'right' }}>
                                    ${(parseFloat(item.precio) * item.cantidad).toFixed(2)}
                                </span>
                                
                                <button 
                                    onClick={() => eliminarDelCarrito(item.id_producto)} 
                                    style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                    title="Quitar del carrito"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                    <h3 style={{ textAlign: 'right', marginTop: '20px' }}>Total a pagar: ${total.toFixed(2)}</h3>
                    
                    <button onClick={procesarCompra} style={{ float: 'right', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                        Proceder al Pago
                    </button>
                    <div style={{ clear: 'both' }}></div>
                </div>
            )}
        </div>
    );
};

export default Carrito;