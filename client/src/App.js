import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';
import Registro from './components/Registro';
import Login from './components/Login';
import MisPedidos from './components/MisPedidos';
import Perfil from './components/Perfil';
import RecuperarPassword from './components/RecuperarPassword';
import RestablecerPassword from './components/RestablecerPassword';
import DocumentosLegales from './components/DocumentosLegales';
import Inicio from './components/Inicio';
import ProductoDetalle from './components/ProductoDetalle';
import AdminInventario from './components/admin/AdminInventario';
import AdminVentas from './components/admin/AdminVentas';
import AdminMetricas from './components/admin/AdminMetricas';
import AdminUsuarios from './components/admin/AdminUsuarios';

const leerStorageSeguro = (clave, valorPorDefecto) => {
  try {
    const raw = localStorage.getItem(clave);
    if (!raw) return valorPorDefecto;
    const parsed = JSON.parse(raw);
    if (Array.isArray(valorPorDefecto)) {
      return Array.isArray(parsed) ? parsed : valorPorDefecto;
    }
    return parsed && typeof parsed === 'object' ? parsed : valorPorDefecto;
  } catch (error) {
    return valorPorDefecto;
  }
};

function App() {
  const [carrito, setCarrito] = useState(() => leerStorageSeguro('carritoAfrolash', []));
  const [vistaActual, setVistaActual] = useState('inicio');
  const [usuarioActual, setUsuarioActual] = useState(() => leerStorageSeguro('usuario', null));
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [avisoStock, setAvisoStock] = useState(null);

  const [tokenRecuperacion, setTokenRecuperacion] = useState(null);
  const [idRecuperacion, setIdRecuperacion] = useState(null);
  const [idDetalleProducto, setIdDetalleProducto] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vista = params.get('vista');
    const token = params.get('token');
    const id = params.get('id');

    if (vista === 'restablecer' && token && id) {
      setTokenRecuperacion(token);
      setIdRecuperacion(id);
      setVistaActual('restablecer');
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('carritoAfrolash', JSON.stringify(carrito));
    } catch (error) {
      // Ignora fallos de almacenamiento local en navegadores restringidos
    }
  }, [carrito]);

  useEffect(() => {
    const interceptorAxios = axios.interceptors.response.use(
      (respuesta) => respuesta,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          setUsuarioActual(null);
          setMenuAbierto(false);
          setVistaActual('login');
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptorAxios);
    };
  }, []);

  useEffect(() => {
    if (!menuAbierto && !avisoStock) return undefined;

    const manejarEscape = (evento) => {
      if (evento.key === 'Escape') {
        if (avisoStock) {
          setAvisoStock(null);
        } else if (menuAbierto) {
          setMenuAbierto(false);
        }
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [menuAbierto, avisoStock]);

  const agregarAlCarrito = (producto, cantidadSolicitada = 1) => {
    const productoExistente = carrito.find((item) => item.id_producto === producto.id_producto);

    if (productoExistente) {
      const nuevaCantidadTotal = productoExistente.cantidad + cantidadSolicitada;
      if (nuevaCantidadTotal > producto.stock) {
        setAvisoStock(
          `No puedes agregar esa cantidad. El stock máximo disponible es de ${producto.stock} unidades.`
        );
        return false;
      }
      setCarrito(
        carrito.map((item) =>
          item.id_producto === producto.id_producto
            ? { ...item, cantidad: nuevaCantidadTotal }
            : item
        )
      );
      return true;
    }

    if (cantidadSolicitada <= producto.stock && cantidadSolicitada > 0) {
      setCarrito([...carrito, { ...producto, cantidad: cantidadSolicitada }]);
      return true;
    }

    if (cantidadSolicitada > producto.stock) {
      setAvisoStock(
        `No puedes agregar esa cantidad. El stock máximo disponible es de ${producto.stock} unidades.`
      );
    }
    return false;
  };

  const eliminarDelCarrito = (id_producto) => {
    setCarrito((prevCarrito) => prevCarrito.filter((item) => item.id_producto !== id_producto));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    localStorage.removeItem('carritoAfrolash');
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    vaciarCarrito();
    setUsuarioActual(null);
    setVistaActual('inicio');
    setMenuAbierto(false);
  };

  const navegarA = (vista, parametro = null) => {
    setVistaActual(vista);
    setMenuAbierto(false);

    if (vista === 'detalle') {
      setIdDetalleProducto(parametro);
    }

    if (vista !== 'tienda') setTerminoBusqueda('');
    window.scrollTo(0, 0);
    window.history.pushState({}, '', `/?vista=${vista}`);
  };

  const esPersonal = usuarioActual?.rol === 'admin' || usuarioActual?.rol === 'empleado';
  const esAdmin = usuarioActual?.rol === 'admin';

  return (
    <div className="afro-app">
      <header className="afro-header">
        <div className="afro-header-inner">
          <button
            type="button"
            className="afro-logo-btn"
            onClick={() => navegarA('inicio')}
            aria-label="Ir al inicio de Afrolash"
          >
            <img src="/logo.png" alt="" className="afro-logo-img" />
            <span className="afro-logo-text" aria-hidden="true">
              Afrolash
            </span>
          </button>

          {vistaActual === 'tienda' ? (
            <div className="afro-search-wrap">
              <input
                type="search"
                className="afro-search-input"
                placeholder="Buscar cosméticos, marcas, tonos..."
                aria-label="Buscar cosméticos, marcas o tonos"
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
              />
            </div>
          ) : null}

          <nav className="afro-nav-actions" aria-label="Acciones principales">
            <button
              type="button"
              className="afro-btn afro-btn-blush"
              onClick={() => navegarA('carrito')}
            >
              Carrito ({carrito.length})
            </button>

            {usuarioActual ? (
              <button
                type="button"
                className="afro-btn afro-btn-dark"
                onClick={() => setMenuAbierto(true)}
                aria-expanded={menuAbierto}
              >
                Mi Cuenta
              </button>
            ) : (
              <button
                type="button"
                className="afro-btn afro-btn-dark"
                onClick={() => navegarA('login')}
              >
                Ingresar
              </button>
            )}
          </nav>
        </div>
      </header>

      {menuAbierto ? (
        <>
          <div
            className="afro-drawer-backdrop"
            onClick={() => setMenuAbierto(false)}
            aria-hidden="true"
          />
          <aside
            className="afro-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de usuario y operaciones"
          >
            <div className="afro-drawer-header">
              <div>
                <span className="afro-drawer-eyebrow">Sesión iniciada</span>
                <h2 className="afro-drawer-user">{usuarioActual?.nombre_completo}</h2>
              </div>
              <button
                type="button"
                className="afro-drawer-close"
                onClick={() => setMenuAbierto(false)}
                aria-label="Cerrar menú"
              >
                ✕
              </button>
            </div>

            <div className="afro-drawer-body">
              <button
                type="button"
                className="afro-drawer-nav-btn"
                aria-current={vistaActual === 'tienda' ? 'page' : undefined}
                onClick={() => navegarA('tienda')}
              >
                Ver Catálogo
              </button>
              <button
                type="button"
                className="afro-drawer-nav-btn"
                aria-current={vistaActual === 'perfil' ? 'page' : undefined}
                onClick={() => navegarA('perfil')}
              >
                Mi Perfil de Cliente
              </button>
              <button
                type="button"
                className="afro-drawer-nav-btn"
                aria-current={vistaActual === 'mis-pedidos' ? 'page' : undefined}
                onClick={() => navegarA('mis-pedidos')}
              >
                Historial de Pedidos
              </button>

              {esPersonal ? (
                <div className="afro-drawer-section">
                  <span className="afro-drawer-section-title">Operaciones</span>

                  <button
                    type="button"
                    className="afro-drawer-nav-btn afro-drawer-nav-btn--ops"
                    aria-current={vistaActual === 'admin-inventario' ? 'page' : undefined}
                    onClick={() => navegarA('admin-inventario')}
                  >
                    Consulta de Inventario
                  </button>

                  <button
                    type="button"
                    className="afro-drawer-nav-btn afro-drawer-nav-btn--ops"
                    aria-current={vistaActual === 'admin-ventas' ? 'page' : undefined}
                    onClick={() => navegarA('admin-ventas')}
                  >
                    Gestión de Pedidos
                  </button>

                  {esAdmin ? (
                    <>
                      <button
                        type="button"
                        className="afro-drawer-nav-btn afro-drawer-nav-btn--ops"
                        aria-current={vistaActual === 'admin-metricas' ? 'page' : undefined}
                        onClick={() => navegarA('admin-metricas')}
                      >
                        Métricas Financieras
                      </button>

                      <button
                        type="button"
                        className="afro-drawer-nav-btn afro-drawer-nav-btn--ops"
                        aria-current={vistaActual === 'admin-usuarios' ? 'page' : undefined}
                        onClick={() => navegarA('admin-usuarios')}
                      >
                        Gestión de Usuarios
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="afro-drawer-footer">
              <button type="button" className="afro-btn-logout" onClick={cerrarSesion}>
                Cerrar Sesión
              </button>
            </div>
          </aside>
        </>
      ) : null}

      <main className="afro-main">
        {vistaActual === 'inicio' ? <Inicio navegarA={navegarA} /> : null}
        {vistaActual === 'tienda' ? (
          <Catalogo
            agregarAlCarrito={agregarAlCarrito}
            navegarA={navegarA}
            terminoBusqueda={terminoBusqueda}
          />
        ) : null}
        {vistaActual === 'detalle' ? (
          <ProductoDetalle
            idProducto={idDetalleProducto}
            agregarAlCarrito={agregarAlCarrito}
            navegarA={navegarA}
          />
        ) : null}
        {vistaActual === 'registro' ? <Registro navegarA={navegarA} /> : null}
        {vistaActual === 'login' ? <Login navegarA={navegarA} /> : null}
        {vistaActual === 'recuperar' ? <RecuperarPassword navegarA={navegarA} /> : null}
        {vistaActual === 'restablecer' ? (
          <RestablecerPassword
            navegarA={navegarA}
            id={idRecuperacion}
            token={tokenRecuperacion}
          />
        ) : null}
        {vistaActual === 'carrito' ? (
          <Carrito
            carrito={carrito}
            eliminarDelCarrito={eliminarDelCarrito}
            volver={() => navegarA('tienda')}
            navegarA={navegarA}
            vaciarCarrito={vaciarCarrito}
          />
        ) : null}
        {vistaActual === 'perfil' ? <Perfil /> : null}
        {vistaActual === 'mis-pedidos' ? <MisPedidos /> : null}
        {vistaActual === 'terminos' ? <DocumentosLegales tipoDocumento="terminos" /> : null}
        {vistaActual === 'privacidad' ? <DocumentosLegales tipoDocumento="privacidad" /> : null}

        {vistaActual === 'admin-inventario'
          ? esPersonal
            ? <AdminInventario usuarioActual={usuarioActual} />
            : (
              <div className="afro-card afro-empty-state">
                <h2>Acceso Restringido</h2>
                <p>No cuentas con los permisos necesarios para consultar esta sección.</p>
              </div>
            )
          : null}
        {vistaActual === 'admin-ventas'
          ? esPersonal
            ? <AdminVentas />
            : (
              <div className="afro-card afro-empty-state">
                <h2>Acceso Restringido</h2>
                <p>No cuentas con los permisos necesarios para consultar esta sección.</p>
              </div>
            )
          : null}
        {vistaActual === 'admin-metricas'
          ? esAdmin
            ? <AdminMetricas />
            : (
              <div className="afro-card afro-empty-state">
                <h2>Acceso Restringido</h2>
                <p>Esta sección es exclusiva para administradores.</p>
              </div>
            )
          : null}
        {vistaActual === 'admin-usuarios'
          ? esAdmin
            ? <AdminUsuarios />
            : (
              <div className="afro-card afro-empty-state">
                <h2>Acceso Restringido</h2>
                <p>Esta sección es exclusiva para administradores.</p>
              </div>
            )
          : null}
      </main>

      {avisoStock ? (
        <div
          className="afro-modal-backdrop"
          onClick={() => setAvisoStock(null)}
        >
          <div
            className="afro-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="afro-stock-alert-title"
            aria-describedby="afro-stock-alert-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="afro-stock-alert-title" className="afro-modal-title">
              Stock disponible superado
            </h2>
            <p id="afro-stock-alert-desc" className="afro-modal-body">
              {avisoStock}
            </p>
            <div className="afro-modal-actions">
              <button
                type="button"
                className="afro-btn afro-btn-primary"
                onClick={() => setAvisoStock(null)}
                autoFocus
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="afro-footer">
        <div className="afro-footer-inner">
          <div>
            <h2 className="afro-footer-brand">Afrolash C.A.</h2>
            <p className="afro-footer-tagline">Realzando tu belleza natural.</p>
            <div className="afro-footer-socials">
              <a
                href="https://www.instagram.com/afrolash_cota/"
                target="_blank"
                rel="noopener noreferrer"
                className="afro-social-link"
                aria-label="Seguir a Afrolash en Instagram"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/p/Afrolash-Cota-Página-100059175514952/"
                target="_blank"
                rel="noopener noreferrer"
                className="afro-social-link"
                aria-label="Seguir a Afrolash en Facebook"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="afro-footer-links">
            <button
              type="button"
              className="afro-link-btn"
              onClick={() => navegarA('terminos')}
            >
              Términos y Condiciones
            </button>
            <span className="afro-footer-sep" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              className="afro-link-btn"
              onClick={() => navegarA('privacidad')}
            >
              Políticas de Privacidad
            </button>
          </div>
        </div>

        <div className="afro-footer-copy">
          &copy; 2026 Afrolash C.A. Todos los derechos reservados.
        </div>
      </footer>

      <a
        href="https://wa.me/573223783458"
        target="_blank"
        rel="noopener noreferrer"
        className="afro-whatsapp-fab"
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
          <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.115.548 4.17 1.59 5.989L.452 23.55l5.662-1.488a11.96 11.96 0 005.917 1.564h.005c6.645 0 12.03-5.385 12.03-12.031C24.066 5.385 18.681 0 12.031 0zm0 21.626h-.004a9.98 9.98 0 01-5.078-1.385l-.364-.216-3.77.99.999-3.676-.237-.377A9.957 9.957 0 012.03 12.03c0-5.523 4.494-10.016 10.001-10.016 5.524 0 10.016 4.493 10.016 10.016 0 5.524-4.493 10.017-10.016 10.017zm5.495-7.513c-.301-.151-1.782-.88-2.059-.981-.277-.101-.479-.151-.68.151-.202.302-.779.981-.955 1.182-.176.201-.353.226-.654.075-1.314-.658-2.42-1.428-3.385-2.613-.249-.307-.026-.474.124-.624.135-.135.302-.352.453-.528.151-.176.201-.302.302-.503.101-.202.05-.378-.025-.528-.076-.151-.68-1.642-.932-2.247-.245-.589-.494-.509-.68-.518-.176-.008-.378-.008-.579-.008-.201 0-.528.075-.805.377-.276.302-1.056 1.031-1.056 2.516 0 1.485 1.082 2.92 1.233 3.121.151.201 2.127 3.245 5.152 4.547 2.164.931 2.934 1.006 3.96 1.006 1.026 0 3.32-.132 3.793-.56.473-.428.65-1.024.65-1.182 0-.158-.177-.258-.478-.41z" />
        </svg>
      </a>
    </div>
  );
}

export default App;
