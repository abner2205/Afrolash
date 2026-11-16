import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, obtenerUrlImagen } from '../config/api';

const formatearPrecio = (precio) => {
  const numero = Number(precio);
  return Number.isFinite(numero) ? `$${numero.toFixed(2)}` : `$${precio}`;
};

const ProductoDetalle = ({ idProducto, agregarAlCarrito, navegarA }) => {
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [modalConfirmacion, setModalConfirmacion] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    let activo = true;

    const obtenerProducto = async () => {
      if (!idProducto) {
        if (activo) {
          setProducto(null);
          setErrorCarga('No se especificó un producto válido para consultar.');
          setCargando(false);
        }
        return;
      }

      setCargando(true);
      setErrorCarga('');
      setCantidad(1);
      setModalConfirmacion(false);

      try {
        const respuesta = await axios.get(`${API_URL}/api/productos/${idProducto}`);
        if (!activo) return;

        if (respuesta.data && typeof respuesta.data === 'object' && !Array.isArray(respuesta.data)) {
          setProducto(respuesta.data);
        } else {
          setProducto(null);
          setErrorCarga('No encontramos información disponible para este producto.');
        }
      } catch (error) {
        console.error('Error al cargar detalles del producto:', error);
        if (activo) {
          setProducto(null);
          setErrorCarga(
            error.response?.status === 404
              ? 'El producto solicitado no existe o ya no está disponible.'
              : 'Ocurrió un problema al cargar los detalles del producto.'
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    obtenerProducto();

    return () => {
      activo = false;
    };
  }, [idProducto]);

  useEffect(() => {
    if (!modalConfirmacion) return undefined;

    const manejarEscape = (evento) => {
      if (evento.key === 'Escape') {
        setModalConfirmacion(false);
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [modalConfirmacion]);

  const manejarAjusteCantidad = (incremento) => {
    if (!producto) return;
    setCantidad((prev) => {
      let nuevaCantidad = prev + incremento;
      if (nuevaCantidad < 1) nuevaCantidad = 1;
      if (nuevaCantidad > producto.stock) nuevaCantidad = producto.stock;
      return nuevaCantidad;
    });
  };

  const procesarAgregado = () => {
    if (!producto) return;
    const exito = agregarAlCarrito(producto, cantidad);
    if (exito) {
      setModalConfirmacion(true);
      setCantidad(1);
    }
  };

  if (cargando) {
    return (
      <div className="afro-card afro-empty-state" role="status" aria-live="polite">
        <h2>Cargando producto</h2>
        <p>Cargando información del producto...</p>
      </div>
    );
  }

  if (errorCarga || !producto) {
    return (
      <div className="afro-card afro-empty-state">
        <div className="afro-inline-error">
          <h2>Producto no encontrado</h2>
          <p>{errorCarga || 'No pudimos encontrar el producto solicitado.'}</p>
          <button
            type="button"
            className="afro-btn afro-btn-primary"
            onClick={() => navegarA('tienda')}
          >
            Volver al Catálogo
          </button>
        </div>
      </div>
    );
  }

  const tieneSeccionesDetalladas = Boolean(
    producto.ingredientes ||
      producto.instrucciones_uso ||
      producto.consejos ||
      producto.precauciones
  );

  return (
    <article className="afro-card afro-detail-page" aria-labelledby="detalle-producto-titulo">
      <button
        type="button"
        className="afro-btn afro-btn-outline afro-detail-back"
        onClick={() => navegarA('tienda')}
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

      <div className="afro-detail-grid">
        <div className="afro-detail-media">
          <img
            src={obtenerUrlImagen(producto.imagen_url)}
            alt={producto.nombre}
            className="afro-detail-img"
          />
        </div>

        <div className="afro-detail-info">
          {producto.categoria ? (
            <span className="afro-badge afro-badge-rose">{producto.categoria}</span>
          ) : null}

          <h1 id="detalle-producto-titulo" className="afro-detail-title">
            {producto.nombre}
          </h1>

          <p className="afro-detail-price">{formatearPrecio(producto.precio)}</p>

          {producto.descripcion ? (
            <p className="afro-detail-desc">{producto.descripcion}</p>
          ) : null}

          {producto.stock > 0 ? (
            <div className="afro-detail-buy-box">
              <div>
                <span className="afro-badge afro-badge-success">
                  Stock disponible: {producto.stock} unidades
                </span>
              </div>

              <div className="afro-detail-actions">
                <div className="afro-qty-control" role="group" aria-label="Selector de cantidad">
                  <button
                    type="button"
                    className="afro-qty-btn"
                    onClick={() => manejarAjusteCantidad(-1)}
                    aria-label="Disminuir cantidad"
                    disabled={cantidad <= 1}
                  >
                    -
                  </button>
                  <span
                    className="afro-qty-value"
                    aria-live="polite"
                    aria-label={`Cantidad seleccionada: ${cantidad}`}
                  >
                    {cantidad}
                  </span>
                  <button
                    type="button"
                    className="afro-qty-btn"
                    onClick={() => manejarAjusteCantidad(1)}
                    aria-label="Aumentar cantidad"
                    disabled={cantidad >= producto.stock}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="afro-btn afro-btn-primary afro-detail-add-btn"
                  onClick={procesarAgregado}
                >
                  Agregar al Carrito
                </button>
              </div>
            </div>
          ) : (
            <div className="afro-toast afro-toast-error afro-btn-full" role="status">
              Producto actualmente agotado.
            </div>
          )}
        </div>
      </div>

      {tieneSeccionesDetalladas ? (
        <div className="afro-detail-sections">
          {producto.ingredientes ? (
            <section
              className="afro-detail-block afro-detail-block--ingredients"
              aria-labelledby="detalle-ingredientes-titulo"
            >
              <h2 id="detalle-ingredientes-titulo" className="afro-detail-block-title">
                Ingredientes Principales
              </h2>
              <p className="afro-detail-block-text">{producto.ingredientes}</p>
            </section>
          ) : null}

          {producto.instrucciones_uso ? (
            <section
              className={`afro-detail-split${
                producto.imagen_instrucciones ? '' : ' afro-detail-split--single'
              }`}
              aria-labelledby="detalle-instrucciones-titulo"
            >
              <div>
                <h2 id="detalle-instrucciones-titulo" className="afro-detail-split-title">
                  Instrucciones de Uso
                </h2>
                <p className="afro-detail-block-text">{producto.instrucciones_uso}</p>
              </div>
              {producto.imagen_instrucciones ? (
                <div className="afro-detail-split-media">
                  <img
                    src={obtenerUrlImagen(producto.imagen_instrucciones)}
                    alt={`Instrucciones de uso de ${producto.nombre}`}
                    loading="lazy"
                    className="afro-detail-split-img"
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          {producto.consejos ? (
            <section
              className={`afro-detail-split afro-detail-split--consejos${
                producto.imagen_consejos ? '' : ' afro-detail-split--single'
              }`}
              aria-labelledby="detalle-consejos-titulo"
            >
              <div>
                <h2 id="detalle-consejos-titulo" className="afro-detail-split-title">
                  Consejos de Afrolash
                </h2>
                <p className="afro-detail-block-text">{producto.consejos}</p>
              </div>
              {producto.imagen_consejos ? (
                <div className="afro-detail-split-media">
                  <img
                    src={obtenerUrlImagen(producto.imagen_consejos)}
                    alt={`Consejos de uso de ${producto.nombre}`}
                    loading="lazy"
                    className="afro-detail-split-img"
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          {producto.precauciones ? (
            <section
              className="afro-detail-block afro-detail-block--warning"
              aria-labelledby="detalle-precauciones-titulo"
            >
              <h2 id="detalle-precauciones-titulo" className="afro-detail-block-title">
                Precauciones y Advertencias
              </h2>
              <p className="afro-detail-block-text">{producto.precauciones}</p>
            </section>
          ) : null}
        </div>
      ) : null}

      {modalConfirmacion ? (
        <div
          className="afro-modal-backdrop"
          onClick={() => setModalConfirmacion(false)}
        >
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-modal-title"
            aria-describedby="detalle-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="afro-modal-icon-success" aria-hidden="true">
              ✓
            </div>
            <h2 id="detalle-modal-title" className="afro-modal-title">
              ¡Añadido con éxito!
            </h2>
            <p id="detalle-modal-desc" className="afro-modal-body">
              El producto <strong>{producto.nombre}</strong> fue agregado a tu carrito de compras.
            </p>
            <div className="afro-modal-actions afro-modal-actions--stack">
              <button
                type="button"
                className="afro-btn afro-btn-primary"
                onClick={() => navegarA('carrito')}
                autoFocus
              >
                Ver mi carrito
              </button>
              <button
                type="button"
                className="afro-btn afro-btn-outline"
                onClick={() => setModalConfirmacion(false)}
              >
                Seguir leyendo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default ProductoDetalle;
