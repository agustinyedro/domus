-- ============================================
-- Migración: Storage para fotos de productos
-- Ejecutar en: Supabase SQL Editor
-- Plan Free: 1 GB incluido (24 fotos ≈ 5 MB).
-- ============================================

-- ============================================
-- 1. BUCKET: productos (lectura pública)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. POLÍTICAS sobre storage.objects
-- Lectura pública (la tienda muestra fotos sin login).
-- Escritura solo autenticados (el admin sube con sesión).
-- ============================================

DROP POLICY IF EXISTS "productos_leer_publico" ON storage.objects;
CREATE POLICY "productos_leer_publico" ON storage.objects
  FOR SELECT USING (bucket_id = 'productos');

DROP POLICY IF EXISTS "productos_subir_auth" ON storage.objects;
CREATE POLICY "productos_subir_auth" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'productos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "productos_actualizar_auth" ON storage.objects;
CREATE POLICY "productos_actualizar_auth" ON storage.objects
  FOR UPDATE USING (bucket_id = 'productos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "productos_borrar_auth" ON storage.objects;
CREATE POLICY "productos_borrar_auth" ON storage.objects
  FOR DELETE USING (bucket_id = 'productos' AND auth.role() = 'authenticated');

-- ============================================
-- FIN
-- Nota: el upload del admin usa service_role (bypass RLS);
-- estas políticas cubren lectura pública y subidas directas futuras.
-- ============================================
