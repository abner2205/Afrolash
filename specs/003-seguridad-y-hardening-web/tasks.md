# Tareas de Implementación: 003 - Seguridad y Hardening Web

**Plan:** `specs/003-seguridad-y-hardening-web/plan.md`  
**Spec:** `specs/003-seguridad-y-hardening-web/spec.md`  

---

- [x] **T1: Dependencias de seguridad, cabeceras HTTP, política CORS por entorno y desacoplamiento de puerto**
  - **RF Asociados:** RF-01.1, RF-01.2, RF-01.3, RF-02.1, RF-02.2, RF-02.3, RF-02.4, RF-07.2
  - **Perfil sugerido:** `pro` (modificación central de la infraestructura de servidor, instalación de paquetes e interceptores de red)
  - **Archivos:**
    - `server/package.json`
    - `server/index.js`
  - **Hecho cuando:**
    1. Las dependencias `helmet` y `express-rate-limit` quedan registradas en `server/package.json` e instaladas limpiamente.
    2. `server/index.js` desacopla la escucha del puerto (`app.listen`) mediante `if (require.main === module)` permitiendo la importación de `app` en tests sin abrir el puerto de red.
    3. `helmet` está activo con política de recursos cruzados `crossOriginResourcePolicy: { policy: 'cross-origin' }` y la cabecera `X-Powered-By` está deshabilitada.
    4. La configuración de `cors` utiliza `FRONTEND_URL` (con respaldo en `http://localhost:3000`), rechaza orígenes no autorizados emitiendo HTTP `403 Forbidden` JSON `{ "mensaje": "Acceso denegado por política de origen (CORS)." }` sin cabeceras `Access-Control-Allow-Origin`, y admite solicitudes sin cabecera `Origin`.
    5. `node --check server/index.js` finaliza con código 0 sin errores de sintaxis.

- [x] **T2: Limitación de tasa (Rate Limiting), control de tamaño de cuerpo JSON (100 KB) y manejo centralizado de errores JSON**
  - **RF Asociados:** RF-03.1, RF-03.2, RF-03.3, RF-03.4, RF-04.1, RF-04.2
  - **Perfil sugerido:** `flash` (configuración acotada de limitador de tasa con bypass condicional para pruebas, ajuste del parser JSON y middleware de errores estándar)
  - **Archivos:**
    - `server/index.js`
  - **Hecho cuando:**
    1. El limitador de tasa aplica a `/api/auth/login`, `/api/auth/registro`, `/api/auth/recuperar-password` y `/api/auth/restablecer-password/:id/:token` un límite de 15 solicitudes cada 15 minutos, respondiendo con HTTP `429 Too Many Requests`, cabecera `Retry-After` y formato JSON `{ "mensaje": "Demasiadas solicitudes realizadas. Por favor, intente nuevamente más tarde." }`.
    2. En `NODE_ENV === 'test'`, el limitador omite el bloqueo ordinario salvo que se envíe la cabecera de control `x-test-rate-limit: true`.
    3. `express.json` restringe el tamaño de cuerpo a un máximo de `100kb`.
    4. Un middleware centralizado de error captura excepciones de sintaxis JSON (`400 Bad Request`) y excesos de tamaño (`413 Payload Too Large`), emitiendo siempre payloads JSON estructurados `{ "mensaje": "..." }` sin trazas internas del servidor ni HTML.
    5. `node --check server/index.js` finaliza con código 0.

