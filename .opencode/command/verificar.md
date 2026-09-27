---
description: Corré los gates técnicos (typecheck + test + build) y resumí el resultado
agent: build
---

Corré la verificación técnica del proyecto y resumí el resultado.

Pasos:

1. Ejecutá `npm run verify`.
2. Si falla, mostrá el error concreto (archivo:línea) y **corregilo** hasta que pase.
3. Tené en cuenta el contexto de `$ARGUMENTS` (si el usuario aclara qué está probando).
4. Si la feature toca UI, recordá las checklistes de `docs/UX_ECOMMERCE.md` y qué falta probar manualmente
   (mobile 390px y desktop), estados y accesibilidad AA.
5. Devolvé un resumen corto: qué pasó, qué corregiste y si está listo para entregar a prueba.

No hagas push ni commit a `main`.
