# Plan de Implementación: 002 - Mejora Integral de UI/UX, Rendimiento y Accesibilidad del Frontend

**Spec de referencia:** `specs/002-mejora-integral-frontend/spec.md`

## 1. Arquitectura y Componentes Afectados
- **Base de Datos MySQL / Esquema (`afrolash_db`)**: Sin modificaciones.
- **Backend API (`server/routes/`, `server/controllers/`, `server/middleware/`, `server/utils/`)**: Sin modificaciones. Se mantienen íntegros todos los endpoints REST (`/api/auth`, `/api/usuarios`, `/api/productos`, `/api/pedidos`, `/api/pagos`), sus formatos de petición/respuesta y el control RBAC.
- **Frontend React (`client/`)**:
  - `client/public/index.html`: Configuración de `lang="es"`, metadatos descriptivos y carga de tipografías (`Cormorant Garamond` para encabezados editoriales y `Plus Jakarta Sans` para cuerpo y UI).
  - `client/src/index.css` y `client/src/App.css`: Sistema de diseño unificado mediante tokens CSS (`:root`), reset moderno, escala tipográfica fluida (`clamp`), clases reutilizables para layout, botones, tarjetas, formularios, tablas responsivas, stepper de checkout, badges semánticos, modales y notificaciones; anillos de foco `:focus-visible`; breakpoints móviles (`<= 768px` y `<= 480px`); y soporte de `@media (prefers-reduced-motion: reduce)`.
  - `client/src/App.js`: Enrutador de vistas por estado, cabecera fija responsiva con botón semántico para el logo y barra de búsqueda etiquetada, drawer de cuenta con `role="dialog"`, `aria-modal="true"` y cierre por tecla `Escape`, lectura protegida de `localStorage`, notificación/modal de stock excedido en lugar de `window.alert`, footer con botones semánticos para términos/privacidad y botón flotante de WhatsApp accesible.
  - **Vistas de tienda y producto (`client/src/components/`)**:
    - `Inicio.js`: Hero editorial responsivo, carrusel de productos destacados accesible por teclado (`<button>` semánticos con `aria-label` y estado actual), carga optimizada de imágenes, mapa embebido responsivo y manejo de estado de carga/error sin bloquear la interfaz.
    - `Catalogo.js`: Grilla CSS fluida responsiva, procesamiento inmutable y memorizado (`useMemo` + `[...productos].sort(...)`) de búsqueda y ordenamiento, controles de cantidad accesibles (`aria-label` e `<input>` etiquetado), `loading="lazy"` en imágenes y modal de confirmación accesible con cierre por `Escape`.
    - `ProductoDetalle.js`: Distribución responsiva imagen/ficha, selector de cantidad accesible, estado agotado claro, secciones de ingredientes/instrucciones/consejos/precauciones con jerarquía editorial y modal de confirmación accesible con cierre por `Escape`.
  - **Flujo de carrito y pago (`client/src/components/`)**:
    - `Carrito.js`: Indicador visual de progreso en 4 etapas (`Resumen`, `Envío`, `Pago`, `Confirmación`), formulario de envío con `<label htmlFor>` + `id`, manejo de errores en UI en lugar de `window.alert`, revocación limpia de `URL.createObjectURL` al desmontar/cambiar factura PDF, visor responsivo del PDF y modal de autenticación accesible con cierre por `Escape`.
    - `FormularioPago.js`: Integración estilizada con Stripe `CardElement`, botón con estado de carga explícito para prevenir envíos duplicados y modal accesible de error de pago con cierre por `Escape`.
  - **Autenticación, cuenta y legal (`client/src/components/`)**:
    - `Login.js`, `Registro.js`, `RecuperarPassword.js`, `RestablecerPassword.js`, `Perfil.js`, `MisPedidos.js`, `DocumentosLegales.js`: Formularios con asociación explícita `<label htmlFor>`/`id`, botones de mostrar/ocultar contraseña alcanzables por teclado (sin `tabIndex="-1"`) con `aria-label`, enlaces semánticos `<button type="button">` en lugar de `<span>` clicables, validación visual en tiempo real en `Registro.js`, tarjetas responsivas y badges semánticos de estado en `MisPedidos.js`, lectura editorial optimizada (`<= 75ch`) en `DocumentosLegales.js` y modales accesibles con `Escape`.
  - **Módulos operativos y administrativos (`client/src/components/admin/` y `PanelAdmin.js`)**:
    - `AdminInventario.js`: Barra de acciones responsiva, preservación estricta de vista de solo lectura para `empleado`, formulario accesible para `admin`, tabla envuelta en contenedor con desplazamiento horizontal limpio y modal accesible de feedback.
    - `AdminVentas.js`: Filtros etiquetados (`<label htmlFor>`), cálculo memorizado (`useMemo`) de ventas filtradas y paginadas, exportación Excel preservada, tarjeta responsiva por orden y modal de feedback accesible.
    - `AdminMetricas.js`: Cálculo memorizado (`useMemo`) de KPIs (`ingresosTotales`, `totalPedidos`, ticket promedio) y series mensuales/top 5 para `Recharts`, grilla de tarjetas KPI responsiva y gráficas adaptables a móvil.
    - `AdminUsuarios.js`: Tabla de usuarios responsiva, formulario etiquetado para alta de empleados, reemplazo de `window.confirm` por modal accesible de confirmación de revocación de acceso y modal de feedback accesible.
    - `PanelAdmin.js`: Alinear estilos, memorización (`useMemo`), accesibilidad y desplazamiento horizontal limpio de tabla en caso de importarse o reutilizarse.
  - **Pruebas automatizadas (`client/src/`)**:
    - `App.test.js` y `Carrito.test.js`.