- [x] **T3: Endurecimiento de carga de archivos (Multer) con límites (2 MB / 3 archivos) y limpieza automática de archivos en disco**
  - **RF Asociados:** RF-04.3, RF-04.4
  - **Perfil sugerido:** `pro` (control riguroso de excepciones de subida multiparte, sanitización de extensiones/MIME y eliminación física en disco con `fs.unlink`)
  - **Archivos:**
    - `server/middleware/uploadMiddleware.js`
    - `server/controllers/productoController.js`
    - `server/index.js`
  - **Hecho cuando:**
    1. `uploadMiddleware.js` aplica en Multer el límite estricto de `fileSize: 2 * 1024 * 1024` (2 MB) y valida extensiones y tipos MIME JPEG, JPG, PNG y WEBP.
    2. Las rutas administrativas de producto limitan la carga a un máximo de 3 archivos en total (fotografía principal, instrucciones y consejos).
    3. Si se sube un archivo mayor a 2 MB, el manejador de errores responde con HTTP `413 Payload Too Large` JSON `{ "mensaje": "..." }`; si se supera el número de archivos o el formato no es válido, responde con HTTP `400 Bad Request` JSON `{ "mensaje": "..." }`.
    4. Toda solicitud de subida rechazada elimina de inmediato del directorio `client/public/img/` cualquier archivo parcial o previo que se hubiese escrito durante dicha petición.
    5. `node --check` sobre los tres archivos modificados finaliza con código 0.

- [x] **T4: Transaccionalidad atómica en pedidos, anti-price tampering, prevención de IDOR y validación de pagos**
  - **RF Asociados:** RF-05.1, RF-05.2, RF-05.3, RF-05.4, RF-05.5, RF-05.6
  - **Perfil sugerido:** `pro` (transacciones MySQL atómicas con `getConnection`, `beginTransaction`, `commit`, `rollback`, `release`, consultas con bloqueo `FOR UPDATE`, recálculo de precios en servidor y validación de pagos)
  - **Archivos:**
    - `server/controllers/pedidoController.js`
    - `server/controllers/pagoController.js`
  - **Hecho cuando:**
    1. `/api/pedidos/procesar` asocia la orden exclusivamente a `req.usuario.id`, ignorando incondicionalmente cualquier `id_usuario` enviado en el cuerpo.
    2. Se valida que el carrito sea una lista con al menos 1 ítem, cantidades enteras mayores a 0, y datos de envío presentes (respondiendo con HTTP `400 Bad Request` JSON ante datos no válidos).
    3. Se ejecuta una transacción MySQL atómica que bloquea las filas de inventario (`SELECT ... FOR UPDATE`), verifica existencias y responde unívocamente con HTTP `409 Conflict` JSON `{ "mensaje": "..." }` si el stock no cubre la cantidad solicitada.
    4. Los precios unitarios y el total del pedido se recalculan autoritativamente desde la base de datos (*anti-price tampering*), descartando totales o precios manipulados por el cliente.
    5. Ante cualquier error o insuficiencia, la transacción se revierte íntegramente (`rollback()`) y la conexión se libera (`release()`), impidiendo pedidos huérfanos o existencias negativas.
    6. Cuando el stock llega a 0, el producto preserva su visibilidad numérica en `estado` (`1` activo, `0` inactivo) sin mutar a cadenas como `'agotado'`.
    7. `/api/pagos/crear-intencion` valida que el importe sea numérico finito estrictamente mayor a 0, respondiendo con HTTP `400 Bad Request` JSON si es inválido.
    8. `node --check` sobre `pedidoController.js` y `pagoController.js` finaliza con código 0.

