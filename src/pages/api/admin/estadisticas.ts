// src/pages/api/admin/estadisticas.ts
// EstadÃ­sticas del negocio para un rango de fechas (ventas, productos, clientes).
export const prerender = false;

import type { APIRoute } from 'astro';
import { createSupabaseServer, getUsuarioActual } from '@/lib/supabase';

const ESTADOS_VALIDOS = ['COMPLETADA', 'PAGADA'];

// LÃ­mites del dÃ­a en UTC (determinista en cualquier servidor)
function aIso(raw: string, fin: boolean): string {
  const [y, m, d] = raw.split('-').map(Number);
  return fin
    ? new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)).toISOString()
    : new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)).toISOString();
}

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const usuarioId = user.id;

  const ahora = new Date();
  const hace30 = new Date(ahora.getTime() - 29 * 24 * 60 * 60 * 1000);
  const desdeRaw = url.searchParams.get('desde') || hace30.toISOString().slice(0, 10);
  const hastaRaw = url.searchParams.get('hasta') || ahora.toISOString().slice(0, 10);

  const desde = new Date(desdeRaw);
  const hasta = new Date(hastaRaw);
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) {
    return new Response(JSON.stringify({ error: 'Fechas invÃ¡lidas' }), { status: 400 });
  }
  const desdeIso = aIso(desdeRaw, false);
  const hastaIso = aIso(hastaRaw, true);

  // PerÃ­odo anterior de la misma duraciÃ³n (para variaciones)
  const ms = new Date(hastaIso).getTime() - new Date(desdeIso).getTime();
  const antHastaIso = new Date(new Date(desdeIso).getTime() - 1).toISOString();
  const antDesdeIso = new Date(new Date(desdeIso).getTime() - ms - 1).toISOString();

  const supabase = createSupabaseServer(request, cookies);

  async function ventasEn(inicio: string, fin: string) {
    const { data } = await supabase
      .from('ventas')
      .select('id, fecha, total, ganancia, estado, source, metodo_pago, cliente_nombre')
      .eq('usuario_id', usuarioId)
      .in('estado', ESTADOS_VALIDOS)
      .gte('fecha', inicio)
      .lte('fecha', fin);
    return data || [];
  }

  const ventas = await ventasEn(desdeIso, hastaIso);
  const ventasAnt = await ventasEn(antDesdeIso, antHastaIso);

  const ids = ventas.map((v) => v.id);
  let items: Array<{
    cantidad: number;
    precio_unitario: number;
    costo_unitario: number;
    producto_id: string;
    nombre: string;
    variante: string | null;
  }> = [];

  if (ids.length) {
    const { data } = await supabase
      .from('ventas_items')
      .select('cantidad, precio_unitario, costo_unitario, producto_id, productos ( nombre, variante )')
      .in('venta_id', ids);
    items = (data || []).map((i: Record<string, unknown>) => ({
      cantidad: Number(i.cantidad) || 0,
      precio_unitario: Number(i.precio_unitario) || 0,
      costo_unitario: Number(i.costo_unitario) || 0,
      producto_id: String(i.producto_id),
      nombre: (i.productos as { nombre?: string } | null)?.nombre || 'Producto',
      variante: (i.productos as { variante?: string } | null)?.variante || null,
    }));
  }

  const facturacion = ventas.reduce((s, v) => s + Number(v.total || 0), 0);
  const ganancia = ventas.reduce((s, v) => s + Number(v.ganancia || 0), 0);
  const unidades = items.reduce((s, i) => s + i.cantidad, 0);
  const cantVentas = ventas.length;
  const ticket = cantVentas ? Math.round(facturacion / cantVentas) : 0;

  const factAnt = ventasAnt.reduce((s, v) => s + Number(v.total || 0), 0);
  const cantAnt = ventasAnt.length;
  const delta = (actual: number, previo: number) =>
    previo === 0 ? (actual > 0 ? 100 : 0) : Math.round(((actual - previo) / previo) * 100);

  // Serie diaria
  const dias: string[] = [];
  for (let d = new Date(desdeIso); d <= new Date(hastaIso); d.setDate(d.getDate() + 1)) {
    dias.push(d.toISOString().slice(0, 10));
  }
  const serieMap = new Map(dias.map((dia) => [dia, { dia, total: 0, ventas: 0 }]));
  for (const v of ventas) {
    const dia = new Date(v.fecha).toISOString().slice(0, 10);
    const cur = serieMap.get(dia);
    if (cur) {
      cur.total += Number(v.total || 0);
      cur.ventas += 1;
    }
  }
  const serie = [...serieMap.values()];

  // Por origen
  const origenMap = new Map<string, { origen: string; ventas: number; total: number }>();
  for (const v of ventas) {
    const origen = v.source === 'TIENDA' ? 'Tienda online' : 'POS / Manual';
    const cur = origenMap.get(origen) || { origen, ventas: 0, total: 0 };
    cur.ventas += 1;
    cur.total += Number(v.total || 0);
    origenMap.set(origen, cur);
  }

  // Por medio de pago
  const medioMap = new Map<string, { metodo: string; ventas: number; total: number }>();
  for (const v of ventas) {
    const metodo = (v.metodo_pago as string) || 'SIN_MEDIO';
    const cur = medioMap.get(metodo) || { metodo, ventas: 0, total: 0 };
    cur.ventas += 1;
    cur.total += Number(v.total || 0);
    medioMap.set(metodo, cur);
  }

  // Ranking de productos
  const porProducto = new Map<
    string,
    {
      producto_id: string;
      nombre: string;
      variante: string | null;
      unidades: number;
      ingresos: number;
      ganancia: number;
    }
  >();
  for (const i of items) {
    const cur = porProducto.get(i.producto_id) || {
      producto_id: i.producto_id,
      nombre: i.nombre,
      variante: i.variante,
      unidades: 0,
      ingresos: 0,
      ganancia: 0,
    };
    cur.unidades += i.cantidad;
    cur.ingresos += i.cantidad * i.precio_unitario;
    cur.ganancia += i.cantidad * (i.precio_unitario - i.costo_unitario);
    porProducto.set(i.producto_id, cur);
  }
  const productos = [...porProducto.values()].sort((a, b) => b.unidades - a.unidades);

  // Stock + dispersiÃ³n
  const { data: stockRows } = await supabase
    .from('v_stock_actual')
    .select('producto_id, nombre, variante, precio_venta, stock_actual, stock_minimo')
    .eq('usuario_id', usuarioId);

  const stockTotal = (stockRows || []).reduce((s, p) => s + Number(p.stock_actual || 0), 0);
  const stockBajo = (stockRows || []).filter(
    (p) => Number(p.stock_actual || 0) < Number(p.stock_minimo || 5),
  ).length;
  const stockPorProducto = new Map(
    (stockRows || []).map((p) => [String(p.producto_id), Number(p.stock_actual || 0)]),
  );
  const dispersion = productos.slice(0, 60).map((p) => ({
    nombre: p.nombre,
    variante: p.variante,
    unidades: p.unidades,
    precio: Math.round(p.ingresos / (p.unidades || 1)),
    stock: stockPorProducto.get(p.producto_id) ?? 0,
  }));

  // Clientes
  const clienteMap = new Map<string, { nombre: string; ventas: number; total: number }>();
  for (const v of ventas) {
    const nombre = (v.cliente_nombre || '').trim();
    if (!nombre) continue;
    const key = nombre.toLowerCase();
    const cur = clienteMap.get(key) || { nombre, ventas: 0, total: 0 };
    cur.ventas += 1;
    cur.total += Number(v.total || 0);
    clienteMap.set(key, cur);
  }
  const clientesArr = [...clienteMap.values()].sort((a, b) => b.total - a.total);
  const clientes = {
    total: clientesArr.length,
    recurrentes: clientesArr.filter((c) => c.ventas > 1).length,
    top: clientesArr.slice(0, 10),
  };

  return new Response(
    JSON.stringify({
      rango: { desde: desdeIso, hasta: hastaIso, dias: dias.length },
      kpis: {
        ventas: cantVentas,
        facturacion,
        ticket,
        unidades,
        ganancia,
        delta: {
          ventas: delta(cantVentas, cantAnt),
          facturacion: delta(facturacion, factAnt),
          ticket: delta(ticket, cantAnt ? Math.round(factAnt / cantAnt) : 0),
        },
      },
      serie,
      por_origen: [...origenMap.values()],
      por_medio: [...medioMap.values()].sort((a, b) => b.total - a.total),
      productos,
      stock: { total: stockTotal, bajo: stockBajo },
      dispersion,
      clientes,
    }),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
  );
};
