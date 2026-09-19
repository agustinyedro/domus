// src/pages/api/admin/pedidos/[id].ts
// Aprobar (efectivo -> COMPLETADA) o rechazar (devuelve stock)
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { z } from 'zod';

const AccionSchema = z.object({
  accion: z.enum(['aprobar', 'rechazar']),
});

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = AccionSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Acción inválida.' }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data: venta, error: vError } = await supabase
    .from('ventas')
    .select('id, estado, metodo_pago, usuario_id')
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single();

  if (vError || !venta) {
    return new Response(JSON.stringify({ error: 'Pedido no encontrado.' }), { status: 404 });
  }

  if (parsed.data.accion === 'aprobar') {
    if (venta.estado !== 'PENDIENTE_EFECTIVO') {
      return new Response(JSON.stringify({ error: 'Solo se pueden aprobar pedidos en efectivo pendientes.' }), { status: 400 });
    }
    const { error } = await supabase
      .from('ventas')
      .update({ estado: 'COMPLETADA' })
      .eq('id', id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(JSON.stringify({ success: true, estado: 'COMPLETADA' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // rechazar: solo pendientes; devuelve el stock automáticamente
  if (venta.estado !== 'PENDIENTE_EFECTIVO' && venta.estado !== 'PENDIENTE_PAGO') {
    return new Response(JSON.stringify({ error: 'Solo se pueden rechazar pedidos pendientes.' }), { status: 400 });
  }

  const { data: items } = await supabase
    .from('ventas_items')
    .select('producto_id, cantidad, costo_unitario')
    .eq('venta_id', id);

  for (const it of items || []) {
    await supabase.from('movimientos_stock').insert([{
      usuario_id: user.id,
      producto_id: it.producto_id,
      tipo: 'AJUSTE_POSITIVO',
      cantidad: it.cantidad,
      costo_unitario: it.costo_unitario,
      motivo: `Devuelve pedido #${String(id).slice(0, 8)} (rechazado por admin)`,
      referencia_id: id,
    }]);
  }

  const { error } = await supabase
    .from('ventas')
    .update({ estado: 'RECHAZADA' })
    .eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true, estado: 'RECHAZADA' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
