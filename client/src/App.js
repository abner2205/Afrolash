import React, { useState, useEffect, useRef } from 'react';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';
import Registro from './components/Registro';
import Login from './components/Login';
import PanelAdmin from './components/PanelAdmin';
import MisPedidos from './components/MisPedidos';

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

// Lógica para agrupar productos y validar el límite de stock
  const agregarAlCarrito = (producto) => {
    // Busca si el producto ya fue agregado previamente
    const productoExistente = carrito.find(item => item.id_producto === producto.id_producto);
    
    if (productoExistente) {
        // Validación crítica: Comprueba si la cantidad actual en el carrito ya alcanzó el stock disponible
        if (productoExistente.cantidad >= producto.stock) {
            alert(`No puedes agregar más unidades. El stock máximo disponible para "${producto.nombre}" es de ${producto.stock}.`);
            return; // Detiene la ejecución de la función inmediatamente
        }

        // Si hay stock disponible, incrementa la cantidad
        setCarrito(carrito.map(item => 
            item.id_producto === producto.id_producto 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        ));
    } else {
        // Validación de seguridad adicional al agregar por primera vez
        if (producto.stock > 0) {
            setCarrito([...carrito, { ...producto, cantidad: 1 }]);
        } else {
            alert('Este producto se encuentra agotado.');
        }
    }
  };

  // Ahora elimina buscando por el ID del producto
  const eliminarDelCarrito = (id_producto) => {
    const nuevoCarrito = carrito.filter(item => item.id_producto !== id_producto);
    setCarrito(nuevoCarrito);
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

                                <button onClick={() => navegarA('mis-pedidos')} style={{ width: '100%', padding: '12px', textAlign: 'left', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                                    Mis Pedidos
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
        
        {vistaActual === 'tienda' && (
            <>
                <Catalogo agregarAlCarrito={agregarAlCarrito} />
                <Carrito carrito={carrito} eliminarDelCarrito={eliminarDelCarrito} />
            </>
        )}
        
        {vistaActual === 'mis-pedidos' && <MisPedidos />}

        {/* Componente Protegido: Validación estricta de rol para el Panel de Administración */}
        {vistaActual === 'admin' && (
            usuarioActual && usuarioActual.rol === 'admin' ? (
                <PanelAdmin />
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', border: '1px solid #f5c6cb', marginTop: '40px' }}>
                    <h2 style={{ marginBottom: '10px' }}>Acceso Restringido</h2>
                    <p style={{ fontSize: '16px' }}>Tu sesión actual no cuenta con los privilegios de seguridad necesarios para acceder a este módulo.</p>
                    <button 
                        onClick={() => navegarA('tienda')} 
                        style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#343a40', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Regresar al Catálogo
                    </button>
                </div>
            )
        )}
      </main>
    </div>
  );
}

export default App;