# Migraciones de Supabase

Las migraciones de este proyecto **se corren a mano** en el panel de Supabase
(SQL Editor). El repo no tiene runner automático.

## Convención

- Un archivo por cambio, en la raíz: `supabase-migration-<tema>.sql` (kebab-case, tema corto).
- Encabezado con propósito y recordatorio de que se corre a mano.
- Cambios **aditivos** siempre que se pueda: `ADD COLUMN IF NOT EXISTS`, `CREATE ... IF NOT EXISTS`.
- Para reemplazar una **vista**, va `DROP VIEW IF EXISTS` antes (con `CREATE OR REPLACE` no se pueden
  agregar/reordenar columnas → error 42P16).
- Los cambios de **estados** (por ejemplo en `ventas.estado`) se hacen soltando el constraint viejo
  (`DROP CONSTRAINT IF EXISTS ...`) y creando el nuevo.

## Checklist RLS (crítico)

Por cada tabla tocada, verificar que existan las políticas de **la operación que se usa**:

- [ ] `SELECT` — `USING (auth.uid() = usuario_id)`
- [ ] `INSERT` — `WITH CHECK (auth.uid() = usuario_id)`
- [ ] `UPDATE` — `USING (...)` **y** `WITH CHECK (...)` ← se olvida y hace que los updates no persistan en silencio
- [ ] `DELETE` — `USING (auth.uid() = usuario_id)`

Que exista `SELECT`/`INSERT` **no alcanza** para poder actualizar.

## Verificación después de correr una migración

1. Si PostgREST cachea el esquema y aparece "could not find the 'X' column ... in the schema cache",
   esperar 1–2 minutos y reintentar.
2. Probar la operación real que depende del cambio (crear, vender, anular) y **releer** para confirmar
   que persistió (no alcanza con que la UI diga "ok").

## Orden de aplicación (histórico)

Correr en este orden en una base nueva:

1. `supabase-schema.sql` — esquema base (tablas, vistas, RLS).
2. `supabase-migration-categorias.sql`
3. `supabase-migration-gastos.sql`
4. `supabase-migration-storage.sql`
5. `supabase-migration-tienda.sql` — tienda pública (precio final, stock, categorías).
6. `supabase-migration-checkout.sql` — estados de venta, método de pago, datos de cliente.
7. `supabase-migration-ventas-update.sql` — política `UPDATE` en `ventas` (aprobación de pedidos).
8. `supabase-migration-variantes.sql` — variantes de productos.
9. `supabase-migration-kits-tienda.sql` — publicar kits como productos (stock derivado de componentes).
   **Va después de la 8**: recrea `v_stock_actual` con `kit_id` y conserva las columnas de variantes
   (`grupo_id`, `variante`, `nombre_opcion`). Si la corrés antes, la vista queda sin variantes.

10. `supabase-migration-metodo-pago-ventas.sql` — amplía el CHECK de `ventas.metodo_pago` a Transferencia/Débito/Crédito/Otro (alta manual en admin/ventas). No toca RLS.

11. `supabase-migration-recargo-tarjeta.sql` — columna `productos.recargo_tarjeta` (default 15) + `precio_efectivo` en `v_stock_actual`. El admin carga precio en efectivo; tarjeta = efectivo + recargo.

12. `supabase-migration-ventas-editables.sql` — edición transaccional de ventas manuales en estado `PAGADA` y cierre definitivo en `COMPLETADA`.

Semillas opcionales: `supabase-seed-productos.sql`.

## Template

```sql
-- ============================================
-- Migración: <tema>
-- Ejecutar en: Supabase SQL Editor
-- ============================================

-- 1. Cambios de esquema
ALTER TABLE <tabla>
  ADD COLUMN IF NOT EXISTS <columna> <tipo>;

-- 2. RLS (por cada operación usada)
-- CREATE POLICY "<tabla>_update" ON <tabla>
--   FOR UPDATE USING (auth.uid() = usuario_id)
--   WITH CHECK (auth.uid() = usuario_id);

-- ============================================
-- FIN
-- ============================================
```
