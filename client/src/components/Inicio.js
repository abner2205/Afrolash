import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_URL, obtenerUrlImagen } from '../config/api';

const BENEFICIOS = [
  {
    titulo: 'Calidad Premium',
    desc: 'Seleccionamos rigurosamente cada producto para cuidar tu piel.',
  },
  {
    titulo: 'Envíos Nacionales',
    desc: 'Despachamos de forma segura a cualquier rincón del territorio nacional.',
  },
  {
    titulo: 'Pagos Seguros',
    desc: 'Tu información financiera está encriptada y protegida.',
  },
];

const formatearPrecio = (precio) => {
  const numero = Number(precio);
  return Number.isFinite(numero) ? `$${numero.toFixed(2)}` : `$${precio}`;
};

const Inicio = ({ navegarA }) => {
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [indiceCarrusel, setIndiceCarrusel] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const montadoRef = useRef(true);
  const tiempoInteraccionRef = useRef(0);
  const pausadoRef = useRef(false);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const cargarDestacados = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const respuesta = await axios.get(`${API_URL}/api/productos`);
      if (!montadoRef.current) return;
      const lista = Array.isArray(respuesta.data) ? respuesta.data.slice(0, 5) : [];
      setProductosDestacados(lista);
      setIndiceCarrusel(0);
    } catch (error) {
      console.error('Error al cargar productos destacados:', error);
      if (montadoRef.current) {
        setErrorCarga('No pudimos cargar los productos destacados en este momento.');
      }
    } finally {
      if (montadoRef.current) {
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    cargarDestacados();
  }, [cargarDestacados]);

  useEffect(() => {
    if (productosDestacados.length <= 1) return undefined;

    const prefiereMovimientoReducido =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefiereMovimientoReducido) return undefined;

    const intervalo = setInterval(() => {
      const ahora = Date.now();
      if (!pausadoRef.current && ahora - tiempoInteraccionRef.current > 8000) {
        setIndiceCarrusel((prev) => (prev + 1) % productosDestacados.length);
      }
    }, 4000);

    return () => clearInterval(intervalo);
  }, [productosDestacados.length]);

  const moverCarrusel = (direccion) => {
    if (productosDestacados.length === 0) return;
    tiempoInteraccionRef.current = Date.now();
    if (direccion === 'siguiente') {
      setIndiceCarrusel((prev) => (prev + 1) % productosDestacados.length);
    } else {
      setIndiceCarrusel(
        (prev) => (prev - 1 + productosDestacados.length) % productosDestacados.length
      );
    }
  };

  const irAIndice = (indice) => {
    tiempoInteraccionRef.current = Date.now();
    setIndiceCarrusel(indice);
  };

  const heroStyle = {
    backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(247, 205, 213, 0.9) 100%), url("${process.env.PUBLIC_URL}/fondo-hero.jpg")`,
  };

  return (
    <div className="afro-home">
      <section className="afro-hero" style={heroStyle} aria-labelledby="afro-hero-title">
        <div className="afro-hero-content">
          <img
            src="/logo.png"
            alt="Logo de Afrolash"
            className="afro-hero-logo"
          />

          <h1 id="afro-hero-title" className="afro-hero-title">
            Bienvenido a Afrolash
          </h1>
          <p className="afro-hero-subtitle">
            Realzamos tu belleza natural con la mejor selección de cosméticos y productos para el
            cuidado personal. Descubre la calidad que mereces.
          </p>
          <button
            type="button"
            className="afro-btn afro-btn-primary afro-hero-cta"
            onClick={() => navegarA('tienda')}
          >
            Explorar Catálogo
          </button>
        </div>
      </section>

      {cargando ? (
        <section className="afro-card afro-empty-state" role="status" aria-live="polite">
          <p>Cargando productos destacados...</p>
        </section>
      ) : errorCarga ? (
        <section className="afro-card afro-empty-state" aria-label="Productos destacados">
          <div className="afro-inline-error">
            <div className="afro-toast afro-toast-error" role="alert">
              {errorCarga}
            </div>
            <button
              type="button"
              className="afro-btn afro-btn-primary"
              onClick={cargarDestacados}
            >
              Reintentar
            </button>
          </div>
        </section>
      ) : productosDestacados.length > 0 ? (
        <section
          className="afro-card afro-carousel-section"
          aria-roledescription="carrusel"
          aria-labelledby="destacados-titulo"
        >
          <h2 id="destacados-titulo" className="afro-section-title">
            Productos Destacados
          </h2>
          <p className="afro-section-subtitle">
            Favoritos de nuestra colección seleccionados para tu rutina diaria.
          </p>

          <div
            className="afro-carousel-shell"
            onMouseEnter={() => {
              pausadoRef.current = true;
            }}
            onMouseLeave={() => {
              pausadoRef.current = false;
            }}
            onFocusCapture={() => {
              pausadoRef.current = true;
            }}
            onBlurCapture={() => {
              pausadoRef.current = false;
            }}
          >
            <div className="afro-carousel-viewport">
              <div
                className="afro-carousel-track"
                style={{ transform: `translateX(-${indiceCarrusel * 100}%)` }}
              >
                {productosDestacados.map((producto, index) => (
                  <article
                    key={producto.id_producto || index}
                    className="afro-carousel-slide"
                    aria-hidden={indiceCarrusel !== index}
                  >
                    <img
                      src={obtenerUrlImagen(producto.imagen_url)}
                      alt={producto.nombre}
                      loading="lazy"
                      className="afro-carousel-img"
                    />
                    <div className="afro-carousel-body">
                      <h3 className="afro-carousel-product-title">{producto.nombre}</h3>
                      <p className="afro-price afro-carousel-price">
                        {formatearPrecio(producto.precio)}
                      </p>
                      <button
                        type="button"
                        className="afro-btn afro-btn-dark afro-btn-full"
                        onClick={() => navegarA('tienda')}
                        tabIndex={indiceCarrusel === index ? 0 : -1}
                      >
                        Ver en Catálogo
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {productosDestacados.length > 1 ? (
              <>
                <button
                  type="button"
                  className="afro-carousel-arrow afro-carousel-arrow--prev"
                  onClick={() => moverCarrusel('anterior')}
                  aria-label="Producto destacado anterior"
                >
                  <svg
                    width="20"
                    height="20"
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
                </button>
                <button
                  type="button"
                  className="afro-carousel-arrow afro-carousel-arrow--next"
                  onClick={() => moverCarrusel('siguiente')}
                  aria-label="Producto destacado siguiente"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            ) : null}
          </div>

          {productosDestacados.length > 1 ? (
            <div
              className="afro-carousel-dots"
              role="group"
              aria-label="Seleccionar producto destacado"
            >
              {productosDestacados.map((producto, index) => (
                <button
                  key={producto.id_producto || index}
                  type="button"
                  className={`afro-carousel-dot${indiceCarrusel === index ? ' is-active' : ''}`}
                  onClick={() => irAIndice(index)}
                  aria-label={`Ir al producto destacado ${index + 1}`}
                  aria-current={indiceCarrusel === index ? 'true' : undefined}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="afro-benefits-grid" aria-label="Beneficios de Afrolash">
        {BENEFICIOS.map((item) => (
          <article key={item.titulo} className="afro-card afro-benefit-card">
            <h2 className="afro-benefit-title">{item.titulo}</h2>
            <p className="afro-benefit-desc">{item.desc}</p>
          </article>
        ))}
      </section>

      <section className="afro-card" aria-labelledby="ubicacion-titulo">
        <h2 id="ubicacion-titulo" className="afro-section-title">
          Nuestra Tienda Física
        </h2>
        <p className="afro-section-subtitle">
          Visítanos en nuestras instalaciones y recibe asesoría personalizada.
        </p>

        <div className="afro-map-frame">
          <iframe
            title="Ubicación Afrolash"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3214.7949215705708!2d-74.106149390597!3d4.806935540709677!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f876380fcbf5f%3A0x280bbe697ecc444b!2sAFRO%20LASH!5e1!3m2!1ses-419!2sve!4v1781659142561!5m2!1ses-419!2sve"
            className="afro-map-iframe"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </div>
  );
};

export default Inicio;
