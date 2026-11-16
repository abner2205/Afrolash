import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, obtenerUrlImagen } from '../config/api';

const ESTADOS_PEDIDO = {
  pendiente: { clase: 'afro-badge afro-badge-warning', etiqueta: 'Pendiente' },
  pagado: { clase: 'afro-badge afro-badge-rose', etiqueta: 'Pagado' },
  enviado: { clase: 'afro-badge afro-badge-info', etiqueta: 'Enviado' },
  entregado: { clase: 'afro-badge afro-badge-success', etiqueta: 'Entregado' },
  cancelado: { clase: 'afro-badge afro-badge-danger', etiqueta: 'Cancelado' },
};

const leerTokenSeguro = () => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    return null;
  }
};

const formatearPrecio = (monto) => {
  const numero = parseFloat(monto);
  return Number.isFinite(numero) ? `$${numero.toFixed(2)}` : '$0.00';
};

const formatearFecha = (cadenaFecha) => {
  if (!cadenaFecha) return 'Fecha desconocida';
  const fecha = new Date(cadenaFecha);
  if (Number.isNaN(fecha.getTime())) return 'Fecha desconocida';
  const opciones = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return fecha.toLocaleDateString('es-VE', opciones);
};

const obtenerBadgeEstado = (estado) => {
  const clave = (estado || 'pendiente').toLowerCase();
  if (ESTADOS_PEDIDO[clave]) {
    return ESTADOS_PEDIDO[clave];
  }
  return {
    clase: 'afro-badge afro-badge-warning',
    etiqueta: estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : 'Pendiente',
  };
};

const MisPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalErrorVisible, setModalErrorVisible] = useState(false);

  useEffect(() => {
    let activo = true;

    const obtenerHistorial = async () => {
      const token = leerTokenSeguro();

      if (!token) {
        if (activo) {
          setError('Debes iniciar sesión para ver tus pedidos.');
          setModalErrorVisible(true);
          setCargando(false);
        }
        return;
      }

      try {
        const respuesta = await axios.get(`${API_URL}/api/pedidos/mis-pedidos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (activo) {
          setPedidos(Array.isArray(respuesta.data) ? respuesta.data : []);
        }
      } catch (err) {
        console.error('Error al cargar pedidos:', err);
        if (activo) {
          setError('Hubo un problema al cargar tu historial de compras.');
          setModalErrorVisible(true);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    obtenerHistorial();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!modalErrorVisible) return undefined;

    const manejarEscape = (evento) => {
      if (evento.key === 'Escape') {
        setModalErrorVisible(false);
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [modalErrorVisible]);

  return (
    <section className="afro-orders-page" aria-labelledby="mis-pedidos-titulo">
      <div className="afro-orders-header">
        <h1 id="mis-pedidos-titulo" className="afro-page-title">
          Mis Pedidos
        </h1>
      </div>

      {cargando ? (
        <div className="afro-card afro-empty-state" role="status" aria-live="polite">
          <p>Cargando tu historial de pedidos...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="afro-card afro-empty-state">
          <h2>Sin pedidos registrados</h2>
          <p>Aún no has realizado ninguna compra o tu historial no está disponible.</p>
        </div>
      ) : (
        <div className="afro-orders-list">
          {pedidos.map((pedido) => {
            const badgeEstado = obtenerBadgeEstado(pedido.estado);

            return (
              <article key={pedido.id_pedido} className="afro-order-card">
                <div className="afro-order-header">
                  <div className="afro-order-meta-item">
                    <span className="afro-order-meta-label">Pedido Realizado</span>
                    <span className="afro-order-meta-value">
                      {formatearFecha(pedido.fecha_pedido)}
                    </span>
                  </div>

                  <div className="afro-order-meta-item">
                    <span className="afro-order-meta-label">Total Pagado</span>
                    <span className="afro-order-total afro-tabular">
                      {formatearPrecio(pedido.total)}
                    </span>
                  </div>

                  <div className="afro-order-meta-item">
                    <span className="afro-order-meta-label">N° de Orden</span>
                    <span className="afro-order-meta-value afro-tabular">#{pedido.id_pedido}</span>
                  </div>

                  <div className="afro-order-meta-item">
                    <span className="afro-order-meta-label">Estado</span>
                    <span className={badgeEstado.clase}>{badgeEstado.etiqueta}</span>
                  </div>
                </div>

                <div className="afro-order-section">
                  <h2 className="afro-order-subheading">Información de Entrega</h2>
                  <p className="afro-order-delivery-text">
                    <strong>Dirección:</strong> {pedido.direccion_envio || 'No especificada'}
                  </p>
                  <p className="afro-order-delivery-text">
                    <strong>Teléfono de Contacto:</strong>{' '}
                    {pedido.telefono_contacto || 'No especificado'}
                  </p>
                </div>

                <div className="afro-order-section">
                  <h2 className="afro-order-subheading">Artículos del Pedido</h2>
                  {Array.isArray(pedido.detalles) && pedido.detalles.length > 0 ? (
                    <ul className="afro-order-items-list">
                      {pedido.detalles.map((item, index) => (
                        <li
                          key={item.id_detalle || item.id_producto || index}
                          className="afro-order-item"
                        >
                          <img
                            src={obtenerUrlImagen(item.imagen_url)}
                            alt={item.nombre}
                            loading="lazy"
                            className="afro-cart-thumb"
                          />
                          <div className="afro-order-item-info">
                            <h3 className="afro-order-item-title">{item.nombre}</h3>
                            <p className="afro-order-item-qty afro-tabular">
                              Cantidad: {item.cantidad}
                            </p>
                          </div>
                          <span className="afro-order-item-price afro-tabular">
                            {formatearPrecio(
                              (parseFloat(item.precio_unitario) || 0) * (Number(item.cantidad) || 0)
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="afro-order-delivery-text">
                      No hay detalles de artículos disponibles para esta orden.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalErrorVisible ? (
        <div className="afro-modal-backdrop" onClick={() => setModalErrorVisible(false)}>
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mis-pedidos-error-title"
            aria-describedby="mis-pedidos-error-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="afro-modal-icon-danger" aria-hidden="true">
              !
            </div>
            <h2 id="mis-pedidos-error-title" className="afro-modal-title">
              Atención requerida
            </h2>
            <p id="mis-pedidos-error-desc" className="afro-modal-body">
              {error}
            </p>
            <div className="afro-modal-actions">
              <button
                type="button"
                className="afro-btn afro-btn-dark afro-btn-full"
                onClick={() => setModalErrorVisible(false)}
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

export default MisPedidos;
