-- ============================================
-- DOMUS - Schema Supabase (Corregido)
-- Ejecutar en: Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. EXTENSIONES
-- ============================================
-- gen_random_uuid() ya viene disponible en Postgres moderno

-- ============================================
-- 2. TABLA: productos
-- ============================================
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(100),
  imagen_url VARCHAR(500),
  costo DECIMAL(12,2) NOT NULL CHECK (costo >= 0),
  precio_venta DECIMAL(12,2) NOT NULL CHECK (precio_venta >= 0),
  stock_minimo INTEGER DEFAULT 5 CHECK (stock_minimo >= 0),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. TABLA: movimientos_stock
-- ============================================
CREATE TABLE movimientos_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('ENTRADA', 'VENTA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO')),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  costo_unitario DECIMAL(12,2) DEFAULT 0,
  motivo TEXT,
  referencia_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. TABLA: historial_compras (renombrado sin acento)
-- ============================================
CREATE TABLE historial_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  fecha TIMESTAMP NOT NULL DEFAULT NOW(),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  costo_unitario DECIMAL(12,2) NOT NULL,
  costo_total DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. TABLA: ventas
-- ============================================
CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha TIMESTAMP DEFAULT NOW(),
  total DECIMAL(12,2) DEFAULT 0,
  ganancia DECIMAL(12,2) DEFAULT 0,
  estado VARCHAR(50) DEFAULT 'COMPLETADA' CHECK (estado IN ('PENDIENTE', 'COMPLETADA', 'CANCELADA')),
  source VARCHAR(50) DEFAULT 'MANUAL',
  ecommerce_order_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_ecommerce_order UNIQUE (ecommerce_order_id)
);

-- ============================================
-- 6. TABLA: ventas_items
-- ============================================
CREATE TABLE ventas_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(12,2) NOT NULL,
  costo_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  ganancia_item DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * (precio_unitario - costo_unitario)) STORED
);

-- ============================================
-- 7. TABLA: kits
-- ============================================
CREATE TABLE kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(500),
  precio_venta DECIMAL(12,2) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 8. TABLA: kit_items
-- ============================================
CREATE TABLE kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 9. TABLA: clubs
-- ============================================
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio_mensual DECIMAL(12,2) NOT NULL,
  kit_id UUID REFERENCES kits(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 10. TABLA: suscriptores
-- ============================================
CREATE TABLE suscriptores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(20),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  estado VARCHAR(50) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'PAUSADO', 'CANCELADO')),
  fecha_suscripcion TIMESTAMP DEFAULT NOW(),
  fecha_cancelacion TIMESTAMP,
  proximo_envio TIMESTAMP,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 11. VISTA: stock_actual (NO columna)
-- ============================================
CREATE OR REPLACE VIEW v_stock_actual AS
SELECT
  p.id AS producto_id,
  p.usuario_id,
  p.sku,
  p.nombre,
  p.categoria,
  p.costo,
  p.precio_venta,
  p.stock_minimo,
  p.activo,
  COALESCE(SUM(
    CASE
      WHEN m.tipo = 'ENTRADA' THEN m.cantidad
      WHEN m.tipo = 'VENTA' THEN -m.cantidad
      WHEN m.tipo = 'AJUSTE_POSITIVO' THEN m.cantidad
      WHEN m.tipo = 'AJUSTE_NEGATIVO' THEN -m.cantidad
      ELSE 0
    END
  ), 0)::INTEGER AS stock_actual
FROM productos p
LEFT JOIN movimientos_stock m ON m.producto_id = p.id
GROUP BY p.id, p.usuario_id, p.sku, p.nombre, p.categoria, p.costo, p.precio_venta, p.stock_minimo, p.activo;

-- ============================================
-- 12. ÍNDICES
-- ============================================
CREATE INDEX idx_productos_usuario ON productos(usuario_id);
CREATE INDEX idx_productos_sku ON productos(sku);
CREATE INDEX idx_movimientos_producto ON movimientos_stock(producto_id);
CREATE INDEX idx_movimientos_usuario ON movimientos_stock(usuario_id);
CREATE INDEX idx_movimientos_created ON movimientos_stock(created_at);
CREATE INDEX idx_historial_producto ON historial_compras(producto_id);
CREATE INDEX idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_items_venta ON ventas_items(venta_id);
CREATE INDEX idx_kits_usuario ON kits(usuario_id);
CREATE INDEX idx_clubs_usuario ON clubs(usuario_id);
CREATE INDEX idx_suscriptores_club ON suscriptores(club_id);

-- ============================================
-- 13. TRIGGERS: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_productos_updated
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_kits_updated
  BEFORE UPDATE ON kits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_clubs_updated
  BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_suscriptores_updated
  BEFORE UPDATE ON suscriptores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 14. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscriptores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 15. POLÍTICAS RLS (equipo interno: uid = usuario_id)
-- ============================================

-- Productos
CREATE POLICY "productos_select" ON productos
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "productos_insert" ON productos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "productos_update" ON productos
  FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "productos_delete" ON productos
  FOR DELETE USING (auth.uid() = usuario_id);

-- Movimientos Stock
CREATE POLICY "movimientos_select" ON movimientos_stock
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "movimientos_insert" ON movimientos_stock
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Historial Compras
CREATE POLICY "historial_select" ON historial_compras
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "historial_insert" ON historial_compras
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Ventas
CREATE POLICY "ventas_select" ON ventas
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "ventas_insert" ON ventas
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Ventas Items
CREATE POLICY "ventas_items_select" ON ventas_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ventas WHERE ventas.id = ventas_items.venta_id AND ventas.usuario_id = auth.uid()
    )
  );
CREATE POLICY "ventas_items_insert" ON ventas_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ventas WHERE ventas.id = ventas_items.venta_id AND ventas.usuario_id = auth.uid()
    )
  );

-- Kits
CREATE POLICY "kits_select" ON kits
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "kits_insert" ON kits
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "kits_update" ON kits
  FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "kits_delete" ON kits
  FOR DELETE USING (auth.uid() = usuario_id);

-- Kit Items
CREATE POLICY "kit_items_select" ON kit_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kits WHERE kits.id = kit_items.kit_id AND kits.usuario_id = auth.uid()
    )
  );
CREATE POLICY "kit_items_insert" ON kit_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM kits WHERE kits.id = kit_items.kit_id AND kits.usuario_id = auth.uid()
    )
  );

-- Clubs
CREATE POLICY "clubs_select" ON clubs
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "clubs_insert" ON clubs
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "clubs_update" ON clubs
  FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "clubs_delete" ON clubs
  FOR DELETE USING (auth.uid() = usuario_id);

-- Suscriptores
CREATE POLICY "suscriptores_select" ON suscriptores
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "suscriptores_insert" ON suscriptores
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "suscriptores_update" ON suscriptores
  FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "suscriptores_delete" ON suscriptores
  FOR DELETE USING (auth.uid() = usuario_id);

-- ============================================
-- FIN DEL SCHEMA
-- ============================================
