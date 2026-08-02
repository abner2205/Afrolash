const db = require('./config/db');

describe('Pruebas de Funcionalidad: Disparadores de Auditoría en MySQL', () => {
    let productoTestId;

    afterAll(async () => {
        await db.end(); 
    });
    it('Debería registrar automáticamente una modificación de stock en la tabla de auditoría', async () => {
        const [insertResult] = await db.query(
            `INSERT INTO productos (nombre, precio, stock, estado) VALUES ('Producto Prueba Trigger', 10.00, 5, 1)`
        );
        productoTestId = insertResult.insertId;

        await db.query(
            `UPDATE productos SET stock = 15 WHERE id_producto = ?`,
            [productoTestId]
        );

        const [auditoriaRows] = await db.query(
            `SELECT * FROM auditoria WHERE tabla_afectada = 'Productos' AND accion = 'UPDATE' AND registro_id = ? ORDER BY id_auditoria DESC LIMIT 1`,
            [productoTestId]
        );

        expect(auditoriaRows.length).toBe(1);
        expect(auditoriaRows[0].detalles).toContain('Stock anterior: 5 -> Nuevo: 15');
        
        await db.query(`DELETE FROM productos WHERE id_producto = ?`, [productoTestId]);
        await db.query(`DELETE FROM auditoria WHERE registro_id = ? AND tabla_afectada = 'Productos'`, [productoTestId]);
    });
});

