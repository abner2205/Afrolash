const db = require('../config/db');
const enviarFactura = require('../utils/enviarFactura');

exports.procesarPedido = async (req, res) => {
    // Inmunidad IDOR / BOLA: Obtener id_usuario exclusivamente del token autenticado
    const id_usuario = req.usuario && (req.usuario.id || req.usuario.id_usuario);
    if (!id_usuario) {
        return res.status(401).json({ mensaje: 'No autorizado. Sesión no válida.' });
    }

    const { carrito, direccion_envio, telefono_contacto } = req.body;

    // Validación de entrada antes de abrir transacción
    if (
        !Array.isArray(carrito) ||
        carrito.length === 0 ||
        typeof direccion_envio !== 'string' ||
        direccion_envio.trim().length === 0 ||
        typeof telefono_contacto !== 'string' ||
        telefono_contacto.trim().length === 0
    ) {
        return res.status(400).json({ mensaje: 'Los datos del pedido o del carrito son inválidos.' });
    }

    for (const item of carrito) {
        if (!item || typeof item !== 'object') {
            return res.status(400).json({ mensaje: 'Los datos del producto en el carrito son inválidos.' });
        }
        const idProd = Number(item.id_producto);
        const cant = Number(item.cantidad);
        if (!Number.isInteger(idProd) || idProd <= 0 || !Number.isInteger(cant) || cant < 1) {
            return res.status(400).json({ mensaje: 'Las cantidades y productos del carrito deben ser enteros válidos.' });
        }
    }

    // Consolida cantidades por id_producto (por si llegan ítems repetidos del mismo producto)
    const mapaConsolidado = new Map();
    for (const item of carrito) {
        const idProd = Number(item.id_producto);
        const cant = Number(item.cantidad);
        mapaConsolidado.set(idProd, (mapaConsolidado.get(idProd) || 0) + cant);
    }

    // Ordena por id_producto ascendente para evitar interbloqueos (deadlocks) bajo concurrencia
    const productosOrdenados = Array.from(mapaConsolidado.entries())
        .map(([id_producto, cantidad]) => ({ id_producto, cantidad }))
        .sort((a, b) => a.id_producto - b.id_producto);

    let connection;
    let transaccionIniciada = false;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        transaccionIniciada = true;

        const itemsAutoritativos = [];
        let totalAcumulado = 0;

        for (const item of productosOrdenados) {
            const [filas] = await connection.query(
                'SELECT id_producto, nombre, precio, stock, estado FROM productos WHERE id_producto = ? FOR UPDATE',
                [item.id_producto]
            );

            if (!filas || filas.length === 0 || Number(filas[0].estado) !== 1) {
                await connection.rollback();
                transaccionIniciada = false;
                return res.status(400).json({ mensaje: 'Uno o más productos no existen o no están disponibles.' });
            }

            const productoBD = filas[0];
            const stockActual = Number(productoBD.stock);
            const precioOficial = Number(productoBD.precio);

            if (stockActual < item.cantidad) {
                await connection.rollback();
                transaccionIniciada = false;
                return res.status(409).json({ mensaje: `Stock insuficiente para el producto ${productoBD.nombre}.` });
            }

            const subtotal = precioOficial * item.cantidad;
            totalAcumulado += subtotal;

            itemsAutoritativos.push({
                id_producto: productoBD.id_producto,
                nombre: productoBD.nombre,
                precio: precioOficial,
                precio_unitario: precioOficial,
                cantidad: item.cantidad,
                subtotal: Number(subtotal.toFixed(2))
            });
        }

        const totalAutoritativo = Number(totalAcumulado.toFixed(2));
        const direccionLimpia = direccion_envio.trim();
        const telefonoLimpio = telefono_contacto.trim();

        // Inserta el pedido maestro con el total autoritativo
        const [resultadoPedido] = await connection.query(
            'INSERT INTO pedidos (id_usuario, total, direccion_envio, telefono_contacto) VALUES (?, ?, ?, ?)',
            [id_usuario, totalAutoritativo, direccionLimpia, telefonoLimpio]
        );
        const id_pedido = resultadoPedido.insertId;

        // Actualiza Usuarios en la misma conexión
        await connection.query(
            'UPDATE usuarios SET direccion = ?, telefono = ? WHERE id_usuario = ?',
            [direccionLimpia, telefonoLimpio, id_usuario]
        );

        // Inserta cada línea en Detalles_pedido y descuenta existencias en Productos
        for (const item of itemsAutoritativos) {
            await connection.query(
                'INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [id_pedido, item.id_producto, item.cantidad, item.precio]
            );

            await connection.query(
                'UPDATE productos SET stock = stock - ? WHERE id_producto = ?',
                [item.cantidad, item.id_producto]
            );
        }

        // Consulta el correo del usuario en Usuarios dentro de la transacción
        const [usuarioData] = await connection.query(
            'SELECT correo FROM usuarios WHERE id_usuario = ?',
            [id_usuario]
        );
        const correoCliente = usuarioData && usuarioData.length > 0 ? usuarioData[0].correo : null;

        // Confirma la transacción MySQL
        await connection.commit();
        transaccionIniciada = false;

        // Facturación post-commit fuera de la transacción MySQL
        let facturaBase64 = null;
        try {
            const datosParaFactura = {
                id_pedido: id_pedido,
                direccion: direccionLimpia,
                telefono: telefonoLimpio
            };

            if (correoCliente) {
                facturaBase64 = await enviarFactura(correoCliente, datosParaFactura, itemsAutoritativos, totalAutoritativo);
            }
        } catch (errorFactura) {
            console.error('Advertencia: Error al generar o enviar factura:', errorFactura.message);
        }

        return res.status(201).json({
            mensaje: 'Transacción procesada correctamente',
            id_pedido: id_pedido,
            factura: facturaBase64
        });

    } catch (error) {
        if (connection && transaccionIniciada) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Error durante rollback:', rollbackError.message);
            }
        }
        console.error('Error al procesar el pedido:', error.message);
        return res.status(500).json({ mensaje: 'Error interno al procesar la transacción.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Obtener el historial de compras de un cliente específico
exports.obtenerMisPedidos = async (req, res) => {
    // El ID del usuario viene del token decodificado por el authMiddleware
    const id_usuario = req.usuario && (req.usuario.id || req.usuario.id_usuario);
    if (!id_usuario) {
        return res.status(401).json({ mensaje: 'No autorizado. Sesión no válida.' });
    }

    try {
        // 1. Busca todos los pedidos generales de este usuario, ordenados del más reciente al más antiguo
        const [pedidos] = await db.query(
            'SELECT * FROM pedidos WHERE id_usuario = ? ORDER BY id_pedido DESC', 
            [id_usuario]
        );

        // 2. Itera sobre cada pedido para buscar sus detalles (los productos comprados)
        for (let i = 0; i < pedidos.length; i++) {
            const id_pedido = pedidos[i].id_pedido;
            
            // Realiza un JOIN entre detalles_pedido y productos para obtener el nombre y la foto de lo que compró
            const [detalles] = await db.query(`
                SELECT dp.cantidad, dp.precio_unitario, pr.nombre, pr.imagen_url 
                FROM detalles_pedido dp
                JOIN productos pr ON dp.id_producto = pr.id_producto
                WHERE dp.id_pedido = ?
            `, [id_pedido]);

            // Adjunta el arreglo de detalles como una nueva propiedad dentro del objeto del pedido
            pedidos[i].detalles = detalles;
        }

        // Envía la estructura completa (pedidos con sus detalles anidados) al frontend
        res.status(200).json(pedidos);

    } catch (error) {
        console.error('Error al obtener el historial de pedidos:', error.message);
        res.status(500).json({ mensaje: 'Error interno al consultar el historial de compras' });
    }
};

// Solo para Admin: Obtiene el historial global de ventas
exports.obtenerTodosLosPedidos = async (req, res) => {
    try {
        // 1. Consulta principal: Une la tabla pedidos con usuarios para obtener los datos del cliente
        const [pedidos] = await db.query(`
            SELECT p.id_pedido, p.total, p.fecha_pedido, p.estado, p.direccion_envio, p.telefono_contacto, u.nombre_completo AS cliente_nombre, u.correo AS cliente_email
            FROM pedidos p
            JOIN usuarios u ON p.id_usuario = u.id_usuario
            ORDER BY p.id_pedido DESC
        `);

        // 2. Bucle para adjuntar los productos específicos a cada factura
        for (let i = 0; i < pedidos.length; i++) {
            const id_pedido = pedidos[i].id_pedido;
            
            const [detalles] = await db.query(`
                SELECT dp.cantidad, dp.precio_unitario, pr.nombre 
                FROM detalles_pedido dp
                JOIN productos pr ON dp.id_producto = pr.id_producto
                WHERE dp.id_pedido = ?
            `, [id_pedido]);

            pedidos[i].detalles = detalles;
        }

        res.status(200).json(pedidos);

    } catch (error) {
        console.error('Error al obtener ventas globales:', error.message);
        res.status(500).json({ mensaje: 'Error interno al consultar el registro de ventas' });
    }
};

exports.actualizarEstadoPedido = async (req, res) => {
    const { id } = req.params;
    // Ahora extraemos 'estado' del cuerpo de la petición
    const { estado } = req.body;

    try {
        await db.query('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', [estado, id]);
        res.status(200).json({ mensaje: 'Estado logístico actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar el estado del pedido:', error.message);
        res.status(500).json({ mensaje: 'Error interno al modificar el estado' });
    }
};
