import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Inicio = ({ navegarA }) => {
    const [productosDestacados, setProductosDestacados] = useState([]);
    const [indiceCarrusel, setIndiceCarrusel] = useState(0);
    
    // Referencia para pausar el carrusel tras una interacción manual
    const tiempoInteraccionRef = useRef(0);

    useEffect(() => {
        window.scrollTo(0, 0);
        cargarDestacados();
    }, []);

    const cargarDestacados = async () => {
        try {
            const respuesta = await axios.get('http://localhost:5000/api/productos');
            setProductosDestacados(respuesta.data.slice(0, 5));
        } catch (error) {
            console.error('Error al cargar productos destacados:', error);
        }
    };

    useEffect(() => {
        if (productosDestacados.length === 0) return;

        const intervalo = setInterval(() => {
            const ahora = Date.now();
            if (ahora - tiempoInteraccionRef.current > 8000) {
                setIndiceCarrusel((prev) => (prev + 1) % productosDestacados.length);
            }
        }, 4000); 

        return () => clearInterval(intervalo);
    }, [productosDestacados]);

    const moverCarrusel = (direccion) => {
        tiempoInteraccionRef.current = Date.now(); 
        if (direccion === 'siguiente') {
            setIndiceCarrusel((prev) => (prev + 1) % productosDestacados.length);
        } else {
            setIndiceCarrusel((prev) => (prev - 1 + productosDestacados.length) % productosDestacados.length);
        }
    };

    const irAIndice = (indice) => {
        tiempoInteraccionRef.current = Date.now();
        setIndiceCarrusel(indice);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '20px' }}>
            
            {/* SECCIÓN HERO ACTUALIZADA CON IMAGEN DE FONDO Y LOGO CIRCULAR */}
            <div style={{
                /* El gradiente actúa como la capa de opacidad sobre la imagen */
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.6), rgba(247, 205, 213, 0.85)), url("/fondo-hero.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '8px',
                padding: '60px 20px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                border: '1px solid rgba(217, 122, 140, 0.3)'
            }}>
                <img 
                    src="/logo.png" 
                    alt="Logo Afrolash" 
                    style={{ 
                        height: '200px', 
                        width: '200px', 
                        objectFit: 'cover', 
                        borderRadius: '50%', 
                        border: '4px solid rgba(255, 255, 255, 0.9)',
                        marginBottom: '20px', 
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)' 
                    }} 
                />
                
                <h1 style={{ color: '#1A1A1A', fontSize: '2.8rem', margin: '0 0 15px 0', textShadow: '0 2px 5px rgba(255,255,255,0.8)' }}>Bienvenido a Afrolash</h1>
                <p style={{ color: '#1A1A1A', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 30px auto', lineHeight: '1.6', fontWeight: '500', textShadow: '0 1px 3px rgba(255,255,255,0.8)' }}>
                    Realzamos tu belleza natural con la mejor selección de cosméticos y productos para el cuidado personal. Descubre la calidad que mereces.
                </p>
                <button
                    onClick={() => navegarA('tienda')}
                    style={{
                        padding: '15px 35px',
                        backgroundColor: '#D97A8C',
                        color: 'white',
                        border: 'none',
                        borderRadius: '30px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(217, 122, 140, 0.5)',
                        transition: 'transform 0.2s, backgroundColor 0.3s'
                    }}
                >
                    Explorar Catálogo
                </button>
            </div>

            {/* CARRUSEL DE PRODUCTOS DESTACADOS */}
            {productosDestacados.length > 0 && (
                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '40px 20px', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ color: '#1A1A1A', textAlign: 'center', margin: '0 0 30px 0' }}>Productos Destacados</h2>
                    
                    <div style={{ position: 'relative', maxWidth: '300px', margin: '0 auto', overflow: 'hidden', borderRadius: '8px' }}>
                        
                        <div style={{ 
                            display: 'flex', 
                            transform: `translateX(-${indiceCarrusel * 100}%)`, 
                            transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)' 
                        }}>
                            {productosDestacados.map((producto) => (
                                <div key={producto.id_producto} style={{ minWidth: '100%', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fdfdfd' }}>
                                    <img 
                                        src={producto.imagen_url} 
                                        alt={producto.nombre} 
                                        style={{ width: '100%', height: '250px', objectFit: 'cover', borderBottom: '1px solid #ddd' }} 
                                    />
                                    <div style={{ padding: '20px', textAlign: 'center' }}>
                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1A1A1A' }}>{producto.nombre}</h3>
                                        <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: '#28a745', fontSize: '18px' }}>${producto.precio}</p>
                                        <button 
                                            onClick={() => navegarA('tienda')}
                                            style={{ width: '100%', padding: '10px', backgroundColor: '#1A1A1A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Ver en Catálogo
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => moverCarrusel('anterior')} style={{ position: 'absolute', top: '40%', left: '10px', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '20px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', color: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ❮
                        </button>
                        <button onClick={() => moverCarrusel('siguiente')} style={{ position: 'absolute', top: '40%', right: '10px', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '20px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', color: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ❯
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                        {productosDestacados.map((_, index) => (
                            <div 
                                key={index} 
                                onClick={() => irAIndice(index)}
                                style={{ 
                                    width: '12px', height: '12px', borderRadius: '50%', cursor: 'pointer', transition: 'background-color 0.3s',
                                    backgroundColor: indiceCarrusel === index ? '#D97A8C' : '#ddd' 
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN DE BENEFICIOS */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                {[
                    { titulo: 'Calidad Premium', desc: 'Seleccionamos rigurosamente cada producto para cuidar tu piel.' },
                    { titulo: 'Envíos Nacionales', desc: 'Despachamos de forma segura a cualquier rincón del territorio nacional.' },
                    { titulo: 'Pagos Seguros', desc: 'Tu información financiera está encriptada y protegida.' }
                ].map((item, idx) => (
                    <div key={idx} style={{
                        flex: '1 1 280px', padding: '30px 20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                        <h3 style={{ color: '#CFA144', margin: '0 0 10px 0', fontSize: '1.2rem' }}>{item.titulo}</h3>
                        <p style={{ color: '#666', margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* SECCIÓN DE UBICACIÓN */}
            <div style={{
                backgroundColor: '#fff', borderRadius: '8px', padding: '30px', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
            }}>
                <h2 style={{ color: '#1A1A1A', textAlign: 'center', margin: '0 0 10px 0' }}>Nuestra Tienda Física</h2>
                <p style={{ color: '#666', textAlign: 'center', margin: '0 0 25px 0' }}>Visítanos en nuestras instalaciones y recibe asesoría personalizada.</p>
                
                <div style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                    <iframe 
                        title="Ubicación Afrolash"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3214.7949215705708!2d-74.106149390597!3d4.806935540709677!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f876380fcbf5f%3A0x280bbe697ecc444b!2sAFRO%20LASH!5e1!3m2!1ses-419!2sve!4v1781659142561!5m2!1ses-419!2sve" 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        allowFullScreen="" 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            </div>

        </div>
    );
};

export default Inicio;