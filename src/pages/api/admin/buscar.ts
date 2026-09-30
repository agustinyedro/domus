// src/pages/api/admin/buscar.ts
// Buscador global del panel: productos y órdenes (ventas).
export const prerender = false;

import type { APIRoute } from 'astro';
import { createSupabaseServer, getUsuarioActual } from '@/lib/supabase';

const esUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const bruto = (url.searchParams.get('q') || '').trim();
  if (bruto.length < 2) {
    return new Response(JSON.stringify({ productos: [], ordenes: [] }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  // Sanitizar caracteres que rompen los filtros de PostgREST
  const q = bruto
    .replace(/[%,()*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const like = `%${q}%`;
  const supabase = createSupabaseServer(request, cookies);

  const { data: productos } = await supabase
    .from('v_stock_actual')
    .select('producto_id, nombre, variante, sku, stock_actual')
    .eq('usuario_id', user.id)
    .or(`nombre.ilike.${like},sku.ilike.${like}`)
    .limit(6);

  const filtroOrden = esUuid(bruto)
    ? `cliente_nombre.ilike.${like},id.eq.${bruto}`
    : `cliente_nombre.ilike.${like}`;

  const { data: ordenes } = await supabase
    .from('ventas')
    .select('id, fecha, total, estado, source, cliente_nombre')
    .eq('usuario_id', user.id)
    .or(filtroOrden)
    .order('fecha', { ascending: false })
    .limit(6);

  return new Response(JSON.stringify({ productos: productos || [], ordenes: ordenes || [] }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
