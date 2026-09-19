// src/pages/api/admin/gastos/index.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { GastoSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createSupabaseServer(request, cookies);
  let query = supabase
    .from('gastos')
    .select('*')
    .eq('usuario_id', user.id)
    .order('fecha', { ascending: false });

  const mes = url.searchParams.get('mes'); // YYYY-MM
  if (mes) {
    const [y, m] = mes.split('-').map(Number);
    const desde = new Date(y, m - 1, 1).toISOString();
    const hasta = new Date(y, m, 1).toISOString();
    query = query.gte('fecha', desde).lt('fecha', hasta);
  } else {
    query = query.limit(100);
  }

  const { data, error } = await query;

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
  const parsed = GastoSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('gastos')
    .insert([{ ...parsed.data, usuario_id: user.id }])
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
