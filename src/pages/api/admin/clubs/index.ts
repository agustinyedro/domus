// src/pages/api/admin/clubs/index.ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { ClubSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data: clubs, error } = await supabase
    .from('clubs')
    .select('*, kits ( nombre )')
    .eq('usuario_id', user.id)
    .order('nombre');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  // Adjuntar conteo de suscriptores activos
  const result = [];
  for (const club of clubs || []) {
    const { count } = await supabase
      .from('suscriptores')
      .select('id', { count: 'exact', head: true })
      .eq('club_id', club.id)
      .eq('estado', 'ACTIVO');
    result.push({ ...club, suscriptores_activos: count || 0 });
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
  const parsed = ClubSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);

  // Si se asigna kit, verificar que sea del usuario
  if (parsed.data.kit_id) {
    const { data: kit } = await supabase
      .from('kits')
      .select('id')
      .eq('id', parsed.data.kit_id)
      .eq('usuario_id', user.id)
      .single();
    if (!kit) {
      return new Response(JSON.stringify({ error: 'Kit no encontrado' }), { status: 404 });
    }
  }

  const { data, error } = await supabase
    .from('clubs')
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
