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

// NUEVA FUNCIÓN: Obtener un solo producto por su ID
exports.obtenerProductoPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const [filas] = await db.query('SELECT * FROM Productos WHERE id_producto = ? AND estado = 1', [id]);
        
        if (filas.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado o inactivo.' });
        }
        
        res.json(filas[0]);
    } catch (error) {
        console.error('Error al obtener el producto individual:', error);
        res.status(500).json({ mensaje: 'Error interno al consultar los detalles del producto.' });
    }
};

// Registrar un nuevo producto con campos expandidos
exports.crearProducto = async (req, res) => {
    // Extrae todos los datos de texto, incluyendo los nuevos opcionales
    const { 
        nombre, descripcion, precio, stock, 
        ingredientes, instrucciones_uso, consejos, precauciones 
    } = req.body;

    // Al usar upload.fields, los archivos se guardan en req.files (plural) y es un objeto
    if (!req.files || !req.files['imagen']) {
        return res.status(400).json({ mensaje: 'Es obligatorio adjuntar la imagen principal fotográfica del producto.' });
    }

    // Rutas de las imágenes (verificando si se subieron las opcionales)
    const imagen_url = '/img/' + req.files['imagen'][0].filename;
    const imagen_instrucciones = req.files['imagen_instrucciones'] ? '/img/' + req.files['imagen_instrucciones'][0].filename : null;
    const imagen_consejos = req.files['imagen_consejos'] ? '/img/' + req.files['imagen_consejos'][0].filename : null;

    try {
        const [resultado] = await db.query(
            `INSERT INTO Productos 
            (nombre, descripcion, precio, stock, imagen_url, ingredientes, instrucciones_uso, imagen_instrucciones, consejos, imagen_consejos, precauciones, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                nombre, descripcion, precio, stock, imagen_url, 
                ingredientes || null, instrucciones_uso || null, imagen_instrucciones, 
                consejos || null, imagen_consejos, precauciones || null
            ]
        );
        
        res.status(201).json({ mensaje: 'Producto registrado exitosamente con información detallada', id_producto: resultado.insertId });
    } catch (error) {
        console.error('Error al crear producto:', error.message);
        res.status(500).json({ mensaje: 'Error interno al registrar el cosmético en la base de datos' });
    }
};

// Eliminar un producto del catálogo
exports.eliminarProducto = async (req, res) => {
    const { id } = req.params;

    try {
        const [resultado] = await db.query('DELETE FROM Productos WHERE id_producto = ?', [id]);

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

// Actualiza la información de texto de un producto existente (incluyendo campos detallados)
exports.actualizarProducto = async (req, res) => {
    const { id } = req.params;
    const { 
        nombre, descripcion, precio, stock,
        ingredientes, instrucciones_uso, consejos, precauciones
    } = req.body;
    
    // Verifica si se adjuntaron nuevos archivos en la petición
    const imagen_url = req.files && req.files['imagen'] ? '/img/' + req.files['imagen'][0].filename : null;
    const imagen_instrucciones = req.files && req.files['imagen_instrucciones'] ? '/img/' + req.files['imagen_instrucciones'][0].filename : null;
    const imagen_consejos = req.files && req.files['imagen_consejos'] ? '/img/' + req.files['imagen_consejos'][0].filename : null;

    try {
        await db.query(
            `UPDATE Productos 
             SET nombre = ?, descripcion = ?, precio = ?, stock = ?,
                 ingredientes = ?, instrucciones_uso = ?, consejos = ?, precauciones = ?,
                 imagen_url = COALESCE(?, imagen_url),
                 imagen_instrucciones = COALESCE(?, imagen_instrucciones),
                 imagen_consejos = COALESCE(?, imagen_consejos)
             WHERE id_producto = ?`,
            [
                nombre, descripcion, precio, stock, 
                ingredientes || null, instrucciones_uso || null, consejos || null, precauciones || null, 
                imagen_url, imagen_instrucciones, imagen_consejos,
                id
            ]
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