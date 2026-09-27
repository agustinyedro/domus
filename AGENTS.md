# AGENTS.md — DOMUS

Guía de trabajo para agentes (opencode y otros) en este repositorio.
Leer completo antes de tocar código.

## Qué es el proyecto

DOMUS: marca de hogar (aromás, objetos, textiles, sabores) con **landing editorial**
y **tienda online** (`/tienda`) con carrito, checkout propio y panel de administración
(`/admin`). El objetivo es conversión real: catálogo → carrito → pedido → cobro.

## Stack

- **Astro 7** — páginas y layout. `output: 'static'`, con rutas SSR (`export const prerender = false`)
  que corren como Functions en Cloudflare.
- **Vue 3** — sólo componentes interactivos (ej. `ShopExplorer.vue`).
- **Supabase** — Postgres + Auth + Storage; RLS por usuario.
- **Mercado Pago** — checkout por preferencia + webhook de confirmación.
- **Cloudflare Pages** — deploy por Git integration.
- **Zod** — validación de payloads en `src/lib/validations.ts`.
- Sin framework de CSS: CSS plano con tokens en `src/styles/globals.css`.

## Comandos

```bash
npm run dev          # servidor local (SSR Node, sin adapter CF)
npm run build        # build de producción (agrega adapter Cloudflare)
npm run preview      # preview del build
npm run typecheck    # astro check con baseline (falla sólo si AUMENTAN los errores)
npm run typecheck:report  # astro check crudo (para ver todo el detalle)
npm run test         # tests (node:test vía tsx)
npm run lint         # Biome sobre archivos staged (sólo código nuevo)
npm run lint:all     # Biome sobre todo src/tests/scripts (ruidoso con legacy)
npm run format       # Biome format sobre archivos staged
npm run verify       # typecheck + test + build  ← gate antes de subir
```

> **Typecheck con baseline:** hay deuda de tipos preexistente registrada en `typecheck.baseline.json`
> (errores/hints). `npm run typecheck` tolera ese número y **falla sólo si aparecen errores nuevos**.
> A medida que se limpia, bajar los números del baseline. Nunca subirlos.

## Mapa de carpetas

```
src/
  pages/            # rutas (.astro) + api/ (endpoints .ts)
    api/admin/      # endpoints del panel (auth por sesión)
    api/tienda/     # endpoints públicos de tienda
    api/checkout/   # creación de pedidos
    api/webhooks/   # mercadopago
  components/       # Astro (secciones) y Vue (interactivos)
  layouts/          # BaseLayout, AdminLayout
  lib/              # supabase.ts, validations.ts, kits.ts, calculations.ts, compra-import.ts
  styles/           # globals.css (tokens), editorial.css, animations.css
  config.ts         # WhatsApp, social, site
supabase-migration-*.sql   # migraciones (se corren a mano en Supabase)
docs/               # playbooks (UX/e-commerce)
```

## Convenciones

- **Idioma:** todo el copy en español rioplatense. Código y nombres de archivos en inglés/español consistente con lo existente.
- **Sin comentarios** salvo que aporten algo no obvio.
- **Marca:** colores y tipografías SOLO desde tokens (`--color-hueso`, `--color-oliva`, `--color-tierra`, `--font-heading`, `--font-editorial`). Ver `src/styles/globals.css`.
- **Dinero:** pesos argentinos, **enteros** (redondear). Formatear con `toLocaleString('es-AR')`.
- **Precios, stock y ganancia:** siempre se calculan/validan en el **servidor**. El cliente sólo previsualiza.
- **Estados de venta:** `PENDIENTE_EFECTIVO`, `PENDIENTE_PAGO`, `PAGADA`, `COMPLETADA`, `RECHAZADA`, `CANCELADA`.
- **Efectivo:** 15% de descuento respecto del precio publicado (tarjeta/MP). Constante `DESCUENTO_EFECTIVO`.
- **Kits:** son productos espejo (`productos.kit_id`) con categoría `Kits`; el stock se **deriva de los componentes** y al vender se descuentan los componentes (no el espejo).
- **Reutilizar** componentes y estilos existentes antes de crear nuevos.

## Gotchas (errores ya cometidos, no repetir)

