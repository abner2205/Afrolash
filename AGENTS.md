# Reglas y Guía del Proyecto Afrolash

Bienvenido al repositorio de **Afrolash** (plataforma e-commerce de cosméticos y belleza de Afrolash C.A.), desarrollado en **JavaScript Full-Stack (React 19 + Node.js / Express 5 + MySQL)**.

---

## 1. Estructura del Repositorio

- `client/`: Aplicación Frontend SPA en React 19 (`Create React App`).
  - `client/src/App.js`: Enrutador de vistas por estado (`inicio`, `tienda`, `detalle`, `carrito`, `login`, `registro`, `recuperar`, `restablecer`, `perfil`, `mis-pedidos`, `admin`, `terminos`, `privacidad`), gestión del carrito en `localStorage` e interceptor de sesión Axios (`401`/`403`).
  - `client/src/components/`: Componentes de vista (`Inicio.js`, `Catalogo.js`, `ProductoDetalle.js`, `Carrito.js`, `FormularioPago.js`, `Login.js`, `Registro.js`, `RecuperarPassword.js`, `RestablecerPassword.js`, `Perfil.js`, `MisPedidos.js`, `PanelAdmin.js`, `DocumentosLegales.js`).
  - `client/public/img/`: Almacenamiento de imágenes de productos servidas estáticamente y subidas desde el backend con Multer.
- `server/`: API REST Backend en Node.js y Express 5 (`CommonJS`).
  - `server/index.js`: Punto de entrada Express (`/api/auth`, `/api/productos`, `/api/pedidos`, `/api/pagos`).
  - `server/config/db.js`: Pool de conexiones MySQL asíncrono (`mysql2/promise`).
  - `server/controllers/`: Lógica de negocio y endpoints (`authController.js`, `productoController.js`, `pedidoController.js`, `pagoController.js`).
  - `server/middleware/`: Autenticación JWT (`authMiddleware.js`), control de rol administrador (`adminMiddleware.js`) y carga de imágenes JPEG/JPG/PNG/WEBP (`uploadMiddleware.js`).
  - `server/routes/`: Definición de rutas REST (`authRoutes.js`, `productoRoutes.js`, `pedidoRoutes.js`, `pagoRoutes.js`).
  - `server/utils/enviarFactura.js`: Generación de facturas PDF (`pdfkit`) en Base64 y envío por correo (`nodemailer`).
- `docs/`: Documentación del proyecto y `docs/constitution.md`.
- `specs/`: Especificaciones SDD (`specs/NNN-nombre/spec.md`, `plan.md`, `tasks.md`).
- `.agents/`:
  - `agents/`: Definición de subagentes especializados (`coordinator.md`, `planner.md`, `implementer.md`, `reviewer.md`).
  - `skills/`: Habilidades y procedimientos (`sdd`, `feature`).
  - `commands/`: Comandos ejecutables o flujos rápidos.
- `MEMORY.md`: Registro vivo de contexto, decisiones de arquitectura y estado del proyecto.

---

## 2. Comandos de Terminal

- **Compilar / Verificar sintaxis y tipos**:
  ```powershell
  npm --prefix client run build
  node --check server/index.js
  ```
- **Ejecutar Pruebas**:
  ```powershell
  npm --prefix client test -- --watchAll=false
  npm --prefix server test
  ```
- **Ejecutar Aplicación**:
  ```powershell
  # Backend (API en http://localhost:5000)
  node server/index.js
  # O en desarrollo con recarga automática:
  cd server; npx nodemon index.js

  # Frontend (SPA en http://localhost:3000)
  npm --prefix client start
  ```
- **Sincronizar con GitHub**:
  ```powershell
  git add .
  git commit -m "tipo(alcance): descripción concisa"
  git push origin main
  ```

---

## 3. Convenciones de Desarrollo

1. **Lenguaje y Estilo**:
   - JavaScript ES6+ (`ES Modules` en `client/` con componentes funcionales y Hooks de React; `CommonJS` `require`/`module.exports` en `server/`). Mantener cero errores y advertencias críticas de ESLint en `npm --prefix client run build`.
   - Convención de nombres: `PascalCase` para componentes React (`ProductoDetalle.js`, `PanelAdmin.js`), `camelCase` para funciones, controladores, rutas y variables (`obtenerProductos`, `procesarPedido`), `snake_case` para columnas de base de datos MySQL y payloads asociados (`id_usuario`, `id_producto`, `precio_unitario`, `direccion_envio`, `imagen_url`), y `UPPER_SNAKE_CASE` para variables de entorno (`DB_HOST`, `JWT_SECRET`, `STRIPE_SECRET_KEY`).
2. **Arquitectura y Capas**:
   - Mantener desacopladas las vistas de React (`client/src/components/`), las rutas y middlewares Express (`server/routes/`, `server/middleware/`), la lógica de controladores (`server/controllers/`) y las utilidades (`server/utils/`).
   - Usar obligatoriamente `async/await` con bloques `try/catch` en controladores y llamadas a base de datos o servicios externos (Stripe, Nodemailer) para evitar bloquear el Event Loop.
3. **Persistencia y Estado**:
   - Usar consultas SQL parametrizadas (`?`) mediante el pool de `mysql2/promise` para prevenir inyección SQL; preservar la integridad de inventario (`stock` y `estado`) en los pedidos y liberar conexiones correctamente.
   - Nunca subir archivos `.env`, credenciales reales, llaves de Stripe ni contraseñas al repositorio (usar `server/.env.example` como plantilla).

---

## 4. Flujo de Trabajo Multiagente (SDD)

El desarrollo de nuevas funcionalidades complejas sigue estrictamente el ciclo SDD:
1. **Coordinator**: Orquesta el flujo, selecciona el perfil de modelo por tarea y actúa como interlocutor con el usuario.
2. **Planner**: Redacta `spec.md` (formato EARS) y, tras aprobación, `plan.md` y `tasks.md`.
3. **Reviewer**: Valida la spec como QA en fase de clarificación; valida la implementación RF por RF al finalizar.
4. **Implementer**: Implementa una sola tarea a la vez bajo enfoque guiado por pruebas, garantizando compilación y tests en verde antes de marcarla como completada.
5. **Cierre y Push a GitHub**: Con el `VEREDICTO: APROBADO` del Reviewer y la confirmación del usuario, el Coordinator actualiza `MEMORY.md`, genera el commit semántico y envía los cambios a GitHub mediante `git push origin main`.
