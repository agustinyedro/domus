---
description: Prepará la entrega de la rama actual para prueba (resumen de PR + qué probar)
agent: build
---

Prepará la entrega de la rama actual para que el humano la pruebe.

Pasos:

1. Corré `npm run verify` y confirmá que pasa.
2. Mirá el diff de la rama contra `main` (`git diff main...HEAD --stat` y los commits).
3. Redactá el resumen con este formato (el mismo de `.github/pull_request_template.md`):
   - **Qué hace** (en 1–3 líneas).
   - **Qué inferí y agregué** (todo lo que no estaba pedido literalmente).
   - **Impacto UX/e-commerce** (según `docs/UX_ECOMMERCE.md`).
   - **Migraciones a correr** (archivo + qué hace), si hay.
   - **Cómo probar**: pasos numerados, en mobile y desktop.
   - **Riesgos / puntos de atención**.
4. Indicá el comando para pushear la rama:
   `git push -u origin <rama>` y crear el PR (preview de Cloudflare).
5. **No** hagas push a `main` ni merge. Esperá el OK explícito.

Contexto adicional del usuario: $ARGUMENTS
