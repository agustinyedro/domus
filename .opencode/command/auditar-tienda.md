---
description: Auditá una página contra las checklists de conversión, a11y y mobile (con Lighthouse local)
agent: build
---

Auditá esta página/sección contra el playbook de e-commerce:

$ARGUMENTS

Método:

1. Leé `docs/UX_ECOMMERCE.md` (checklists A y B).
2. Revisá el código de la página y su comportamiento en **mobile (390px) y desktop**.
3. Corré **Lighthouse local** sobre el build:
   - `npm run build` y luego `npm run preview` (o `npm run dev`), y corré Lighthouse sobre la URL local
     apuntando a performance, accesibilidad, buenas prácticas y SEO.
   - Anotá los hallazgos concretos (no genéricos).
4. Entregá un informe priorizado por impacto:
   - **Conversión/confianza** (fricción en carrito/checkout, precios, stock, señales de confianza).
   - **Accesibilidad AA** (contraste, foco, labels/aria, teclado, tap targets).
   - **Mobile** (cortes, tamaños, legibilidad).
   - **Performance/SEO**.
   Cada hallazgo con: qué, dónde (archivo:línea), impacto y arreglo sugerido.
5. No cambies código salvo que te lo pidan; primero el informe.

No hagas push ni commit a `main`.
