import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Importaciones de Stripe
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import FormularioPago from './FormularioPago';

// Inicializa Stripe fuera del componente para evitar que se recargue en cada renderizado de React
// Asegúrate de que tu variable de entorno en .env esté bien escrita
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const Carrito = ({ carrito, eliminarDelCarrito, volver }) => {
    // Ahora tenemos 3 pasos: 1 (Carrito), 2 (Envío), 3 (Pago)
    const [pasoCheckout, setPasoCheckout] = useState(1);
    const [clientSecret, setClientSecret] = useState('');
    const [facturaUrl, setFacturaUrl] = useState(null); // NUEVO ESTADO
    
    const [datosEnvio, setDatosEnvio] = useState({
        direccion: '',
        telefono: ''
    });

    const total = carrito.reduce((acumulador, producto) => acumulador + (parseFloat(producto.precio) * producto.cantidad), 0);

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
        setDatosEnvio({ ...datosEnvio, [e.target.name]: e.target.value });
    };

    // Nueva función: Se comunica con el backend para pedir la autorización de cobro a Stripe
    const prepararPago = async (e) => {
        e.preventDefault(); 
        
        const token = localStorage.getItem('token'); 
        if (!token) {
            alert('Por favor, inicia sesión para continuar.');
            return;
        }

        try {
            // Solicita el client_secret a tu nuevo controlador de pagos
            const respuesta = await axios.post('http://localhost:5000/api/pagos/crear-intencion', 
                { total: total },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            // Guarda el secreto y avanza al paso 3 para mostrar la tarjeta
            setClientSecret(respuesta.data.clientSecret);
            setPasoCheckout(3);
        } catch (error) {
            console.error('Error al inicializar pasarela:', error);
            alert('No se pudo conectar con el servidor de pagos.');
        }
    };

    // Esta función ahora será invocada internamente por FormularioPago.js SOLO si Stripe aprueba la tarjeta
    const procesarCompraFinal = async () => {
        const usuarioGuardado = localStorage.getItem('usuario');
        const token = localStorage.getItem('token'); 
        const usuario = JSON.parse(usuarioGuardado);

        try {
            const respuesta = await axios.post('http://localhost:5000/api/pedidos/procesar', 
                {
                    id_usuario: usuario.id || usuario.id_usuario, 
                    carrito: carrito,
                    total: total,
                    direccion_envio: datosEnvio.direccion,
                    telefono_contacto: datosEnvio.telefono
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            // Verificamos de forma segura si el servidor adjuntó la factura
            if (respuesta.data.factura) {
                const base64Pdf = respuesta.data.factura;
                const byteCharacters = atob(base64Pdf);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                
                const urlLocal = URL.createObjectURL(blob);
                setFacturaUrl(urlLocal);
            } else {
                console.warn("La orden se procesó, pero el servidor no devolvió el PDF para visualizarlo en pantalla.");
            }

            // Avanzamos a la pantalla final de éxito sin importar si hay PDF o no
            setPasoCheckout(4);

        } catch (error) {
            console.error('Error procesando la respuesta del servidor:', error);
            alert('El pago se realizó, pero ocurrió un error al cargar la pantalla final.');
        }
    };

    return (
        <div style={{ marginTop: '40px', padding: '20px', borderTop: '2px solid #eee' }}>
            
            {/* Nuevo botón de navegación superior */}
            <button 
                onClick={volver} 
                style={{ marginBottom: '20px', padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                ← Volver a la Tienda
            </button>

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
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <span style={{ backgroundColor: '#e9ecef', padding: '5px 10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>Cant: {item.cantidad}</span>
                                        <span style={{ fontWeight: 'bold', minWidth: '70px', textAlign: 'right' }}>${(parseFloat(item.precio) * item.cantidad).toFixed(2)}</span>
                                        <button onClick={() => eliminarDelCarrito(item.id_producto)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
                                    </div>
                                </div>
                            ))}
                            <h3 style={{ textAlign: 'right', marginTop: '20px' }}>Subtotal: ${total.toFixed(2)}</h3>
                            <button onClick={() => setPasoCheckout(2)} style={{ float: 'right', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>Continuar con el Envío</button>
                            <div style={{ clear: 'both' }}></div>
                        </div>
                    )}

                    {/* PASO 2: CONFIRMACIÓN DE ENVÍO */}
                    {pasoCheckout === 2 && (
                        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <h2 style={{ marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Datos de Envío</h2>
                            <form onSubmit={prepararPago} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Dirección de Entrega:</label>
                                    <textarea name="direccion" value={datosEnvio.direccion} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '60px', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Teléfono de Contacto:</label>
                                    <input type="text" name="telefono" value={datosEnvio.telefono} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                    <button type="button" onClick={() => setPasoCheckout(1)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>Volver</button>
                                    <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>Ir al Pago</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* PASO 3: PASARELA DE PAGOS STRIPE */}
                    {pasoCheckout === 3 && clientSecret && (
                        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                            <h2 style={{ textAlign: 'center' }}>Completar Pago</h2>
                            
                            {/* El componente Elements provee el contexto seguro para la tarjeta */}
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <FormularioPago 
                                    clientSecret={clientSecret} 
                                    procesarCompraFinal={procesarCompraFinal} 
                                    total={total} 
                                />
                            </Elements>

                            <button onClick={() => setPasoCheckout(2)} style={{ width: '100%', marginTop: '15px', padding: '10px', backgroundColor: 'transparent', color: '#6c757d', border: '1px solid #ccc', cursor: 'pointer', borderRadius: '4px' }}>
                                Volver a Datos de Envío
                            </button>
                        </div>
                    )}

                    {/* PASO 4: PANTALLA DE ÉXITO Y FACTURA */}
                    {pasoCheckout === 4 && (
                        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <h2 style={{ color: '#28a745', fontSize: '28px', marginTop: 0 }}>¡Pago Procesado Exitosamente!</h2>
                            <p style={{ fontSize: '16px', color: '#555', marginBottom: '20px' }}>
                                Tu orden ha sido confirmada. Hemos enviado una copia de esta factura electrónica a tu correo registrado.
                            </p>
                            
                            {/* Visor del documento PDF */}
                            {facturaUrl && (
                                <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                                    <iframe 
                                        src={facturaUrl} 
                                        title="Factura PDF" 
                                        width="100%" 
                                        height="450px" 
                                        style={{ border: 'none', display: 'block' }}
                                    />
                                </div>
                            )}

                            <button 
                                onClick={() => window.location.reload()} 
                                style={{ padding: '12px 25px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px' }}
                            >
                                Finalizar y Volver al Catálogo
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Carrito;