- [x] **T5: Validación estricta de entradas, unificación de respuesta 401 en autenticación, sanitización de correos salientes y sincronización frontend**
  - **RF Asociados:** RF-06.1, RF-06.2, RF-06.3, RF-06.4
  - **Perfil sugerido:** `pro` (validaciones con expresiones regulares de contraseñas y correos, utilidad de escape HTML, corrección de status HTTP en token expirado, auditoría de arranque y sincronización de UI)
  - **Archivos:**
    - `server/middleware/authMiddleware.js`
    - `server/controllers/authController.js`
    - `server/controllers/usuarioController.js`
    - `server/utils/enviarFactura.js`
    - `server/.env.example`
    - `client/src/components/RestablecerPassword.js`
  - **Hecho cuando:**
    1. `authMiddleware.js` responde unívocamente con HTTP `401 Unauthorized` JSON `{ "mensaje": "Token inválido o expirado." }` ante firmas inválidas, tokens malformados o vigencia caducada.
    2. `/api/auth/registro` y `/api/auth/restablecer-password/:id/:token` exigen contraseñas de al menos 8 caracteres, al menos una mayúscula y al menos un número, y correos con formato válido, respondiendo con HTTP `400 Bad Request` JSON si no cumplen.
    3. `/api/auth/recuperar-password` valida presencia y sintaxis de correo con HTTP `400 Bad Request` JSON antes de consultar la BD, y responde con HTTP `200` genérico únicamente para correos sintácticamente válidos.
    4. Los correos salientes (bienvenida de empleado, recuperación y factura) escapan caracteres HTML (`&`, `<`, `>`, `"`, `'`) en campos provistos por usuarios para prevenir inyección HTML, y los enlaces de recuperación emplean `FRONTEND_URL`.
    5. `RestablecerPassword.js` en el frontend actualiza su validación local de contraseña (mínimo 8 caracteres, una mayúscula y un número) en el modal accesible sin alterar el sistema visual.
    6. `server/index.js` audita en el arranque que `JWT_SECRET` y credenciales de BD existan en entornos normales/producción, y `server/.env.example` lista todas las variables requeridas.
    7. `node --check` sobre todos los archivos de backend finaliza con código 0, `npm --prefix client test -- --watchAll=false` aprueba las 36 pruebas de frontend en verde y `npm --prefix client run build` compila limpiamente con código 0 y cero warnings.

- [x] **T6: Suite automatizada de pruebas de integración de seguridad y verificación integral**
  - **RF Asociados:** RF-07.1, RF-07.2 (y verificación completa de RF-01 a RF-06)
  - **Perfil sugerido:** `pro` (creación de la suite `server/seguridad.test.js` con Supertest, aislamiento de puertos efímeros, cobertura integral de todos los RFs y validación final de suites completas)
  - **Archivos:**
    - `server/seguridad.test.js`
  - **Hecho cuando:**
    1. Se crea la suite `server/seguridad.test.js` verificando con Supertest sobre `app`:
       - Emisión de cabeceras de seguridad Helmet (`X-Frame-Options`, `X-Content-Type-Options`, `Cross-Origin-Resource-Policy`) y ausencia de `X-Powered-By`.
       - Denegación de orígenes no registrados con HTTP `403 Forbidden` JSON sin cabecera de origen, y aceptación de orígenes permitidos y solicitudes sin cabecera `Origin`.
       - Limitación de tasa con HTTP `429 Too Many Requests` ante ráfagas usando `x-test-rate-limit`.
       - Rechazo de cuerpos JSON > 100 KB con HTTP `413` y JSON malformado con HTTP `400` en formato JSON.
       - Rechazo de carga de archivo > 2 MB con HTTP `413` y verificación de limpieza de archivos parciales en disco.
       - Prevención de IDOR e inmunidad de precio en `/api/pedidos/procesar` tomando identidad del token y recalculando precios desde BD.
       - Rechazo por stock insuficiente con HTTP `409 Conflict` JSON sin alterar existencias ni dejar pedidos huérfanos.
       - Validación de pagos con importe menor o igual a 0 con HTTP `400 Bad Request` JSON.
       - Validación de contraseñas y correos en autenticación con HTTP `400` y token inválido/expirado con HTTP `401`.
       - Ejecución sobre puertos efímeros sin colisiones `EADDRINUSE` y limpieza de registros creados durante las pruebas.
    2. `npm --prefix server test` aprueba el 100% de las pruebas (`auditoria.test.js` y `seguridad.test.js`) en verde.
    3. `npm --prefix client test -- --watchAll=false` pasa en verde al 100% (36 pruebas).
    4. `npm --prefix client run build` compila con código 0 y cero advertencias.
