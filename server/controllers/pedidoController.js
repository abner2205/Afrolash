// Importa el pool de conexión a la base de datos
const db = require('../config/db');

// Define la función asíncrona 
exports.procesarPedido = async (req, res) => {
    // Extrae los datos enviados desde el frontend
    const { id_usuario, carrito, total } = req.body;
    const conexion = await db.getConnection();

    try {
        // Inicia la transacción 
        await conexion.beginTransaction();

        // Inserta el registro principal en la tabla Pedidos
        const [resultadoPedido] = await conexion.query(
            'INSERT INTO Pedidos (id_usuario, total, estado) VALUES (?, ?, ?)',
            [id_usuario, total, 'pagado']
        );
        const id_pedido = resultadoPedido.insertId;

        // Itera sobre el arreglo del carrito para insertar los detalles
        for (const item of carrito) {
            await conexion.query(
                'INSERT INTO Detalles_Pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [id_pedido, item.id_producto, 1, item.precio]
            );
            
            // Actualiza el inventario descontando la unidad comprada
            await conexion.query(
                'UPDATE Productos SET stock = stock - 1 WHERE id_producto = ?',
                [item.id_producto]
            );
        }

        // Confirma la transacción guardando los cambios permanentemente
        await conexion.commit();
        res.status(200).json({ mensaje: 'Pedido procesado con éxito', id_pedido });

    } catch (error) {
        // Revierte todos los cambios si ocurre algún error durante el proceso
        await conexion.rollback();
        console.error('Error al procesar el pedido:', error.message);
        res.status(500).json({ mensaje: 'Error interno al procesar la transacción' });
    } finally {
        // Libera la conexión para no saturar el servidor
        conexion.release();
    }
};