1. **Estilos scoped vs. DOM inyectado.** Astro "scopea" los `<style>` a elementos de la plantilla.
   El HTML creado por JS (`innerHTML`) **no recibe** esos estilos. Si un componente inyecta DOM
   (modales, tarjetas, filas), usá `<style is:global>` o clases globales.
2. **Migraciones manuales.** Cada cambio de DB va en un `supabase-migration-<tema>.sql` que el humano
   corre en Supabase SQL Editor. Nunca asumir que ya está aplicada.
3. **RLS necesita cada operación.** Que exista política de SELECT/INSERT no alcanza: para `update`
   hace falta política `FOR UPDATE` (nos pasó con `ventas`: los cambios no persistían en silencio).
4. **`PUBLIC_*` se inlinean en build.** Deben estar presentes al compilar (CI usa dummy). Las
   server-only (`SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`) van como **Secret**
   en Cloudflare.
5. **Falso éxito.** Si una operación de DB puede no persistir (RLS, update sin filas), **verificar
   releyendo** antes de responder éxito.
6. **Cache.** Los endpoints de tienda con datos vivos (stock/precio) van con `Cache-Control: no-store`.

## Flujo por feature (obligatorio)

1. **Descubrimiento.** Antes de planificar: releer lo relevante, listar lo que entendí + lo que
   **infiero** (puede no estar en el pedido) + impacto UX/e-commerce. Si algo es ambiguo, preguntar.
2. **Rama.** Trabajar en `feat/<tema>` o `fix/<tema>`. **Nunca** commitear/pushear a `main` directo.
3. **Plan.** Escribirlo (qué toca, DB, API, admin, storefront, estados, migraciones). Pedir OK si
   el alcance es grande o hay decisiones de producto.
4. **Build.** Implementar completo: backend + validaciones + admin + storefront + estados + docs.
5. **Verificación técnica.** `npm run verify`. Corregir hasta que pase.
6. **Entrega para prueba.** Push de la rama → PR → **Preview de Cloudflare**. Entregar
   "Qué inferí y agregué" + "Cómo probar" (mobile y desktop).
7. **OK humano.** Sólo con el OK explícito se mergea a `main` (deploy a producción).

## Contrato de autonomía

- **Completar lo necesario, no sólo lo literal.** Si la feature implica estados vacíos, validaciones,
  migración, ajuste de admin o de checkout, hacerlo.
- **Inferir y declarar.** Todo lo agregado por iniciativa propia se lista en la entrega para que se
  pueda aprobar o revertir.
- **Nunca desplegar sin OK.** Ni commit a `main`, ni merge, ni deploy automático sin aprobación.
- **Probar antes de entregar.** No entregar algo que no se verificó localmente (`verify` + prueba manual).
- **No romper lo que funciona.** Cambios en checkout/stock/RLS son sensibles: validar con datos reales
  de prueba y revisar el impacto en pedidos pendientes.

## Definition of Done

Una feature cierra cuando:

- [ ] `npm run verify` pasa (typecheck + test + build).
- [ ] Funciona en **mobile** y desktop.
- [ ] Cubre **estados**: loading, vacío, error, éxito.
- [ ] **Accesibilidad AA**: contraste, foco visible, labels/`aria`, navegación por teclado, tap targets ≥44px.
- [ ] **UX/e-commerce** revisado según `docs/UX_ECOMMERCE.md` (sin agregar fricción a carrito/checkout).
- [ ] Si toca DB: migración creada y **listada en la entrega** para correr.
- [ ] Si toca dinero/stock: cálculo y validación en servidor, verificado.
- [ ] Copy en español, coherente con la marca.
- [ ] Documentado lo que se infirió y cómo probarlo.

## Referencias

- `docs/UX_ECOMMERCE.md` — checklists de conversión, craft UX/UI y roadmap e-commerce.
- `SUPABASE_MIGRATIONS.md` — orden de migraciones y checklist RLS.

## Comandos de opencode (`.opencode/command/`)

- `/feature <idea>` — implementa de punta a punta con el flujo de arriba.
- `/verificar` — corre los gates y resume.
- `/migracion <cambio>` — crea un `supabase-migration-*.sql` con checklist RLS.
- `/revisar-ui [objetivo]` — pulido de interfaz (skill *impeccable*).
- `/auditar-tienda [página]` — auditoría de conversión/a11y/mobile + Lighthouse local.
- `/entregar` — arma el resumen de PR y el “cómo probar” para la aprobación humana.
