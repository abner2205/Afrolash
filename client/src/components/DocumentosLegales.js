import React, { useEffect } from 'react';

const DocumentosLegales = ({ tipoDocumento, enModal = false }) => {
  useEffect(() => {
    if (!enModal) {
      window.scrollTo(0, 0);
    }
  }, [tipoDocumento, enModal]);

  const TituloPrincipal = enModal ? 'h2' : 'h1';
  const EncabezadoSeccion = enModal ? 'h3' : 'h2';
  const claseContenedor = enModal
    ? 'afro-legal-doc afro-legal-doc--modal'
    : 'afro-card afro-legal-doc';

  return (
    <article className={claseContenedor}>
      {tipoDocumento === 'terminos' ? (
        <>
          <TituloPrincipal className="afro-legal-title">
            Términos y Condiciones de Uso
          </TituloPrincipal>
          <p className="afro-legal-meta">Última actualización: Junio de 2026</p>

          <EncabezadoSeccion className="afro-legal-heading">
            1. Aceptación y Ámbito de Aplicación
          </EncabezadoSeccion>
          <p>
            Bienvenido a Afrolash C.A. Al acceder y utilizar este sitio web, usted acepta estar
            sujeto a los presentes Términos y Condiciones. Esta plataforma opera bajo la
            legislación de la República de Colombia, específicamente en concordancia con la Ley
            1480 de 2011 (Estatuto del Consumidor).
          </p>

          <EncabezadoSeccion className="afro-legal-heading">
            2. Proceso de Compra y Pagos
          </EncabezadoSeccion>
          <p>
            Los precios publicados en nuestro catálogo están expresados en la moneda indicada al
            momento del pago. Las transacciones se procesan a través de pasarelas de pago seguras
            (Stripe). Afrolash C.A. no almacena directamente los datos financieros de sus tarjetas
            de crédito o débito.
          </p>

          <EncabezadoSeccion className="afro-legal-heading">
            3. Envíos y Entregas
          </EncabezadoSeccion>
          <p>
            Nos comprometemos a despachar los productos en los plazos estipulados al momento de la
            compra. Los tiempos de entrega pueden variar dependiendo de la ubicación del cliente
            dentro del territorio nacional. El cliente es responsable de proporcionar una dirección
            de entrega válida y un número de contacto.
          </p>

          <EncabezadoSeccion className="afro-legal-heading">
            4. Derecho de Retracto
          </EncabezadoSeccion>
          <p>
            De acuerdo con el artículo 47 de la Ley 1480 de 2011, los consumidores tienen derecho a
            retractarse de la compra dentro de los cinco (5) días hábiles siguientes a la entrega
            del producto, siempre y cuando los cosméticos no hayan sido abiertos, usados o
            alterados, por razones de salud e higiene.
          </p>
        </>
      ) : null}

      {tipoDocumento === 'privacidad' ? (
        <>
          <TituloPrincipal className="afro-legal-title">
            Políticas de Privacidad y Tratamiento de Datos
          </TituloPrincipal>
          <p className="afro-legal-meta">Última actualización: Junio de 2026</p>

          <EncabezadoSeccion className="afro-legal-heading">
            1. Marco Legal
          </EncabezadoSeccion>
          <p>
            Afrolash C.A. garantiza la protección de los datos personales de sus usuarios en
            estricto cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013 de
            la República de Colombia (Ley de Hábeas Data).
          </p>

          <EncabezadoSeccion className="afro-legal-heading">
            2. Recolección y Finalidad
          </EncabezadoSeccion>
          <p>
            Los datos personales recolectados en el proceso de registro y compra (tales como
            nombre, correo electrónico, dirección y teléfono) serán utilizados exclusivamente para:
          </p>
          <ul className="afro-legal-list">
            <li>Procesamiento, facturación y envío de los pedidos.</li>
            <li>Gestión de atención al cliente y soporte técnico.</li>
            <li>Envío de notificaciones sobre el estado de la compra.</li>
          </ul>

          <EncabezadoSeccion className="afro-legal-heading">
            3. Seguridad de la Información
          </EncabezadoSeccion>
          <p>
            Implementamos medidas técnicas, humanas y administrativas necesarias para otorgar
            seguridad a los registros, evitando su adulteración, pérdida, consulta, o acceso no
            autorizado. Las contraseñas de los usuarios son almacenadas mediante algoritmos de
            encriptación unidireccional.
          </p>

          <EncabezadoSeccion className="afro-legal-heading">
            4. Derechos del Titular
          </EncabezadoSeccion>
          <p>
            Como titular de los datos personales, usted tiene derecho a conocer, actualizar,
            rectificar y solicitar la supresión de sus datos de nuestra base de datos en cualquier
            momento, enviando una solicitud a través de nuestros canales de soporte.
          </p>
        </>
      ) : null}
    </article>
  );
};

export default DocumentosLegales;
