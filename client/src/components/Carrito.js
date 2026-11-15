import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import FormularioPago from './FormularioPago';

const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const PASOS_CHECKOUT = [
  { numero: 1, etiqueta: 'Resumen' },
  { numero: 2, etiqueta: 'Envío' },
  { numero: 3, etiqueta: 'Pago' },
  { numero: 4, etiqueta: 'Confirmación' },
];

const formatearPrecio = (monto) => {
  const numero = Number(monto);
  return Number.isFinite(numero) ? `$${numero.toFixed(2)}` : '$0.00';
};

const leerStorageTextoSeguro = (clave) => {
  try {
    return localStorage.getItem(clave);
  } catch (error) {
    return null;
  }
};

const leerUsuarioSeguro = () => {
  try {
    const raw = localStorage.getItem('usuario');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
};

const guardarUsuarioSeguro = (usuario) => {
  try {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  } catch (error) {
    // Ignora fallos de almacenamiento en navegadores restringidos
  }
};

const Carrito = ({ carrito, eliminarDelCarrito, volver, navegarA, vaciarCarrito }) => {
  const itemsCarrito = useMemo(() => (Array.isArray(carrito) ? carrito : []), [carrito]);

  const [pasoCheckout, setPasoCheckout] = useState(1);
  const [clientSecret, setClientSecret] = useState('');
  const [facturaUrl, setFacturaUrl] = useState(null);
  const [modalLoginVisible, setModalLoginVisible] = useState(false);
  const [cargandoIntencion, setCargandoIntencion] = useState(false);
  const [errorModal, setErrorModal] = useState(null);

  const [datosEnvio, setDatosEnvio] = useState({
    direccion: '',
    telefono: '',
  });

  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const total = useMemo(
    () =>
      itemsCarrito.reduce(
        (acumulador, producto) =>
          acumulador + (parseFloat(producto.precio) || 0) * (Number(producto.cantidad) || 0),
        0
      ),
    [itemsCarrito]
  );

  useEffect(() => {
    const usuario = leerUsuarioSeguro();
    if (usuario) {
      setDatosEnvio({
        direccion: usuario.direccion || '',
        telefono: usuario.telefono || '',
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (facturaUrl) {
        URL.revokeObjectURL(facturaUrl);
      }
    };
  }, [facturaUrl]);

  useEffect(() => {
    if (!errorModal && !modalLoginVisible) return undefined;

    const manejarEscape = (evento) => {
      if (evento.key === 'Escape') {
        if (errorModal) {
          setErrorModal(null);
        } else if (modalLoginVisible) {
          setModalLoginVisible(false);
        }
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [errorModal, modalLoginVisible]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosEnvio((prev) => ({ ...prev, [name]: value }));
  };

  const intentarContinuarEnvio = () => {
    const token = leerStorageTextoSeguro('token');
    if (!token) {
      setModalLoginVisible(true);
      return;
    }
    setPasoCheckout(2);
  };

  const prepararPago = async (e) => {
    e.preventDefault();
    if (cargandoIntencion) return;

    const token = leerStorageTextoSeguro('token');
    if (!token) {
      setModalLoginVisible(true);
      return;
    }

    setCargandoIntencion(true);

    try {
      const respuesta = await axios.post(
        'http://localhost:5000/api/pagos/crear-intencion',
        { total: total },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!montadoRef.current) return;

      if (!respuesta?.data?.clientSecret) {
        setErrorModal({
          titulo: 'No se pudo iniciar el pago',
          mensaje: 'La pasarela no devolvió una sesión de pago válida. Intenta nuevamente.',
        });
        return;
      }

      setClientSecret(respuesta.data.clientSecret);
      setPasoCheckout(3);
    } catch (error) {
      console.error('Error al inicializar pasarela:', error);
      if (montadoRef.current) {
        setErrorModal({
          titulo: 'Error de conexión con pagos',
          mensaje:
            'No se pudo conectar con el servidor de pagos. Verifica tu conexión e intenta nuevamente.',
        });
      }
    } finally {
      if (montadoRef.current) {
        setCargandoIntencion(false);
      }
    }
  };

  const procesarCompraFinal = async () => {
    const usuario = leerUsuarioSeguro();
    const token = leerStorageTextoSeguro('token');

    if (!usuario || !token) {
      if (montadoRef.current) {
        setErrorModal({
          titulo: 'Sesión no disponible',
          mensaje:
            'Tu pago fue autorizado, pero no pudimos leer los datos de tu sesión local. Revisa tu historial de pedidos o inicia sesión nuevamente.',
        });
      }
      return;
    }

    try {
      const respuesta = await axios.post(
        'http://localhost:5000/api/pedidos/procesar',
        {
          id_usuario: usuario.id || usuario.id_usuario,
          carrito: itemsCarrito,
          total: total,
          direccion_envio: datosEnvio.direccion,
          telefono_contacto: datosEnvio.telefono,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const usuarioActualizado = {
        ...usuario,
        direccion: datosEnvio.direccion,
        telefono: datosEnvio.telefono,
      };
      guardarUsuarioSeguro(usuarioActualizado);

      if (respuesta?.data?.factura && montadoRef.current) {
        const base64Pdf = respuesta.data.factura;
        const byteCharacters = atob(base64Pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i += 1) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const urlLocal = URL.createObjectURL(blob);
        setFacturaUrl(urlLocal);
      }

      vaciarCarrito();
      if (montadoRef.current) {
        setPasoCheckout(4);
      }
    } catch (error) {
      console.error('Error procesando la respuesta del servidor:', error);
      if (montadoRef.current) {
        setErrorModal({
          titulo: 'Error al confirmar el pedido',
          mensaje:
            'El pago se realizó, pero ocurrió un error al cargar la pantalla final. Revisa tu historial en Mis Pedidos.',
        });
      }
    }
  };

  const mostrarCheckout = itemsCarrito.length > 0 || pasoCheckout === 4;

  return (
    <section className="afro-cart-page" aria-label="Carrito de compras y pago">
      <div className="afro-cart-topbar">
        <button
          type="button"
          className="afro-btn afro-btn-outline afro-detail-back"
          onClick={volver}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver al Catálogo
        </button>
      </div>

      {mostrarCheckout ? (
        <nav aria-label="Progreso del proceso de compra">
          <ol className="afro-stepper">
            {PASOS_CHECKOUT.map((paso) => {
              const estaActivo = paso.numero === pasoCheckout;
              const estaCompletado = paso.numero < pasoCheckout;
              return (
                <li
                  key={paso.numero}
                  className={`afro-stepper-item${estaActivo ? ' is-active' : ''}${
                    estaCompletado ? ' is-completed' : ''
                  }`}
                  aria-current={estaActivo ? 'step' : undefined}
                >
                  <span className="afro-stepper-dot" aria-hidden="true">
                    {estaCompletado ? '✓' : paso.numero}
                  </span>
                  <span className="afro-stepper-label">{paso.etiqueta}</span>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      {!mostrarCheckout ? (
        <div className="afro-card afro-empty-state">
          <h2>Tu carrito está vacío</h2>
          <p>Agrega algunos cosméticos de nuestro catálogo para comenzar.</p>
          <div className="afro-empty-action">
            <button type="button" className="afro-btn afro-btn-primary" onClick={volver}>
              Explorar Productos
            </button>
          </div>
        </div>
      ) : (
        <>
          {pasoCheckout === 1 && itemsCarrito.length > 0 ? (
            <div className="afro-card">
              <h2 className="afro-cart-section-title">Resumen de Compra</h2>

              <ul className="afro-cart-list">
                {itemsCarrito.map((item) => {
                  const precioUnitario = parseFloat(item.precio) || 0;
                  const cantidadItem = Number(item.cantidad) || 0;
                  const subtotalItem = precioUnitario * cantidadItem;

                  return (
                    <li key={item.id_producto} className="afro-cart-item">
                      <div className="afro-cart-item-info">
                        <img
                          src={item.imagen_url}
                          alt={item.nombre}
                          loading="lazy"
                          className="afro-cart-thumb"
                        />
                        <div className="afro-cart-item-text">
                          <span className="afro-cart-item-name">{item.nombre}</span>
                          <span className="afro-cart-item-unit afro-tabular">
                            {formatearPrecio(precioUnitario)} c/u
                          </span>
                        </div>
                      </div>

                      <div className="afro-cart-item-actions">
                        <span className="afro-badge afro-badge-rose afro-tabular">
                          Cant: {cantidadItem}
                        </span>
                        <span className="afro-cart-item-subtotal afro-tabular">
                          {formatearPrecio(subtotalItem)}
                        </span>
                        <button
                          type="button"
                          className="afro-btn afro-btn-danger afro-cart-remove-btn"
                          onClick={() => eliminarDelCarrito(item.id_producto)}
                          aria-label={`Eliminar ${item.nombre} del carrito`}
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="afro-cart-summary-footer">
                <div className="afro-cart-total-wrap">
                  <span className="afro-cart-total-label">Total de productos</span>
                  <h3 className="afro-cart-total-value afro-tabular">
                    Subtotal: {formatearPrecio(total)}
                  </h3>
                </div>
                <button
                  type="button"
                  className="afro-btn afro-btn-primary"
                  onClick={intentarContinuarEnvio}
                >
                  Continuar con el Envío
                </button>
              </div>
            </div>
          ) : null}

          {pasoCheckout === 2 ? (
            <div className="afro-form-card">
              <h2 className="afro-checkout-heading">Datos de Envío</h2>
              <form onSubmit={prepararPago}>
                <div className="afro-field">
                  <label htmlFor="checkout-direccion" className="afro-label">
                    Dirección de Entrega
                  </label>
                  <textarea
                    id="checkout-direccion"
                    name="direccion"
                    className="afro-textarea"
                    value={datosEnvio.direccion}
                    onChange={handleChange}
                    required
                    placeholder="Calle, número, apartamento o punto de referencia"
                  />
                </div>

                <div className="afro-field">
                  <label htmlFor="checkout-telefono" className="afro-label">
                    Teléfono de Contacto
                  </label>
                  <input
                    id="checkout-telefono"
                    type="tel"
                    name="telefono"
                    className="afro-input"
                    value={datosEnvio.telefono}
                    onChange={handleChange}
                    required
                    autoComplete="tel"
                    placeholder="Ej. +57 300 123 4567"
                  />
                </div>

                <div className="afro-checkout-form-actions">
                  <button
                    type="button"
                    className="afro-btn afro-btn-outline"
                    onClick={() => setPasoCheckout(1)}
                    disabled={cargandoIntencion}
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="afro-btn afro-btn-primary"
                    disabled={cargandoIntencion}
                  >
                    {cargandoIntencion ? 'Preparando pago...' : 'Ir al Pago'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {pasoCheckout === 3 && clientSecret ? (
            <div className="afro-checkout-payment-wrap">
              <h2 className="afro-checkout-payment-title">Completar Pago</h2>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <FormularioPago
                  clientSecret={clientSecret}
                  procesarCompraFinal={procesarCompraFinal}
                  total={total}
                />
              </Elements>
              <button
                type="button"
                className="afro-btn afro-btn-outline afro-btn-full"
                onClick={() => setPasoCheckout(2)}
              >
                Volver a Datos de Envío
              </button>
            </div>
          ) : null}

          {pasoCheckout === 4 ? (
            <div className="afro-card afro-checkout-confirm">
              <div className="afro-modal-icon-success" aria-hidden="true">
                ✓
              </div>
              <h2 className="afro-checkout-confirm-title">¡Pago Procesado Exitosamente!</h2>
              <p className="afro-checkout-confirm-desc">
                Tu orden ha sido confirmada. Hemos enviado una copia de esta factura electrónica a
                tu correo registrado.
              </p>

              {facturaUrl ? (
                <div className="afro-pdf-frame">
                  <iframe src={facturaUrl} title="Factura PDF" className="afro-pdf-iframe" />
                </div>
              ) : null}

              <div className="afro-checkout-confirm-actions">
                {facturaUrl ? (
                  <a
                    href={facturaUrl}
                    download="Factura_Afrolash.pdf"
                    className="afro-btn afro-btn-outline"
                  >
                    Descargar Factura PDF
                  </a>
                ) : null}
                <button
                  type="button"
                  className="afro-btn afro-btn-primary"
                  onClick={() => navegarA('tienda')}
                >
                  Finalizar y Volver al Catálogo
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {modalLoginVisible ? (
        <div
          className="afro-modal-backdrop"
          onClick={() => setModalLoginVisible(false)}
        >
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="carrito-login-modal-title"
            aria-describedby="carrito-login-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="carrito-login-modal-title" className="afro-modal-title">
              Autenticación Requerida
            </h3>
            <p id="carrito-login-modal-desc" className="afro-modal-body">
              Para procesar tu pago y registrar la dirección de envío, necesitas acceder a tu
              cuenta. Tus productos seguirán guardados en el carrito.
            </p>
            <div className="afro-modal-actions afro-modal-actions--stack">
              <button
                type="button"
                className="afro-btn afro-btn-primary"
                onClick={() => navegarA('login')}
                autoFocus
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                className="afro-btn afro-btn-dark"
                onClick={() => navegarA('registro')}
              >
                Crear una Cuenta
              </button>
              <button
                type="button"
                className="afro-btn afro-btn-outline"
                onClick={() => setModalLoginVisible(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {errorModal ? (
        <div
          className="afro-modal-backdrop"
          onClick={() => setErrorModal(null)}
        >
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="carrito-error-modal-title"
            aria-describedby="carrito-error-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="afro-modal-icon-danger" aria-hidden="true">
              !
            </div>
            <h3 id="carrito-error-modal-title" className="afro-modal-title">
              {errorModal.titulo}
            </h3>
            <p id="carrito-error-modal-desc" className="afro-modal-body">
              {errorModal.mensaje}
            </p>
            <div className="afro-modal-actions">
              <button
                type="button"
                className="afro-btn afro-btn-dark afro-btn-full"
                onClick={() => setErrorModal(null)}
                autoFocus
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Carrito;
