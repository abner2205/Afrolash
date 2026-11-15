# Tareas de Implementación: 002 - Mejora Integral de UI/UX, Rendimiento y Accesibilidad del Frontend

**Plan:** `specs/002-mejora-integral-frontend/plan.md`

- [x] **T1: Sistema de Diseño CSS, Tipografía y Marco Global Accesible**
  - **RF Asociados:** RF-01, RF-02, RF-03, RF-07, RF-08
  - **Perfil sugerido:** `pro`
  - **Archivos:** `client/public/index.html`, `client/src/index.css`, `client/src/App.css`, `client/src/App.js`, `client/src/App.test.js`
  - **Alcance:** Configurar `lang="es"` y fuentes editoriales (`Cormorant Garamond` + `Plus Jakarta Sans`) en `index.html`; construir el sistema de tokens CSS, escalas tipográficas, clases reutilizables (layout, header, drawer, botones, tarjetas, inputs, modales, toasts, tablas responsivas, stepper, badges), `:focus-visible`, breakpoints móviles (`<= 768px`, `<= 480px`) y `@media (prefers-reduced-motion: reduce)` en `index.css` y `App.css`; refactorizar `App.js` con controles semánticos operables por teclado, drawer con `role="dialog"` y cierre por `Escape`, lectura segura de `localStorage`, reemplazo de `window.alert` en `agregarAlCarrito` por notificación en UI y footer/WhatsApp accesibles; y actualizar `App.test.js` (mockeando `axios` y reemplazando el test heredado `/learn react/i`) para validar el marco global de Afrolash.
  - **Hecho cuando:** `npm --prefix client run build` compila sin errores ni advertencias de ESLint, `npm --prefix client test -- --watchAll=false` aprueba en verde, y no existen llamadas a `window.alert` ni controles clicables no semánticos en `App.js`.

- [x] **T2: Mejora Visual, Accesibilidad y Rendimiento en Inicio, Catálogo y Detalle de Producto**
  - **RF Asociados:** RF-01, RF-03, RF-07, RF-08
  - **Perfil sugerido:** `pro`
  - **Archivos:** `client/src/components/Inicio.js`, `client/src/components/Catalogo.js`, `client/src/components/ProductoDetalle.js`
  - **Alcance:** Aplicar el sistema de diseño responsivo en las tres vistas comerciales; dotar al carrusel de `Inicio.js` de botones semánticos accesibles, `aria-label` y estados de carga/vacío seguros; optimizar `Catalogo.js` con `useMemo` e inmutabilidad al ordenar/filtrar productos, grilla fluida para móvil/escritorio, controles de cantidad accesibles e imágenes con `loading="lazy"`; estandarizar `ProductoDetalle.js` con diseño responsivo para ficha, ingredientes, instrucciones, consejos y precauciones; y agregar `role="dialog"`, `aria-modal="true"` y cierre por `Escape` en sus modales.
  - **Hecho cuando:** `npm --prefix client run build` compila limpiamente y los componentes `Inicio`, `Catalogo` y `ProductoDetalle` son responsivos, memorizados y accesibles por teclado.

- [x] **T3: Rediseño del Carrito, Stepper de 4 Etapas y Checkout con Stripe**
  - **RF Asociados:** RF-01, RF-04, RF-07, RF-08
  - **Perfil sugerido:** `pro`
  - **Archivos:** `client/src/components/Carrito.js`, `client/src/components/FormularioPago.js`
  - **Alcance:** Implementar el indicador visual de progreso para las 4 etapas del checkout en `Carrito.js` (Resumen, Datos de Envío, Pago y Confirmación), asociar `<label htmlFor>` e `id` en el formulario de envío, manejar estados de carga y prevención de doble envío al crear intención de pago, reemplazar todos los `alert()` por mensajes/modales de error accesibles en UI, limpiar `URL.createObjectURL` de la factura PDF con `URL.revokeObjectURL` al cambiar/desmontar, asegurar vista móvil cómoda para ítems/visor PDF, y estilizar `FormularioPago.js` y sus modales con `role="dialog"` y cierre por `Escape`.
  - **Hecho cuando:** `npm --prefix client run build` compila limpiamente, no quedan `alert()` en `Carrito.js` ni `FormularioPago.js` y el checkout de 4 etapas mantiene intactos sus contratos con `/api/pagos/crear-intencion` y `/api/pedidos/procesar`.

