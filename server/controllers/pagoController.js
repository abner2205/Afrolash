// Inicializa la librería de Stripe utilizando tu llave secreta del archivo .env
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.crearIntencionDePago = async (req, res) => {
    // Recibe el total a pagar desde el carrito en el frontend
    const { total } = req.body;

    try {
        // Validación de seguridad para evitar enviar montos vacíos o en cero
        if (!total || total <= 0) {
            return res.status(400).json({ mensaje: 'El monto total es inválido para procesar el pago.' });
        }

        // Convierte el total a centavos (multiplicando por 100) y asegura que sea un número entero
        const montoEnCentavos = Math.round(total * 100);

        // Genera la intención de cobro en los servidores de Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: montoEnCentavos,
            currency: 'usd', // Moneda de la transacción
            automatic_payment_methods: {
                enabled: true, // Habilita los métodos de pago automáticos recomendados por Stripe
            },
        });

        // Envía el secreto temporal al frontend para autorizar el cobro
        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });

    } catch (error) {
        console.error('Error al generar la intención de pago con Stripe:', error.message);
        res.status(500).json({ mensaje: 'Error interno de comunicación con la pasarela de pagos.' });
    }
};