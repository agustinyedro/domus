// src/pages/api/admin/dashboard.ts
// Dashboard de negocio: KPIs, comparativas, series, estrella, club, actividad
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';

export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const inicioMesAnt = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const diasEnMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // ---------- Stock ----------
  const { data: productos } = await supabase
    .from('v_stock_actual')
    .select('*')
    .eq('usuario_id', user.id);

  const stockTotal = (productos || []).reduce((s, p) => s + (p.stock_actual || 0), 0);
  const valorStock = (productos || []).reduce((s, p) => s + (p.stock_actual || 0) * (p.costo || 0), 0);
  const stockBajo = (productos || []).filter((p) => (p.stock_actual || 0) < (p.stock_minimo || 5));

  // ---------- Ventas mes actual ----------
  const { data: ventasMes } = await supabase
    .from('ventas')
    .select('id, fecha, total, ganancia')
    .eq('usuario_id', user.id)
    .gte('fecha', inicioMes)
    .eq('estado', 'COMPLETADA');

  const ventasIds = (ventasMes || []).map((v) => v.id);
  const ingresos = (ventasMes || []).reduce((s, v) => s + (v.total || 0), 0);
  const cantVentas = (ventasMes || []).length;

  // ---------- Ventas mes anterior (comparativa) ----------
  const { data: ventasAnt } = await supabase
    .from('ventas')
    .select('id, total')
    .eq('usuario_id', user.id)
    .gte('fecha', inicioMesAnt)
    .lt('fecha', inicioMes)
    .eq('estado', 'COMPLETADA');

  const ingresosAnt = (ventasAnt || []).reduce((s, v) => s + (v.total || 0), 0);
  const cantVentasAnt = (ventasAnt || []).length;

  // ---------- COGS (costo de lo vendido) ----------
  let cogs = 0;
  let itemsDetalle: Array<{ cantidad: number; precio_unitario: number; costo_unitario: number; producto_id: string; producto_nombre?: string }> = [];
  if (ventasIds.length > 0) {
    const { data: items } = await supabase
      .from('ventas_items')
      .select('cantidad, precio_unitario, costo_unitario, producto_id, productos ( nombre )')
      .in('venta_id', ventasIds);
    itemsDetalle = (items || []).map((i: Record<string, unknown>) => ({
      cantidad: i.cantidad as number,
      precio_unitario: i.precio_unitario as number,
      costo_unitario: i.costo_unitario as number,
      producto_id: i.producto_id as string,
      producto_nombre: (i.productos as { nombre?: string } | null)?.nombre,
    }));
    cogs = itemsDetalle.reduce((s, i) => s + i.cantidad * i.costo_unitario, 0);
  }

  // ---------- Egresos: compras + gastos ----------
  const { data: comprasMes } = await supabase
    .from('historial_compras')
    .select('costo_total')
    .eq('usuario_id', user.id)
    .gte('fecha', inicioMes);

  const egresosCompras = (comprasMes || []).reduce((s, c) => s + (c.costo_total || 0), 0);

  const { data: gastosMes } = await supabase
    .from('gastos')
    .select('monto, categoria')
    .eq('usuario_id', user.id)
    .gte('fecha', inicioMes);

  const egresosGastos = (gastosMes || []).reduce((s, g) => s + (g.monto || 0), 0);
  const egresos = egresosCompras + egresosGastos;

  // ---------- Serie diaria de ingresos ----------
  const serieDiaria = Array.from({ length: diasEnMes }, (_, i) => ({ dia: i + 1, ingresos: 0 }));
  for (const v of ventasMes || []) {
    const d = new Date(v.fecha).getDate();
    if (d >= 1 && d <= diasEnMes) serieDiaria[d - 1].ingresos += v.total || 0;
  }

  // ---------- Producto estrella + top 5 ----------
  const porProducto = new Map<string, { nombre: string; unidades: number; ingresos: number; ganancia: number }>();
  for (const i of itemsDetalle) {
    const cur = porProducto.get(i.producto_id) || { nombre: i.producto_nombre || 'Producto', unidades: 0, ingresos: 0, ganancia: 0 };
    cur.unidades += i.cantidad;
    cur.ingresos += i.cantidad * i.precio_unitario;
    cur.ganancia += i.cantidad * (i.precio_unitario - i.costo_unitario);
    porProducto.set(i.producto_id, cur);
  }
  const ranking = [...porProducto.values()].sort((a, b) => b.unidades - a.unidades);
  const estrella = ranking[0] || null;
  const top5 = ranking.slice(0, 5);
  const topGanancia = [...porProducto.values()].sort((a, b) => b.ganancia - a.ganancia)[0] || null;

  // ---------- Club mini-CRM ----------
  const { data: subs } = await supabase
    .from('suscriptores')
    .select('id, nombre, proximo_envio, club_id, clubs ( nombre, precio_mensual )')
    .eq('usuario_id', user.id)
    .eq('estado', 'ACTIVO');

  const subsActivos = (subs || []).length;
  const ingresosRecurrentes = (subs || []).reduce(
    (s, x: Record<string, unknown>) => s + (((x.clubs as { precio_mensual?: number } | null)?.precio_mensual) || 0), 0);

  const en7dias = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const proximosEnvios = (subs || [])
    .filter((x) => x.proximo_envio && x.proximo_envio <= en7dias)
    .sort((a, b) => (a.proximo_envio || '').localeCompare(b.proximo_envio || ''))
    .slice(0, 5)
    .map((x: Record<string, unknown>) => ({
      nombre: x.nombre,
      club: (x.clubs as { nombre?: string } | null)?.nombre || '',
      proximo_envio: x.proximo_envio,
    }));

  // ---------- Actividad reciente ----------
  const { data: movs } = await supabase
    .from('movimientos_stock')
    .select('id, tipo, cantidad, motivo, created_at, productos ( nombre )')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(8);

  const actividad = (movs || []).map((m: Record<string, unknown>) => ({
    tipo: m.tipo,
    cantidad: m.cantidad,
    motivo: m.motivo,
    fecha: m.created_at,
    producto: (m.productos as { nombre?: string } | null)?.nombre || '',
  }));

  // ---------- Deltas vs mes anterior ----------
  const delta = (actual: number, previo: number) =>
    previo === 0 ? (actual > 0 ? 100 : 0) : Math.round(((actual - previo) / previo) * 100);

  const gananciaBruta = ingresos - cogs;
  const gananciaNeta = gananciaBruta - egresosGastos;
  const ticketPromedio = cantVentas > 0 ? Math.round(ingresos / cantVentas) : 0;

  return new Response(JSON.stringify({
    // Compat con dashboard anterior
    ventas_mes: ingresos,
    costo_cogs: cogs,
    ganancia: gananciaBruta,
    stock_total: stockTotal,
    valor_stock: valorStock,
    productos_stock_bajo: stockBajo,
    // Nuevo: negocio
    cant_ventas: cantVentas,
    ingresos,
    egresos_compras: egresosCompras,
    egresos_gastos: egresosGastos,
    egresos: egresos,
    ganancia_bruta: gananciaBruta,
    ganancia_neta: gananciaNeta,
    ticket_promedio: ticketPromedio,
    delta_ingresos: delta(ingresos, ingresosAnt),
    delta_ventas: delta(cantVentas, cantVentasAnt),
    serie_diaria: serieDiaria,
    producto_estrella: estrella,
    top_productos: top5,
    top_ganancia: topGanancia,
    club: {
      suscriptores_activos: subsActivos,
      ingresos_recurrentes: ingresosRecurrentes,
      proximos_envios: proximosEnvios,
    },
    actividad,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
