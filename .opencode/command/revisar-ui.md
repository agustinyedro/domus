---
description: Revisá y pulí la UI/UX de una pantalla o componente con criterio de marca y accesibilidad
agent: build
---

Revisá y mejorá la interfaz pedida:

$ARGUMENTS

Método:

1. Cargá la skill **`impeccable`** (herramienta `skill`) y aplicala.
2. Leé `docs/UX_ECOMMERCE.md` (checklists A y B) y `src/styles/globals.css` (tokens de marca).
3. Revisá en **mobile (390px) y desktop**: jerarquía, espaciado, tipografía, contraste AA, foco, teclado,
   tap targets ≥44px, estados (loading/vacío/error/éxito) y microcopy.
4. Si el DOM se inyecta por JS, usá `<style is:global>` (gotcha #1 de `AGENTS.md`).
5. No inventes colores ni fuentes: sólo tokens.
6. Corregí lo que haga falta y corré `npm run verify`.
7. Entregá: qué cambiaste, por qué, y qué probar en mobile y desktop. Sin push a `main`.
