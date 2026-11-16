# Plan de Implementación: 004 - Preparación para Producción, Despliegue en la Nube y Estándar de Portafolio

**Spec de referencia:** `specs/004-preparacion-produccion-y-despliegue/spec.md`

---

## 1. Arquitectura y Componentes Afectados

La implementación prepara a **Afrolash** para operar en un entorno de producción desacoplado en la nube 100% gratuito (Vercel/Netlify + Render + Aiven/TiDB) y como carta de presentación de portafolio profesional, manteniendo intacta la compatibilidad local:

```text
[Vercel / Netlify (Frontend React 19 SPA)]
  │
  ├─ `client/src/config/api.js` (API_URL con fallback local y obtenerUrlImagen determinista)
  ├─ Enrutamiento SPA sin 404 (`client/public/_redirects` y `client/vercel.json`)
  └─ Consumo de imágenes `/img/...` hacia la API en Render
         │
         ▼ (HTTPS Cross-Origin con CORP)
┌────────────────────────────────────────────────────────────────────────┐
│ Render Web Service (API Node.js / Express 5)                           │
│  ├─ GET /api/health (CORS permisivo propio, status 200/503 con MySQL) │
│  ├─ GET /img/* (express.static público con CORP: cross-origin)        │
│  ├─ app.set('trust proxy', 1) (salto exacto vía TRUST_PROXY)           │
│  ├─ CORS restrictivo de negocio (403 Forbidden para rutas /api/*)     │
│  └─ Carga resiliente de .env desde raíz o subdirectorio               │
└────────────────────────────────────────────────────────────────────────┘
         │
         ▼ (Conexión TLS/SSL condicional: DB_SSL=true)
┌────────────────────────────────────────────────────────────────────────┐
│ Aiven for MySQL / TiDB Serverless (Cloud MySQL 8 sobre Linux)         │
│  ├─ 5 tablas físicas en minúsculas: usuarios, productos, pedidos,      │
│  │  detalles_pedido, auditoria (lower_case_table_names=0 compatible)   │
│  ├─ 6 disparadores de auditoría activos (DELIMITER //)                 │
│  └─ Integridad referencial: ON DELETE CASCADE y ON DELETE RESTRICT     │
└────────────────────────────────────────────────────────────────────────┘
```

### Capas y Archivos Afectados

1. **Infraestructura de Servidor Backend (`server/`)**:
   - `server/index.js`:
     - Endpoint público de diagnóstico `GET /api/health` montado con su propia política `cors()` permisiva (permitiendo solicitudes de cualquier `Origin` y sin `Origin` para monitores externos), que evalúa la conectividad a MySQL con `SELECT 1` respondiendo `200 OK` (`{ status: 'ok', database: 'connected' }`) o `503 Service Unavailable` (`{ status: 'error', database: 'disconnected' }`) sin exponer trazas internas.
     - Configuración de confianza en proxy inverso numéricamente exacta mediante helper `parsearTrustProxy(process.env.TRUST_PROXY)` (asignando `1` cuando valga `'true'` o el entero positivo configurado, y `false` en caso contrario para desarrollo local), cumpliendo con `express-rate-limit`.
     - Exposición pública y estática de imágenes en `app.use('/img', express.static(destinoImagenes))` situada tras `helmet`, heredando la cabecera `Cross-Origin-Resource-Policy: cross-origin`.
     - Carga de entorno resiliente con `dotenv.config({ path: path.resolve(__dirname, '.env') })` que resuelve `.env` indistintamente al ejecutar desde la raíz del monorepo o desde `server/`.
   - `server/config/db.js`:
     - Función exportada `construirOpcionesSSL(env = process.env)` que habilita `{ rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED === 'true' }` cuando `env.DB_SSL === 'true'`, omitiendo la propiedad `ssl` por defecto en desarrollo local.
   - `server/.env.example`:
     - Documentación de las nuevas variables de entorno de producción (`DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`, `TRUST_PROXY`).

