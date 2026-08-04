import React, { useState, useEffect} from 'react';
import axios from 'axios';
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

function App() {
  const [carrito, setCarrito] = useState(() => {
    const carritoGuardado = localStorage.getItem('carritoAfrolash');
    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  });
  
  const [vistaActual, setVistaActual] = useState('inicio'); 
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  const [tokenRecuperacion, setTokenRecuperacion] = useState(null);
  const [idRecuperacion, setIdRecuperacion] = useState(null);
  
  // NUEVO: Estado para almacenar qué producto detallado se está viendo
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
        window.history.replaceState({}, document.title, "/");
    }
  }, []);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      setUsuarioActual(JSON.parse(usuarioGuardado));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('carritoAfrolash', JSON.stringify(carrito));
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

  const agregarAlCarrito = (producto, cantidadSolicitada = 1) => {
    const productoExistente = carrito.find(item => item.id_producto === producto.id_producto);
    
    if (productoExistente) {
        const nuevaCantidadTotal = productoExistente.cantidad + cantidadSolicitada;
        if (nuevaCantidadTotal > producto.stock) {
            alert(`No puedes agregar esa cantidad. El stock máximo es de ${producto.stock} unidades.`);
            return false; 
        }
        setCarrito(carrito.map(item => item.id_producto === producto.id_producto ? { ...item, cantidad: nuevaCantidadTotal } : item));
        return true;
    } else {
        if (cantidadSolicitada <= producto.stock && cantidadSolicitada > 0) {
            setCarrito([...carrito, { ...producto, cantidad: cantidadSolicitada }]);
            return true;
        }
        return false;
    }
  };

  const eliminarDelCarrito = (id_producto) => {
    const nuevoCarrito = carrito.filter(item => item.id_producto !== id_producto);
    setCarrito(nuevoCarrito);
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

  // ACTUALIZACIÓN: La función ahora acepta un parámetro opcional (el ID del producto)
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

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      
      <header style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '60px', 
          backgroundColor: 'rgba(217, 122, 140, 0.60)', 
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', 
          boxSizing: 'border-box', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
      }}>
        <div onClick={() => navegarA('inicio')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', minWidth: '150px' }}>
            <img 
                src="/logo.png" 
                alt="Logo Afrolash" 
                style={{ 
                    height: '56px', width: '56px', 
                    objectFit: 'cover', 
                    borderRadius: '50%', 
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }} 
            />
        </div>
        
        <div style={{ flex: 1, maxWidth: '500px', margin: '0 20px', transition: 'opacity 0.3s' }}>
            {vistaActual === 'tienda' && (
                <input 
                    type="text" 
                    placeholder="Buscar cosméticos, marcas, tonos..." 
                    value={terminoBusqueda}
                    onChange={(e) => setTerminoBusqueda(e.target.value)}
                    style={{ 
                        width: '100%', padding: '12px 20px', borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.5)', 
                        boxSizing: 'border-box', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.9)', fontSize: '15px',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                    }} 
                />
            )}
        </div>

        <div style={{ minWidth: '150px', display: 'flex', justifyContent: 'flex-end' }}>
            {usuarioActual ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navegarA('carrito')} style={{ fontWeight: 'bold', backgroundColor: '#F7CDD5', color: '#1A1A1A', padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        Carrito ({carrito.length})
                    </button>
                    
                    <button onClick={() => setMenuAbierto(true)} style={{ padding: '10px 20px', backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        Mi Cuenta
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => navegarA('carrito')} style={{ fontWeight: 'bold', backgroundColor: '#F7CDD5', color: '#1A1A1A', padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        Carrito ({carrito.length})
                    </button>
                    <button onClick={() => navegarA('login')} style={{ padding: '10px 20px', backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        Ingresar
                    </button>
                </div>
            )}
        </div>
      </header>
      
      <div 
        onClick={() => setMenuAbierto(false)} 
        style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1001, 
            opacity: menuAbierto ? 1 : 0, visibility: menuAbierto ? 'visible' : 'hidden', 
            transition: 'opacity 0.3s ease, visibility 0.3s ease' 
        }} 
      />
      
      <div style={{
          position: 'fixed', top: 0, right: 0, width: '320px', height: '100vh', backgroundColor: '#fff',
          boxShadow: '-5px 0 25px rgba(0,0,0,0.15)', zIndex: 1002,
          transform: menuAbierto ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          display: 'flex', flexDirection: 'column'
      }}>
          <div style={{ padding: '25px 20px', backgroundColor: '#1A1A1A', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                  <span style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Sesión Iniciada</span>
                  <h3 style={{ margin: '5px 0 0 0', fontSize: '20px', color: '#F7CDD5' }}>{usuarioActual?.nombre_completo}</h3>
              </div>
              <button onClick={() => setMenuAbierto(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
          </div>
          
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
              <button onClick={() => navegarA('tienda')} style={{ textAlign: 'left', padding: '15px', backgroundColor: '#f9f9f9', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', color: '#333', fontWeight: 'bold' }}>Ver Catálogo</button>
              <button onClick={() => navegarA('perfil')} style={{ textAlign: 'left', padding: '15px', backgroundColor: '#f9f9f9', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', color: '#333', fontWeight: 'bold' }}>Mi Perfil de Cliente</button>
              <button onClick={() => navegarA('mis-pedidos')} style={{ textAlign: 'left', padding: '15px', backgroundColor: '#f9f9f9', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', color: '#333', fontWeight: 'bold' }}>Historial de Pedidos</button>
              
              {usuarioActual?.rol === 'admin' && (
                  <div style={{ marginTop: '20px' }}>
                      <span style={{ display: 'block', padding: '0 5px 10px 5px', fontSize: '12px', color: '#888', fontWeight: 'bold', borderBottom: '1px solid #eee', marginBottom: '10px' }}>ADMINISTRACIÓN</span>
                      
                      <button onClick={() => navegarA('admin-inventario')} style={{ width: '100%', textAlign: 'left', padding: '15px', backgroundColor: vistaActual === 'admin-inventario' ? '#F7CDD5' : '#fcf2f4', border: '1px solid #F7CDD5', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', color: '#D97A8C', fontWeight: 'bold', marginBottom: '5px' }}>
                          Gestión de Inventario
                      </button>
                      <button onClick={() => navegarA('admin-ventas')} style={{ width: '100%', textAlign: 'left', padding: '15px', backgroundColor: vistaActual === 'admin-ventas' ? '#F7CDD5' : '#fcf2f4', border: '1px solid #F7CDD5', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', color: '#D97A8C', fontWeight: 'bold', marginBottom: '5px' }}>
                          Registro de Ventas
                      </button>
                      <button onClick={() => navegarA('admin-metricas')} style={{ width: '100%', textAlign: 'left', padding: '15px', backgroundColor: vistaActual === 'admin-metricas' ? '#F7CDD5' : '#fcf2f4', border: '1px solid #F7CDD5', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', color: '#D97A8C', fontWeight: 'bold' }}>
                          Métricas y Rendimiento
                      </button>
                  </div>
              )}
          </div>
          
          <div style={{ padding: '20px', borderTop: '1px solid #eee' }}>
              <button onClick={cerrarSesion} style={{ width: '100%', padding: '15px', backgroundColor: 'transparent', color: '#dc3545', border: '2px solid #dc3545', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                  Cerrar Sesión
              </button>
          </div>
      </div>

      <main style={{ padding: '20px', paddingTop: '100px', maxWidth: '1200px', margin: '0 auto', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        {vistaActual === 'inicio' && <Inicio navegarA={navegarA} />}
        {vistaActual === 'tienda' && <Catalogo agregarAlCarrito={agregarAlCarrito} navegarA={navegarA} terminoBusqueda={terminoBusqueda} />}
        
        {vistaActual === 'detalle' && <ProductoDetalle idProducto={idDetalleProducto} agregarAlCarrito={agregarAlCarrito} navegarA={navegarA} />}
        {vistaActual === 'registro' && <Registro navegarA={navegarA} />}
        {vistaActual === 'login' && <Login navegarA={navegarA} />}
        {vistaActual === 'recuperar' && <RecuperarPassword navegarA={navegarA} />}
        {vistaActual === 'restablecer' && <RestablecerPassword navegarA={navegarA} id={idRecuperacion} token={tokenRecuperacion} />}
        {vistaActual === 'carrito' && <Carrito carrito={carrito} eliminarDelCarrito={eliminarDelCarrito} volver={() => navegarA('tienda')} navegarA={navegarA} vaciarCarrito={vaciarCarrito} />}
        {vistaActual === 'perfil' && <Perfil />}
        {vistaActual === 'mis-pedidos' && <MisPedidos />}
        {vistaActual === 'terminos' && <DocumentosLegales tipoDocumento="terminos" />}
        {vistaActual === 'privacidad' && <DocumentosLegales tipoDocumento="privacidad" />}

        {vistaActual === 'admin-inventario' && (usuarioActual?.rol === 'admin' ? <AdminInventario /> : <div style={{textAlign: 'center', padding: '50px'}}>Acceso Restringido</div>)}
        {vistaActual === 'admin-ventas' && (usuarioActual?.rol === 'admin' ? <AdminVentas /> : <div style={{textAlign: 'center', padding: '50px'}}>Acceso Restringido</div>)}
        {vistaActual === 'admin-metricas' && (usuarioActual?.rol === 'admin' ? <AdminMetricas /> : <div style={{textAlign: 'center', padding: '50px'}}>Acceso Restringido</div>)}
      </main>

      <footer style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF', padding: '30px 20px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
                <h3 style={{ margin: '0 0 10px 0', color: '#F7CDD5' }}>Afrolash C.A.</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>Realzando tu belleza natural.</p>
                <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                    <a href="https://www.instagram.com/afrolash_cota/" target="_blank" rel="noopener noreferrer" style={{ color: '#F7CDD5', textDecoration: 'none' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                    </a>
                    <a href="https://www.facebook.com/p/Afrolash-Cota-Página-100059175514952/" target="_blank" rel="noopener noreferrer" style={{ color: '#F7CDD5', textDecoration: 'none' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                        </svg>
                    </a>
                </div>
            </div>
            <div style={{ fontSize: '14px', color: '#aaa', display: 'flex', gap: '15px' }}>
                <span onClick={() => navegarA('terminos')} style={{ cursor: 'pointer' }}>Términos y Condiciones</span>
                <span>|</span>
                <span onClick={() => navegarA('privacidad')} style={{ cursor: 'pointer' }}>Políticas de Privacidad</span>
            </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #333', fontSize: '13px', color: '#888' }}>
            &copy; 2026 Afrolash C.A. Todos los derechos reservados.
        </div>
      </footer>

      <a 
          href="https://wa.me/573223783458" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
              position: 'fixed', 
              bottom: '25px', 
              right: '25px', 
              backgroundColor: '#25D366', 
              color: 'white', 
              width: '55px', 
              height: '55px', 
              borderRadius: '50%', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)', 
              zIndex: 90,
              cursor: 'pointer'
          }}
      >
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.115.548 4.17 1.59 5.989L.452 23.55l5.662-1.488a11.96 11.96 0 005.917 1.564h.005c6.645 0 12.03-5.385 12.03-12.031C24.066 5.385 18.681 0 12.031 0zm0 21.626h-.004a9.98 9.98 0 01-5.078-1.385l-.364-.216-3.77.99.999-3.676-.237-.377A9.957 9.957 0 012.03 12.03c0-5.523 4.494-10.016 10.001-10.016 5.524 0 10.016 4.493 10.016 10.016 0 5.524-4.493 10.017-10.016 10.017zm5.495-7.513c-.301-.151-1.782-.88-2.059-.981-.277-.101-.479-.151-.68.151-.202.302-.779.981-.955 1.182-.176.201-.353.226-.654.075-1.314-.658-2.42-1.428-3.385-2.613-.249-.307-.026-.474.124-.624.135-.135.302-.352.453-.528.151-.176.201-.302.302-.503.101-.202.05-.378-.025-.528-.076-.151-.68-1.642-.932-2.247-.245-.589-.494-.509-.68-.518-.176-.008-.378-.008-.579-.008-.201 0-.528.075-.805.377-.276.302-1.056 1.031-1.056 2.516 0 1.485 1.082 2.92 1.233 3.121.151.201 2.127 3.245 5.152 4.547 2.164.931 2.934 1.006 3.96 1.006 1.026 0 3.32-.132 3.793-.56.473-.428.65-1.024.65-1.182 0-.158-.177-.258-.478-.41z"/>
          </svg>
      </a>

    </div>
  );
}

export default App;