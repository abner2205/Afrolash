-- =====================================================================
-- Afrolash C.A. — Esquema de Base de Datos Relacional (MySQL 8 / InnoDB)
-- Spec 004 — Preparación para Producción, Portabilidad Cloud y Despliegue
-- =====================================================================

-- Creación e inicialización idempotente de la base de datos
CREATE DATABASE IF NOT EXISTS afrolash_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE afrolash_db;

-- NOTA PARA DESPLIEGUE EN LA NUBE (ej. Aiven for MySQL, TiDB Serverless):
-- Si tu proveedor DBaaS asigna un esquema predeterminado (por ejemplo defaultdb),
-- adapta o comenta la directiva USE afrolash_db anterior y conéctate directamente
-- a la base de datos asignada por el proveedor de nube.

-- =====================================================================
-- 1. Tabla: usuarios
-- =====================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'empleado', 'admin') NOT NULL DEFAULT 'cliente',
    telefono VARCHAR(20) DEFAULT NULL,
    direccion TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 2. Tabla: productos
-- =====================================================================
CREATE TABLE IF NOT EXISTS productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    ingredientes TEXT,
    instrucciones_uso TEXT,
    imagen_instrucciones VARCHAR(255) DEFAULT NULL,
    consejos TEXT,
    imagen_consejos VARCHAR(255) DEFAULT NULL,
    precauciones TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagen_url VARCHAR(255) DEFAULT NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,
    INDEX idx_productos_estado (estado),
    INDEX idx_productos_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 3. Tabla: pedidos
-- =====================================================================
CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    direccion_envio VARCHAR(255) DEFAULT NULL,
    telefono_contacto VARCHAR(50) DEFAULT NULL,
    INDEX idx_pedidos_usuario (id_usuario),
    INDEX idx_pedidos_estado (estado),
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 4. Tabla: detalles_pedido
-- =====================================================================
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    INDEX idx_detalles_pedido (id_pedido),
    INDEX idx_detalles_producto (id_producto),
    CONSTRAINT fk_detalles_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_detalles_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 5. Tabla: auditoria
-- =====================================================================
CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    accion VARCHAR(20) NOT NULL,
    registro_id INT NOT NULL,
    usuario_db VARCHAR(50) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    detalles TEXT,
    INDEX idx_auditoria_tabla_registro (tabla_afectada, registro_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 6. Disparadores de Auditoría (Triggers)
-- =====================================================================

-- 6.1. trg_pedidos_update: Auditoría sobre cambios de estado en pedidos
DROP TRIGGER IF EXISTS trg_pedidos_update;
DELIMITER //
CREATE TRIGGER trg_pedidos_update
AFTER UPDATE ON pedidos
FOR EACH ROW
BEGIN
    IF OLD.estado <> NEW.estado THEN
        INSERT INTO auditoria (tabla_afectada, accion, registro_id, usuario_db, fecha, detalles)
        VALUES (
            'Pedidos',
            'UPDATE',
            NEW.id_pedido,
            USER(),
            NOW(),
            CONCAT('Estado anterior: ', OLD.estado, ' -> Nuevo: ', NEW.estado)
        );
    END IF;
END //
DELIMITER ;

-- 6.2. trg_productos_insert: Auditoría tras creación de nuevos productos
DROP TRIGGER IF EXISTS trg_productos_insert;
DELIMITER //
CREATE TRIGGER trg_productos_insert
AFTER INSERT ON productos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, accion, registro_id, usuario_db, fecha, detalles)
    VALUES (
        'Productos',
        'INSERT',
        NEW.id_producto,
        USER(),
        NOW(),
        CONCAT('Producto creado: ', NEW.nombre, ' | Precio: ', NEW.precio, ' | Stock: ', NEW.stock)
    );
END //
DELIMITER ;

-- 6.3. trg_productos_update: Auditoría tras modificaciones de stock, precio o visibilidad
DROP TRIGGER IF EXISTS trg_productos_update;
DELIMITER //
CREATE TRIGGER trg_productos_update
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
    IF OLD.precio <> NEW.precio OR OLD.stock <> NEW.stock OR OLD.estado <> NEW.estado THEN
        INSERT INTO auditoria (tabla_afectada, accion, registro_id, usuario_db, fecha, detalles)
        VALUES (
            'Productos',
            'UPDATE',
            NEW.id_producto,
            USER(),
            NOW(),
            CONCAT(
                'Stock anterior: ', OLD.stock, ' -> Nuevo: ', NEW.stock,
                ' | Precio anterior: ', OLD.precio, ' -> Nuevo: ', NEW.precio,
                ' | Estado anterior: ', OLD.estado, ' -> Nuevo: ', NEW.estado
            )
        );
    END IF;
END //
DELIMITER ;

-- 6.4. trg_productos_delete: Auditoría tras eliminación de productos
DROP TRIGGER IF EXISTS trg_productos_delete;
DELIMITER //
CREATE TRIGGER trg_productos_delete
AFTER DELETE ON productos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, accion, registro_id, usuario_db, fecha, detalles)
    VALUES (
        'Productos',
        'DELETE',
        OLD.id_producto,
        USER(),
        NOW(),
        CONCAT('Producto eliminado: ', OLD.nombre, ' (ID: ', OLD.id_producto, ')')
    );
END //
DELIMITER ;

-- 6.5. trg_usuarios_update: Auditoría tras cambios en el rol de usuarios
DROP TRIGGER IF EXISTS trg_usuarios_update;
DELIMITER //
CREATE TRIGGER trg_usuarios_update
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    IF OLD.rol <> NEW.rol THEN
        INSERT INTO auditoria (tabla_afectada, accion, registro_id, usuario_db, fecha, detalles)
        VALUES (
            'Usuarios',
            'UPDATE',
            NEW.id_usuario,
            USER(),
            NOW(),
            CONCAT('Rol anterior: ', OLD.rol, ' -> Nuevo: ', NEW.rol)
        );
    END IF;
END //
DELIMITER ;

-- 6.6. trg_usuarios_delete: Auditoría tras eliminación de usuarios
DROP TRIGGER IF EXISTS trg_usuarios_delete;
DELIMITER //
CREATE TRIGGER trg_usuarios_delete
AFTER DELETE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, accion, registro_id, usuario_db, fecha, detalles)
    VALUES (
        'Usuarios',
        'DELETE',
        OLD.id_usuario,
        USER(),
        NOW(),
        CONCAT('Usuario eliminado: ', OLD.nombre_completo, ' | Correo: ', OLD.correo)
    );
END //
DELIMITER ;
