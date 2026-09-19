// src/pages/api/admin/categorias/index.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { CategoriaSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data: cats, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('usuario_id', user.id)
    .order('nombre');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  // Conteo de productos por categoría
  const { data: prods } = await supabase
    .from('productos')
    .select('categoria')
    .eq('usuario_id', user.id);

  const conteo = new Map<string, number>();
  for (const p of prods || []) {
    const c = (p.categoria || '').trim();
    if (c) conteo.set(c.toLowerCase(), (conteo.get(c.toLowerCase()) || 0) + 1);
  }

  return new Response(JSON.stringify(
    (cats || []).map((c) => ({ ...c, productos: conteo.get(c.nombre.toLowerCase()) || 0 }))
  ), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const parsed = CategoriaSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400 });
  }

  const nombre = parsed.data.nombre.trim().replace(/\s+/g, ' ');
  const supabase = createSupabaseServer(request, cookies);

  // Evitar duplicados insensible a mayúsculas
  const { data: existentes } = await supabase
    .from('categorias')
    .select('id, nombre')
    .eq('usuario_id', user.id);

  const dup = (existentes || []).find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
  if (dup) {
    return new Response(JSON.stringify(dup), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase
    .from('categorias')
    .insert([{ usuario_id: user.id, nombre }])
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
