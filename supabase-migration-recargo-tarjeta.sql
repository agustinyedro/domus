-- ============================================
-- Migración: recargo de tarjeta por producto
-- Correr en: Supabase SQL Editor (production)
--
-- El admin carga el precio EN EFECTIVO; el de tarjeta/MP se deriva con un
-- recargo por producto (default 15%):  tarjeta = round(efectivo * (1 + r/100)).
-- Esta migración agrega la columna y expone en v_stock_actual:
--   - recargo_tarjeta  (para derivar precios)
--   - precio_efectivo  (precio vigente ya convertido: filtros y orden de tienda)
--
-- CHECKLIST RLS
-- [x] No modifica políticas (columna nueva con DEFAULT + vista pública)
-- [x] Filas existentes: recargo_tarjeta = 15 (efectivo vigente = tarjeta / 1.15)

-- 1. Columna por producto
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS recargo_tarjeta INTEGER NOT NULL DEFAULT 15
  CHECK (recargo_tarjeta >= 0 AND recargo_tarjeta <= 95);

-- 2. Recrear v_stock_actual (DROP obligatorio: CREATE OR REPLACE no agrega
--    columnas, error 42P16). Conserva todo lo de supabase-migration-kits-tienda.sql
--    y suma recargo_tarjeta + precio_efectivo.
DROP VIEW IF EXISTS v_stock_actual;

CREATE OR REPLACE VIEW v_stock_actual AS
SELECT
  p.id AS producto_id,
  p.usuario_id,
  p.grupo_id,
  p.variante,
  p.nombre_opcion,
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
  p.recargo_tarjeta,
  CASE
    WHEN p.es_oferta AND p.precio_oferta IS NOT NULL AND p.precio_oferta < p.precio_venta
      THEN p.precio_oferta
    ELSE p.precio_venta
  END AS precio_final,
  ROUND(
    (CASE
      WHEN p.es_oferta AND p.precio_oferta IS NOT NULL AND p.precio_oferta < p.precio_venta
        THEN p.precio_oferta
      ELSE p.precio_venta
    END)::NUMERIC / (1 + COALESCE(p.recargo_tarjeta, 15) / 100.0)
  ) AS precio_efectivo,
  CASE
    WHEN p.es_oferta AND p.precio_oferta IS NOT NULL AND p.precio_oferta < p.precio_venta
         AND p.precio_venta > 0
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
GROUP BY p.id, p.usuario_id, p.grupo_id, p.variante, p.nombre_opcion, p.sku, p.nombre,
         p.descripcion, p.categoria, p.imagen_url, p.costo, p.precio_venta, p.precio_oferta,
         p.es_oferta, p.destacado, p.rating_promedio, p.rating_cantidad, p.stock_minimo,
         p.activo, p.kit_id, p.recargo_tarjeta;

-- FIN
