-- supabase-migration-metodo-pago-ventas.sql
-- Correr en: Supabase SQL Editor (production)
--
-- Amplía los medios de pago válidos en ventas para el alta manual desde
-- admin/ventas (antes sólo permitía 'MP', 'EFECTIVO', 'MANUAL').
-- No toca RLS ni políticas: sólo la restricción CHECK de la columna.
--
-- CHECKLIST RLS
-- [x] No modifica políticas (sólo CHECK de columna)
-- [x] Compatible con filas existentes (conserva MP / EFECTIVO / MANUAL)

DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'ventas'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%metodo_pago%'
  LOOP
    EXECUTE format('ALTER TABLE ventas DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE ventas
  ADD CONSTRAINT ventas_metodo_pago_check
  CHECK (metodo_pago IS NULL OR metodo_pago IN (
    'MP',            -- Mercado Pago (checkout de tienda)
    'EFECTIVO',      -- Efectivo (−15%)
    'MANUAL',        -- legado
    'TRANSFERENCIA', -- Transferencia bancaria
    'DEBITO',        -- Tarjeta de débito
    'CREDITO',       -- Tarjeta de crédito
    'OTRO'           -- Otro medio
  ));
