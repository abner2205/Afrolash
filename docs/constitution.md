# Constitución del Proyecto Afrolash

Este documento establece los principios técnicos y de desarrollo no negociables para **Afrolash**. Todo agente (Coordinator, Planner, Implementer, Reviewer) y colaborador humano debe apegarse a estas directrices.

---

## 1. Stack Tecnológico Base
- **Plataforma / Lenguaje**: JavaScript (ES6+) sobre Node.js (`CommonJS` en `server/`, `ES Modules` en `client/`).
- **Capa Visual / Frontend**: React 19 (`react-scripts` 5, Axios, `@stripe/react-stripe-js`, Recharts, React Icons).
- **Capa de Servicios / Backend**: Node.js con Express 5 (`cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `multer`, `stripe`, `pdfkit`, `nodemailer`).
- **Persistencia**: MySQL (`afrolash_db`) mediante pool de conexiones asíncrono `mysql2/promise` (consultas SQL parametrizadas sin ORM) y almacenamiento local de imágenes de catálogo en `client/public/img/`.
- **Pruebas Automatizadas**: Jest + React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`) en `client/`.

---

## 2. Principios y Reglas No Negociables

### A. Rendimiento y Gestión de Ejecución
1. **Operaciones no bloqueantes**: Toda operación de base de datos (`mysql2/promise`), pasarela de pagos (Stripe), generación de PDF (`pdfkit`) y envío SMTP (`nodemailer`) debe ejecutarse de forma asíncrona con `async/await` sin bloquear el Event Loop.
2. **Liberación de recursos**: Los efectos en React deben limpiar sus suscripciones e interceptores de Axios mediante funciones de retorno en `useEffect`, y las conexiones obtenidas manualmente del pool MySQL deben liberarse explícitamente (`connection.release()`).

### B. Integridad de Datos y Seguridad
1. **Consultas parametrizadas y operaciones seguras**: Toda consulta SQL en `server/` debe usar marcadores parametrizados (`?`) para prevenir inyección SQL. Ninguna operación crítica (como creación de pedidos o descuento de inventario) debe dejar estados parciales ante errores; validar entradas y aislar las pruebas para no alterar datos de producción.
2. **Autenticación, autorización y carga de archivos**: Las contraseñas se almacenan exclusivamente hasheadas con `bcryptjs`; los endpoints privados se protegen con JWT (`authMiddleware`) y rol administrador (`adminMiddleware`); la subida de archivos se valida con `uploadMiddleware` permitiendo únicamente imágenes JPEG, JPG, PNG y WEBP.
3. **Evolución segura del esquema y cero secretos en Git**: Todo cambio en tablas de `afrolash_db` (`Usuarios`, `Productos`, `Pedidos`, `Detalles_pedido`) debe ser compatible o documentado con su migración verificable. Está prohibido subir archivos `.env` o credenciales reales al repositorio.

### C. Arquitectura y Separación de Responsabilidades
- Mantener límites claros entre vistas React (`client/src/components/`), rutas y middlewares Express (`server/routes/`, `server/middleware/`), controladores (`server/controllers/`) y servicios utilitarios (`server/utils/`).
- La lógica de negocio y persistencia en `server/` debe mantenerse desacoplada de la interfaz React para poder verificarse mediante pruebas automatizadas independientes del navegador.

---

## 3. Estándares del Flujo de Trabajo (SDD)
- **Cero código sin spec aprobada**: Salvo correcciones menores puntuales (`/feature`), todo cambio funcional inicia con una especificación en `specs/`.
- **Compilación Limpia**: No se aceptan entregas con errores ni advertencias críticas en `npm --prefix client run build` ni errores sintácticos en `server/` (`node --check`).
- **Pruebas Automatizadas**: Toda regla de negocio y flujo crítico debe estar cubierto por pruebas automatizadas ejecutables con `npm --prefix client test -- --watchAll=false` (y la suite de `server/` cuando aplique).
- **Integración Continua con GitHub**: Todo cambio aprobado por el Reviewer y el usuario debe consolidarse con un commit semántico (`feat`, `fix`, `docs`, `refactor`, `chore`) y sincronizarse con GitHub en la rama `main`.
