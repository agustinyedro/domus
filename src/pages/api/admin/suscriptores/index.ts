// src/pages/api/admin/suscriptores/index.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { SuscriptorSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createSupabaseServer(request, cookies);
  let query = supabase
    .from('suscriptores')
    .select('*, clubs ( nombre )')
    .eq('usuario_id', user.id)
    .order('fecha_suscripcion', { ascending: false });

  const clubId = url.searchParams.get('club_id');
  if (clubId) query = query.eq('club_id', clubId);

  const estado = url.searchParams.get('estado');
  if (estado) query = query.eq('estado', estado);

  const { data, error } = await query.limit(200);

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
  const parsed = SuscriptorSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);

  // Verificar club del usuario
  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('id', parsed.data.club_id)
    .eq('usuario_id', user.id)
    .single();

  if (!club) {
    return new Response(JSON.stringify({ error: 'Club no encontrado' }), { status: 404 });
  }

  const { data, error } = await supabase
    .from('suscriptores')
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
