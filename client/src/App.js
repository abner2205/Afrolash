// Importa la librería principal y el componente del catálogo
import React from 'react';
import Catalogo from './components/Catalogo';

function App() {
  return (
    <div className="App">
      <header style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa' }}>
        <h1>Afrolash C.A.</h1>
        <p>Cosméticos y Cuidado Personal</p>
      </header>
      <main style={{ padding: '20px' }}>
        <Catalogo />
      </main>
    </div>
  );
}

export default App;