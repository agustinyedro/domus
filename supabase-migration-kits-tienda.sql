-- ============================================
-- Migración: publicar kits como productos de la tienda
-- Ejecutar en: Supabase SQL Editor
-- El stock de un kit se deriva de sus componentes:
--   stock_kit = MIN( FLOOR( stock_componente / cantidad_en_kit ) )
-- Al vender, se descuentan los componentes (no el producto espejo).
-- ============================================

-- ============================================
-- 1. Vínculo productos -> kits (producto espejo)
-- ============================================
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS kit_id UUID REFERENCES kits(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_kit
  ON productos(kit_id) WHERE kit_id IS NOT NULL;

-- ============================================
-- 2. Snapshot de componentes en la venta
--    (permite devolver stock exacto al anular)
-- ============================================
ALTER TABLE ventas_items
  ADD COLUMN IF NOT EXISTS kit_id UUID,
  ADD COLUMN IF NOT EXISTS componentes JSONB;

-- ============================================
-- 3. Recrear v_stock_actual con kit_id y stock derivado
--    DROP obligatorio: CREATE OR REPLACE VIEW no permite
--    agregar columnas (error 42P16). La vista es solo una consulta.
-- ============================================
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
  p.kit_id,
  CASE
    WHEN p.es_oferta AND p.precio_oferta IS NOT NULL AND p.precio_oferta < p.precio_venta
      THEN p.precio_oferta
    ELSE p.precio_venta
  END AS precio_final,
  CASE
    WHEN p.es_oferta AND p.precio_oferta IS NOT NULL AND p.precio_oferta < p.precio_venta
      THEN ROUND(((p.precio_venta - p.precio_oferta) / p.precio_venta * 100)::NUMERIC, 0)
    ELSE 0
  END AS descuento_pct,
  -- Stock: derivado de componentes si es kit; si no, por movimientos
  CASE
    WHEN p.kit_id IS NOT NULL THEN (
      SELECT COALESCE(MIN(FLOOR(sub.comp_stock::NUMERIC / NULLIF(ki.cantidad, 0))), 0)::INTEGER
      FROM kit_items ki
      JOIN (
        SELECT m.producto_id,
               SUM(CASE
                     WHEN m.tipo = 'ENTRADA' THEN m.cantidad
                     WHEN m.tipo = 'VENTA' THEN -m.cantidad
                     WHEN m.tipo = 'AJUSTE_POSITIVO' THEN m.cantidad
                     WHEN m.tipo = 'AJUSTE_NEGATIVO' THEN -m.cantidad
                     ELSE 0
                   END) AS comp_stock
        FROM movimientos_stock m
        GROUP BY m.producto_id
      ) sub ON sub.producto_id = ki.producto_id
      WHERE ki.kit_id = p.kit_id
    )
    ELSE COALESCE(SUM(
      CASE
        WHEN m.tipo = 'ENTRADA' THEN m.cantidad
        WHEN m.tipo = 'VENTA' THEN -m.cantidad
        WHEN m.tipo = 'AJUSTE_POSITIVO' THEN m.cantidad
        WHEN m.tipo = 'AJUSTE_NEGATIVO' THEN -m.cantidad
        ELSE 0
      END
    ), 0)::INTEGER
  END AS stock_actual,
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
         p.destacado, p.rating_promedio, p.rating_cantidad, p.stock_minimo, p.activo, p.kit_id;

-- ============================================
-- 4. Índices de apoyo
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ventas_items_kit ON ventas_items(kit_id) WHERE kit_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kit_items_kit ON kit_items(kit_id);

-- ============================================
-- FIN
-- ============================================
