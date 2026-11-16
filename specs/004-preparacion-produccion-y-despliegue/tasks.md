# Tareas de Implementación: 004 - Preparación para Producción, Despliegue en la Nube y Estándar de Portafolio

**Plan:** `specs/004-preparacion-produccion-y-despliegue/plan.md`  
**Spec:** `specs/004-preparacion-produccion-y-despliegue/spec.md`  

---

- [x] **T1: Infraestructura de producción en Backend (Health Check, Proxy Inverso, Servido Estático `/img` y SSL Condicional)**
  - **RF Asociados:** RF-02.1, RF-02.2, RF-02.3, RF-03.1, RF-03.2, RF-04.1, RF-04.2, RF-04.3
  - **Perfil sugerido:** `pro` (ajustes en el ciclo de vida de Express, configuración de conexión TLS/SSL a MySQL y enrutamiento con CORS dual)
  - **Archivos:**
    - `server/index.js`
    - `server/config/db.js`
    - `server/.env.example`
  - **Hecho cuando:**
    1. `server/index.js` implementa `GET /api/health` con política `cors()` permisiva independiente, verificando la conexión a MySQL con `SELECT 1` y respondiendo con HTTP `200 OK` JSON `{ status: 'ok', database: 'connected', timestamp: '...' }` si está activa o con HTTP `503 Service Unavailable` JSON `{ status: 'error', database: 'disconnected', timestamp: '...' }` si la base de datos es inalcanzable, sin exponer credenciales ni trazas de error internas.
    2. Las rutas de negocio de la API (`/api/auth`, `/api/productos`, `/api/pedidos`, `/api/usuarios`, `/api/pagos`) mantienen intacto su rechazo CORS con HTTP `403 Forbidden` JSON ante orígenes no autorizados.
    3. `server/index.js` expone el directorio de imágenes bajo `/img` con `express.static` tras `helmet`, emitiendo la cabecera `Cross-Origin-Resource-Policy: cross-origin`.
    4. Se implementa el helper `parsearTrustProxy(process.env.TRUST_PROXY)` que configura `app.set('trust proxy', 1)` cuando `TRUST_PROXY` sea `'true'` o un entero positivo `>= 1`, permaneciendo desactivado (`false`) en desarrollo local.
    5. `server/config/db.js` exporta la función `construirOpcionesSSL(env)` que activa `{ rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED === 'true' }` cuando `env.DB_SSL === 'true'`, manteniendo la conexión no cifrada estándar cuando `DB_SSL` esté ausente o sea `'false'`.
    6. `server/index.js` y `server/config/db.js` resuelven `.env` de forma resiliente tanto desde la raíz del monorepo como desde la carpeta `server/`.
    7. `server/.env.example` documenta `DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED` y `TRUST_PROXY`.
    8. `node --check server/index.js` y `node --check server/config/db.js` finalizan con código 0.

- [x] **T2: Estandarización de nombres de tablas SQL a minúsculas en Backend y Pruebas**
  - **RF Asociados:** RF-03.3
  - **Perfil sugerido:** `pro` (refactorización exhaustiva de sentencias SQL en controladores y suites de prueba garantizando compatibilidad con MySQL sobre Linux)
  - **Archivos:**
    - `server/controllers/productoController.js`
    - `server/controllers/pedidoController.js`
    - `server/controllers/authController.js`
    - `server/controllers/usuarioController.js`
    - `server/auditoria.test.js`
    - `server/seguridad.test.js`
  - **Hecho cuando:**
    1. Todas las sentencias SQL en `productoController.js` usan la tabla `productos` en minúsculas.
    2. Todas las sentencias SQL en `pedidoController.js` usan `pedidos`, `detalles_pedido`, `productos` y `usuarios` en minúsculas.
    3. Todas las sentencias SQL en `authController.js` usan `usuarios` en minúsculas.
    4. Todas las sentencias SQL en `usuarioController.js` usan `usuarios` en minúsculas.
    5. `server/auditoria.test.js` y `server/seguridad.test.js` ejecutan sus consultas DML sobre tablas en minúsculas (`productos`, `usuarios`, `pedidos`, `detalles_pedido`, `auditoria`), preservando los valores literales de auditoría (`WHERE tabla_afectada = 'Productos'`).
    6. `node --check` finaliza con código 0 en todos los controladores modificados.
    7. `npm --prefix server test` pasa en verde con todas las pruebas existentes de `auditoria.test.js` y `seguridad.test.js` al 100%.

