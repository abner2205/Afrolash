import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const FormularioPago = ({ clientSecret, procesarCompraFinal, total }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorPago, setErrorPago] = useState(null);
    const [procesando, setProcesando] = useState(false);

    const manejarPago = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return; // Stripe.js aún no ha cargado
        }

        setProcesando(true);
        setErrorPago(null);

        // 1. Confirma el pago directamente con los servidores de Stripe usando el clientSecret del backend
        const resultado = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
            }
        });

        if (resultado.error) {
            // Si hay un error (fondos insuficientes, tarjeta rechazada, etc.), lo guardamos para el modal
            setErrorPago(resultado.error.message);
            setProcesando(false);
        } else {
            // 2. Si el pago es exitoso, Stripe devuelve status 'succeeded'
            if (resultado.paymentIntent.status === 'succeeded') {
                await procesarCompraFinal();
            }
        }
    };

    // Estilos para el campo de la tarjeta
    const opcionesTarjeta = {
        style: {
            base: {
                fontSize: '16px',
                color: '#1A1A1A',
                '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#dc3545' },
        },
    };

    return (
        <form onSubmit={manejarPago} style={{ marginTop: '20px', padding: '20px', border: '1px solid #F7CDD5', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', color: '#1A1A1A' }}>Ingresa los datos de tu tarjeta</h3>
            
            <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fdfdfd', marginBottom: '20px' }}>
                <CardElement options={opcionesTarjeta} />
            </div>

            <button 
                type="submit" 
                disabled={!stripe || procesando}
                style={{ 
                    width: '100%', padding: '12px', backgroundColor: procesando ? '#6c757d' : '#D97A8C', 
                    color: 'white', border: 'none', borderRadius: '4px', cursor: procesando ? 'not-allowed' : 'pointer', 
                    fontWeight: 'bold', fontSize: '16px'
                }}
            >
                {procesando ? 'Procesando transacción...' : `Pagar $${total.toFixed(2)}`}
            </button>

            {/* MODAL DE ERROR DE PAGO RECHAZADO */}
            {errorPago && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: '50px', height: '50px', backgroundColor: '#f8d7da', color: '#dc3545', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', margin: '0 auto 15px auto', fontWeight: 'bold' }}>!</div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1A1A1A', fontSize: '20px' }}>Pago Rechazado</h3>
                        <p style={{ margin: '0 0 25px 0', color: '#555', fontSize: '15px' }}>
                            {errorPago}
                        </p>
                        <button 
                            onClick={() => setErrorPago(null)} 
                            style={{ width: '100%', padding: '12px', backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </form>
    );
};

export default FormularioPago;