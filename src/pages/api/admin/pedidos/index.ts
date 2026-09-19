// src/pages/api/admin/pedidos/index.ts
// Bandeja de pedidos de la tienda (excluye ventas manuales)
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createSupabaseServer(request, cookies);
  let query = supabase
    .from('ventas')
    .select('id, fecha, total, ganancia, estado, metodo_pago, source, cliente_nombre, cliente_telefono, mp_payment_id, ventas_items ( cantidad, precio_unitario, producto_id, productos ( nombre ) )')
    .eq('usuario_id', user.id)
    .eq('source', 'TIENDA')
    .order('fecha', { ascending: false });

  const estado = url.searchParams.get('estado');
  if (estado) query = query.eq('estado', estado);

  const { data, error } = await query.limit(100);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify(data || []), {
    headers: { 'Content-Type': 'application/json' },
  });
};
