const db = require('../config/db');
exports.procesarPedido = async (req, res) => {
    // Extrae los datos enviados desde el frontend
    const { id_usuario, carrito, total } = req.body;

    try {
        // 1. Registra el pedido principal en la tabla Pedidos
        const [resultadoPedido] = await db.query(
            'INSERT INTO Pedidos (id_usuario, total) VALUES (?, ?)',
            [id_usuario, total]
        );
        
        // Captura el ID generado para este nuevo pedido
        const id_pedido = resultadoPedido.insertId;

        // 2. Itera sobre el arreglo para procesar cada producto de forma individual
        for (let item of carrito) {
            
            // a. Registra el historial en Detalles_Pedido para mantener la integridad referencial
            await db.query(
                'INSERT INTO Detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [id_pedido, item.id_producto, item.cantidad, item.precio]
            );

            // b. Actualiza el inventario y la visibilidad en una sola transacción eficiente
            // Se resta la cantidad exacta solicitada. Si el resultado es 0, el estado pasa a 0 (oculto).
            await db.query(
                `UPDATE Productos 
                 SET stock = stock - ?, 
                     estado = IF((stock - ?) <= 0, 0, estado) 
                 WHERE id_producto = ?`,
                [item.cantidad, item.cantidad, item.id_producto]
            );
        }

        res.status(201).json({ mensaje: 'Transacción procesada correctamente', id_pedido: id_pedido });
    } catch (error) {
        console.error('Error al procesar el pedido:', error.message);
        res.status(500).json({ mensaje: 'Error interno al procesar la transacción en la base de datos' });
    }
};