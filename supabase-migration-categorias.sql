-- ============================================
-- Migración: categorías como entidad
-- Ejecutar en: Supabase SQL Editor
-- NO rompe nada: productos.categoria sigue siendo texto libre;
-- esta tabla es el vocabulario controlado para los selects.
-- ============================================

-- ============================================
-- 1. TABLA: categorias
-- ============================================
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT categorias_usuario_nombre_unique UNIQUE (usuario_id, nombre)
);

-- ============================================
-- 2. ÍNDICE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_categorias_usuario ON categorias(usuario_id);

-- ============================================
-- 3. RLS
-- ============================================
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categorias_select" ON categorias;
DROP POLICY IF EXISTS "categorias_insert" ON categorias;
DROP POLICY IF EXISTS "categorias_update" ON categorias;
DROP POLICY IF EXISTS "categorias_delete" ON categorias;

CREATE POLICY "categorias_select" ON categorias
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "categorias_insert" ON categorias
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "categorias_update" ON categorias
  FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "categorias_delete" ON categorias
  FOR DELETE USING (auth.uid() = usuario_id);

-- ============================================
-- 4. BACKFILL: categorías ya usadas en productos
-- Reemplazar el email por el del usuario admin.
-- ============================================
INSERT INTO categorias (usuario_id, nombre)
SELECT u.id, DISTINCT_CAT.categoria
FROM auth.users u
CROSS JOIN (
  SELECT DISTINCT categoria
  FROM productos
  WHERE categoria IS NOT NULL AND TRIM(categoria) <> ''
) AS DISTINCT_CAT
WHERE u.email = 'domusencasa@gmail.com'
ON CONFLICT (usuario_id, nombre) DO NOTHING;

-- ============================================
-- 5. SEED: categorías base de DOMUS
-- ============================================
INSERT INTO categorias (usuario_id, nombre)
SELECT u.id, x.nombre
FROM auth.users u
CROSS JOIN (VALUES ('Sahumerios'), ('Difusores'), ('Aromas'), ('Velas')) AS x(nombre)
WHERE u.email = 'domusencasa@gmail.com'
ON CONFLICT (usuario_id, nombre) DO NOTHING;

-- ============================================
-- FIN
-- ============================================
