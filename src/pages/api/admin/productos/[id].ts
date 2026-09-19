// src/pages/api/admin/productos/[id].ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { ProductoSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ params, request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('v_stock_actual')
    .select('*')
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
  }

  const body = await request.json();
  const parsed = ProductoSchema.partial().safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400,
    });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('productos')
    .update(parsed.data)
    .eq('id', id)
    .eq('usuario_id', user.id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id)
    .eq('usuario_id', user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
