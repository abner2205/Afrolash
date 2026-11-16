# Plan de Implementación: 003 - Seguridad y Hardening Web

**Spec de referencia:** `specs/003-seguridad-y-hardening-web/spec.md`

---

## 1. Arquitectura y Componentes Afectados

El endurecimiento de seguridad (*hardening*) fortalece la resiliencia del backend Express 5 y su contrato con la SPA React 19, alineándose con las directrices de OWASP Top 10 (2025) y las mejores prácticas web sin alterar los flujos funcionales ni la experiencia visual de Afrolash:

```text
[Cliente Web / React SPA / Herramientas]
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Express 5 API (`server/index.js`)                           │
│  ├─ Helmet (Cabeceras HTTP de protección + CORP: cross-origin)│
│  ├─ Desacoplamiento de escucha (`require.main === module`)   │
│  ├─ CORS dinámico restringido por `FRONTEND_URL` (403 JSON) │
│  ├─ express.json({ limit: '100kb' })                         │
│  ├─ express-rate-limit (15 req / 15 min en /api/auth/*)      │
│  └─ Manejador Centralizado de Errores (JSON { mensaje })    │
└─────────────────────────────────────────────────────────────┘
         │               │                 │
         ▼               ▼                 ▼
 ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐
 │ Autenticación│ │  Inventario  │ │ Pedidos y Transacciones  │
 │ & Usuarios   │ │ & Archivos   │ │                          │
 │              │ │              │ │ - IDOR Immunity (JWT ID) │
 │ - Regex pass │ │ - Multer 2MB │ │ - Anti-Price Tampering   │
 │   & email    │ │ - 3 archivos │ │ - SELECT ... FOR UPDATE  │
 │ - 401 unif.  │ │ - Limpieza   │ │ - 409 Conflict por stock │
 │ - Escape HTML│ │   fs.unlink  │ │ - rollback() atómico     │
 └──────────────┘ └──────────────┘ └──────────────────────────┘
         │               │                 │
         └───────────────┼─────────────────┘
                         ▼
             ┌────────────────────────┐
             │ MySQL (`afrolash_db`)  │
             │ - `stock = 0` agotado  │
             │ - `estado` numérico 1/0│
             └────────────────────────┘
```

### Capas y Archivos Afectados
- **Gestión de Paquetes (`server/package.json`)**:
  - Incorporación de dependencias de producción: `helmet` (cabeceras de seguridad) y `express-rate-limit` (limitación de tasa contra abuso).
- **Punto de Entrada del Servidor (`server/index.js`)**:
  - Desacoplamiento de la inicialización de red mediante `if (require.main === module)` para exportar `app` sin abrir puertos en entornos de prueba con Supertest.
  - Inyección de `helmet` con política `crossOriginResourcePolicy: { policy: 'cross-origin' }` y desactivación de la cabecera `X-Powered-By`.
  - Configuración estricta de `cors` vinculada a `FRONTEND_URL` (con valor por defecto `http://localhost:3000`), respondiendo con HTTP `403 Forbidden` JSON ante orígenes no permitidos y admitiendo solicitudes sin cabecera `Origin`.
  - Restricción del analizador de cuerpo JSON a un límite máximo de `100kb`.
  - Configuración de `express-rate-limit` sobre endpoints públicos de autenticación (`/api/auth/login`, `/api/auth/registro`, `/api/auth/recuperar-password`, `/api/auth/restablecer-password/:id/:token`) con 15 solicitudes en 15 minutos y mecanismo de desactivación en `NODE_ENV === 'test'` salvo cuando una cabecera de prueba (`x-test-rate-limit`) lo habilite explícitamente.
  - Middleware centralizado de gestión de errores que captura sintaxis JSON inválida (`400`), excesos de tamaño (`413`), rechazos de CORS (`403`) y fallos de subida de archivos (`400`/`413`), emitiendo siempre formato JSON `{ "mensaje": "..." }` sin trazas internas ni HTML.
  - Verificación de variables de entorno críticas (`JWT_SECRET`, credenciales de BD) en arranque de producción.
- **Middleware de Carga de Archivos (`server/middleware/uploadMiddleware.js`)**:
  - Configuración estricta en Multer: límite individual de `fileSize: 2 * 1024 * 1024` (2 MB) y total de archivos controlado.
  - Helper / mecanismo de limpieza física con `fs.unlink` para eliminar inmediatamente de `client/public/img/` cualquier archivo parcial o previo si una subida múltiple es rechazada a mitad del proceso.
- **Middleware de Autenticación (`server/middleware/authMiddleware.js`)**:
  - Estandarización de la respuesta de token no válido, manipulado o expirado a código HTTP `401 Unauthorized` bajo formato JSON `{ "mensaje": "Token inválido o expirado." }` para sincronización exacta con el interceptor de Axios del cliente web.