2. **Controladores y Consultas SQL Backend (`server/controllers/`, `server/*.test.js`)**:
   - `server/controllers/productoController.js`: Estandarización de sentencias SQL a minúsculas (`SELECT * FROM productos WHERE estado = 1`, `INSERT INTO productos ...`, `UPDATE productos ...`, `DELETE FROM productos ...`).
   - `server/controllers/pedidoController.js`: Estandarización de consultas a minúsculas (`SELECT ... FROM productos`, `INSERT INTO pedidos ...`, `INSERT INTO detalles_pedido ...`, `UPDATE productos ...`, `UPDATE usuarios ...`, `SELECT ... FROM pedidos`).
   - `server/controllers/authController.js`: Estandarización a minúsculas (`SELECT id_usuario FROM usuarios WHERE correo = ?`, `INSERT INTO usuarios ...`, `SELECT * FROM usuarios ...`, `UPDATE usuarios ...`).
   - `server/controllers/usuarioController.js`: Estandarización a minúsculas en listado, creación y eliminación de empleados (`SELECT ... FROM usuarios`, `INSERT INTO usuarios ...`, `DELETE FROM usuarios ...`).
   - `server/auditoria.test.js` y `server/seguridad.test.js`: Estandarización de nombres de tablas físicas a minúsculas (`productos`, `usuarios`, `pedidos`, `detalles_pedido`, `auditoria`), preservando los valores literales de auditoría (`WHERE tabla_afectada = 'Productos'`).

3. **Arquitectura y Enrutamiento en Frontend SPA (`client/`)**:
   - `client/src/config/api.js`:
     - Módulo centralizado que exporta `API_URL` (leyendo `REACT_APP_API_URL` y normalizando barras finales, con respaldo automático a `http://localhost:5000`).
     - Función utilitaria determinista `obtenerUrlImagen(ruta)`:
       - Retorna `''` si la ruta es nula, vacía o no es string.
       - Retorna la ruta intacta si es una URL absoluta (`http://`, `https://`) o `data:`.
       - Normaliza y antepone `${API_URL}/` si es una ruta relativa de catálogo (`/img/...` o `img/...`) evitando dobles barras diagonales (`//`).
   - Componentes de vista en `client/src/components/`:
     - Reemplazo de URLs fijas `http://localhost:5000` por `${API_URL}` y aplicación de `obtenerUrlImagen(...)` en el renderizado de imágenes de catálogo en: `Catalogo.js`, `Inicio.js`, `ProductoDetalle.js`, `Carrito.js`, `Login.js`, `Registro.js`, `RecuperarPassword.js`, `RestablecerPassword.js`, `Perfil.js`, `MisPedidos.js`.
     - Preservación de rutas relativas locales para activos estáticos propios del shell SPA (`/logo.png`, `${process.env.PUBLIC_URL}/fondo-hero.jpg`).
   - Subcomponentes administrativos en `client/src/components/admin/`:
     - Uso de `API_URL` y `obtenerUrlImagen` en `AdminInventario.js`, `AdminVentas.js`, `AdminMetricas.js`, `AdminUsuarios.js`.
   - Entorno y Servidores Estáticos:
     - `client/.env.example`: Documentación con comentarios explicativos sobre el respaldo local automático (`REACT_APP_API_URL` y `REACT_APP_STRIPE_PUBLISHABLE_KEY`).
     - `client/public/_redirects`: Regla `/* /index.html 200` para Netlify y servidores compatibles.
     - `client/vercel.json`: Configuración de reescritura de rutas (`rewrites: [{ source: "/(.*)", destination: "/index.html" }]`) para Vercel.