## 2. Decisiones Técnicas y Alternativas Descartadas
- **Decisión 1 — Sistema de Diseño mediante CSS Custom Properties en `index.css` y `App.css`**:
  - *Elegida*: Definir tokens (`--afro-rose`, `--afro-blush`, `--afro-ink`, `--afro-gold`, `--afro-surface`, radios, sombras y escalas tipográficas) y clases utilitarias/estructurales reutilizables en CSS puro.
  - *Descartada*: Instalar Tailwind CSS, MUI o Styled-Components, ya que exigiría reconfigurar `react-scripts@5.0.1` o añadir dependencias de terceros con riesgo de reintroducir vulnerabilidades NPM resueltas en la Spec 001.
- **Decisión 2 — Dirección Estética "Rose Noir & Gold" (`frontend-design`)**:
  - *Elegida*: Mantener la paleta oficial de Afrolash (`#D97A8C`, `#F7CDD5`, `#1A1A1A`, `#CFA144`, `#FAFAFA`) elevada con un emparejamiento tipográfico editorial (`Cormorant Garamond` para encabezados + `Plus Jakarta Sans` para cuerpo/controles y cifras tabulares en precios/totales), contraste WCAG AA legible en botones y badges, superficies limpias sin sombras recargadas y transiciones suaves enfocadas en interacciones de usuario.
  - *Descartada*: Cambiar radicalmente la identidad cromática de la marca o introducir animaciones decorativas continuas que distraigan o rompan la coherencia visual existente.
- **Decisión 3 — Optimización React 19 (`vercel-react-best-practices`)**:
  - *Elegida*: Envolver filtros, ordenamientos y agregaciones de métricas en `useMemo`, clonar antes de ordenar (`[...lista].sort(...)`) para evitar mutaciones durante renderizado, proteger `JSON.parse` de `localStorage` con `try/catch`, revocar Blob URLs generados para facturas PDF y habilitar `loading="lazy"` en imágenes secundarias/tarjetas.
  - *Descartada*: Introducir librerías externas de estado global (Redux/Zustand) que sobredimensionarían la SPA sin beneficios frente al flujo de props y estado actual.
- **Decisión 4 — Accesibilidad y UX Sin Diálogos Nativos (`web-design-guidelines`)**:
  - *Elegida*: Reemplazar todo `window.alert` y `window.confirm` por modales accesibles (`role="dialog"`, `aria-modal="true"`, cierre por `Escape`) y banners de notificación en interfaz; sustituir elementos `<div>`/`<span>` clicables por `<button type="button">` semánticos; asociar `<label htmlFor>` e `id`; eliminar `tabIndex="-1"` de los botones de visibilidad de contraseña; y actualizar `index.html` a `lang="es"`.
  - *Descartada*: Mantener controles nativos bloqueantes del navegador o conservar elementos `div`/`span` simulando enlaces/botones.

