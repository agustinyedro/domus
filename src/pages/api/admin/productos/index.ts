// src/pages/api/admin/productos/index.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { createSupabaseServer, getUsuarioActual } from '@/lib/supabase';
import { ProductoSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('v_stock_actual')
    .select('*')
    .eq('usuario_id', user.id)
    .order('nombre');

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
  const parsed = ProductoSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400,
    });
  }

  const supabase = createSupabaseServer(request, cookies);
  const producto = { ...parsed.data };
  if (!producto.grupo_id) delete producto.grupo_id;
  // La principal siempre va primera en la lista.
  const cats = [...new Set((producto.categorias ?? []).map((c) => String(c).trim()).filter(Boolean))].slice(0, 5);
  if (producto.categoria && !cats.includes(producto.categoria)) cats.unshift(producto.categoria);
  producto.categorias = cats.slice(0, 5);
  if (!producto.categoria) producto.categoria = cats[0] ?? null;
  const { data, error } = await supabase
    .from('productos')
    .insert([{ ...producto, usuario_id: user.id }])
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
