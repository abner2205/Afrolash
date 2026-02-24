const db = require('../config/db');
const enviarFactura = require('../utils/enviarFactura');

exports.procesarPedido = async (req, res) => {
    // Ahora el backend espera recibir la dirección y el teléfono desde el formulario
    const { id_usuario, carrito, total, direccion_envio, telefono_contacto } = req.body;

    try {
        // Actualiza la consulta de inserción para incluir los nuevos campos de envío
        const [resultadoPedido] = await db.query(
            'INSERT INTO Pedidos (id_usuario, total, direccion_envio, telefono_contacto) VALUES (?, ?, ?, ?)',
            [id_usuario, total, direccion_envio, telefono_contacto]
        );

        // NUEVO: 2. Actualizar el perfil del usuario con los últimos datos de contacto utilizados
        try {
            // Aseguramos que las variables no sean nulas antes de actualizar
            if (direccion_envio && telefono_contacto) {
                await db.query(
                    'UPDATE Usuarios SET direccion = ?, telefono = ? WHERE id_usuario = ?',
                    [direccion_envio, telefono_contacto, id_usuario]
                );
            }
        } catch (errorActualizacion) {
            console.error('Advertencia: No se pudo actualizar el perfil del usuario:', errorActualizacion.message);
        }
        
        const id_pedido = resultadoPedido.insertId;

        for (let item of carrito) {
            const precioParaInsertar = item.precio || item.precio_unitario;

            await db.query(
                'INSERT INTO Detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [id_pedido, item.id_producto, item.cantidad, precioParaInsertar]
            );

            // Mantenemos la lógica de reducción de stock
            await db.query(
                `UPDATE Productos 
                 SET stock = stock - ? 
                 WHERE id_producto = ?`,
                [item.cantidad, item.id_producto]
            );
            
            // Opcional: Actualiza el estado a "agotado" si el stock llega a 0, según las opciones de tu ENUM
            await db.query(
                `UPDATE Productos SET estado = 'agotado' WHERE stock <= 0 AND id_producto = ?`, 
                [item.id_producto]
            );
        }
        // NUEVO: Consultar el correo del cliente para enviar la factura
        const [usuarioData] = await db.query('SELECT correo FROM Usuarios WHERE id_usuario = ?', [id_usuario]);
        const correoCliente = usuarioData[0].correo;

        // Ejecutar la generación del PDF y envío de correo en segundo plano
        const datosParaFactura = { 
               id_pedido: id_pedido, 
               direccion: direccion_envio, 
               telefono: telefono_contacto 
           };

           // Ejecutar la generación del PDF, el envío del correo y esperar el resultado
           const facturaBase64 = await enviarFactura(correoCliente, datosParaFactura, carrito, total);

           // Respuesta al frontend
           res.status(201).json({ 
               mensaje: 'Transacción procesada correctamente', 
               id_pedido: id_pedido,
               factura: facturaBase64 // Esta es la propiedad vital que React intenta leer
           });
    } catch (error) {
        console.error('Error al procesar el pedido:', error.message);
        res.status(500).json({ mensaje: 'Error interno al procesar la transacción' });
    }
};

// Obtener el historial de compras de un cliente específico
exports.obtenerMisPedidos = async (req, res) => {
    // El ID del usuario viene del token decodificado por el authMiddleware
    const id_usuario = req.usuario.id;

    try {
        // 1. Busca todos los pedidos generales de este usuario, ordenados del más reciente al más antiguo
        const [pedidos] = await db.query(
            'SELECT * FROM Pedidos WHERE id_usuario = ? ORDER BY id_pedido DESC', 
            [id_usuario]
        );

        // 2. Itera sobre cada pedido para buscar sus detalles (los productos comprados)
        for (let i = 0; i < pedidos.length; i++) {
            const id_pedido = pedidos[i].id_pedido;
            
            // Realiza un JOIN entre Detalles_pedido y Productos para obtener el nombre y la foto de lo que compró
            const [detalles] = await db.query(`
                SELECT dp.cantidad, dp.precio_unitario, pr.nombre, pr.imagen_url 
                FROM Detalles_pedido dp
                JOIN Productos pr ON dp.id_producto = pr.id_producto
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
        // 1. Consulta principal: Une la tabla Pedidos con Usuarios para obtener los datos del cliente
        const [pedidos] = await db.query(`
            SELECT p.id_pedido, p.total, p.fecha_pedido, p.estado, p.direccion_envio, p.telefono_contacto, u.nombre_completo AS cliente_nombre, u.correo AS cliente_email
            FROM Pedidos p
            JOIN Usuarios u ON p.id_usuario = u.id_usuario
            ORDER BY p.id_pedido DESC
        `);

        // 2. Bucle para adjuntar los productos específicos a cada factura
        for (let i = 0; i < pedidos.length; i++) {
            const id_pedido = pedidos[i].id_pedido;
            
            const [detalles] = await db.query(`
                SELECT dp.cantidad, dp.precio_unitario, pr.nombre 
                FROM Detalles_pedido dp
                JOIN Productos pr ON dp.id_producto = pr.id_producto
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
        await db.query('UPDATE Pedidos SET estado = ? WHERE id_pedido = ?', [estado, id]);
        res.status(200).json({ mensaje: 'Estado logístico actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar el estado del pedido:', error.message);
        res.status(500).json({ mensaje: 'Error interno al modificar el estado' });
    }
};