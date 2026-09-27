---
description: Implementa una feature completa siguiendo el flujo DOMUS (descubrimiento → build → verify → entrega para prueba)
agent: build
---

Vas a implementar esta idea de principio a fin siguiendo el flujo de `AGENTS.md`.

Idea / pedido del usuario:

$ARGUMENTS

Pasos obligatorios:

1. **Descubrimiento y plan.** Releé lo relevante del repo (`AGENTS.md`, `docs/UX_ECOMMERCE.md` y los archivos que toquen).
   Escribí un plan corto con:
   - Qué entendí del pedido.
   - Qué **infiero** que hace falta aunque no se haya pedido (estados, validaciones, edge cases, mobile, a11y AA,
     implicancias de e-commerce, migración SQL + RLS, env, SEO, y efectos en tienda/carrito/checkout/admin).
   - Qué archivos toca (DB, API, admin, storefront, docs).
   - **Impacto UX/e-commerce** según `docs/UX_ECOMMERCE.md`.
   Si algo es ambiguo o hay decisiones de producto, **preguntá antes de construir**.
   Si el alcance es grande, pedí OK al plan.

2. **Rama.** Creá `feat/<tema>` (o `fix/<tema>`). Nunca trabajes sobre `main`.

3. **Build.** Implementá todo lo necesario para que funcione de punta a punta, no sólo lo literal.
   - Migraciones: creá `supabase-migration-<tema>.sql` si toca la DB (no asumas que ya está aplicada).
   - Dinero/stock: cálculo y validación en el servidor.
   - Estados: loading, vacío, error, éxito.
   - `is:global` para DOM inyectado por JS.

4. **Verificación.** Corré `npm run verify` y arreglá hasta que pase (typecheck + test + build).
   Probá el flujo manualmente cuando aplique.

5. **Entrega para prueba.** NO hagas push a `main`. Dejá la rama lista y entregá:
   - **Qué inferí y agregué** (lista para aprobar o revertir).
   - **Migraciones a correr** (si hay).
   - **Cómo probar**, en mobile y desktop.
   Sólo con el OK explícito del usuario se hace push de la rama → PR → preview, y luego merge.