- **Controlador de Pedidos y Pagos (`server/controllers/pedidoController.js`, `server/controllers/pagoController.js`)**:
  - Asociación exclusiva del pedido a `req.usuario.id` (inmunidad contra IDOR / BOLA ignorando `req.body.id_usuario`).
  - Validación estricta del carrito (arreglo no vacío, cantidades enteras `>= 1`, datos de envío y contacto presentes).
  - Implementación de transacciones atómicas MySQL completas (`getConnection()`, `beginTransaction()`, `commit()`, `rollback()`, `release()`).
  - Consulta autoritativa de productos en BD con bloqueo pesimista (`SELECT ... FOR UPDATE`), recálculo del total de la orden en el servidor (*anti-price tampering*) y validación de stock disponible.
  - Respuesta unívoca con HTTP `409 Conflict` `{ "mensaje": "..." }` si el stock es insuficiente.
  - Preservación del tipo de dato numérico en `Productos.estado` (`1` = activo, `0` = inactivo) al agotar inventario, representando la condición de agotado exclusivamente a través de `stock = 0`.
  - Validación de importe finito y estrictamente mayor a 0 en `/api/pagos/crear-intencion`.
- **Controladores de Autenticación y Usuarios (`server/controllers/authController.js`, `server/controllers/usuarioController.js`, `server/utils/enviarFactura.js`)**:
  - Validación estricta de formato de correo y complejidad de contraseña (mínimo 8 caracteres, al menos una mayúscula y un número) en registro y restablecimiento.
  - Validación previa de sintaxis de correo en `/api/auth/recuperar-password` con HTTP `400 Bad Request` ante entradas inválidas o vacías, y respuesta `200` genérica únicamente para formatos válidos.
  - Función utilitaria para escape de caracteres con significado HTML (`&`, `<`, `>`, `"`, `'`) en campos de usuario interpolados en correos salientes (bienvenida de empleado, recuperación y factura).
  - Uso dinámico de `FRONTEND_URL` en enlaces de recuperación de contraseña.
- **Cliente Web Frontend (`client/src/components/RestablecerPassword.js`)**:
  - Alineación de la validación en el formulario de restablecimiento para exigir contraseña de al menos 8 caracteres, una mayúscula y un número, reflejando el error en el modal accesible sin alterar el diseño visual existente.
