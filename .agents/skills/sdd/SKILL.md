---
name: sdd
description: >-
  Metodología Spec-Driven Development (SDD) para el desarrollo estructurado de funcionalidades mediante especificación formal, clarificación de QA, planificación incremental e implementación validada tarea por tarea.
---

# Skill: Spec-Driven Development (SDD)

Esta habilidad guía el proceso formal de desarrollo de características en **Afrolash** para evitar ambigüedades y retrabajos.

---

## 1. El Flujo SDD

```text
[Petición Usuario]
        │
        ▼
   Fase 1: Spec (Planner)
        │
        ▼
   Fase 2: Clarificación (Reviewer QA) ──► Aprobación del Usuario
        │
        ▼
   Fase 3: Plan y Tareas (Planner) ──────► Aprobación del Usuario
        │
        ▼
   Fase 4: Implementación (Implementer: T1, T2...) ──► Pruebas en verde
        │
        ▼
   Fase 5: Validación RF por RF (Reviewer) ──► VEREDICTO: APROBADO
        │
        ▼
   Fase 6: Cierre, Memoria y Push a GitHub (Coordinator)
        │     - Actualizar MEMORY.md
        │     - Git commit (convención feat/fix)
        │     - git push origin main
        ▼
   [Entrega Finalizada en GitHub]
```

---

## 2. Requisitos Funcionales en Sintaxis EARS

Cada Requisito Funcional (**RF-01**, **RF-02**, etc.) en `spec.md` debe redactarse usando la sintaxis **EARS** (*Easy Approach to Requirements Syntax*):

- **Requisito Ubicuo** (siempre activo):
  `El sistema DEBERÁ <respuesta del sistema>.`
- **Requisito Guiado por Evento**:
  `CUANDO <evento disparador>, el sistema DEBERÁ <respuesta del sistema>.`
- **Requisito Guiado por Estado**:
  `MIENTRAS <estado específico>, el sistema DEBERÁ <respuesta del sistema>.`
- **Comportamiento No Deseado / Error**:
  `SI <condición de error/excepción>, ENTONCES el sistema DEBERÁ <respuesta de recuperación>.`
- **Característica Opcional**:
  `DONDE <característica opcional esté habilitada>, el sistema DEBERÁ <respuesta>.`

---

## 3. Plantillas de Archivos

### A. Plantilla `specs/NNN-nombre/spec.md`
```markdown
# Especificación: NNN - [Nombre de la Funcionalidad]

**Estado:** Borrador | En Revisión | Aprobado
**Fecha:** AAAA-MM-DD

## 1. Propósito y Contexto
- **Qué**: Descripción funcional de la característica.
- **Por qué**: Problema u oportunidad que resuelve.

## 2. Requisitos Funcionales (EARS)
- **RF-01**: CUANDO [evento], el sistema DEBERÁ [acción].
- **RF-02**: MIENTRAS [estado], el sistema DEBERÁ [acción].
- **RF-03**: SI [error], ENTONCES el sistema DEBERÁ [recuperación].

## 3. Casos Límite y Restricciones
- Concurrencia o accesos simultáneos.
- Valores fuera de rango, nulos o duplicados.
- Comportamiento ante fallos de red, disco o persistencia.

## 4. Criterios de Aceptación
- [ ] Criterio 1
- [ ] Criterio 2
```

### B. Plantilla `specs/NNN-nombre/plan.md`
```markdown
# Plan de Implementación: NNN - [Nombre de la Funcionalidad]

**Spec de referencia:** `specs/NNN-nombre/spec.md`

## 1. Arquitectura y Componentes Afectados
- Base de Datos MySQL / Esquema (`afrolash_db`):
- Backend API (`server/routes/`, `server/controllers/`, `server/middleware/`, `server/utils/`):
- Frontend React (`client/src/App.js`, `client/src/components/`):

## 2. Decisiones Técnicas y Alternativas Descartadas
- **Decisión 1**: [Explicación y por qué se descartó la alternativa X]

## 3. Estrategia de Pruebas
- Pruebas automatizadas (`client/src/*.test.js` / suite de `server/`):
- Verificación manual:

## 4. Matriz de Cobertura de RF
- RF-01 -> Componentes / Métodos / Tests que lo cubren.
- RF-02 -> Componentes / Métodos / Tests que lo cubren.
```

### C. Plantilla `specs/NNN-nombre/tasks.md`
```markdown
# Tareas de Implementación: NNN - [Nombre de la Funcionalidad]

**Plan:** `specs/NNN-nombre/plan.md`

- [ ] **T1: [Nombre de la tarea]**
  - **RF Asociados:** RF-01
  - **Perfil sugerido:** `flash` | `pro` *(según complejidad)*
  - **Archivos:** `Ruta/Al/Archivo`
  - **Hecho cuando:** `npm --prefix client run build` (y `node --check` en `server/` si aplica) compila limpiamente y `npm --prefix client test -- --watchAll=false` (y/o `npm --prefix server test`) pasa en verde.

- [ ] **T2: [Nombre de la tarea]**
  - **RF Asociados:** RF-02
  - **Perfil sugerido:** `flash` | `pro`
  - **Archivos:** `Ruta/Al/Archivo`
  - **Hecho cuando:** [Criterio objetivo y comprobable].
```