- [x] **T3: Parametrización de API, resolución determinista de imágenes y reglas de enrutamiento SPA en Frontend**
  - **RF Asociados:** RF-01.1, RF-01.2, RF-01.3, RF-01.4
  - **Perfil sugerido:** `pro` (creación de módulo centralizado de configuración, refactorización de llamadas HTTP en todas las vistas del frontend y reglas de distribución estática)
  - **Archivos:**
    - `client/src/config/api.js`
    - `client/src/App.js`
    - `client/src/components/Catalogo.js`
    - `client/src/components/Inicio.js`
    - `client/src/components/ProductoDetalle.js`
    - `client/src/components/Carrito.js`
    - `client/src/components/Login.js`
    - `client/src/components/Registro.js`
    - `client/src/components/RecuperarPassword.js`
    - `client/src/components/RestablecerPassword.js`
    - `client/src/components/Perfil.js`
    - `client/src/components/MisPedidos.js`
    - `client/src/components/admin/AdminInventario.js`
    - `client/src/components/admin/AdminVentas.js`
    - `client/src/components/admin/AdminMetricas.js`
    - `client/src/components/admin/AdminUsuarios.js`
    - `client/.env.example`
    - `client/public/_redirects`
    - `client/vercel.json`
  - **Hecho cuando:**
    1. Se crea `client/src/config/api.js` exportando:
       - `API_URL`: normalizada a partir de `process.env.REACT_APP_API_URL`, con respaldo automático en `http://localhost:5000` si está ausente o vacía.
       - `obtenerUrlImagen(ruta)`: retorna `''` si es nula/vacía, la URL intacta si es absoluta (`http://`, `https://`, `data:`), y antepone `${API_URL}/` si es relativa de catálogo (`/img/...` o `img/...`) sin dobles barras (`//`).
    2. Todos los componentes de `client/src/components/` y `client/src/components/admin/` sustituyen `http://localhost:5000` por `${API_URL}` y usan `obtenerUrlImagen` en las etiquetas `img` de catálogo.
    3. Los recursos estáticos propios del shell visual (`/logo.png`, fondo hero) continúan resolviéndose desde el origen local del frontend.
    4. Se crea `client/public/_redirects` con la regla `/* /index.html 200` y `client/vercel.json` con la reescritura hacia `/index.html`.
    5. `client/.env.example` documenta `REACT_APP_API_URL` y `REACT_APP_STRIPE_PUBLISHABLE_KEY` con notas explicativas sobre el respaldo automático a `http://localhost:5000`.
    6. `npm --prefix client test -- --watchAll=false` aprueba al 100% las 36 pruebas existentes sin fallos de mock.
    7. `npm --prefix client run build` compila con código de salida 0 y cero advertencias de ESLint.

- [x] **T4: Scripts SQL reproducibles de esquema idempotente y datos semilla con credenciales de demo seguras**
  - **RF Asociados:** RF-05.1, RF-05.2
  - **Perfil sugerido:** `pro` (generación de scripts DDL y DML estructurados para MySQL 8 sobre Linux con hashes criptográficos y delimitadores)
  - **Archivos:**
    - `database/schema.sql`
    - `database/seed.sql`
  - **Hecho cuando:**
    1. `database/schema.sql` crea la base de datos `afrolash_db` y las 5 tablas físicas en minúsculas en orden foráneo estricto (`usuarios`, `productos`, `pedidos`, `detalles_pedido`, `auditoria`) usando `CREATE TABLE IF NOT EXISTS`, con claves primarias, claves foráneas con reglas de integridad referencial (`ON DELETE CASCADE` en pedidos/detalles y `ON DELETE RESTRICT` en producto) e índices de búsqueda.
    2. `database/schema.sql` declara los 6 disparadores de auditoría (`trg_pedidos_update`, `trg_productos_insert`, `trg_productos_update`, `trg_productos_delete`, `trg_usuarios_update`, `trg_usuarios_delete`) con `DROP TRIGGER IF EXISTS` y delimitadores estándar `DELIMITER // ... DELIMITER ;`.
    3. `database/seed.sql` puebla el catálogo inicial de productos cosméticos referenciando imágenes existentes en `client/public/img/` (`rimel.png`, `lapiz_cejas.png`, `serum_crecimiento.png`, etc.) con precios, existencias y detalles completos.
    4. `database/seed.sql` crea cuentas de usuario de demostración para los roles `admin` (`admin@afrolash.com`), `empleado` (`empleado@afrolash.com`) y `cliente` (`cliente@afrolash.com`) con contraseñas seguras pre-hasheadas con `bcryptjs` (salt rounds 10) que cumplen con la política de seguridad de la Spec 003.
    5. Ambos scripts son idempotentes y ejecutable de principio a fin sin errores sintácticos en clientes MySQL estándar.

