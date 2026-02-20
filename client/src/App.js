import React, { useState } from 'react';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';
import Registro from './components/Registro'; // Importa el componente de registro

function App() {
  const [carrito, setCarrito] = useState([]);
  
  // Define un estado para alternar entre la tienda y el formulario de registro
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
  };

  return (
    <div className="App">
      <header style={{ padding: '20px', backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
        <h1 style={{ margin: 0 }}>Afrolash C.A.</h1>
        <div>
            {/* Botón para cambiar de vista */}
            <button 
                onClick={() => setMostrarRegistro(!mostrarRegistro)} 
                style={{ marginRight: '15px', padding: '8px 15px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                {mostrarRegistro ? 'Volver a la Tienda' : 'Crear Cuenta'}
            </button>
            <span style={{ fontWeight: 'bold' }}>Items en carrito: {carrito.length}</span>
        </div>
      </header>
      
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Renderizado condicional basado en el estado */}
        {mostrarRegistro ? (
            <Registro />
        ) : (
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