- **Variables de Entorno (`server/.env.example`)**:
  - Documentación de la totalidad de las variables operativas requeridas (`PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `EMAIL_USER`, `EMAIL_PASS`, `FRONTEND_URL`, `NODE_ENV`).
- **Suite de Pruebas de Seguridad (`server/seguridad.test.js`)**:
  - Pruebas automatizadas de integración independientes ejecutadas con Jest + Supertest sobre la instancia exportada de `app` en puertos efímeros sin colisión de red.

---

## 2. Decisiones Técnicas y Alternativas Descartadas

- **Decisión 1: Uso de `helmet` con `crossOriginResourcePolicy: { policy: 'cross-origin' }` y supresión de `x-powered-by`**:
  - *Justificación*: Protege automáticamente contra ataques de enmarcado (clickjacking vía `X-Frame-Options: DENY`), mitigación de sniffing de tipos MIME (`X-Content-Type-Options: nosniff`) y transporte estricto. La configuración explícita `cross-origin` en la política de recursos permite que la SPA de React (en puerto 3000 o dominio diferente) cargue sin bloqueos del navegador las imágenes estáticas servidas desde `/img/...`.
  - *Alternativa descartada*: Establecer cabeceras manuales mediante un middleware casero; se descartó por el riesgo de omisiones en estándares de seguridad y por la falta de mantenimiento continuo frente a vulnerabilidades emergentes.
- **Decisión 2: Política CORS dinámica con `FRONTEND_URL` y denegación temprana en `403 Forbidden` JSON**:
  - *Justificación*: La función de verificación compara el encabezado `Origin` contra la lista delimitada por comas de `FRONTEND_URL`. Si el origen no está autorizado, se omite `Access-Control-Allow-Origin` y se responde inmediatamente con `403 Forbidden` `{ "mensaje": "Acceso denegado por política de origen (CORS)." }`. Peticiones sin cabecera `Origin` (utilidades curl, pruebas de backend o llamadas de servidor) se permiten sin trabas.
  - *Alternativa descartada*: Usar `cors()` con comodín `*` (descartada por vulnerabilidad de seguridad ante solicitudes no autorizadas en producción) o delegar el error a la respuesta HTML por defecto de Express.
- **Decisión 3: Limitación de tasa cuantitativa (15 solicitudes / 15 min) con desacoplamiento en pruebas**:
  - *Justificación*: Aplica `express-rate-limit` a los endpoints sensibles de autenticación (`login`, `registro`, `recuperar`, `restablecer`). En entorno `test` (`NODE_ENV === 'test'`), se evita el bloqueo cruzado en pruebas continuas mediante `skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']`, permitiendo activar el bloqueo y verificar determinísticamente la respuesta `429 Too Many Requests` en la suite de seguridad enviando dicha cabecera de prueba.
  - *Alternativa descartada*: Mantener el limitador activo incondicionalmente en pruebas (provocaría fallos aleatorios en tests de integración que envían ráfagas de logins) o implementar un almacenamiento externo complejo como Redis (añadiría infraestructura pesada innecesaria para la escala de la aplicación).
- **Decisión 4: Manejo centralizado de errores JSON y limpieza de archivos parciales con `fs.unlink`**:
  - *Justificación*: Se define un middleware de error al final de la cadena de Express que captura `SyntaxError` (JSON malformado con status 400), `entity.too.large` (cuerpos > 100 KB con status 413) y errores de Multer (`LIMIT_FILE_SIZE` -> 413, `LIMIT_UNEXPECTED_FILE` / tipo no válido -> 400), emitiendo siempre `{ "mensaje": "..." }`. Ante fallas de subida, se recorre `req.files` y se eliminan del disco los archivos escritos.
  - *Alternativa descartada*: Depender de los controladores individuales para capturar excesos de tamaño (Multer y Express rechazan la petición antes de llegar al controlador, dejando archivos huérfanos y páginas de error HTML si no hay middleware de error).
- **Decisión 5: Inmunidad IDOR, Anti-Price Tampering y Transacciones MySQL con `SELECT ... FOR UPDATE`**:
  - *Justificación*: Para evitar manipulaciones de identidad y de importes financieros, el servidor obtiene el identificador de usuario exclusivamente del token verificado (`req.usuario.id`) y lee los precios autoritativos desde la base de datos bloqueando las filas de producto (`FOR UPDATE`). Si `stock < item.cantidad`, responde unívocamente con `409 Conflict`. Si todo es correcto, ejecuta el pedido, detalles y actualización de inventario dentro de una transacción (`connection.beginTransaction()`, `connection.commit()`, con `connection.rollback()` y `connection.release()` garantizados en `catch`/`finally`).
  - *Alternativa descartada*: Confiar en el total enviado por el frontend (permite fraude por alteración de precios) o actualizar stock con consultas aisladas sin bloqueo (propicio a condiciones de carrera y existencias negativas en compras simultáneas).
- **Decisión 6: Representación de producto agotado exclusivamente mediante `stock = 0` y preservación de `estado` numérico**:
  - *Justificación*: La columna `estado` en la tabla `Productos` almacena la visibilidad en catálogo (`1` activo, `0` inactivo). La condición de agotado de un cosmético es puramente un estado de inventario (`stock = 0`). Se elimina cualquier intento de mutar la columna a cadenas de texto (como `'agotado'`), previniendo advertencias de truncamiento de datos en MySQL y asegurando que el producto permanezca visible en la tienda pero con la compra deshabilitada.
  - *Alternativa descartada*: Mutar `estado` a `0` al agotarse el stock (desaparecería completamente del catálogo sin que el cliente pueda ver la ficha ni saber que el producto existe).
- **Decisión 7: Desacoplamiento de la escucha de red (`require.main === module`)**:
  - *Justificación*: En `server/index.js`, la llamada `app.listen(PORT)` se confina al bloque condicional `if (require.main === module)`. Esto permite que la suite de pruebas importe `app` y Supertest cree instancias de prueba en puertos efímeros asignados por el sistema operativo, eliminando errores `EADDRINUSE` cuando el servidor de desarrollo ya está en ejecución en el puerto 5000.
  - *Alternativa descartada*: Modificar dinámicamente scripts de inicio o utilizar puertos fijos alternativos (propensos a colisiones entre procesos).

---

## 3. Estrategia de Pruebas

La verificación del plan se estructura en pruebas automatizadas y chequeos estáticos sin intervención humana requerida:

1. **Pruebas de Backend (`npm --prefix server test`)**:
   - Ejecuta `server/auditoria.test.js` (prueba de triggers existente) y `server/seguridad.test.js` (nueva suite integral de integración).
   - Cobertura de la nueva suite:
     - Emisión de cabeceras HTTP de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, `Cross-Origin-Resource-Policy`) y ausencia de `X-Powered-By` (RF-01).
     - Denegación de orígenes CORS no registrados con HTTP `403 Forbidden` JSON, aceptación de orígenes válidos y solicitudes sin cabecera `Origin` (RF-02).
     - Limitación de tasa con HTTP `429 Too Many Requests` estructurado ante solicitudes repetitivas usando la cabecera de prueba (RF-03).
     - Rechazo de cuerpos JSON > 100 KB con HTTP `413 Payload Too Large` JSON y sintaxis malformada con HTTP `400 Bad Request` JSON (RF-04).
     - Rechazo de cargas de archivos > 2 MB con HTTP `413`, más de 3 archivos con HTTP `400` y formatos inválidos con HTTP `400` JSON, verificando que no queden archivos huérfanos en disco (RF-04).
     - Rechazo de compra con HTTP `409 Conflict` cuando el stock es insuficiente, cálculo de total con precios reales de base de datos (*anti-price tampering*), asignación al ID del token ignorando el body (anti-IDOR), y validación de `total > 0` en pasarela de pagos (RF-05).
     - Validación de contraseñas (mínimo 8 caracteres, mayúscula, número) y correos en registro, restablecimiento y recuperación con HTTP `400` JSON, y retorno de HTTP `401 Unauthorized` ante token ausente o inválido (RF-06).
     - Ejecución sin colisión de puertos efímeros y limpieza garantizada de datos creados en pruebas (RF-07).
