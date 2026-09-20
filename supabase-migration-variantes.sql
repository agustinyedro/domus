-- ============================================
-- DOMUS: productos con variantes
-- Ejecutar una sola vez en Supabase SQL Editor.
-- Es aditiva: conserva IDs, stock, compras, ventas y kits existentes.
-- ============================================

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS grupo_id UUID,
  ADD COLUMN IF NOT EXISTS variante VARCHAR(120);

-- Cada producto existente comienza como su propio grupo. Luego se pueden
-- agrupar desde el administrador sin alterar su historial ni su stock.
UPDATE productos SET grupo_id = id WHERE grupo_id IS NULL;
UPDATE productos SET variante = 'Única' WHERE variante IS NULL OR BTRIM(variante) = '';

ALTER TABLE productos ALTER COLUMN grupo_id SET DEFAULT gen_random_uuid();
ALTER TABLE productos ALTER COLUMN grupo_id SET NOT NULL;
ALTER TABLE productos ALTER COLUMN variante SET DEFAULT 'Única';
ALTER TABLE productos ALTER COLUMN variante SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_productos_grupo ON productos(usuario_id, grupo_id);

-- Impide repetir el mismo nombre de variante dentro de un producto.
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_grupo_variante
  ON productos(usuario_id, grupo_id, LOWER(variante));

DROP VIEW IF EXISTS v_stock_actual;

CREATE VIEW v_stock_actual AS
SELECT
  p.id AS producto_id,
  p.usuario_id,
  p.grupo_id,
  p.variante,
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
  CASE
    WHEN p.es_oferta AND p.precio_oferta IS NOT NULL AND p.precio_oferta < p.precio_venta
      THEN p.precio_oferta
    ELSE p.precio_venta
  END AS precio_final,
  CASE
    WHEN p.es_oferta AND p.precio_oferta IS NOT NULL AND p.precio_oferta < p.precio_venta
         AND p.precio_venta > 0
      THEN ROUND(((p.precio_venta - p.precio_oferta) / p.precio_venta * 100)::NUMERIC, 0)
    ELSE 0
  END AS descuento_pct,
  COALESCE(SUM(
    CASE
      WHEN m.tipo = 'ENTRADA' THEN m.cantidad
      WHEN m.tipo = 'VENTA' THEN -m.cantidad
      WHEN m.tipo = 'AJUSTE_POSITIVO' THEN m.cantidad
      WHEN m.tipo = 'AJUSTE_NEGATIVO' THEN -m.cantidad
      ELSE 0
    END
  ), 0)::INTEGER AS stock_actual,
  COALESCE((
    SELECT SUM(vi.cantidad)
    FROM ventas_items vi
    JOIN ventas v ON v.id = vi.venta_id
    WHERE vi.producto_id = p.id
      AND v.estado IN ('COMPLETADA', 'PAGADA')
      AND v.fecha >= NOW() - INTERVAL '90 days'
  ), 0)::INTEGER AS vendidos_90d
FROM productos p
LEFT JOIN movimientos_stock m ON m.producto_id = p.id
GROUP BY p.id;

COMMENT ON COLUMN productos.grupo_id IS 'Agrupa variantes que se muestran como un solo producto en la tienda';
COMMENT ON COLUMN productos.variante IS 'Opción vendible, por ejemplo Bambú, Vainilla o 250 ml';