## 3. Estrategia de Pruebas
- **Compilación y Análisis Estático**:
  - Ejecutar `npm --prefix client run build` tras cada tarea para confirmar compilación limpia (código de salida `0`, sin errores ni advertencias críticas de ESLint).
- **Pruebas Automatizadas (`Jest` + `React Testing Library`)**:
  - Ejecutar `npm --prefix client test -- --watchAll=false`.
  - En T6, alinear `client/src/App.test.js` con la UI real de Afrolash (verificando renderizado de cabecera/inicio, apertura del drawer/navegación accesible, o estado de vistas sin errores de importación ni llamadas reales a red gracias a mocks de `axios`) y ampliar `client/src/Carrito.test.js` cubriendo la interfaz de carrito vacío/con ítems, stepper de checkout y cálculo de totales sin usar `alert` nativo.
- **Verificación Manual / Responsiva**:
  - Inspección estructural de reglas CSS `@media (max-width: 768px)` y `@media (max-width: 480px)` y atributos `aria-*`/`role`/`htmlFor` en todas las vistas, validando ausencia de `window.alert`/`window.confirm` en `client/src/`.

## 4. Matriz de Cobertura de RF
- **RF-01 (Sistema Visual, Estético y Tipográfico Cohesivo)** -> `client/public/index.html`, `client/src/index.css`, `client/src/App.css` y todas las vistas de `client/src/` (T1–T6).
- **RF-02 (Navegación Global, Cabecera, Drawer y Footer Accesibles)** -> `client/public/index.html` (`lang="es"`), `client/src/App.js` (header, buscador, drawer con `Escape`, footer con `<button>`, botón flotante WhatsApp) + `App.test.js` (T1, T6).
- **RF-03 (Inicio, Catálogo y Detalle de Producto)** -> `Inicio.js`, `Catalogo.js`, `ProductoDetalle.js`, `App.js` (notificación de stock sin `alert`, `useMemo` sin mutación, `loading="lazy"`, carrusel accesible) (T1, T2).
- **RF-04 (Carrito y Checkout Guiado en 4 Etapas)** -> `Carrito.js`, `FormularioPago.js` (stepper de 4 etapas, formularios etiquetados, estados de carga, errores en UI sin `alert`, limpieza de Blob PDF) + `Carrito.test.js` (T3, T6).
- **RF-05 (Autenticación, Perfil, Mis Pedidos y Legal)** -> `Login.js`, `Registro.js`, `RecuperarPassword.js`, `RestablecerPassword.js`, `Perfil.js`, `MisPedidos.js`, `DocumentosLegales.js` (labels, toggles con teclado y `aria-label`, enlaces semánticos, tarjetas responsivas) (T4).
- **RF-06 (Módulos Operativos y Administración)** -> `AdminInventario.js`, `AdminVentas.js`, `AdminMetricas.js`, `AdminUsuarios.js`, `PanelAdmin.js` (scroll horizontal en tablas, `useMemo` en métricas y ventas, modal de confirmación en lugar de `window.confirm`, vista de solo lectura para `empleado`) (T5).
- **RF-07 (Ventanas Modales Accesibles y Homogéneas)** -> Clases compartidas `.afro-modal-backdrop` / `.afro-modal` en `App.css` y comportamiento `role="dialog"`, `aria-modal="true"`, cierre por `Escape` en `App.js`, `Catalogo.js`, `ProductoDetalle.js`, `Carrito.js`, `FormularioPago.js`, `Login.js`, `Registro.js`, `RecuperarPassword.js`, `RestablecerPassword.js`, `Perfil.js`, `MisPedidos.js`, `AdminInventario.js`, `AdminVentas.js`, `AdminUsuarios.js`, `PanelAdmin.js` (T1–T5).
- **RF-08 (Preservación de Reglas, Contratos API y Tests)** -> Preservación de payloads/endpoints en todas las vistas, `npm --prefix client run build` en verde y `npm --prefix client test -- --watchAll=false` al 100% (T1–T6).
