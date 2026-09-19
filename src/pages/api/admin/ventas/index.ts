// src/pages/api/admin/ventas/index.ts
// Historial de ventas + registrar venta (descuenta stock, calcula ganancia)
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { VentaSchema, VentaBatchSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('ventas')
    .select('id, fecha, total, ganancia, estado, source, ventas_items ( cantidad, precio_unitario, producto_id, productos ( nombre ) )')
    .eq('usuario_id', user.id)
    .order('fecha', { ascending: false })
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify(data || []), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();

  // Acepta batch { items: [...] } o formato simple de 1 producto (compat)
  const esBatch = Array.isArray(body.items);
  const parsed = esBatch ? VentaBatchSchema.safeParse(body) : VentaSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400 });
  }

  const items = esBatch
    ? (parsed.data as { items: Array<{ producto_id: string; cantidad: number }> }).items
    : [{ producto_id: (parsed.data as { producto_id: string }).producto_id, cantidad: (parsed.data as { cantidad: number }).cantidad }];
  const supabase = createSupabaseServer(request, cookies);

  // Fase 1: resolver precio/costo/stock de TODOS los items antes de escribir nada
  const resueltos = [];
  for (const item of items) {
    const { data: prod, error: prodError } = await supabase
      .from('productos')
      .select('id, nombre, precio_venta, precio_oferta, es_oferta')
      .eq('id', item.producto_id)
      .eq('usuario_id', user.id)
      .single();

    if (prodError || !prod) {
      return new Response(JSON.stringify({ error: `Producto no encontrado: ${item.producto_id}` }), { status: 404 });
    }

    const { data: ultimaCompra } = await supabase
      .from('historial_compras')
      .select('costo_unitario')
      .eq('producto_id', item.producto_id)
      .eq('usuario_id', user.id)
      .order('fecha', { ascending: false })
      .limit(1)
      .single();

    const precio = (prod.es_oferta && prod.precio_oferta && prod.precio_oferta < prod.precio_venta)
      ? Number(prod.precio_oferta)
      : Number(prod.precio_venta);
    const costo = ultimaCompra ? Number(ultimaCompra.costo_unitario) : 0;

    const { data: movs } = await supabase
      .from('movimientos_stock')
      .select('tipo, cantidad')
      .eq('producto_id', item.producto_id)
      .eq('usuario_id', user.id);

    const stock = (movs || []).reduce((s, m) => {
      if (m.tipo === 'ENTRADA' || m.tipo === 'AJUSTE_POSITIVO') return s + m.cantidad;
      return s - m.cantidad;
    }, 0);

    if (item.cantidad > stock) {
      return new Response(
        JSON.stringify({ error: `Stock insuficiente: hay ${stock} u. de "${prod.nombre}" y pedís ${item.cantidad}. No se registró nada.` }),
        { status: 400 }
      );
    }

    resueltos.push({ producto_id: item.producto_id, nombre: prod.nombre, cantidad: item.cantidad, precio, costo });
  }

  const total = resueltos.reduce((s, r) => s + r.precio * r.cantidad, 0);
  const ganancia = resueltos.reduce((s, r) => s + (r.precio - r.costo) * r.cantidad, 0);

  // Fase 2: escribir todo (1 venta + N items + N movimientos)
  const { data: venta, error: ventaError } = await supabase
    .from('ventas')
    .insert([{ usuario_id: user.id, total, ganancia, estado: 'COMPLETADA', source: 'MANUAL' }])
    .select()
    .single();

  if (ventaError) {
    return new Response(JSON.stringify({ error: ventaError.message }), { status: 400 });
  }

  for (const r of resueltos) {
    await supabase.from('ventas_items').insert([{
      venta_id: venta.id,
      producto_id: r.producto_id,
      cantidad: r.cantidad,
      precio_unitario: r.precio,
      costo_unitario: r.costo,
    }]);

    await supabase.from('movimientos_stock').insert([{
      usuario_id: user.id,
      producto_id: r.producto_id,
      tipo: 'VENTA',
      cantidad: r.cantidad,
      costo_unitario: r.costo,
      motivo: `Venta manual`,
      referencia_id: venta.id,
    }]);
  }

  return new Response(JSON.stringify({ ...venta, items: resueltos }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
