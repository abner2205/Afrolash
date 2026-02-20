import React, { useState, useEffect, useRef } from 'react';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';
import Registro from './components/Registro';
import Login from './components/Login';
import PanelAdmin from './components/PanelAdmin';

function App() {
  const [carrito, setCarrito] = useState([]);
  const [vistaActual, setVistaActual] = useState('tienda'); 
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Crea una referencia para el contenedor del menú desplegable
  const menuRef = useRef(null);

  // Hook para cargar la sesión al inicio
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      setUsuarioActual(JSON.parse(usuarioGuardado));
    }
  }, []);

  // Hook para detectar clics fuera del menú
  useEffect(() => {
    const manejarClicFuera = (evento) => {
        // Si el menú está abierto y el clic NO ocurrió dentro del contenedor referenciado
        if (menuRef.current && !menuRef.current.contains(evento.target)) {
            setMenuAbierto(false);
        }
    };

    // Suscribe el evento al documento completo
    document.addEventListener('mousedown', manejarClicFuera);

    // Limpia el evento al desmontar para evitar fugas de memoria
    return () => {
        document.removeEventListener('mousedown', manejarClicFuera);
    };
  }, []);

  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuarioActual(null);
    setVistaActual('tienda');
    setMenuAbierto(false); 
  };

  const navegarA = (vista) => {
    setVistaActual(vista);
    setMenuAbierto(false);
  };

  return (
    <div className="App">
      <header style={{ padding: '20px', backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
        <h1 
            style={{ margin: 0, cursor: 'pointer', color: '#333' }} 
            onClick={() => navegarA('tienda')}
        >
            Afrolash C.A.
        </h1>
        
        <div>
            {usuarioActual ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ fontWeight: 'bold', backgroundColor: '#e9ecef', padding: '5px 10px', borderRadius: '15px' }}>
                        Carrito: {carrito.length}
                    </span>
                    
                    {/* Se asigna la referencia (ref) a este contenedor padre */}
                    <div style={{ position: 'relative' }} ref={menuRef}>
                        <button 
                            onClick={() => setMenuAbierto(!menuAbierto)} 
                            style={{ padding: '8px 15px', backgroundColor: '#343a40', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {usuarioActual.nombre} {menuAbierto ? '▲' : '▼'}
                        </button>

                        {menuAbierto && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, minWidth: '160px', overflow: 'hidden' }}>
                                
                                <button onClick={() => navegarA('tienda')} style={{ width: '100%', padding: '12px', textAlign: 'left', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                                    Ver Catálogo
                                </button>

                                {usuarioActual.rol === 'admin' && (
                                    <button onClick={() => navegarA('admin')} style={{ width: '100%', padding: '12px', textAlign: 'left', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                                        Panel Admin
                                    </button>
                                )}

                                <button onClick={cerrarSesion} style={{ width: '100%', padding: '12px', textAlign: 'left', backgroundColor: '#fff', color: '#dc3545', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', backgroundColor: '#e9ecef', padding: '5px 10px', borderRadius: '15px', marginRight: '10px' }}>
                        Carrito: {carrito.length}
                    </span>
                    <button onClick={() => navegarA('login')} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Iniciar Sesión
                    </button>
                    <button onClick={() => navegarA('registro')} style={{ padding: '8px 15px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Crear Cuenta
                    </button>
                </div>
            )}
        </div>
      </header>
      
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {vistaActual === 'registro' && <Registro />}
        {vistaActual === 'login' && <Login />}
        {vistaActual === 'admin' && <PanelAdmin />}
        {vistaActual === 'tienda' && (
            <>
                <Catalogo agregarAlCarrito={agregarAlCarrito} />
                <Carrito carrito={carrito} />
            </>
        )}
      </main>
    </div>
  );
}

export default App;