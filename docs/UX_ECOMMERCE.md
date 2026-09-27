# DOMUS — Playbook UX / UI & E-commerce

Se lee en toda feature con impacto en tienda, carrito, checkout o admin.
Toda feature de cara al usuario se evalúa contra estas listas antes de la entrega.

## A. Conversión y confianza (e-commerce)

**Producto**
- [ ] Tarjeta clara: imagen, nombre, precio, estado de stock, CTA visible.
- [ ] Badges con criterio: `MÁS VENDIDO`, `-X%`. Nunca inventar urgencia.
- [ ] Precio honesto: lista vs oferta visibles y **efectivo −15%** explícito.
- [ ] En kits: mostrar **valor por separado** y el **ahorro** del combo.
- [ ] Stock real: no permitir comprar sin stock, tope de cantidad, “¡Quedan X!” cuando aplica.

**Carrito**
- [ ] Persistente (localStorage) y consistente al recargar.
- [ ] Editar cantidad / quitar sin recargar; total claro con descuento de efectivo.
- [ ] CTA de finalizar siempre accesible; alternativa por WhatsApp.

**Checkout**
- [ ] Mínimos campos (nombre + teléfono), validación inline con mensajes claros.
- [ ] Método de pago explícito (efectivo / Mercado Pago) y qué pasa con cada uno.
- [ ] Confirmación con **N° de pedido** y próximo paso (WhatsApp o link de pago).
- [ ] Estados: procesando, error recuperable, éxito.

**Confianza**
- [ ] Contacto visible (WhatsApp), horarios/tiempos de respuesta.
- [ ] **Envíos/retiro**, **cambios y devoluciones** y **medios de pago** accesibles desde la tienda.
- [ ] Post-compra: página de gracias y seguimiento del estado del pedido.

**Descubrimiento**
- [ ] Búsqueda y filtros que encuentran rápido; chips de filtros activos; orden.
- [ ] Estados vacíos útiles (con acción sugerida), nunca pantallas muertas.

## B. Craft UX/UI

- [ ] **Marca**: color y tipografía solo desde tokens (`--color-hueso/oliva/tierra`, `--font-heading/editorial`).
- [ ] **Contraste AA**: el Oliva sobre Hueso es bajo → usar Tierra para texto. Verificar cualquier combinación nueva.
- [ ] **Estados**: loading, vacío, error, éxito (+ skeletons donde sumen).
- [ ] **Accesibilidad AA**: foco visible, labels/`aria`, navegación por teclado, `alt`, tap targets ≥44px.
- [ ] **Mobile-first**: probar a 390px de ancho; nada que se corte ni requiera zoom.
- [ ] **Jerarquía**: un foco por pantalla; espaciado y tamaño guían la lectura.
- [ ] **Microcopy**: español rioplatense, claro, orientado a la acción, sin jerga.
- [ ] **Performance**: imágenes `loading="lazy"`, tamaños razonables, no bloquear el render.
- [ ] **Consistencia**: reutilizar componentes/estilos; `is:global` para DOM inyectado por JS.
- [ ] **No agregar fricción** a carrito/checkout (pasos, campos y clicks al mínimo).

## Roadmap e-commerce (priorizado)

Implementar de a uno, vía `/feature`, con su plan y su PR de prueba.

1. **Envíos / retiro** — opciones, zonas y costos visibles en ficha y checkout.
2. **Cambios y devoluciones** — política y flujo de solicitud.
3. **Medios de pago** — qué se acepta y cuotas, visibles antes de pagar.
4. **Seguimiento de pedido** — estado para el cliente (recibido → en preparación → listo/enviado).
5. **Reseñas** — mostrar y permitir opinar (los campos `rating_*` ya existen en `productos`).
6. **Cupones** — códigos de descuento (validación y cálculo siempre en el servidor).

## Cómo se aplica

- En el **plan** de cada feature: sección “Impacto UX/e-commerce” con los puntos de A y B que toca.
- En la **entrega**: “Qué probar” con pasos en mobile y desktop.
- Auditoría puntual de una página: comando `/auditar-tienda`.
- Pulido visual/profundo: comando `/revisar-ui` (skill *impeccable*).

## Reglas de marca

- Fondo claro: **Beige Hueso `#DBD190`**; texto **Marrón Tierra `#604811`**.
- Acento y fondos plenos: **Oliva Dorado `#988C2D`** (con texto Hueso).
- Wordmark: Montserrat Regular 400, mayúsculas, línea fina bajo la M.
- Editorial / títulos: Bricolage Grotesque Regular 400.