4. **Definición de Base de Datos y Semillas (`database/`)**:
   - `database/schema.sql`: Script DDL idempotente ejecutable en cualquier cliente MySQL sobre Linux, creando la base de datos `afrolash_db`, las 5 tablas físicas en minúsculas en orden foráneo estricto (`usuarios`, `productos`, `pedidos`, `detalles_pedido`, `auditoria`) con `CREATE TABLE IF NOT EXISTS`, claves primarias, claves foráneas con reglas de integridad referencial (`ON DELETE CASCADE` y `ON DELETE RESTRICT`) e índices; y los 6 disparadores de auditoría con `DROP TRIGGER IF EXISTS` y delimitadores estándar `DELIMITER // ... DELIMITER ;`.
   - `database/seed.sql`: Script DML idempotente con catálogo inicial de productos cosméticos referenciando imágenes existentes en `client/public/img/` (`rimel.png`, `lapiz_cejas.png`, `serum_crecimiento.png`, etc.) y cuentas de demostración para evaluadores (`admin@afrolash.com`, `empleado@afrolash.com`, `cliente@afrolash.com`) con contraseñas seguras pre-hasheadas con `bcryptjs` (salt rounds 10).

5. **Documentación de Portafolio y Guías (`README.md`, `docs/`)**:
   - `README.md`: Presentación exhaustiva de nivel profesional orientada a reclutadores y evaluadores técnicos (visión del producto, arquitectura full-stack, tecnologías clave, medidas de seguridad OWASP, metodología SDD, guía de instalación local, pruebas automatizadas y credenciales de demo).
   - `docs/deployment.md`: Guía paso a paso 100% gratuita para desplegar en la nube (Aiven/TiDB + Render con Root Directory `.` y `--prefix server` + Vercel/Netlify), variables de entorno, consideraciones del almacenamiento efímero y CI/CD con GitHub.

6. **Suite Automatizada de Pruebas de Producción (`server/produccion.test.js`)**:
   - Suite con Jest + Supertest sobre la instancia exportada de `app` verificando:
     - Endpoint `/api/health` en estado operativo `200` y con fallo de base de datos simulado en `503`.
     - Política CORS permisiva exclusiva en `/api/health` frente al CORS restrictivo en rutas de negocio.
     - Servido estático de `/img` con cabecera `Cross-Origin-Resource-Policy: cross-origin`.
     - Helpers unitarios `construirOpcionesSSL` y `parsearTrustProxy`.
     - Ejecución de consultas sobre tablas en minúsculas.

---

## 2. Decisiones Técnicas y Alternativas Descartadas

- **Decisión 1: Endpoint `/api/health` con política CORS permisiva independiente**:
  - *Justificación*: Los monitores de uptime y balanceadores de carga en la nube (Render, UptimeRobot, Better Uptime) efectúan peticiones HTTP sin cabecera de origen o con orígenes arbitrarios de monitoreo. Si `/api/health` se situara detrás del middleware general de CORS restrictivo de la Spec 003, recibiría un HTTP `403 Forbidden` JSON y reportaría el servicio como caído. Montar `app.get('/api/health', cors(), ...)` con su propio middleware permisivo garantiza acceso universal de diagnóstico sin debilitar en absoluto el bloqueo CORS `403` sobre las rutas de negocio (`/api/auth`, `/api/productos`, `/api/pedidos`, etc.).
  - *Alternativa descartada*: Incluir comodines en `FRONTEND_URL` (descartada porque expondría los endpoints transaccionales y de autenticación a cualquier origen web).
- **Decisión 2: Configuración de `TRUST_PROXY` con saltos numéricos exactos (`1` para `'true'`)**:
  - *Justificación*: Render y Vercel terminan TLS a través de un único balanceador de carga/proxy inverso frontal. `express-rate-limit` desaconseja y genera advertencias cuando se utiliza la configuración booleana permisiva `trust proxy: true` porque permitiría a clientes maliciosos falsificar cabeceras intermedias `X-Forwarded-For`. La función `parsearTrustProxy` traduce `'true'` al entero `1` (1 salto de proxy de confianza) o admite enteros configurados, permaneciendo en `false` en desarrollo local.
  - *Alternativa descartada*: Dejar `trust proxy` siempre en `false` (provocaría que todos los usuarios compartan el contador de rate limiting en Render al registrar la misma IP del proxy) o usar `true` booleano (inseguro ante IP spoofing).
