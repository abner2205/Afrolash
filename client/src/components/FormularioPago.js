import React, { useState, useEffect, useRef } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const OPCIONES_TARJETA = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1A1A1A',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      '::placeholder': { color: '#685E62' },
    },
    invalid: { color: '#C82333' },
  },
};

const formatearPrecio = (monto) => {
  const numero = Number(monto);
  return Number.isFinite(numero) ? `$${numero.toFixed(2)}` : '$0.00';
};

const FormularioPago = ({ clientSecret, procesarCompraFinal, total }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorPago, setErrorPago] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!errorPago) return undefined;

    const manejarEscape = (evento) => {
      if (evento.key === 'Escape') {
        setErrorPago(null);
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [errorPago]);

  const manejarPago = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || procesando) {
      return;
    }

    const elementoTarjeta = elements.getElement(CardElement);
    if (!elementoTarjeta) {
      setErrorPago('No pudimos inicializar el formulario de tarjeta. Intenta nuevamente.');
      return;
    }

    setProcesando(true);
    setErrorPago(null);

    try {
      const resultado = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elementoTarjeta,
        },
      });

      if (resultado?.error) {
        if (montadoRef.current) {
          setErrorPago(resultado.error.message || 'No se pudo completar el pago con tu tarjeta.');
        }
        return;
      }

      if (resultado?.paymentIntent?.status === 'succeeded') {
        await procesarCompraFinal();
      } else if (montadoRef.current) {
        setErrorPago('La transacción no se completó. Verifica los datos de tu tarjeta.');
      }
    } catch (error) {
      console.error('Error inesperado al confirmar el pago:', error);
      if (montadoRef.current) {
        setErrorPago(
          error?.message || 'Ocurrió un error inesperado al procesar el pago. Intenta nuevamente.'
        );
      }
    } finally {
      if (montadoRef.current) {
        setProcesando(false);
      }
    }
  };

  return (
    <form onSubmit={manejarPago} className="afro-card afro-payment-card">
      <h3 className="afro-payment-title">Ingresa los datos de tu tarjeta</h3>

      <div className="afro-field">
        <span id="stripe-card-label" className="afro-label">
          Tarjeta de crédito o débito
        </span>
        <div className="afro-stripe-element-box" aria-labelledby="stripe-card-label">
          <CardElement options={OPCIONES_TARJETA} />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || procesando}
        className="afro-btn afro-btn-primary afro-btn-full afro-tabular"
      >
        {procesando ? 'Procesando transacción...' : `Pagar ${formatearPrecio(total)}`}
      </button>

      {errorPago ? (
        <div
          className="afro-modal-backdrop"
          onClick={() => setErrorPago(null)}
        >
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pago-error-modal-title"
            aria-describedby="pago-error-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="afro-modal-icon-danger" aria-hidden="true">
              !
            </div>
            <h3 id="pago-error-modal-title" className="afro-modal-title">
              Pago Rechazado
            </h3>
            <p id="pago-error-modal-desc" className="afro-modal-body">
              {errorPago}
            </p>
            <div className="afro-modal-actions">
              <button
                type="button"
                className="afro-btn afro-btn-dark afro-btn-full"
                onClick={() => setErrorPago(null)}
                autoFocus
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
};

export default FormularioPago;
