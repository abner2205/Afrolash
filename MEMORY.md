# Memoria del Proyecto Afrolash

Este documento almacena el estado persistente, decisiones técnicas y el historial de progreso de **Afrolash**.

---

## 1. Estado Actual del Sistema

- **Versión / Stack**: Frontend React 19 (`client/` v0.1.0) + Backend Node.js / Express 5 (`server/` v1.0.0) + MySQL (`mysql2/promise`).
- **Estado de Compilación y Pruebas**: Proyecto estructurado en `client/` y `server/`. El frontend dispone de compilación CRA y pruebas Jest/RTL (`client/src/Carrito.test.js`, además de `client/src/App.test.js` pendiente de alinear con la UI actual). El backend dispone de Jest + Supertest configurado en `server/package.json` (`npm --prefix server test`) con `server/auditoria.test.js` (prueba de integración contra MySQL).
- **Persistencia / Datos**: Base de datos relacional MySQL (`afrolash_db`) gestionada por pool de conexiones (`server/config/db.js`) con las tablas `Usuarios`, `Productos`, `Pedidos`, `Detalles_pedido` y `auditoria` (alimentada por triggers MySQL). Almacenamiento de imágenes de productos en `client/public/img/` vía Multer y estado de carrito/sesión en `localStorage`.
- **Servicios / Interfaces**:
  - **API REST (`server/`, puerto 5000)**:
    - `/api/auth`: registro, login JWT, perfil, recuperación/restablecimiento de contraseña por correo.
    - `/api/usuarios`: listado de usuarios, alta de empleados con contraseña temporal enviada por correo y eliminación restringida a rol `empleado` (exclusivo de `admin`).
    - `/api/productos`: catálogo público, detalle individual con ingredientes/instrucciones/consejos/precauciones, lectura de inventario para `admin` y `empleado` (`verificarPersonal`), y CRUD/visibilidad exclusivo de `admin`.
    - `/api/pedidos`: procesamiento de orden, descuento de stock, generación de factura PDF con `pdfkit` + envío por `nodemailer`, historial de cliente y gestión operativa de ventas para `admin` y `empleado` (`verificarPersonal`).
    - `/api/pagos`: PaymentIntents de Stripe en USD.
  - **SPA Frontend (`client/`, puerto 3000)**: Vistas de `Inicio`, `Catalogo` con buscador, `ProductoDetalle`, `Carrito` + `FormularioPago` (Stripe), `Login`, `Registro`, `RecuperarPassword`, `RestablecerPassword`, `Perfil`, `MisPedidos`, vistas operativas/administrativas modulares (`AdminInventario`, `AdminVentas`, `AdminMetricas` con Recharts, `AdminUsuarios`), `DocumentosLegales`, footer con redes sociales y botón flotante de WhatsApp.

---

## 2. Decisiones Arquitectónicas Registradas

| Fecha | Decisión | Razón / Impacto |
| :--- | :--- | :--- |
| 2026-11-14 | Adopción y adaptación de arquitectura Multiagente SDD | Separación de roles (Coordinator, Planner, Implementer, Reviewer) adaptada al stack React 19 + Express 5 + MySQL para garantizar especificaciones claras y pruebas en verde antes de publicar cambios. |
| 2026-11-14 | Arquitectura Monorepo Cliente/Servidor (`client/` y `server/`) | Comunicación mediante API REST JSON, autenticación JWT sin estado, RBAC de 3 niveles (`cliente`, `empleado` con `verificarPersonal`, `admin` con `adminMiddleware`) y carga local de imágenes en `client/public/img/`. |
| 2026-11-14 | Modularización del panel administrativo y entorno de pruebas | División de la interfaz administrativa en `client/src/components/admin/` (`AdminInventario`, `AdminVentas`, `AdminMetricas`, `AdminUsuarios`) y configuración de Jest + Supertest en `server/` (`auditoria.test.js`) junto a `client/src/Carrito.test.js`. |
| 2026-11-14 | Generación híbrida de facturas PDF (`server/utils/enviarFactura.js`) | Genera la factura con `pdfkit` retornando el contenido en Base64 al frontend y envía copia por SMTP (`nodemailer`) con tolerancia a fallos de correo para no bloquear la compra. |

---

## 3. Registro de Especificaciones (Specs)

| ID | Nombre | Estado | Resumen |
| :--- | :--- | :--- | :--- |
| - | *(Sin specs activas aún)* | - | El proyecto está listo para iniciar su primera spec con `/sdd` o `@coordinator`. |

---

## 4. Deuda Técnica y Pendientes Inmediatos

1. **Transacciones SQL en `procesarPedido`**: Envolver la creación del pedido, inserción de `Detalles_pedido` y descuento de `stock` en `server/controllers/pedidoController.js` dentro de una transacción MySQL (`beginTransaction` / `commit` / `rollback`) para evitar estados parciales ante fallos.
2. **Cobertura de pruebas automatizadas**: Actualizar `client/src/App.test.js` (que conserva el test base de Create React App) y ampliar pruebas unitarias/integración en `client/` y `server/` para controladores y rutas protegidas.
3. **Unificación de nombres de tablas SQL**: Estandarizar mayúsculas/minúsculas en consultas SQL de `server/` (`Usuarios` vs `usuarios`, `Productos` vs `productos`) para compatibilidad estricta en servidores MySQL sobre Linux.
4. **Consolidación de dependencias y variables de entorno**: Unificar el uso de `bcryptjs` vs `bcrypt` en `server/` e incluir `EMAIL_USER` y `EMAIL_PASS` en `server/.env.example` (utilizadas por `authController.js`, `usuarioController.js` y `enviarFactura.js`).
