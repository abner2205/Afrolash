# Memoria del Proyecto Afrolash

Este documento almacena el estado persistente, decisiones técnicas y el historial de progreso de **Afrolash**.

---

## 1. Estado Actual del Sistema

- **Versión / Stack**: Frontend React 19 (`client/` v0.1.0) + Backend Node.js / Express 5 (`server/` v1.0.0) + MySQL (`mysql2/promise`). Dependencias auditadas y remediadas bajo la Spec 001 (0 vulnerabilidades críticas y 0 altas tanto en `server/` como en `client/`; 0 vulnerabilidades en runtime de producción en backend).
- **Estado de Compilación y Pruebas**: Proyecto estructurado en `client/` y `server/`. El frontend dispone de compilación CRA (`npm --prefix client run build` con código 0 y cero advertencias) y 5 suites de pruebas Jest/RTL (`client/src/App.test.js`, `client/src/Carrito.test.js`, `client/src/TiendaVistas.test.js`, `client/src/CuentaLegalVistas.test.js`, `client/src/AdminVistas.test.js` sumando 36 pruebas en verde que validan el marco global, accesibilidad por teclado/Escape, carrusel, stepper de checkout de 4 etapas, autenticación, perfil, historial de pedidos, documentos legales y permisos administrativos). El backend dispone de Jest + Supertest configurado en `server/package.json` (`npm --prefix server test`) con 2 suites integrales en verde (`server/auditoria.test.js` y `server/seguridad.test.js` sumando 27 pruebas al 100%) validando disparadores de auditoría, cabeceras Helmet, CORS dinámico restringido, limitador de tasa, control de payloads JSON/archivos con limpieza en disco, transacciones atómicas con bloqueo pesimista `SELECT ... FOR UPDATE`, recálculo autoritativo de precios (*anti-price tampering*), inmunidad IDOR, validaciones de contraseñas y escape HTML en correos sobre puertos efímeros sin colisión `EADDRINUSE`.
- **Persistencia / Datos**: Base de datos relacional MySQL (`afrolash_db`) gestionada por pool de conexiones (`server/config/db.js`) con las tablas `Usuarios`, `Productos`, `Pedidos`, `Detalles_pedido` y `auditoria` (alimentada por triggers MySQL). Almacenamiento de imágenes de productos en `client/public/img/` vía Multer y estado de carrito/sesión en `localStorage`. Transacciones atómicas seguras en pedidos con preservación estricta del indicador numérico de visibilidad (`estado = 1/0`) y representación de agotado mediante `stock = 0`.
- **Servicios / Interfaces**:
  - **API REST (`server/`, puerto 5000)**:
    - `/api/auth`: registro, login JWT, perfil, recuperación/restablecimiento de contraseña por correo.
    - `/api/usuarios`: listado de usuarios, alta de empleados con contraseña temporal enviada por correo y eliminación restringida a rol `empleado` (exclusivo de `admin`).
    - `/api/productos`: catálogo público, detalle individual con ingredientes/instrucciones/consejos/precauciones, lectura de inventario para `admin` y `empleado` (`verificarPersonal`), y CRUD/visibilidad exclusivo de `admin`.
    - `/api/pedidos`: procesamiento de orden, descuento de stock, generación de factura PDF con `pdfkit` + envío por `nodemailer`, historial de cliente y gestión operativa de ventas para `admin` y `empleado` (`verificarPersonal`).
    - `/api/pagos`: PaymentIntents de Stripe en USD.
  - **SPA Frontend (`client/`, puerto 3000)**: Sistema de diseño editorial cosmético "Rose Noir & Gold" con tipografía dual (`Cormorant Garamond` y `Plus Jakarta Sans`), navegación accesible por teclado y tecla `Escape`, total eliminación de llamadas nativas sincrónicas (`window.alert`, `window.confirm`), feedback por modales/toasts accesibles (`role="dialog"`, `role="alertdialog"`), stepper visual de checkout de 4 etapas (Resumen, Envío, Pago Stripe, Confirmación/Factura PDF), vistas operativas modulares responsivas (`AdminInventario`, `AdminVentas`, `AdminMetricas` con Recharts, `AdminUsuarios`), `DocumentosLegales` navegables y botón flotante de WhatsApp.

---

## 2. Decisiones Arquitectónicas Registradas

