import React, { useState, useEffect } from 'react';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';
import Registro from './components/Registro';
import Login from './components/Login';
import PanelAdmin from './components/PanelAdmin';

function App() {
  // Define estados para el carrito, la vista actual y los datos del usuario
  const [carrito, setCarrito] = useState([]);
  const [vistaActual, setVistaActual] = useState('tienda'); // Puede ser 'tienda', 'registro', o 'login'
  const [usuarioActual, setUsuarioActual] = useState(null);

  // Ejecuta la verificacion de sesion al cargar la aplicacion
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      setUsuarioActual(JSON.parse(usuarioGuardado));
    }
  }, []);

  // Agrega productos al arreglo
  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
  };

  // Ejecuta el cierre de sesion eliminando los datos locales
  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuarioActual(null);
    setVistaActual('tienda');
  };

  // Renderiza la estructura principal
  return (
    <div className="App">
      <header style={{ padding: '20px', backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
        <h1 
            style={{ margin: 0, cursor: 'pointer' }} 
            onClick={() => setVistaActual('tienda')}
        >
            Afrolash C.A.
        </h1>
        
        <div>
            {usuarioActual ? (
                // Opciones si el usuario está logueado
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span>Hola, {usuarioActual.nombre}</span>
                    
                    {/* Botón exclusivo para administradores */}
                    {usuarioActual.rol === 'admin' && (
                        <button onClick={() => setVistaActual('admin')} style={{ padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Panel Admin
                        </button>
                    )}

                    <button onClick={cerrarSesion} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Cerrar Sesión
                    </button>
                    <span style={{ fontWeight: 'bold' }}>Items en carrito: {carrito.length}</span>
                </div>
            ) : (
                // Opciones si el usuario es un invitado
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => setVistaActual('login')} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Iniciar Sesión
                    </button>
                    <button onClick={() => setVistaActual('registro')} style={{ padding: '8px 15px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Crear Cuenta
                    </button>
                    <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>Items en carrito: {carrito.length}</span>
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
                <Catalogo agregarAlCarrito={agregarAlCarrito} usuarioActual={usuarioActual} />
                <Carrito carrito={carrito} />
            </>
        )}
      </main>
    </div>
  );
}

export default App;