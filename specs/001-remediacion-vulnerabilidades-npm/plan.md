# Plan de Implementación: 001 - Remediación de Vulnerabilidades de Dependencias NPM en Server y Client

**Spec de referencia:** `specs/001-remediacion-vulnerabilidades-npm/spec.md`

## 1. Arquitectura y Componentes Afectados
- **Base de Datos MySQL / Esquema (`afrolash_db`)**:
  - Sin modificaciones en tablas ni disparadores; `server/config/db.js` y `server/auditoria.test.js` permiten validar la compatibilidad operativa de `mysql2/promise` tras su actualización.
- **Backend API (`server/package.json`, `server/package-lock.json`)**:
  - Dependencias de producción a actualizar mediante `npm audit fix` y rangos semver compatibles: `mysql2` (`>3.23.0`), `multer` (`>2.4.0`), `nodemailer` (`>10.1.3`), junto con las transitivas de Express 5 (`body-parser`, `proxy-addr`, `qs`, `brace-expansion`, `js-yaml`).
  - Dependencias de desarrollo (`jest`, `nodemon`): remediación de transitivas (`glob`, `minimatch`, `deepmerge`, `browserslist`, `baseline-browser-mapping`) mediante `npm audit fix` y bloque `overrides` en `server/package.json`.
- **Frontend React (`client/package.json`, `client/package-lock.json`)**:
  - Dependencias directas y transitivas con parche compatible vía `npm audit fix`: `axios`, `react-router`/`react-router-dom`, `shell-quote`, `websocket-driver`, `proxy-addr`, `ws`, `node-forge`, `lodash`, `underscore`, `flatted`, `fast-uri`, `form-data`, `nanoid`, `picomatch`, `path-to-regexp`, `rollup`, `source-map-js`, `compression`, `body-parser`, `launch-editor`, `colord`, `follow-redirects`, `http-proxy-middleware`, `postcss-selector-parser`, `yaml`, `baseline-browser-mapping`, `browserslist`, `brace-expansion`, `minimatch`, `@babel/core`, `@babel/plugin-transform-modules-systemjs`.
  - Sub-dependencias de `react-scripts@5.0.1` y `exceljs@4.4.0` donde `npm audit fix --force` intentaría degradar paquetes: evaluación controlada y aplicación de `overrides` en `client/package.json` (`serialize-javascript`, `nth-check`, `postcss`, `webpack-dev-middleware`, `@tootallnate/once`, `deepmerge`, `uuid`), conservando únicamente los que resuelven sin `ERESOLVE` y mantienen en verde `npm --prefix client run build` y `Carrito.test.js`.

## 2. Decisiones Técnicas y Alternativas Descartadas
- **Decisión 1: Uso combinado de `npm audit fix` (sin `--force`) + actualización de rangos en `package.json` + `overrides` selectivos verificados**:
  - Permite remediar todas las vulnerabilidades críticas y altas de runtime y la mayoría de herramientas de build sin degradar `react-scripts@5.0.1`, `exceljs@4.4.0`, `jest@30.4.2` ni `nodemon@3.1.13`.
  - *Alternativa descartada*: `npm audit fix --force`, ya que degrada `react-scripts` a `0.0.0`, `jest` a `25.1.0`, `nodemon` a `3.1.11` y `exceljs` a `3.4.0`, dejando inoperativo el entorno de compilación y pruebas.
- **Decisión 2: Validación incremental y reversión selectiva por lote de `overrides` (RF-05)**:
  - Si una sub-dependencia con cambio mayor (como `uuid >=11.1.1` que migró a ESM puro o `webpack-dev-middleware >=7.4.5` frente a `webpack-dev-server` de CRA 5) provoca error `ERESOLVE` o rompe CommonJS / Webpack 5 en `client/`, se acota al paquete padre específico o se revierte únicamente ese `override`, documentando la excepción técnica en `MEMORY.md`.
  - *Alternativa descartada*: Ejecutar `npm run eject` sobre Create React App o migrar el frontend a Vite, descartado para preservar intactas la estructura y dependencias directas actuales del proyecto.
- **Decisión 3: Separación de remediación por capa (`server/` primero, `client/` después)**:
  - Aislar la actualización y verificación del backend Express/MySQL respecto del frontend React/Webpack facilita diagnosticar de forma inequívoca cualquier conflicto de árbol (`ERESOLVE`) o regresión funcional.

## 3. Estrategia de Pruebas
- **Backend (`server/`)**:
  - Auditoría de seguridad: `npm --prefix server audit --omit=dev` y `npm --prefix server audit`.
  - Idempotencia de instalación: `npm --prefix server install` sin errores `ERESOLVE`.
  - Verificación sintáctica y carga de módulos: `node --check server/index.js` y carga programática (`require`) de controladores, rutas, middlewares y utilidades (`server/utils/enviarFactura.js`).
  - Pruebas automatizadas: `npm --prefix server test` (`server/auditoria.test.js` cuando MySQL esté disponible; ante indisponibilidad de BD en el entorno, verificación de arranque limpio de Jest sin errores de dependencias/resolución).
- **Frontend (`client/`)**:
  - Auditoría de seguridad: `npm --prefix client audit`.
  - Idempotencia de instalación: `npm --prefix client install` sin errores `ERESOLVE`.
  - Compilación de producción: `npm --prefix client run build` finalizando con código `0` y sin advertencias críticas.
  - Pruebas automatizadas: `npm --prefix client test -- --watchAll=false --testPathPattern=Carrito.test.js` en verde, y ejecución de `App.test.js` verificando ausencia de fallos de importación o resolución de paquetes.

## 4. Matriz de Cobertura de RF
- **RF-01** -> `server/package.json`, `server/package-lock.json` -> Tarea `T1` -> `npm --prefix server audit --omit=dev` (0 críticas, 0 altas) + `node --check server/index.js` + carga de módulos.
- **RF-02** -> `server/package.json` (`overrides`), `server/package-lock.json` -> Tarea `T1` -> `npm --prefix server audit` + `npm --prefix server test`.
- **RF-03** -> `client/package.json`, `client/package-lock.json` -> Tarea `T2` -> `npm --prefix client audit` (0 críticas) + `npm --prefix client run build`.
- **RF-04** -> `client/package.json` (`overrides`), `client/package-lock.json` -> Tarea `T3` -> `npm --prefix client install` + `npm --prefix client run build` + `Carrito.test.js`.
- **RF-05** -> `server/package.json`, `client/package.json`, `MEMORY.md` -> Tareas `T1`, `T3`, `T4` -> Confinamiento o reversión selectiva de `overrides` incompatibles y registro de excepciones técnicas.
- **RF-06** -> `server/package.json`, `client/package.json` -> Tareas `T1`, `T2`, `T3` -> Revisión con `git diff` confirmando preservación de dependencias directas y código fuente de aplicación.
- **RF-07** -> `server/package-lock.json`, `client/package-lock.json`, `MEMORY.md` -> Tarea `T4` -> Verificación integral de idempotencia de `npm install`, build, sintaxis y suites de prueba.