- **Decisión 3: Servido estático `/img` tras `helmet` en Backend Express**:
  - *Justificación*: El frontend SPA desplegado en Vercel necesita cargar imágenes dinámicas servidas por la API en Render. Al montar `app.use('/img', express.static(destinoImagenes))` después de `helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })`, las respuestas de imágenes incluyen automáticamente la cabecera CORP necesaria para que los navegadores no bloqueen los recursos en solicitudes cross-origin.
  - *Alternativa descartada*: Alojar imágenes en un bucket S3 de pago (descartada porque el requerimiento exige herramientas 100% gratuitas) o subirlas al repositorio Git en runtime (imposible en sistemas de archivos en la nube sin commit).
- **Decisión 4: Módulo centralizado `client/src/config/api.js` con respaldo local automático**:
  - *Justificación*: Centraliza la resolución de URLs en un único punto. En desarrollo local y en las suites de pruebas de Jest/RTL donde `process.env.REACT_APP_API_URL` no está definida, `API_URL` evalúa exactamente a `'http://localhost:5000'`, lo que preserva intactos todos los mocks y expectativas de las pruebas existentes (`expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/registro', ...)`).
  - *Alternativa descartada*: Reemplazar todas las URLs por rutas relativas `/api/...` (descartada porque Create React App requeriría proxy inverso en desarrollo y fallaría en Vercel al estar la API en un dominio diferente).
- **Decisión 5: Estandarización a minúsculas de tablas SQL para MySQL sobre Linux**:
  - *Justificación*: En servidores MySQL sobre Linux (como Aiven, TiDB, Ubuntu o contenedores Docker), el parámetro `lower_case_table_names=0` hace que los nombres de tablas sean sensibles a mayúsculas. Estandarizar todas las sentencias SQL a minúsculas (`usuarios`, `productos`, `pedidos`, `detalles_pedido`, `auditoria`) resuelve de raíz cualquier error `Table doesn't exist`, mientras que conservar los literales `'Pedidos'`, `'Productos'`, `'Usuarios'` en `auditoria.tabla_afectada` mantiene la coherencia histórica de los disparadores y sus pruebas.
  - *Alternativa descartada*: Modificar la configuración de Linux en proveedores cloud administrados (inviable, ya que los planes gratuitos de DBaaS no permiten modificar parámetros del sistema operativo).
- **Decisión 6: Despliegue en Render desde la raíz del monorepo (`Root Directory: .`) con `--prefix server`**:
  - *Justificación*: Al configurar `Root Directory: .` en Render y ejecutar `npm --prefix server install` y `npm --prefix server start`, la ruta relativa de Multer `../../client/public/img` hacia el almacenamiento local de imágenes sigue siendo válida dentro del contenedor.
  - *Alternativa descartada*: Desplegar Render con `Root Directory: server` (rompería las rutas relativas de Multer que buscan `client/public/img` dos niveles arriba al no existir la carpeta `client` dentro del contexto de build).

---

## 3. Estrategia de Pruebas

La validación del plan garantiza cero regresiones y verificación completa de la portabilidad a producción:

