import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';
import Registro from './components/Registro';
import Login from './components/Login';
import PanelAdmin from './components/PanelAdmin';
import MisPedidos from './components/MisPedidos';
import Perfil from './components/Perfil';
import RecuperarPassword from './components/RecuperarPassword';
import RestablecerPassword from './components/RestablecerPassword';
import DocumentosLegales from './components/DocumentosLegales';
import Inicio from './components/Inicio';
import ProductoDetalle from './components/ProductoDetalle'; // Importación de la nueva vista

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

  const menuRef = useRef(null);

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
                      <button onClick={() => navegarA('admin')} style={{ width: '100%', textAlign: 'left', padding: '15px', backgroundColor: '#fcf2f4', border: '1px solid #F7CDD5', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', color: '#D97A8C', fontWeight: 'bold' }}>Panel Administrativo</button>
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
        
        {/* NUEVA RUTA: Renderiza el Detalle del Producto enviándole el ID seleccionado */}
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

        {vistaActual === 'admin' && (
            usuarioActual && usuarioActual.rol === 'admin' ? (
                <PanelAdmin />
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', border: '1px solid #f5c6cb', marginTop: '40px' }}>
                    <h2 style={{ marginBottom: '10px' }}>Acceso Restringido</h2>
                    <p style={{ fontSize: '16px' }}>Tu sesión actual no cuenta con los privilegios necesarios.</p>
                </div>
            )
        )}
      </main>

      <footer style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF', padding: '30px 20px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
                <h3 style={{ margin: '0 0 10px 0', color: '#F7CDD5' }}>Afrolash C.A.</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>Realzando tu belleza natural.</p>
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
    </div>
  );
}

export default App;