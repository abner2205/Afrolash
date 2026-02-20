import React, { useState } from 'react';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';

function App() {
  // Define el estado para almacenar los productos agregados al pedido
  const [carrito, setCarrito] = useState([]);

  // Agrega un cosmético al arreglo del carrito y actualiza el estado
  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
  };

  // Renderiza la estructura principal de la aplicación web
  return (
    <div className="App">
      <header style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa' }}>
        <h1>Afrolash C.A.</h1>
        <p>Cosméticos y Cuidado Personal</p>
      </header>
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Catalogo agregarAlCarrito={agregarAlCarrito} />
        <Carrito carrito={carrito} />
      </main>
    </div>
  );
}

export default App;