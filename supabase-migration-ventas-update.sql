-- ============================================
-- Migración: permitir actualizar ventas propias
-- Ejecutar en: Supabase SQL Editor
-- Sin esta política, aprobar/rechazar pedidos desde el
-- admin no persiste (el UPDATE no toca filas en silencio).
-- ============================================

CREATE POLICY "ventas_update" ON ventas
  FOR UPDATE USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- ============================================
-- FIN
-- ============================================
