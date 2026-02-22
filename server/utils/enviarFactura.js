const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const enviarFactura = async (usuarioEmail, datosPedido, carrito, total) => {
    return new Promise((resolve, reject) => {
        // 1. Configurar la conexión con el servidor de correo
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 2. Inicializar el documento PDF
        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        
        // Capturar los fragmentos de datos a medida que se dibuja el PDF
        doc.on('data', buffers.push.bind(buffers));
        
        // Cuando el documento termine de dibujarse
        doc.on('end', async () => {
            let pdfData = Buffer.concat(buffers);

            const mailOptions = {
                from: `"Afrolash C.A." <${process.env.EMAIL_USER}>`,
                to: usuarioEmail,
                subject: `Factura de tu pedido #${datosPedido.id_pedido} - Afrolash`,
                text: `Hola. Adjuntamos la factura en formato PDF de tu compra reciente por un total de $${total}. Los productos serán despachados a la brevedad. Gracias por tu preferencia.`,
                attachments: [
                    {
                        filename: `Factura_Afrolash_Orden_${datosPedido.id_pedido}.pdf`,
                        content: pdfData
                    }
                ]
            };

            try {
                // Procesamos el envío del correo
                await transporter.sendMail(mailOptions);
                // Retornamos el PDF transformado a texto Base64 para que el frontend lo pueda leer
                resolve(pdfData.toString('base64'));
            } catch (error) {
                console.error('Error enviando correo SMTP:', error);
                // Si el correo falla temporalmente, de igual forma enviamos el PDF al frontend para no interrumpir la compra
                resolve(pdfData.toString('base64'));
            }
        });

        // --- DISEÑO VISUAL DEL PDF ---
        doc.fontSize(20).text('AFROLASH C.A.', { align: 'center' });
        doc.fontSize(10).text('Cosméticos y Belleza', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(14).text(`Orden de Compra: #${datosPedido.id_pedido}`);
        doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString('es-VE')}`);
        doc.text(`Dirección de envío: ${datosPedido.direccion}`);
        doc.text(`Teléfono de contacto: ${datosPedido.telefono}`);
        doc.moveDown();
        
        doc.text('------------------------------------------------------------------');
        doc.moveDown();

        // Iterar sobre los productos para dibujarlos en la factura
        carrito.forEach(item => {
            const subtotal = (parseFloat(item.precio) * item.cantidad).toFixed(2);
            doc.text(`${item.cantidad}x ${item.nombre} - $${subtotal}`);
        });

        doc.moveDown();
        doc.text('------------------------------------------------------------------');
        doc.fontSize(14).text(`Total Pagado: $${parseFloat(total).toFixed(2)}`, { align: 'right' });

        // Ordenar al motor que finalice el dibujo del archivo
        doc.end();
    });
};

module.exports = enviarFactura;