1. **Pruebas de Backend (`npm --prefix server test`)**:
   - `server/auditoria.test.js`: Disparadores de auditoría con tablas en minúsculas en verde.
   - `server/seguridad.test.js`: Suite completa de seguridad OWASP (Spec 003) en verde al 100%.
   - `server/produccion.test.js` (Nueva suite):
     - `GET /api/health`: Retorno de HTTP `200 OK` JSON con base de datos activa y presencia de cabecera CORS permisiva.
     - `GET /api/health`: Retorno controlado de HTTP `503 Service Unavailable` JSON al simular falla o rechazo de conexión en el pool.
     - `GET /img/:archivo`: Servido estático de imagen con cabecera `Cross-Origin-Resource-Policy: cross-origin`.
     - `parsearTrustProxy`: Pruebas unitarias para `'true'` -> `1`, `'2'` -> `2`, `'false'` -> `false`, `undefined` -> `false`.
     - `construirOpcionesSSL`: Pruebas unitarias para `DB_SSL='true'`, `DB_SSL_REJECT_UNAUTHORIZED='true'/'false'` y `undefined`.
     - Consultas sobre tablas en minúsculas sin errores de sintaxis.
2. **Pruebas de Frontend (`npm --prefix client test -- --watchAll=false`)**:
   - Ejecución de las 5 suites de frontend (`App.test.js`, `Carrito.test.js`, `TiendaVistas.test.js`, `CuentaLegalVistas.test.js`, `AdminVistas.test.js`), confirmando que las 36 pruebas existentes pasan al 100% en verde con `API_URL` por defecto (`http://localhost:5000`) y con la resolución determinista de imágenes.
3. **Verificación Estática y Compilación de Producción**:
   - `node --check` sobre cada archivo backend modificado o creado (`server/index.js`, `server/config/db.js`, controladores, tests).
   - `npm --prefix client run build`: Compilación de producción con código 0 y cero advertencias críticas de ESLint, verificando que los archivos `_redirects` y `vercel.json` queden listos para distribución estática.

---

## 4. Matriz de Cobertura de RF

| Requisito Funcional | Componentes y Archivos de Código | Suite de Pruebas / Verificación |
| :--- | :--- | :--- |
| **RF-01** (Parametrización API, Imágenes y Enrutamiento SPA) | `client/src/config/api.js`, `client/src/components/*.js`, `client/src/components/admin/*.js`, `client/.env.example`, `client/public/_redirects`, `client/vercel.json` | `client/src/*.test.js` (36 pruebas pasando), `npm --prefix client run build` |
| **RF-02** (Servicio Estático `/img`, Proxy Inverso y Carga de Entorno) | `server/index.js` (`express.static`, `parsearTrustProxy`, `dotenv.config`), `server/.env.example` | `server/produccion.test.js` (pruebas de `/img`, CORP y trust proxy) |
| **RF-03** (SSL Condicional MySQL Cloud y Tablas en Minúsculas) | `server/config/db.js` (`construirOpcionesSSL`), `server/controllers/*.js` (consultas en minúsculas), `server/.env.example` | `server/produccion.test.js`, `server/auditoria.test.js`, `server/seguridad.test.js` |
| **RF-04** (Endpoint Público de Diagnóstico `/api/health`) | `server/index.js` (`GET /api/health`, `cors()` permisivo dedicado, consulta `SELECT 1`, HTTP 200/503 JSON) | `server/produccion.test.js` (verificación de 200 OK, 503 error y cabecera CORS) |
| **RF-05** (Scripts SQL Reproducibles: `schema.sql` y `seed.sql`) | `database/schema.sql` (tablas en minúsculas, FK con ON DELETE, 6 triggers `DELIMITER //`), `database/seed.sql` (catálogo base e imágenes existentes, usuarios demo con hashes `bcryptjs`) | Validación sintáctica DDL/DML contra MySQL y revisión de claves ficticias |
| **RF-06** (Documentación de Portafolio y Guía de Despliegue) | `README.md` (portafolio profesional completo), `docs/deployment.md` (guía paso a paso 100% gratuita: Aiven/TiDB + Render + Vercel/Netlify) | Inspección de enlaces, formato markdown y comandos reproducibles |
| **RF-07** (Verificación Automatizada y Cero Regresiones) | `server/produccion.test.js`, `npm test` en `server/` y `client/`, `npm run build` en `client/` | Ejecución completa en verde de pruebas de backend (auditoría, seguridad, producción) y frontend (5 suites) |
