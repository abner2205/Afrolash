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
            // Si hay un error (fondos insuficientes, tarjeta rechazada, etc.)
            setErrorPago(resultado.error.message);
            setProcesando(false);
        } else {
            // 2. Si el pago es exitoso, Stripe devuelve status 'succeeded'
            if (resultado.paymentIntent.status === 'succeeded') {
                // Ejecutamos la función original para guardar el pedido en nuestra base de datos MySQL
                await procesarCompraFinal();
            }
        }
    };

    // Estilos para el campo de la tarjeta
    const opcionesTarjeta = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#9e2146' },
        },
    };

    return (
        <form onSubmit={manejarPago} style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px' }}>Ingresa los datos de tu tarjeta</h3>
            
            <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fdfdfd', marginBottom: '20px' }}>
                <CardElement options={opcionesTarjeta} />
            </div>

            {errorPago && <div style={{ color: '#dc3545', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{errorPago}</div>}

            <button 
                type="submit" 
                disabled={!stripe || procesando}
                style={{ 
                    width: '100%', padding: '12px', backgroundColor: procesando ? '#6c757d' : '#28a745', 
                    color: 'white', border: 'none', borderRadius: '4px', cursor: procesando ? 'not-allowed' : 'pointer', 
                    fontWeight: 'bold', fontSize: '16px'
                }}
            >
                {procesando ? 'Procesando transacción...' : `Pagar $${total.toFixed(2)}`}
            </button>
        </form>
    );
};

export default FormularioPago;