-- =====================================================================
-- Afrolash C.A. — Datos Semilla Iniciales (Seed Data)
-- Spec 004 — Preparación para Producción, Portabilidad Cloud y Despliegue
-- =====================================================================

USE afrolash_db;

-- NOTA: Si utilizas un esquema asignado en la nube (ej. defaultdb en Aiven),
-- adapta o comenta la directiva USE afrolash_db anterior.

-- =====================================================================
-- 1. Cuentas de Usuario de Demostración
-- =====================================================================
-- Credenciales seguras pre-hasheadas con bcryptjs (10 rondas de sal)
-- que cumplen con la política de seguridad de la Spec 003:
--   - Admin:    admin@afrolash.com    / AdminAfro2026
--   - Empleado: empleado@afrolash.com / EmpleadoAfro2026
--   - Cliente:  cliente@afrolash.com  / ClienteAfro2026

-- Cuenta de Administrador
INSERT INTO usuarios (nombre_completo, correo, password, rol, telefono, direccion)
SELECT
    'Administrador Afrolash',
    'admin@afrolash.com',
    '$2b$10$3/kWE.pJ0j8xKMfwwE0mxetV8BqKwN7wbuOOhFqeL1e.Zii0XbkbW',
    'admin',
    '04141234567',
    'Sede Central Afrolash, Caracas, Venezuela'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = 'admin@afrolash.com');

-- Cuenta de Empleado de Operaciones
INSERT INTO usuarios (nombre_completo, correo, password, rol, telefono, direccion)
SELECT
    'Empleado Operaciones',
    'empleado@afrolash.com',
    '$2b$10$F/FfNB9gwIiXoaSAWIrTs.JpG4iHaAHBxE.H3ggzlfTu/qRFrxRp2',
    'empleado',
    '04129876543',
    'Centro Logístico Afrolash, Caracas, Venezuela'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = 'empleado@afrolash.com');

-- Cuenta de Cliente de Demostración
INSERT INTO usuarios (nombre_completo, correo, password, rol, telefono, direccion)
SELECT
    'Cliente Demostración',
    'cliente@afrolash.com',
    '$2b$10$x.2T0F.opLj8MOG7nmMsC.KgVMA/d4K44ZtKJXyLINBbR4amzzRli',
    'cliente',
    '04245551234',
    'Av. Francisco de Miranda, Edif. Parque Cristal, Caracas, Venezuela'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = 'cliente@afrolash.com');

-- =====================================================================
-- 2. Catálogo Inicial de Productos Cosméticos
-- =====================================================================

-- 2.1. Rímel Volumen Extremo
INSERT INTO productos (
    nombre, descripcion, ingredientes, instrucciones_uso,
    imagen_instrucciones, consejos, imagen_consejos, precauciones,
    precio, stock, imagen_url, estado
)
SELECT
    'Rímel Volumen Extremo',
    'Máscara para pestañas formulada para aportar máximo volumen, elevación y longitud panorámica sin grumos. Acabado negro azabache de larga duración resistente al agua y a la humedad.',
    'Agua purificada, Cera de abeja sintética, Cera de carnauba, Aceite de ricino, Vitamina E, Óxidos de hierro (CI 77499), Polímeros fijadores.',
    'Aplica el cepillo desde la raíz de las pestañas realizando suaves movimientos en zigzag hacia las puntas. Reaplica una segunda capa para intensificar el volumen antes de que seque.',
    '/img/1781913807304-120328284.jpg',
    'Gira el aplicador suavemente al sacarlo del tubo; evita bombear aire para prevenir que la fórmula se reseque prematuramente.',
    NULL,
    'Uso externo. Suspende su aplicación si observas irritación o enrojecimiento. Mantén el envase bien cerrado en un lugar fresco y seco.',
    12.50,
    32,
    '/img/rimel.png',
    1
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Rímel Volumen Extremo');

-- 2.2. Lápiz Perfilador de Cejas
INSERT INTO productos (
    nombre, descripcion, ingredientes, instrucciones_uso,
    imagen_instrucciones, consejos, imagen_consejos, precauciones,
    precio, stock, imagen_url, estado
)
SELECT
    'Lápiz Perfilador de Cejas',
    'Lápiz delineador de cejas ultrapreciso con punta retráctil y cepillo espiral integrado. Define, rellena y disciplina cada vello logrando un acabado natural de fijación prolongada.',
    'Aceite de jojoba hidrogenado, Cera microcristalina, Mica, Manteca de karité, Pigmentos minerales de alta pureza.',
    'Peina las cejas hacia arriba con el cepillo espiral. Traza líneas finas imitando el vello natural en zonas despobladas y difumina suavemente.',
    NULL,
    'Elige un tono ligeramente más claro que el cabello natural para obtener un look iluminado y suave.',
    NULL,
    'Evita aplicar sobre heridas abiertas o piel irritada. Mantén fuera del alcance de niños.',
    8.00,
    21,
    '/img/lapiz_cejas.png',
    1
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Lápiz Perfilador de Cejas');

-- 2.3. Sérum Crecimiento
INSERT INTO productos (
    nombre, descripcion, ingredientes, instrucciones_uso,
    imagen_instrucciones, consejos, imagen_consejos, precauciones,
    precio, stock, imagen_url, estado
)
SELECT
    'Sérum Crecimiento',
    'Tratamiento botánico intensivo para pestañas y cejas. Estimula el folículo piloso, previene la caída prematura y densifica la fibra capilar desde la raíz.',
    'Biotina, Péptidos de cobre, Pantenol (Provitamina B5), Ácido hialurónico, Extracto de romero y té verde.',
    'Con el rostro limpio y seco por la noche, desliza el pincel aplicador sobre la línea superior de pestañas y en zonas despobladas de las cejas.',
    NULL,
    'La constancia diaria durante al menos 4 semanas es clave para apreciar los resultados visibles de mayor densidad y fuerza.',
    NULL,
    'Evita el contacto directo con los ojos. En caso de contacto, enjuaga con abundante agua tibia.',
    24.00,
    39,
    '/img/serum_crecimiento.png',
    1
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Sérum Crecimiento');

-- 2.4. Uñas Postizas 48u
INSERT INTO productos (
    nombre, descripcion, ingredientes, instrucciones_uso,
    imagen_instrucciones, consejos, imagen_consejos, precauciones,
    precio, stock, imagen_url, estado
)
SELECT
    'Uñas Postizas 48u',
    'Set premium de 48 uñas postizas estilizadas con acabado brillante y ajuste anatómico. Fabricadas en ABS flexible de alta resistencia para una manicura impecable en minutos.',
    'Plástico ABS grado cosmético, Polímero acrílico moldeable.',
    'Limpia y desengrasa tus uñas naturales. Selecciona el tamaño adecuado para cada uña, aplica adhesivo para uñas y presiona firmemente durante 15 a 20 segundos.',
    NULL,
    'Para retirarlas fácilmente, sumerge los dedos en agua tibia con aceite para cutículas durante 10 minutos.',
    NULL,
    'No aplicar sobre uñas inflamadas, infectadas o dañadas. Mantener alejado de fuentes de calor directo.',
    7.15,
    47,
    '/img/1771583718785-910879873.jpg',
    1
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Uñas Postizas 48u');
