-- ============================================
-- Migración: Tienda pública DOMUS
-- Ejecutar en: Supabase SQL Editor
-- NO rompe nada existente: solo agrega columnas
-- ============================================

-- ============================================
-- 1. Columnas nuevas en productos
-- ============================================
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_oferta DECIMAL(12,2) CHECK (precio_oferta IS NULL OR precio_oferta >= 0),
  ADD COLUMN IF NOT EXISTS es_oferta BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating_promedio NUMERIC(3,2) DEFAULT 0 CHECK (rating_promedio >= 0 AND rating_promedio <= 5),
  ADD COLUMN IF NOT EXISTS rating_cantidad INTEGER DEFAULT 0 CHECK (rating_cantidad >= 0);

-- ============================================
-- 2. Vista v_stock_actual: ampliada con precio final
-- ============================================
-- DROP previo obligatorio: CREATE OR REPLACE VIEW no permite
-- insertar/reordenar columnas (error 42P16). La vista es solo
-- una consulta guardada: no se pierde ningún dato.
DROP VIEW IF EXISTS v_stock_actual;

CREATE OR REPLACE VIEW v_stock_actual AS
SELECT
  p.id AS producto_id,
  p.usuario_id,
  p.sku,
  p.nombre,
  p.descripcion,
  p.categoria,
  p.imagen_url,
  p.costo,
  p.precio_venta,
  p.precio_oferta,
  p.es_oferta,
  p.destacado,
  p.rating_promedio,
  p.rating_cantidad,
  p.stock_minimo,
  p.activo,
  -- Precio final para la tienda
  CASE
    WHEN p.es_oferta AND p.precio_oferta IS NOT NULL AND p.precio_oferta < p.precio_venta
      THEN p.precio_oferta
    ELSE p.precio_venta
  END AS precio_final,
  -- Porcentaje de descuento
  CASE
    WHEN p.es_oferta AND p.precio_oferta IS NOT NULL AND p.precio_oferta < p.precio_venta
      THEN ROUND(((p.precio_venta - p.precio_oferta) / p.precio_venta * 100)::NUMERIC, 0)
    ELSE 0
  END AS descuento_pct,
  -- Stock actual
  COALESCE(SUM(
    CASE
      WHEN m.tipo = 'ENTRADA' THEN m.cantidad
      WHEN m.tipo = 'VENTA' THEN -m.cantidad
      WHEN m.tipo = 'AJUSTE_POSITIVO' THEN m.cantidad
      WHEN m.tipo = 'AJUSTE_NEGATIVO' THEN -m.cantidad
      ELSE 0
    END
  ), 0)::INTEGER AS stock_actual,
  -- Unidades vendidas últimos 90 días (para ranking más vendidos)
  COALESCE(
    (SELECT SUM(vi.cantidad)
     FROM ventas_items vi
     JOIN ventas v ON v.id = vi.venta_id
     WHERE vi.producto_id = p.id
       AND v.estado = 'COMPLETADA'
       AND v.fecha >= NOW() - INTERVAL '90 days'
    ), 0
  )::INTEGER AS vendidos_90d
FROM productos p
LEFT JOIN movimientos_stock m ON m.producto_id = p.id
GROUP BY p.id, p.usuario_id, p.sku, p.nombre, p.descripcion, p.categoria,
         p.imagen_url, p.costo, p.precio_venta, p.precio_oferta, p.es_oferta,
         p.destacado, p.rating_promedio, p.rating_cantidad, p.stock_minimo, p.activo;

-- ============================================
-- 3. Índices para la tienda
-- ============================================
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_productos_es_oferta ON productos(es_oferta) WHERE es_oferta = true;
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_ventas_items_producto ON ventas_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado) WHERE estado = 'COMPLETADA';

-- ============================================
-- 4. Política RLS: lectura pública solo para productos activos
-- ============================================
-- Primero eliminar políticas de SELECT existentes de productos
DROP POLICY IF EXISTS "productos_select" ON productos;

-- Política para lectura pública: solo productos activos
CREATE POLICY "productos_select_public" ON productos
  FOR SELECT USING (activo = true);

-- Política para autenticados: ver todos sus productos (admin)
CREATE POLICY "productos_select_auth" ON productos
  FOR SELECT USING (auth.uid() = usuario_id);

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