- [x] **T5: Documentación profesional de portafolio y guía técnica de despliegue en la nube gratuita**
  - **RF Asociados:** RF-06.1, RF-06.2
  - **Perfil sugerido:** `flash` (redacción exhaustiva de documentación técnica en Markdown con enfoque editorial y de portafolio)
  - **Archivos:**
    - `README.md`
    - `docs/deployment.md`
  - **Hecho cuando:**
    1. `README.md` presenta la solución como proyecto de portafolio profesional: título, descripción editorial de Afrolash, arquitectura desacoplada full-stack (React 19 + Express 5 + MySQL 8), diagrama visual, stack tecnológico, resumen de seguridad OWASP Top 10, flujo de trabajo multiagente SDD, guía de instalación local paso a paso, comandos de prueba y credenciales de acceso de demostración.
    2. `docs/deployment.md` proporciona la guía paso a paso 100% gratuita para desplegar:
       - Base de datos relacional en Aiven for MySQL (o TiDB Serverless) con TLS/SSL y ejecución de `schema.sql` y `seed.sql`.
       - API Backend en Render Web Services con `Root Directory: .` y comandos `--prefix server`, detallando todas las variables de entorno necesarias y la advertencia sobre el almacenamiento efímero en planes gratuitos.
       - Frontend SPA en Vercel (o Netlify) con variables de entorno y soporte de enrutamiento SPA.
       - Flujo continuo de actualización local y publicación mediante `git push origin main`.
    3. Ambos documentos están redactados en español formal, con formato Markdown estandarizado y enlaces relativos válidos.

- [x] **T6: Suite automatizada de pruebas de producción y verificación de cero regresiones**
  - **RF Asociados:** RF-07.1, RF-07.2
  - **Perfil sugerido:** `pro` (creación de la suite de pruebas de producción con Supertest, verificación de todas las capas modificadas y comprobación integral del monorepo)
  - **Archivos:**
    - `server/produccion.test.js`
  - **Hecho cuando:**
    1. Se crea la suite `server/produccion.test.js` verificando con Supertest sobre `app`:
       - `GET /api/health` responde con HTTP `200 OK` JSON `{ status: 'ok', database: 'connected' }` y cuenta con cabeceras CORS permisivas.
       - `GET /api/health` responde con HTTP `503 Service Unavailable` JSON `{ status: 'error', database: 'disconnected' }` ante fallos simulados de base de datos sin exponer trazas de error.
       - `GET /img/...` sirve archivos estáticos con cabecera `Cross-Origin-Resource-Policy: cross-origin`.
       - Pruebas unitarias de `parsearTrustProxy` y `construirOpcionesSSL`.
       - Consultas a tablas en minúsculas en MySQL sin errores.
    2. `npm --prefix server test` pasa en verde al 100% ejecutando las 3 suites (`auditoria.test.js`, `seguridad.test.js`, `produccion.test.js`).
    3. `npm --prefix client test -- --watchAll=false` pasa en verde al 100% con las 5 suites de frontend (36 pruebas).
    4. `npm --prefix client run build` compila con código 0 y cero advertencias.
    5. `node --check` pasa en todos los archivos modificados de backend.
