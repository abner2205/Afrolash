# Tareas de Implementación: 001 - Remediación de Vulnerabilidades de Dependencias NPM en Server y Client

**Plan:** `specs/001-remediacion-vulnerabilidades-npm/plan.md`

- [x] **T1: Remediación de vulnerabilidades de producción y desarrollo en Backend (`server/`)**
  - **RF Asociados:** RF-01, RF-02, RF-05, RF-06
  - **Perfil sugerido:** `pro`
  - **Archivos:** `server/package.json`, `server/package-lock.json`
  - **Hecho cuando:** `npm --prefix server audit --omit=dev` reporta 0 vulnerabilidades críticas y 0 altas, `npm --prefix server audit` reduce al mínimo las vulnerabilidades de desarrollo mediante `overrides` sin degradar `jest` ni `nodemon`, `npm --prefix server install` finaliza sin errores `ERESOLVE`, `node --check server/index.js` y la carga de módulos de `server/` pasan sin errores, y `npm --prefix server test` no falla por dependencias rotas.

- [x] **T2: Remediación base de vulnerabilidades críticas y altas en Frontend (`client/`) vía `npm audit fix` y actualizaciones compatibles**
  - **RF Asociados:** RF-03, RF-06
  - **Perfil sugerido:** `flash`
  - **Archivos:** `client/package.json`, `client/package-lock.json`
  - **Hecho cuando:** `npm --prefix client audit` reporta **0 vulnerabilidades críticas** y resuelve los avisos con parche directo (`axios`, `react-router-dom`, `shell-quote`, `websocket-driver`, `proxy-addr`, `ws`, `node-forge`, `lodash`, etc.), `npm --prefix client run build` compila con código `0` y `npm --prefix client test -- --watchAll=false --testPathPattern=Carrito.test.js` pasa en verde.

- [x] **T3: Aplicación y validación selectiva de `overrides` en Frontend (`client/`) para cadenas transitivas de `react-scripts` y `exceljs`**
  - **RF Asociados:** RF-04, RF-05, RF-06
  - **Perfil sugerido:** `pro`
  - **Archivos:** `client/package.json`, `client/package-lock.json`
  - **Hecho cuando:** Se han aplicado en `client/package.json` todos los `overrides` compatibles que reducen vulnerabilidades altas/moderadas transitivas sin provocar `ERESOLVE`, descartando o acotando conforme a RF-05 los que rompan CommonJS/Webpack 5, `npm --prefix client run build` compila limpiamente y `npm --prefix client test -- --watchAll=false --testPathPattern=Carrito.test.js` pasa en verde sin errores de importación en `App.test.js`.

- [x] **T4: Verificación integral de idempotencia, no-regresión y registro en `MEMORY.md`**
  - **RF Asociados:** RF-05, RF-07
  - **Perfil sugerido:** `flash`
  - **Archivos:** `MEMORY.md`, `server/package-lock.json`, `client/package-lock.json`
  - **Hecho cuando:** `npm --prefix server install` y `npm --prefix client install` son idempotentes sin errores `ERESOLVE`, `npm --prefix client run build`, `node --check server/index.js`, `Carrito.test.js` y la verificación de `server/` pasan limpiamente, y `MEMORY.md` documenta las métricas comparativas de vulnerabilidades antes vs. después junto con cualquier excepción técnica residual justificada por RF-05.