- [x] **T4: Estandarización de Autenticación, Perfil, Mis Pedidos y Documentos Legales**
  - **RF Asociados:** RF-01, RF-05, RF-07, RF-08
  - **Perfil sugerido:** `pro`
  - **Archivos:** `client/src/components/Login.js`, `client/src/components/Registro.js`, `client/src/components/RecuperarPassword.js`, `client/src/components/RestablecerPassword.js`, `client/src/components/Perfil.js`, `client/src/components/MisPedidos.js`, `client/src/components/DocumentosLegales.js`
  - **Alcance:** Unificar visualmente y hacer responsivas todas las tarjetas de autenticación, cuenta, historial y textos legales; asociar `<label htmlFor>` e `id` en cada campo; habilitar acceso por teclado (sin `tabIndex="-1"`) con `aria-label` dinámico en los botones de visibilidad de contraseña; reemplazar `<span>` y `<p>` clicables por `<button type="button">`; refinar la checklist de contraseña y modal legal en `Registro.js`; optimizar lectura y estado vacío/error de `MisPedidos.js` y `DocumentosLegales.js`; y dotar a todos los modales de `role="dialog"`, `aria-modal="true"` y cierre por `Escape`.
  - **Hecho cuando:** `npm --prefix client run build` compila limpiamente y todas las vistas de usuario mantienen su lógica de envío, validación y redirección sin `<span>`/`<p>` interactivos no semánticos.

- [x] **T5: Renovación Responsiva y Memorización en Módulos Operativos y de Administración**
  - **RF Asociados:** RF-01, RF-06, RF-07, RF-08
  - **Perfil sugerido:** `pro`
  - **Archivos:** `client/src/components/admin/AdminInventario.js`, `client/src/components/admin/AdminVentas.js`, `client/src/components/admin/AdminMetricas.js`, `client/src/components/admin/AdminUsuarios.js`, `client/src/components/PanelAdmin.js`
  - **Alcance:** Envolver tablas administrativas en contenedores con desplazamiento horizontal limpio para móvil, etiquetar filtros y formularios (`<label htmlFor>`/`id`), memorizar con `useMemo` los filtros/paginación de `AdminVentas.js` y `PanelAdmin.js` y los KPIs/series `Recharts` de `AdminMetricas.js`, reemplazar `window.confirm` al revocar empleados en `AdminUsuarios.js` por un modal de confirmación accesible con `Escape`, dotar de `role="dialog"` y cierre por `Escape` a los modales de feedback, y preservar íntegramente las exportaciones a Excel y la restricción de solo lectura para rol `empleado`.
  - **Hecho cuando:** `npm --prefix client run build` compila limpiamente y no existen llamadas a `window.confirm` ni `alert` en ningún módulo administrativo.

- [x] **T6: Actualización de Suite de Pruebas Automatizadas y Validación Integral**
  - **RF Asociados:** RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08
  - **Perfil sugerido:** `flash`
  - **Archivos:** `client/src/App.test.js`, `client/src/Carrito.test.js`
  - **Alcance:** Actualizar `App.test.js` (eliminando la aserción heredada `/learn react/i`) para validar el marco global de Afrolash, controles accesibles, cierre de drawer y navegación; ampliar `Carrito.test.js` para probar el renderizado del stepper de checkout en UI, cálculos de subtotal/total, estado de carrito vacío y apertura del modal de autenticación accesible cuando no hay sesión. Ejecutar compilación y suite completa.
  - **Hecho cuando:** `npm --prefix client run build` finaliza con código 0 sin advertencias críticas de ESLint y `npm --prefix client test -- --watchAll=false` aprueba el 100% de las suites y casos de prueba.
