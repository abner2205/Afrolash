import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Carrito = ({ carrito, eliminarDelCarrito }) => {
    // Controla si mostramos la lista de productos (1) o el formulario de envío (2)
    const [pasoCheckout, setPasoCheckout] = useState(1);
    
    // Almacena los datos de envío que se enviarán a la base de datos
    const [datosEnvio, setDatosEnvio] = useState({
        direccion: '',
        telefono: ''
    });

    // Calcula el total a pagar
    const total = carrito.reduce((acumulador, producto) => acumulador + (parseFloat(producto.precio) * producto.cantidad), 0);

    // Precarga los datos del usuario si ya los registró al crear su cuenta
    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            const usuario = JSON.parse(usuarioGuardado);
            setDatosEnvio({
                direccion: usuario.direccion || '',
                telefono: usuario.telefono || ''
            });
        }
    }, []);

    const handleChange = (e) => {
        setDatosEnvio({
            ...datosEnvio,
            [e.target.name]: e.target.value
        });
    };

    const procesarCompraFinal = async (e) => {
        e.preventDefault(); // Evita que el formulario recargue la página
        
        const usuarioGuardado = localStorage.getItem('usuario');
        const token = localStorage.getItem('token'); 
        
        if (!usuarioGuardado || !token) {
            alert('Por favor, inicia sesión nuevamente para procesar tu compra.');
            return;
        }

        const usuario = JSON.parse(usuarioGuardado);

        try {
            // Se envía el carrito junto con los nuevos datos logísticos
            const respuesta = await axios.post('http://localhost:5000/api/pedidos/procesar', 
                {
                    // Operador lógico para prevenir valores nulos
                    id_usuario: usuario.id || usuario.id_usuario, 
                    carrito: carrito,
                    total: total,
                    direccion_envio: datosEnvio.direccion,
                    telefono_contacto: datosEnvio.telefono
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}` 
                    }
                }
            );
            
            // Simulación de pasarela de pago exitosa
            alert('Pago procesado con éxito. Número de orden: ' + respuesta.data.id_pedido);
            window.location.reload(); // Recarga para vaciar el carrito y reiniciar el estado
        } catch (error) {
            console.error('Error en la transacción:', error);
            alert('Ocurrió un error al procesar el pago o tu sesión ha expirado.');
        }
    };

    return (
        <div style={{ marginTop: '40px', padding: '20px', borderTop: '2px solid #eee' }}>
            
            {carrito.length === 0 ? (
                <div>
                    <h2>Resumen de Compra</h2>
                    <p>El carrito está vacío.</p>
                </div>
            ) : (
                <div>
                    {/* PASO 1: REVISIÓN DEL CARRITO */}
                    {pasoCheckout === 1 && (
                        <div>
                            <h2>Resumen de Compra</h2>
                            {carrito.map((item) => (
                                <div key={item.id_producto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '10px', borderBottom: '1px solid #f9f9f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <img src={item.imagen_url} alt={item.nombre} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                        <div>
                                            <span style={{ display: 'block', fontWeight: 'bold' }}>{item.nombre}</span>
                                            <span style={{ fontSize: '12px', color: '#666' }}>Precio unitario: ${item.precio}</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <span style={{ backgroundColor: '#e9ecef', padding: '5px 10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                                            Cant: {item.cantidad}
                                        </span>
                                        <span style={{ fontWeight: 'bold', minWidth: '70px', textAlign: 'right' }}>
                                            ${(parseFloat(item.precio) * item.cantidad).toFixed(2)}
                                        </span>
                                        <button 
                                            onClick={() => eliminarDelCarrito(item.id_producto)} 
                                            style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <h3 style={{ textAlign: 'right', marginTop: '20px' }}>Subtotal: ${total.toFixed(2)}</h3>
                            
                            <button 
                                onClick={() => setPasoCheckout(2)} 
                                style={{ float: 'right', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                            >
                                Continuar con el Envío
                            </button>
                            <div style={{ clear: 'both' }}></div>
                        </div>
                    )}

                    {/* PASO 2: FORMULARIO DE ENVÍO Y PAGO SIMULADO */}
                    {pasoCheckout === 2 && (
                        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <h2 style={{ marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Datos de Envío</h2>
                            <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
                                Confirma la dirección donde deseas recibir tus cosméticos.
                            </p>

                            <form onSubmit={procesarCompraFinal} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Dirección de Entrega:</label>
                                    <textarea 
                                        name="direccion" 
                                        value={datosEnvio.direccion} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="Ej. Calle 123, Urb. Centro, Casa #45"
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '60px', boxSizing: 'border-box' }} 
                                    />
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Teléfono de Contacto:</label>
                                    <input 
                                        type="text" 
                                        name="telefono" 
                                        value={datosEnvio.telefono} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="Ej. 0414-1234567"
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
                                    />
                                </div>

                                <div style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '4px', marginTop: '10px' }}>
                                    <h3 style={{ margin: 0, textAlign: 'right' }}>Total a Pagar: ${total.toFixed(2)}</h3>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                    <button 
                                        type="button"
                                        onClick={() => setPasoCheckout(1)} 
                                        style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                                    >
                                        Volver al Carrito
                                    </button>
                                    <button 
                                        type="submit" 
                                        style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                                    >
                                        Simular Pago y Procesar
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Carrito;