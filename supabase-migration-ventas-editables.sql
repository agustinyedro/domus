-- ============================================
-- Migración: ventas manuales editables hasta completarlas
-- Ejecutar en: Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION editar_venta_manual(
  p_venta_id UUID,
  p_metodo_pago TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario UUID := auth.uid();
  v_venta ventas%ROWTYPE;
  v_item JSONB;
  v_prod productos%ROWTYPE;
  v_cantidad INTEGER;
  v_precio NUMERIC(12,2);
  v_costo NUMERIC(12,2);
  v_total NUMERIC(12,2) := 0;
  v_ganancia NUMERIC(12,2) := 0;
  v_stock INTEGER;
  v_componentes JSONB;
  v_comp RECORD;
  v_stock_kit INTEGER;
  v_costo_kit NUMERIC(12,2);
BEGIN
  IF v_usuario IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF p_metodo_pago NOT IN ('EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'MP', 'OTRO') THEN
    RAISE EXCEPTION 'Medio de pago inválido';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'La venta debe tener entre 1 y 50 productos';
  END IF;
  IF (SELECT COUNT(*) FROM jsonb_array_elements(p_items)) <>
     (SELECT COUNT(DISTINCT value->>'producto_id') FROM jsonb_array_elements(p_items)) THEN
    RAISE EXCEPTION 'No repitas el mismo producto en la venta';
  END IF;

  SELECT * INTO v_venta
  FROM ventas
  WHERE id = p_venta_id AND usuario_id = v_usuario
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Venta no encontrada'; END IF;
  IF COALESCE(v_venta.source, 'MANUAL') <> 'MANUAL' THEN RAISE EXCEPTION 'Los pedidos de la tienda no se editan desde Ventas'; END IF;
  IF v_venta.estado <> 'PAGADA' THEN RAISE EXCEPTION 'La venta ya está completada y no se puede editar'; END IF;

  DELETE FROM movimientos_stock
  WHERE referencia_id = p_venta_id AND usuario_id = v_usuario AND tipo = 'VENTA';
  DELETE FROM ventas_items WHERE venta_id = p_venta_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_cantidad := (v_item->>'cantidad')::INTEGER;
    IF v_cantidad < 1 THEN RAISE EXCEPTION 'La cantidad debe ser mayor a cero'; END IF;

    SELECT * INTO v_prod
    FROM productos
    WHERE id = (v_item->>'producto_id')::UUID AND usuario_id = v_usuario;
    IF NOT FOUND THEN RAISE EXCEPTION 'Producto no encontrado'; END IF;

    v_precio := CASE
      WHEN v_prod.es_oferta AND v_prod.precio_oferta IS NOT NULL AND v_prod.precio_oferta < v_prod.precio_venta
        THEN v_prod.precio_oferta
      ELSE v_prod.precio_venta
    END;
    IF p_metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA') THEN
      v_precio := ROUND(v_precio / (1 + LEAST(95, GREATEST(0, COALESCE(v_prod.recargo_tarjeta, 15))) / 100.0));
    END IF;

    IF v_prod.kit_id IS NOT NULL THEN
      v_componentes := '[]'::JSONB;
      v_stock_kit := NULL;
      v_costo_kit := 0;
      FOR v_comp IN
        SELECT ki.producto_id, ki.cantidad,
          COALESCE((
            SELECT hc.costo_unitario FROM historial_compras hc
            WHERE hc.producto_id = ki.producto_id AND hc.usuario_id = v_usuario
            ORDER BY hc.fecha DESC LIMIT 1
          ), cp.costo, 0) AS costo_unitario,
          COALESCE((
            SELECT SUM(CASE WHEN ms.tipo IN ('ENTRADA','AJUSTE_POSITIVO') THEN ms.cantidad ELSE -ms.cantidad END)
            FROM movimientos_stock ms
            WHERE ms.producto_id = ki.producto_id AND ms.usuario_id = v_usuario
          ), 0)::INTEGER AS stock_actual
        FROM kit_items ki
        JOIN productos cp ON cp.id = ki.producto_id AND cp.usuario_id = v_usuario
        WHERE ki.kit_id = v_prod.kit_id
      LOOP
        v_stock_kit := LEAST(COALESCE(v_stock_kit, FLOOR(v_comp.stock_actual / v_comp.cantidad)::INTEGER), FLOOR(v_comp.stock_actual / v_comp.cantidad)::INTEGER);
        v_costo_kit := v_costo_kit + v_comp.cantidad * v_comp.costo_unitario;
        v_componentes := v_componentes || jsonb_build_array(jsonb_build_object(
          'producto_id', v_comp.producto_id,
          'cantidad', v_comp.cantidad,
          'costo_unitario', v_comp.costo_unitario
        ));
      END LOOP;
      IF jsonb_array_length(v_componentes) = 0 THEN RAISE EXCEPTION 'El kit % no tiene componentes', v_prod.nombre; END IF;
      IF v_cantidad > COALESCE(v_stock_kit, 0) THEN RAISE EXCEPTION 'Stock insuficiente para %', v_prod.nombre; END IF;
      v_costo := v_costo_kit;

      INSERT INTO ventas_items (venta_id, producto_id, cantidad, precio_unitario, costo_unitario, kit_id, componentes)
      VALUES (p_venta_id, v_prod.id, v_cantidad, v_precio, v_costo, v_prod.kit_id, v_componentes);

      FOR v_comp IN SELECT * FROM jsonb_to_recordset(v_componentes) AS x(producto_id UUID, cantidad INTEGER, costo_unitario NUMERIC)
      LOOP
        INSERT INTO movimientos_stock (usuario_id, producto_id, tipo, cantidad, costo_unitario, motivo, referencia_id)
        VALUES (v_usuario, v_comp.producto_id, 'VENTA', v_comp.cantidad * v_cantidad, v_comp.costo_unitario, 'Venta manual editada · kit ' || v_prod.nombre, p_venta_id);
      END LOOP;
    ELSE
      SELECT COALESCE((
        SELECT hc.costo_unitario FROM historial_compras hc
        WHERE hc.producto_id = v_prod.id AND hc.usuario_id = v_usuario
        ORDER BY hc.fecha DESC LIMIT 1
      ), v_prod.costo, 0) INTO v_costo;
      SELECT COALESCE(SUM(CASE WHEN ms.tipo IN ('ENTRADA','AJUSTE_POSITIVO') THEN ms.cantidad ELSE -ms.cantidad END), 0)::INTEGER
      INTO v_stock FROM movimientos_stock ms
      WHERE ms.producto_id = v_prod.id AND ms.usuario_id = v_usuario;
      IF v_cantidad > v_stock THEN RAISE EXCEPTION 'Stock insuficiente para %: hay %', v_prod.nombre, v_stock; END IF;

      INSERT INTO ventas_items (venta_id, producto_id, cantidad, precio_unitario, costo_unitario)
      VALUES (p_venta_id, v_prod.id, v_cantidad, v_precio, v_costo);
      INSERT INTO movimientos_stock (usuario_id, producto_id, tipo, cantidad, costo_unitario, motivo, referencia_id)
      VALUES (v_usuario, v_prod.id, 'VENTA', v_cantidad, v_costo, 'Venta manual editada', p_venta_id);
    END IF;

    v_total := v_total + v_precio * v_cantidad;
    v_ganancia := v_ganancia + (v_precio - v_costo) * v_cantidad;
  END LOOP;

  UPDATE ventas
  SET metodo_pago = p_metodo_pago, total = v_total, ganancia = v_ganancia
  WHERE id = p_venta_id AND usuario_id = v_usuario;

  RETURN jsonb_build_object('id', p_venta_id, 'estado', 'PAGADA', 'total', v_total, 'ganancia', v_ganancia);
END;
$$;

CREATE OR REPLACE FUNCTION completar_venta_manual(p_venta_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario UUID := auth.uid();
  v_actualizado UUID;
BEGIN
  UPDATE ventas
  SET estado = 'COMPLETADA'
  WHERE id = p_venta_id
    AND usuario_id = v_usuario
    AND source = 'MANUAL'
    AND estado = 'PAGADA'
  RETURNING id INTO v_actualizado;
  IF v_actualizado IS NULL THEN
    RAISE EXCEPTION 'La venta no está disponible para completar';
  END IF;
  RETURN jsonb_build_object('id', v_actualizado, 'estado', 'COMPLETADA');
END;
$$;

REVOKE ALL ON FUNCTION editar_venta_manual(UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION completar_venta_manual(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION editar_venta_manual(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION completar_venta_manual(UUID) TO authenticated;

-- RLS: las eliminaciones ocurren dentro de funciones SECURITY DEFINER que
-- validan auth.uid(), usuario_id, source y estado antes de modificar datos.

-- ============================================
-- FIN
-- ============================================
