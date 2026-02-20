const db = require('../config/db');

// Obtener todos los productos del catálogo
exports.obtenerProductos = async (req, res) => {
    try {
        const [filas] = await db.query('SELECT * FROM Productos WHERE estado = 1');
        res.json(filas);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ mensaje: 'Error al consultar la base de datos' });
    }
};

// Registrar un nuevo producto
exports.crearProducto = async (req, res) => {
    // Extrae los datos de texto
    const { nombre, descripcion, precio, stock } = req.body;

    // Verifica si el middleware Multer procesó y adjuntó el archivo
    if (!req.file) {
        return res.status(400).json({ mensaje: 'Es obligatorio adjuntar una imagen fotográfica del producto.' });
    }

    // Construye la ruta relativa que se guardará en MySQL
    const imagen_url = '/img/' + req.file.filename;

    try {
        const [resultado] = await db.query(
            'INSERT INTO Productos (nombre, descripcion, precio, stock, imagen_url, estado) VALUES (?, ?, ?, ?, ?, 1)',
            [nombre, descripcion, precio, stock, imagen_url]
        );
        
        res.status(201).json({ mensaje: 'Producto e imagen guardados exitosamente', id_producto: resultado.insertId });
    } catch (error) {
        console.error('Error al crear producto:', error.message);
        res.status(500).json({ mensaje: 'Error interno al registrar el cosmético en la base de datos' });
    }
};

// Eliminar un producto del catálogo
exports.eliminarProducto = async (req, res) => {
    // Extrae el ID del producto desde los parámetros de la URL
    const { id } = req.params;

    try {
        // Ejecuta la consulta SQL para borrar el registro correspondiente
        const [resultado] = await db.query('DELETE FROM Productos WHERE id_producto = ?', [id]);

        // Verifica si realmente se eliminó algún registro
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado en la base de datos' });
        }

        res.status(200).json({ mensaje: 'Producto eliminado exitosamente del catálogo' });
    } catch (error) {
        console.error('Error al eliminar producto:', error.message);
        res.status(500).json({ mensaje: 'Error interno al intentar eliminar el cosmético' });
    }
};

// Obtiene el inventario completo (activos e inactivos) exclusivo para el panel admin
exports.obtenerTodosLosProductos = async (req, res) => {
    try {
        const [filas] = await db.query('SELECT * FROM Productos ORDER BY id_producto DESC');
        res.json(filas);
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ mensaje: 'Error al consultar el inventario completo' });
    }
};

// Actualiza la información de texto de un producto existente
exports.actualizarProducto = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock } = req.body;
    try {
        await db.query(
            'UPDATE Productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id_producto = ?',
            [nombre, descripcion, precio, stock, id]
        );
        res.status(200).json({ mensaje: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar producto:', error.message);
        res.status(500).json({ mensaje: 'Error interno al actualizar el cosmético' });
    }
};

// Cambia el estado de visibilidad (1 = Activo, 0 = Inactivo)
exports.cambiarEstadoProducto = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        await db.query('UPDATE Productos SET estado = ? WHERE id_producto = ?', [estado, id]);
        res.status(200).json({ mensaje: 'Visibilidad del producto actualizada' });
    } catch (error) {
        console.error('Error al cambiar estado:', error.message);
        res.status(500).json({ mensaje: 'Error interno al modificar la visibilidad' });
    }
};