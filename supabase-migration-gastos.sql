-- ============================================
-- Migración: gastos generales + dashboard negocio
-- Ejecutar en: Supabase SQL Editor
-- NO rompe nada existente: solo agrega tabla gastos
-- ============================================

-- ============================================
-- 1. TABLA: gastos
-- ============================================
CREATE TABLE IF NOT EXISTS gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha TIMESTAMP NOT NULL DEFAULT NOW(),
  concepto VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL DEFAULT 'Otros'
    CHECK (categoria IN ('Alquiler', 'Servicios', 'Insumos', 'Marketing', 'Personal', 'Otros')),
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_gastos_usuario ON gastos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);

-- ============================================
-- 3. RLS
-- ============================================
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gastos_select" ON gastos;
DROP POLICY IF EXISTS "gastos_insert" ON gastos;
DROP POLICY IF EXISTS "gastos_update" ON gastos;
DROP POLICY IF EXISTS "gastos_delete" ON gastos;

CREATE POLICY "gastos_select" ON gastos
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "gastos_insert" ON gastos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "gastos_update" ON gastos
  FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "gastos_delete" ON gastos
  FOR DELETE USING (auth.uid() = usuario_id);

-- ============================================
-- FIN
-- ============================================
