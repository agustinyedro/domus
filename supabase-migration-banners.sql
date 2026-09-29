-- ============================================
-- Migración: banners promocionales (carrusel de tienda)
-- Ejecutar en: Supabase SQL Editor
-- Aditivo: crea la tabla banners + RLS + bucket de imágenes.
-- Los banners se muestran en /tienda, arriba del hero.
-- ============================================

-- ============================================
-- 1. TABLA: banners
-- ============================================
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(160) NOT NULL,
  descripcion VARCHAR(400),
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  mostrar_precio BOOLEAN NOT NULL DEFAULT true,
  mostrar_descripcion BOOLEAN NOT NULL DEFAULT true,
  texto_cta VARCHAR(60),
  link_url VARCHAR(500),
  imagen_url VARCHAR(500),
  posicion_imagen VARCHAR(20) NOT NULL DEFAULT 'derecha'
    CHECK (posicion_imagen IN ('izquierda', 'derecha')),
  estilo VARCHAR(20) NOT NULL DEFAULT 'oliva'
    CHECK (estilo IN ('oliva', 'tierra', 'hueso', 'oscuro')),
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_desde TIMESTAMPTZ,
  fecha_hasta TIMESTAMPTZ,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_banners_usuario ON banners(usuario_id);
CREATE INDEX IF NOT EXISTS idx_banners_vigencia ON banners(usuario_id, activo, orden);
CREATE INDEX IF NOT EXISTS idx_banners_producto ON banners(producto_id) WHERE producto_id IS NOT NULL;

-- ============================================
-- 3. TRIGGER updated_at
-- ============================================
DROP TRIGGER IF EXISTS trg_banners_updated ON banners;
CREATE TRIGGER trg_banners_updated
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. RLS (por cada operación usada)
-- ============================================
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_select" ON banners;
DROP POLICY IF EXISTS "banners_insert" ON banners;
DROP POLICY IF EXISTS "banners_update" ON banners;
DROP POLICY IF EXISTS "banners_delete" ON banners;

CREATE POLICY "banners_select" ON banners
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "banners_insert" ON banners
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "banners_update" ON banners
  FOR UPDATE USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "banners_delete" ON banners
  FOR DELETE USING (auth.uid() = usuario_id);

-- ============================================
-- 5. STORAGE: bucket banners (lectura pública)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "banners_leer_publico" ON storage.objects;
CREATE POLICY "banners_leer_publico" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "banners_subir_auth" ON storage.objects;
CREATE POLICY "banners_subir_auth" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "banners_actualizar_auth" ON storage.objects;
CREATE POLICY "banners_actualizar_auth" ON storage.objects
  FOR UPDATE USING (bucket_id = 'banners' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "banners_borrar_auth" ON storage.objects;
CREATE POLICY "banners_borrar_auth" ON storage.objects
  FOR DELETE USING (bucket_id = 'banners' AND auth.role() = 'authenticated');

-- ============================================
-- FIN
-- Nota: el upload del admin usa service_role (bypass RLS);
-- estas políticas cubren lectura pública y subidas directas futuras.
-- ============================================
