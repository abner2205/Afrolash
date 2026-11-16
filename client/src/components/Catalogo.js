import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL, obtenerUrlImagen } from '../config/api';

const PRODUCTOS_POR_PAGINA = 10;

const formatearPrecio = (precio) => {
  const numero = Number(precio);
  return Number.isFinite(numero) ? `$${numero.toFixed(2)}` : `$${precio}`;
};

const Catalogo = ({ agregarAlCarrito, navegarA, terminoBusqueda }) => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [paginaActual, setPaginaActual] = useState(1);
  const [criterioOrden, setCriterioOrden] = useState('alfabetico');

  const [cantidades, setCantidades] = useState({});
  const [modalConfirmacion, setModalConfirmacion] = useState({
    visible: false,
    productoNombre: '',
    cantidad: 0,
  });

  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const obtenerDatos = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const respuesta = await axios.get(`${API_URL}/api/productos`);
      if (!montadoRef.current) return;
      setProductos(Array.isArray(respuesta.data) ? respuesta.data : []);
    } catch (error) {
      console.error('Error al cargar el catálogo:', error);
      if (montadoRef.current) {
        setErrorCarga(
          'No pudimos cargar los productos del catálogo. Verifica tu conexión e intenta nuevamente.'
        );
      }
    } finally {
      if (montadoRef.current) {
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    obtenerDatos();
  }, [obtenerDatos]);

  useEffect(() => {
    setPaginaActual(1);
  }, [terminoBusqueda, criterioOrden]);

  const cerrarModalConfirmacion = useCallback(() => {
    setModalConfirmacion({ visible: false, productoNombre: '', cantidad: 0 });
  }, []);

  useEffect(() => {
    if (!modalConfirmacion.visible) return undefined;

    const manejarEscape = (evento) => {
      if (evento.key === 'Escape') {
        cerrarModalConfirmacion();
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [modalConfirmacion.visible, cerrarModalConfirmacion]);

  const productosProcesados = useMemo(() => {
    const busquedaSegura = (terminoBusqueda || '').trim().toLowerCase();
    const filtrados = busquedaSegura
      ? productos.filter((producto) =>
          (producto.nombre || '').toLowerCase().includes(busquedaSegura)
        )
      : productos;

    const copiaOrdenada = [...filtrados];
    if (criterioOrden === 'alfabetico') {
      copiaOrdenada.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
    } else if (criterioOrden === 'precio_asc') {
      copiaOrdenada.sort((a, b) => parseFloat(a.precio) - parseFloat(b.precio));
    } else if (criterioOrden === 'precio_desc') {
      copiaOrdenada.sort((a, b) => parseFloat(b.precio) - parseFloat(a.precio));
    }

    return copiaOrdenada;
  }, [productos, terminoBusqueda, criterioOrden]);

  const totalPaginas = Math.ceil(productosProcesados.length / PRODUCTOS_POR_PAGINA);

  const productosPaginados = useMemo(() => {
    const indiceUltimoProducto = paginaActual * PRODUCTOS_POR_PAGINA;
    const indicePrimerProducto = indiceUltimoProducto - PRODUCTOS_POR_PAGINA;
    return productosProcesados.slice(indicePrimerProducto, indiceUltimoProducto);
  }, [productosProcesados, paginaActual]);

  const obtenerCantidadActual = (id) => {
    return cantidades[id] !== undefined ? cantidades[id] : 1;
  };

  const manejarCambioManual = (id, valorStr, stockMaximo) => {
    if (valorStr === '') {
      setCantidades((prev) => ({ ...prev, [id]: '' }));
      return;
    }

    let valor = parseInt(valorStr, 10);
    if (Number.isNaN(valor)) valor = '';
    if (valor !== '' && valor < 1) valor = 1;
    if (valor !== '' && valor > stockMaximo) valor = stockMaximo;

    setCantidades((prev) => ({ ...prev, [id]: valor }));
  };

  const normalizarCantidadAlSalir = (id) => {
    setCantidades((prev) => {
      const actual = prev[id];
      if (actual === '' || actual === undefined || Number(actual) < 1) {
        return { ...prev, [id]: 1 };
      }
      return prev;
    });
  };

  const ajustarCantidad = (id, incremento, stockMaximo) => {
    setCantidades((prev) => {
      const actual = prev[id] === undefined || prev[id] === '' ? 1 : Number(prev[id]);
      let nuevaCantidad = actual + incremento;
      if (nuevaCantidad < 1) nuevaCantidad = 1;
      if (nuevaCantidad > stockMaximo) nuevaCantidad = stockMaximo;
      return { ...prev, [id]: nuevaCantidad };
    });
  };

  const procesarAgregado = (producto) => {
    const valorActual = obtenerCantidadActual(producto.id_producto);
    let cantidadSolicitada = valorActual === '' ? 1 : Number(valorActual);
    if (!Number.isFinite(cantidadSolicitada) || cantidadSolicitada < 1) {
      cantidadSolicitada = 1;
    }

    const exito = agregarAlCarrito(producto, cantidadSolicitada);

    if (exito) {
      setModalConfirmacion({
        visible: true,
        productoNombre: producto.nombre,
        cantidad: cantidadSolicitada,
      });
      setCantidades((prev) => ({ ...prev, [producto.id_producto]: 1 }));
    } else {
      setCantidades((prev) => ({ ...prev, [producto.id_producto]: cantidadSolicitada }));
    }
  };

  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
    window.scrollTo(0, 0);
  };

  return (
    <section className="afro-catalog" aria-labelledby="catalogo-titulo">
      <div className="afro-catalog-header">
        <div className="afro-catalog-heading">
          <h1 id="catalogo-titulo" className="afro-page-title">
            Nuestro Catálogo
          </h1>
          {!cargando && !errorCarga ? (
            <p className="afro-catalog-count">
              {productosProcesados.length}{' '}
              {productosProcesados.length === 1 ? 'producto disponible' : 'productos disponibles'}
            </p>
          ) : null}
        </div>

        <div className="afro-catalog-sort">
          <label htmlFor="orden-catalogo" className="afro-label">
            Ordenar por
          </label>
          <select
            id="orden-catalogo"
            className="afro-select afro-catalog-select"
            value={criterioOrden}
            onChange={(e) => setCriterioOrden(e.target.value)}
          >
            <option value="alfabetico">Orden Alfabético (A-Z)</option>
            <option value="precio_asc">Menor a Mayor Precio</option>
            <option value="precio_desc">Mayor a Menor Precio</option>
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="afro-card afro-empty-state" role="status" aria-live="polite">
          <h2>Cargando catálogo</h2>
          <p>Estamos preparando los productos disponibles para ti...</p>
        </div>
      ) : errorCarga ? (
        <div className="afro-card afro-empty-state">
          <div className="afro-inline-error">
            <div className="afro-toast afro-toast-error" role="alert">
              {errorCarga}
            </div>
            <button type="button" className="afro-btn afro-btn-primary" onClick={obtenerDatos}>
              Reintentar
            </button>
          </div>
        </div>
      ) : productosPaginados.length > 0 ? (
        <div className="afro-product-grid">
          {productosPaginados.map((producto) => {
            const cantidadActual = obtenerCantidadActual(producto.id_producto);
            const cantidadNumerica =
              cantidadActual === '' ? 1 : Number(cantidadActual) || 1;

            return (
              <article key={producto.id_producto} className="afro-product-card">
                <div>
                  <button
                    type="button"
                    className="afro-product-media-btn"
                    onClick={() => navegarA('detalle', producto.id_producto)}
                    aria-label={`Ver detalles de ${producto.nombre}`}
                  >
                    <div className="afro-product-img-wrap">
                      <img
                        src={obtenerUrlImagen(producto.imagen_url)}
                        alt={producto.nombre}
                        loading="lazy"
                        className="afro-product-img"
                      />
                    </div>
                    <span className="afro-product-title">{producto.nombre}</span>
                  </button>
                  {producto.descripcion ? (
                    <p className="afro-product-desc">{producto.descripcion}</p>
                  ) : null}
                </div>

                <div className="afro-product-footer">
                  <div className="afro-product-meta">
                    <p className="afro-price afro-product-price">
                      {formatearPrecio(producto.precio)}
                    </p>
                    <span
                      className={`afro-badge ${
                        producto.stock > 0 ? 'afro-badge-success' : 'afro-badge-danger'
                      }`}
                    >
                      {producto.stock > 0 ? `Stock: ${producto.stock}` : 'Agotado'}
                    </span>
                  </div>

                  {producto.stock > 0 ? (
                    <>
                      <div className="afro-qty-control afro-qty-control--full">
                        <button
                          type="button"
                          className="afro-qty-btn"
                          onClick={() => ajustarCantidad(producto.id_producto, -1, producto.stock)}
                          aria-label={`Disminuir cantidad de ${producto.nombre}`}
                          disabled={cantidadNumerica <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="afro-qty-input"
                          min={1}
                          max={producto.stock}
                          inputMode="numeric"
                          value={cantidadActual}
                          onChange={(e) =>
                            manejarCambioManual(
                              producto.id_producto,
                              e.target.value,
                              producto.stock
                            )
                          }
                          onBlur={() => normalizarCantidadAlSalir(producto.id_producto)}
                          aria-label={`Cantidad de ${producto.nombre}`}
                        />
                        <button
                          type="button"
                          className="afro-qty-btn"
                          onClick={() => ajustarCantidad(producto.id_producto, 1, producto.stock)}
                          aria-label={`Aumentar cantidad de ${producto.nombre}`}
                          disabled={cantidadNumerica >= producto.stock}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="afro-btn afro-btn-primary afro-btn-full"
                        onClick={() => procesarAgregado(producto)}
                      >
                        Agregar al Carrito
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="afro-btn afro-btn-outline afro-btn-full"
                    >
                      Sin Inventario
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="afro-card afro-empty-state">
          <h2>Sin coincidencias</h2>
          <p>
            {terminoBusqueda
              ? `No se encontraron productos para "${terminoBusqueda}".`
              : 'No hay productos disponibles en el catálogo en este momento.'}
          </p>
        </div>
      )}

      {!cargando && !errorCarga && totalPaginas > 1 ? (
        <nav className="afro-pagination" aria-label="Paginación del catálogo">
          <button
            type="button"
            className="afro-btn afro-btn-outline afro-page-btn"
            onClick={() => cambiarPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
          >
            Anterior
          </button>

          {Array.from({ length: totalPaginas }, (_, index) => {
            const numeroPagina = index + 1;
            const esActual = paginaActual === numeroPagina;
            return (
              <button
                key={numeroPagina}
                type="button"
                className={`afro-btn afro-page-btn ${
                  esActual ? 'afro-btn-dark' : 'afro-btn-outline'
                }`}
                onClick={() => cambiarPagina(numeroPagina)}
                aria-label={`Página ${numeroPagina}`}
                aria-current={esActual ? 'page' : undefined}
              >
                {numeroPagina}
              </button>
            );
          })}

          <button
            type="button"
            className="afro-btn afro-btn-outline afro-page-btn"
            onClick={() => cambiarPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
          >
            Siguiente
          </button>
        </nav>
      ) : null}

      {modalConfirmacion.visible ? (
        <div className="afro-modal-backdrop" onClick={cerrarModalConfirmacion}>
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalogo-modal-title"
            aria-describedby="catalogo-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="afro-modal-icon-success" aria-hidden="true">
              ✓
            </div>
            <h2 id="catalogo-modal-title" className="afro-modal-title">
              ¡Añadido con éxito!
            </h2>
            <p id="catalogo-modal-desc" className="afro-modal-body">
              Agregaste <strong>{modalConfirmacion.cantidad}</strong> unidad(es) de{' '}
              <strong>{modalConfirmacion.productoNombre}</strong> a tu carrito de compras.
            </p>
            <div className="afro-modal-actions afro-modal-actions--stack">
              <button
                type="button"
                className="afro-btn afro-btn-primary"
                onClick={() => navegarA('carrito')}
                autoFocus
              >
                Ver mi carrito y Pagar
              </button>
              <button
                type="button"
                className="afro-btn afro-btn-outline"
                onClick={cerrarModalConfirmacion}
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Catalogo;
