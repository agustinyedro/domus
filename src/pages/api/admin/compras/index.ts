// src/pages/api/admin/compras/index.ts
// Historial de compras + registrar compra (suma stock y actualiza costo)
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { CompraSchema, CompraBatchSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('historial_compras')
    .select('id, fecha, cantidad, costo_unitario, costo_total, observaciones, producto_id, productos ( nombre )')
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
  const parsed = esBatch ? CompraBatchSchema.safeParse(body) : CompraSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400 });
  }

  const items = esBatch
    ? (parsed.data as { items: Array<{ producto_id: string; cantidad: number; costo_unitario: number }>; observaciones?: string }).items
    : [{ producto_id: (parsed.data as { producto_id: string }).producto_id, cantidad: (parsed.data as { cantidad: number }).cantidad, costo_unitario: (parsed.data as { costo_unitario: number }).costo_unitario }];
  const observaciones = (parsed.data as { observaciones?: string }).observaciones;
  const supabase = createSupabaseServer(request, cookies);
  const fecha = new Date().toISOString();
  const registradas = [];

  for (const item of items) {
    // Verificar producto del usuario
    const { data: prod, error: prodError } = await supabase
      .from('productos')
      .select('id, nombre')
      .eq('id', item.producto_id)
      .eq('usuario_id', user.id)
      .single();

    if (prodError || !prod) {
      return new Response(JSON.stringify({ error: `Producto no encontrado: ${item.producto_id}` }), { status: 404 });
    }

    // 1. Insertar en historial_compras (costo_total se calcula solo)
    const { data: compra, error: compraError } = await supabase
      .from('historial_compras')
      .insert([{
        usuario_id: user.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario,
        observaciones: observaciones || null,
        fecha,
      }])
      .select()
      .single();

    if (compraError) {
      return new Response(JSON.stringify({ error: compraError.message }), { status: 400 });
    }

    // 2. Movimiento ENTRADA (suma stock)
    await supabase.from('movimientos_stock').insert([{
      usuario_id: user.id,
      producto_id: item.producto_id,
      tipo: 'ENTRADA',
      cantidad: item.cantidad,
      costo_unitario: item.costo_unitario,
      motivo: observaciones || 'Compra registrada',
      referencia_id: compra.id,
    }]);

    // 3. Actualizar costo del producto al último costo de compra
    await supabase
      .from('productos')
      .update({ costo: item.costo_unitario })
      .eq('id', item.producto_id)
      .eq('usuario_id', user.id);

    registradas.push({ ...compra, producto_nombre: prod.nombre });
  }

  const total = registradas.reduce((s, r) => s + Number(r.costo_total), 0);

  return new Response(JSON.stringify({ items: registradas, total, cantidad_items: registradas.length }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
