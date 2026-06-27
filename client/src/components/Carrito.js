import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import FormularioPago from './FormularioPago';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const Carrito = ({ carrito, eliminarDelCarrito, volver, navegarA, vaciarCarrito }) => {
    const [pasoCheckout, setPasoCheckout] = useState(1);
    const [clientSecret, setClientSecret] = useState('');
    const [facturaUrl, setFacturaUrl] = useState(null); 
    
    // NUEVO ESTADO PARA EL MODAL DE LOGIN
    const [modalLoginVisible, setModalLoginVisible] = useState(false);
    
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

    // NUEVA FUNCIÓN: Valida la sesión en el Paso 1 en lugar del Paso 2
    const intentarContinuarEnvio = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setModalLoginVisible(true);
        } else {
            setPasoCheckout(2);
        }
    };

    const prepararPago = async (e) => {
        e.preventDefault(); 
        const token = localStorage.getItem('token'); 

        try {
            const respuesta = await axios.post('http://localhost:5000/api/pagos/crear-intencion', 
                { total: total },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            setClientSecret(respuesta.data.clientSecret);
            setPasoCheckout(3);
        } catch (error) {
            console.error('Error al inicializar pasarela:', error);
            // Idealmente, esto también se cambiaría por un modal de error en un futuro
            alert('No se pudo conectar con el servidor de pagos.');
        }
    };

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

            const usuarioActualizado = { 
                ...usuario, 
                direccion: datosEnvio.direccion, 
                telefono: datosEnvio.telefono 
            };
            localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
            
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
            }

            // Vaciamos el carrito automáticamente en segundo plano antes de mostrar el éxito
            vaciarCarrito();
            setPasoCheckout(4);

        } catch (error) {
            console.error('Error procesando la respuesta del servidor:', error);
            alert('El pago se realizó, pero ocurrió un error al cargar la pantalla final.');
        }
    };

    return (
        <div style={{ marginTop: '40px', padding: '20px', borderTop: '2px solid #eee' }}>
            
            <button 
                onClick={volver} 
                style={{ marginBottom: '20px', padding: '8px 15px', backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                ← Volver al Catálogo
            </button>

            {carrito.length === 0 && pasoCheckout !== 4 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <h2 style={{ color: '#1A1A1A' }}>Tu carrito está vacío</h2>
                    <p style={{ color: '#666', marginBottom: '20px' }}>Agrega algunos cosméticos de nuestro catálogo para comenzar.</p>
                    <button onClick={volver} style={{ padding: '12px 25px', backgroundColor: '#D97A8C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Explorar Productos
                    </button>
                </div>
            ) : (
                <div>
                    {pasoCheckout === 1 && carrito.length > 0 && (
                        <div>
                            <h2 style={{ color: '#1A1A1A' }}>Resumen de Compra</h2>
                            {carrito.map((item) => (
                                <div key={item.id_producto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '10px', borderBottom: '1px solid #f9f9f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <img src={item.imagen_url} alt={item.nombre} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                        <div>
                                            <span style={{ display: 'block', fontWeight: 'bold', color: '#1A1A1A' }}>{item.nombre}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <span style={{ backgroundColor: '#F7CDD5', color: '#1A1A1A', padding: '5px 10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>Cant: {item.cantidad}</span>
                                        <span style={{ fontWeight: 'bold', minWidth: '70px', textAlign: 'right', color: '#1A1A1A' }}>${(parseFloat(item.precio) * item.cantidad).toFixed(2)}</span>
                                        <button onClick={() => eliminarDelCarrito(item.id_producto)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Eliminar</button>
                                    </div>
                                </div>
                            ))}
                            <h3 style={{ textAlign: 'right', marginTop: '20px', color: '#1A1A1A' }}>Subtotal: ${total.toFixed(2)}</h3>
                            
                            {/* Botón actualizado para usar la validación de sesión */}
                            <button onClick={intentarContinuarEnvio} style={{ float: 'right', padding: '12px 25px', backgroundColor: '#D97A8C', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px' }}>Continuar con el Envío</button>
                            <div style={{ clear: 'both' }}></div>
                        </div>
                    )}

                    {pasoCheckout === 2 && (
                        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '8px', border: '1px solid #F7CDD5', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ marginTop: 0, borderBottom: '2px solid #F7CDD5', paddingBottom: '10px', color: '#1A1A1A' }}>Datos de Envío</h2>
                            <form onSubmit={prepararPago} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#1A1A1A' }}>Dirección de Entrega:</label>
                                    <textarea name="direccion" value={datosEnvio.direccion} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px', boxSizing: 'border-box', outlineColor: '#D97A8C' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#1A1A1A' }}>Teléfono de Contacto:</label>
                                    <input type="text" name="telefono" value={datosEnvio.telefono} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', outlineColor: '#D97A8C' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                                    <button type="button" onClick={() => setPasoCheckout(1)} style={{ padding: '12px 20px', backgroundColor: 'transparent', color: '#1A1A1A', border: '1px solid #ccc', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>Volver</button>
                                    <button type="submit" style={{ padding: '12px 25px', backgroundColor: '#D97A8C', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px' }}>Ir al Pago</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {pasoCheckout === 3 && clientSecret && (
                        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                            <h2 style={{ textAlign: 'center', color: '#1A1A1A' }}>Completar Pago</h2>
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <FormularioPago clientSecret={clientSecret} procesarCompraFinal={procesarCompraFinal} total={total} />
                            </Elements>
                            <button onClick={() => setPasoCheckout(2)} style={{ width: '100%', marginTop: '15px', padding: '12px', backgroundColor: 'transparent', color: '#1A1A1A', border: '1px solid #ccc', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                                Volver a Datos de Envío
                            </button>
                        </div>
                    )}

                    {pasoCheckout === 4 && (
                        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', padding: '40px', borderRadius: '8px', border: '1px solid #d4edda', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                            <div style={{ width: '60px', height: '60px', backgroundColor: '#d4edda', color: '#28a745', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px', margin: '0 auto 20px auto' }}>✓</div>
                            <h2 style={{ color: '#28a745', fontSize: '28px', marginTop: 0 }}>¡Pago Procesado Exitosamente!</h2>
                            <p style={{ fontSize: '16px', color: '#555', marginBottom: '30px' }}>
                                Tu orden ha sido confirmada. Hemos enviado una copia de esta factura electrónica a tu correo registrado.
                            </p>
                            
                            {facturaUrl && (
                                <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden', marginBottom: '30px' }}>
                                    <iframe src={facturaUrl} title="Factura PDF" width="100%" height="500px" style={{ border: 'none', display: 'block' }} />
                                </div>
                            )}

                            {/* En lugar de forzar una recarga bruta del navegador, usamos el enrutador de React */}
                            <button 
                                onClick={() => navegarA('tienda')} 
                                style={{ padding: '15px 30px', backgroundColor: '#D97A8C', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px' }}
                            >
                                Finalizar y Volver al Catálogo
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE INICIO DE SESIÓN */}
            {modalLoginVisible && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1A1A1A', fontSize: '22px' }}>Autenticación Requerida</h3>
                        <p style={{ margin: '0 0 25px 0', color: '#555', fontSize: '15px' }}>
                            Para procesar tu pago y registrar la dirección de envío, necesitas acceder a tu cuenta. Tus productos seguirán guardados en el carrito.
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button 
                                onClick={() => navegarA('login')} 
                                style={{ width: '100%', padding: '12px', backgroundColor: '#D97A8C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                            >
                                Iniciar Sesión
                            </button>
                            <button 
                                onClick={() => navegarA('registro')} 
                                style={{ width: '100%', padding: '12px', backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                            >
                                Crear una Cuenta
                            </button>
                            <button 
                                onClick={() => setModalLoginVisible(false)} 
                                style={{ width: '100%', padding: '10px', marginTop: '5px', backgroundColor: 'transparent', color: '#666', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Carrito;