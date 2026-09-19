-- ============================================
-- Migración: flujo de compra (MP + efectivo con OK)
-- Ejecutar en: Supabase SQL Editor
-- No toca datos existentes: solo amplía estados y columnas.
-- ============================================

-- ============================================
-- 1. Ampliar estados de ventas
-- ============================================
ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_estado_check;

ALTER TABLE ventas ADD CONSTRAINT ventas_estado_check
  CHECK (estado IN (
    'PENDIENTE', 'COMPLETADA', 'CANCELADA',
    'PENDIENTE_PAGO', 'PAGADA', 'PENDIENTE_EFECTIVO',
    'RECHAZADA'
  ));

-- ============================================
-- 2. Columnas de pago y cliente
-- ============================================
ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(20) CHECK (metodo_pago IS NULL OR metodo_pago IN ('MP', 'EFECTIVO', 'MANUAL')),
  ADD COLUMN IF NOT EXISTS mp_preference_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cliente_nombre VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cliente_telefono VARCHAR(50);

-- Idempotencia del webhook: un pago MP marca una sola venta
CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_mp_payment
  ON ventas(mp_payment_id) WHERE mp_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_metodo ON ventas(metodo_pago);

-- ============================================
-- FIN
-- ============================================