| Fecha | Decisión | Razón / Impacto |
| :--- | :--- | :--- |
| 2026-11-14 | Adopción y adaptación de arquitectura Multiagente SDD | Separación de roles (Coordinator, Planner, Implementer, Reviewer) adaptada al stack React 19 + Express 5 + MySQL para garantizar especificaciones claras y pruebas en verde antes de publicar cambios. |
| 2026-11-14 | Arquitectura Monorepo Cliente/Servidor (`client/` y `server/`) | Comunicación mediante API REST JSON, autenticación JWT sin estado, RBAC de 3 niveles (`cliente`, `empleado` con `verificarPersonal`, `admin` con `adminMiddleware`) y carga local de imágenes en `client/public/img/`. |
| 2026-11-14 | Modularización del panel administrativo y entorno de pruebas | División de la interfaz administrativa en `client/src/components/admin/` (`AdminInventario`, `AdminVentas`, `AdminMetricas`, `AdminUsuarios`) y configuración de Jest + Supertest en `server/` (`auditoria.test.js`) junto a `client/src/Carrito.test.js`. |
| 2026-11-14 | Generación híbrida de facturas PDF (`server/utils/enviarFactura.js`) | Genera la factura con `pdfkit` retornando el contenido en Base64 al frontend y envía copia por SMTP (`nodemailer`) con tolerancia a fallos de correo para no bloquear la compra. |
| 2026-11-14 | Estrategia de remediación de dependencias NPM (Spec 001) | Remediación mediante `npm audit fix` no destructivo (sin `--force`), actualización de rangos compatibles y directivas `overrides` selectivas verificadas en `client/package.json` y `server/package.json`, preservando intactos `react-scripts@5.0.1`, `exceljs@4.4.0`, `jest@30.4.2` y `nodemon@3.1.13` sin alterar el código fuente. |
| 2026-11-14 | Sistema de diseño editorial CSS ("Rose Noir & Gold") y accesibilidad/rendimiento sin dependencias adicionales (Spec 002) | Implementación de tokens y escalas en CSS nativo (`index.css` y `App.css`), accesibilidad integral WCAG 2.1 AA (`:focus-visible`, roving tabindex, modales accesibles con `role="dialog"` y cierre con `Escape`, labels asociados a inputs, reemplazo de `alert`/`confirm` por UI accesible), optimizaciones de renderizado con React 19 (`useMemo`, inmutabilidad, lazy loading de imágenes, revocación de blobs PDF) y suite integral de 36 pruebas Jest/RTL sin librerías externas ni sobrecarga al bundle. |
| 2026-11-16 | Hardening integral de seguridad web OWASP Top 10 y transaccionalidad atómica (Spec 003) | Incorporación de Helmet con política de recursos cruzados, CORS restringido por `FRONTEND_URL` con 403 Forbidden explícito, rate limiting cuantitativo en autenticación (15 req / 15 min), límite de cuerpo JSON de 100 KB, límites de Multer (2 MB, 3 archivos) con eliminación automática de residuales en disco, transacciones atómicas MySQL completas (`beginTransaction`/`commit`/`rollback`) con `SELECT ... FOR UPDATE` para evitar condiciones de carrera en inventario, recálculo de precios en backend (*anti-price tampering*), inmunidad IDOR vinculando la orden al JWT, validación de contraseñas/correos, neutralización de inyección HTML en correos salientes y desacoplamiento de puerto de red en pruebas. |

---

## 3. Registro de Especificaciones (Specs)

| ID | Nombre | Estado | Resumen |
| :--- | :--- | :--- | :--- |
| 001 | Remediación de Vulnerabilidades NPM | Completado | server/ pasó de 22 a 5 bajas (0 runtime) y client/ de 68 a 15 (0 críticas, 0 altas); validado y aprobado por @reviewer. |
| 002 | Mejora Integral del Frontend | Completado | Rediseño visual responsivo completo bajo identidad cosmética "Rose Noir & Gold", accesibilidad por teclado y lectores de pantalla, eliminación de alerts/confirms nativos, optimización con useMemo/lazy loading y suite integral de 36 pruebas Jest/RTL (5 suites) pasando al 100%; validado y aprobado por @reviewer. |
| 003 | Seguridad y Hardening Web | Completado | Hardening integral backend/frontend: Helmet, CORS restrictivo por entorno, limitador de tasa contra fuerza bruta, límites de payload y subida segura con limpieza física en disco, transacciones atómicas con bloqueo pesimista `SELECT ... FOR UPDATE`, recálculo autoritativo de precios en servidor (*anti-price tampering*), prevención de IDOR, validación de contraseñas robustas y sanitización contra inyección HTML en correos salientes; verificado determinísticamente con 27 pruebas de backend en verde (`server/seguridad.test.js` y `server/auditoria.test.js`) y 36 pruebas de frontend en verde; validado y aprobado por @reviewer. |

---

## 4. Deuda Técnica y Pendientes Inmediatos

1. **Excepciones residuales de dependencias (RF-05, Spec 001)**:
   - `deepmerge >=4.2.0` (baja): presente en sub-dependencias de desarrollo/build tools (`jest-config` en `server/`; `workbox-build`, `@svgr/webpack`, `fork-ts-checker-webpack-plugin`, `jest-config` en `client/`). No cuenta con versión parcheada en la rama 4.x y forzar una actualización mayor degradaría o rompería las herramientas de compilación/pruebas.
   - `webpack-dev-server <=5.2.5` (moderada): anclado estrictamente por `react-scripts@5.0.1` en desarrollo. Un override a v5 rompe la API de configuración interna de Create React App v5 (`onBeforeSetupMiddleware` / `onAfterSetupMiddleware`), por lo que se mantiene confinado a entorno de desarrollo local sin impacto en el artefacto de producción generado por `npm run build`.
2. **Cobertura de pruebas automatizadas en backend**: Consolidar y extender pruebas unitarias de controladores administrativos secundarios aprovechando la infraestructura de puertos efímeros y mocks establecida en `server/seguridad.test.js`.
3. **Unificación de nombres de tablas SQL**: Estandarizar mayúsculas/minúsculas en consultas SQL de `server/` (`Usuarios` vs `usuarios`, `Productos` vs `productos`) para compatibilidad estricta en servidores MySQL sobre Linux.
4. **Limpieza opcional de paquete residual (`bcrypt`)**: El código de `server/` ya está unificado en `bcryptjs` (Spec 003); únicamente queda desinstalar opcionalmente la dependencia nativa no referenciada `bcrypt` en `server/package.json`.
