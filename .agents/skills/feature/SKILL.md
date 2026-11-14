---
name: feature
description: >-
  Flujo simplificado para cambios rápidos, ajustes puntuales o correcciones que no ameritan una especificación formal SDD de gran escala.
---

# Skill: Feature Rápida

Utiliza este flujo cuando el usuario solicite un cambio puntual, ajuste de UI menor en `client/src/components/`, refactorización pequeña o corrección de bugs evidentes en `client/` o `server/`.

---

## Procedimiento

1. **Comprensión**: Analiza el archivo afectado y la petición concreta del usuario.
2. **Impacto**: Verifica si el cambio afecta la persistencia en MySQL (`afrolash_db`), contratos de la API REST en `server/`, integración con Stripe/Nodemailer o el rendimiento de la interfaz React.
3. **Implementación**: Realiza la modificación necesaria en el código.
4. **Verificación**:
   - Ejecuta `npm --prefix client run build` (y `node --check` sobre los archivos modificados de `server/` si se tocó el backend).
   - Ejecuta `npm --prefix client test -- --watchAll=false` (y `npm --prefix server test` cuando aplique al backend) sobre las pruebas afectadas.
5. **Reporte**: Explica brevemente qué se modificó y confirma que la compilación y pruebas están en verde.
6. **Sincronización con GitHub**:
   - Solicita aprobación rápida al usuario para publicar los cambios.
   - Crea el commit siguiendo la convención (`fix: ...` o `feat: ...`).
   - Ejecuta `git push origin main` para subir el cambio aprobado a GitHub.
