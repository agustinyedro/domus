// src/pages/api/admin/kits/index.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { KitSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data: kits, error } = await supabase
    .from('kits')
    .select('*')
    .eq('usuario_id', user.id)
    .order('nombre');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  // Adjuntar items + costo calculado
  const result = [];
  for (const kit of kits || []) {
    const { data: items } = await supabase
      .from('kit_items')
      .select('id, cantidad, producto_id, productos ( nombre, costo )')
      .eq('kit_id', kit.id);

    const costoKit = (items || []).reduce(
      (s, i: Record<string, unknown>) => s + (i.cantidad as number) * (Number((i.productos as { costo?: number } | null)?.costo) || 0), 0);

    result.push({ ...kit, items: items || [], costo_calculado: costoKit });
  }

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const parsed = KitSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('kits')
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
