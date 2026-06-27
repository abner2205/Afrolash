import React, { useEffect } from 'react';

const DocumentosLegales = ({ tipoDocumento }) => {
    
    // Al cargar el componente, la ventana sube al inicio automáticamente
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [tipoDocumento]);

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '40px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', lineHeight: '1.6', color: '#333' }}>
            
            {tipoDocumento === 'terminos' && (
                <>
                    <h1 style={{ color: '#1A1A1A', borderBottom: '2px solid #F7CDD5', paddingBottom: '10px', marginBottom: '20px' }}>Términos y Condiciones de Uso</h1>
                    <p style={{ fontSize: '14px', color: '#666' }}>Última actualización: Junio de 2026</p>
                    
                    <h3 style={{ color: '#1A1A1A', marginTop: '25px' }}>1. Aceptación y Ámbito de Aplicación</h3>
                    <p>Bienvenido a Afrolash C.A. Al acceder y utilizar este sitio web, usted acepta estar sujeto a los presentes Términos y Condiciones. Esta plataforma opera bajo la legislación de la República de Colombia, específicamente en concordancia con la Ley 1480 de 2011 (Estatuto del Consumidor).</p>

                    <h3 style={{ color: '#1A1A1A', marginTop: '25px' }}>2. Proceso de Compra y Pagos</h3>
                    <p>Los precios publicados en nuestro catálogo están expresados en la moneda indicada al momento del pago. Las transacciones se procesan a través de pasarelas de pago seguras (Stripe). Afrolash C.A. no almacena directamente los datos financieros de sus tarjetas de crédito o débito.</p>

                    <h3 style={{ color: '#1A1A1A', marginTop: '25px' }}>3. Envíos y Entregas</h3>
                    <p>Nos comprometemos a despachar los productos en los plazos estipulados al momento de la compra. Los tiempos de entrega pueden variar dependiendo de la ubicación del cliente dentro del territorio nacional. El cliente es responsable de proporcionar una dirección de entrega válida y un número de contacto.</p>

                    <h3 style={{ color: '#1A1A1A', marginTop: '25px' }}>4. Derecho de Retracto</h3>
                    <p>De acuerdo con el artículo 47 de la Ley 1480 de 2011, los consumidores tienen derecho a retractarse de la compra dentro de los cinco (5) días hábiles siguientes a la entrega del producto, siempre y cuando los cosméticos no hayan sido abiertos, usados o alterados, por razones de salud e higiene.</p>
                </>
            )}

            {tipoDocumento === 'privacidad' && (
                <>
                    <h1 style={{ color: '#1A1A1A', borderBottom: '2px solid #F7CDD5', paddingBottom: '10px', marginBottom: '20px' }}>Políticas de Privacidad y Tratamiento de Datos</h1>
                    <p style={{ fontSize: '14px', color: '#666' }}>Última actualización: Junio de 2026</p>

                    <h3 style={{ color: '#1A1A1A', marginTop: '25px' }}>1. Marco Legal</h3>
                    <p>Afrolash C.A. garantiza la protección de los datos personales de sus usuarios en estricto cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia (Ley de Hábeas Data).</p>

                    <h3 style={{ color: '#1A1A1A', marginTop: '25px' }}>2. Recolección y Finalidad</h3>
                    <p>Los datos personales recolectados en el proceso de registro y compra (tales como nombre, correo electrónico, dirección y teléfono) serán utilizados exclusivamente para:</p>
                    <ul>
                        <li>Procesamiento, facturación y envío de los pedidos.</li>
                        <li>Gestión de atención al cliente y soporte técnico.</li>
                        <li>Envío de notificaciones sobre el estado de la compra.</li>
                    </ul>

                    <h3 style={{ color: '#1A1A1A', marginTop: '25px' }}>3. Seguridad de la Información</h3>
                    <p>Implementamos medidas técnicas, humanas y administrativas necesarias para otorgar seguridad a los registros, evitando su adulteración, pérdida, consulta, o acceso no autorizado. Las contraseñas de los usuarios son almacenadas mediante algoritmos de encriptación unidireccional.</p>

                    <h3 style={{ color: '#1A1A1A', marginTop: '25px' }}>4. Derechos del Titular</h3>
                    <p>Como titular de los datos personales, usted tiene derecho a conocer, actualizar, rectificar y solicitar la supresión de sus datos de nuestra base de datos en cualquier momento, enviando una solicitud a través de nuestros canales de soporte.</p>
                </>
            )}

        </div>
    );
};

export default DocumentosLegales;