2. **Pruebas de Frontend (`npm --prefix client test -- --watchAll=false`)**:
   - Ejecución de las 5 suites existentes (`App.test.js`, `Carrito.test.js`, `TiendaVistas.test.js`, `CuentaLegalVistas.test.js`, `AdminVistas.test.js`), confirmando que las 36 pruebas siguen en verde al 100% tras alinear la validación de contraseñas en `RestablecerPassword.js`.
3. **Verificación Sintáctica y de Compilación**:
   - `node --check` sobre cada archivo backend creado o modificado (`server/index.js`, middlewares, controladores y tests).
   - `npm --prefix client run build`: Compilación de producción con código 0 y cero advertencias críticas de ESLint.

---

## 4. Matriz de Cobertura de RF

| Requisito Funcional | Componentes y Archivos de Código | Suite de Pruebas / Verificación |
| :--- | :--- | :--- |
| **RF-01** (Cabeceras HTTP Seguras y Ocultamiento de Huella) | `server/index.js` (`helmet`, `crossOriginResourcePolicy`, `app.disable('x-powered-by')`) | `server/seguridad.test.js` (inspección de cabeceras en GET `/` y `/img/*`) |
| **RF-02** (Política CORS Restringida por Entorno) | `server/index.js` (función origin dinámica, `FRONTEND_URL`, respuesta 403 en error handler) | `server/seguridad.test.js` (peticiones con Origin permitido, no permitido y sin Origin) |
| **RF-03** (Limitación de Tasa Cuantitativa) | `server/index.js` (`express-rate-limit` en `/api/auth/*`, skip en test con bypass por cabecera) | `server/seguridad.test.js` (ráfaga de peticiones con cabecera `x-test-rate-limit` verificando 429) |
| **RF-04** (Límites de Carga Útil y Archivos Seguros) | `server/index.js` (`express.json({ limit: '100kb' })`, manejador de errores), `server/middleware/uploadMiddleware.js` (limits 2MB / 3 files, fileFilter, limpieza `fs.unlink`), `server/controllers/productoController.js` | `server/seguridad.test.js` (POST JSON > 100 KB, JSON malformado, carga de archivo > 2 MB, > 3 archivos y extensión falsa) |
| **RF-05** (Inmunidad IDOR, Anti-Price Tampering y Transaccionalidad Atómica) | `server/controllers/pedidoController.js` (`req.usuario.id`, transacción MySQL `beginTransaction`/`commit`/`rollback`, `SELECT ... FOR UPDATE`, cálculo autoritativo, respuesta 409 Conflict, preservación numérico `Productos.estado`), `server/controllers/pagoController.js` | `server/seguridad.test.js` (compra con ID de body manipulado, total manipulado, stock insuficiente 409, pago con total <= 0) |
| **RF-06** (Validación de Entradas, Sanitización HTML y Manejo Seguro de Secretos) | `server/controllers/authController.js` (regex password y email, escape HTML, `FRONTEND_URL`), `server/controllers/usuarioController.js` (escape HTML), `server/utils/enviarFactura.js` (escape HTML), `server/middleware/authMiddleware.js` (HTTP 401 unificado), `client/src/components/RestablecerPassword.js` (regla de contraseña), `server/.env.example` | `server/seguridad.test.js`, `client/src/CuentaLegalVistas.test.js`, inspección de `.env.example` y auditoría de arranque |
| **RF-07** (Ejecución Aislada y Verificación Automatizada) | `server/index.js` (`require.main === module`), `server/package.json` (`npm test`), `server/seguridad.test.js` | `npm --prefix server test` (ejecución completa limpia sin colisiones `EADDRINUSE` ni datos residuales) |
