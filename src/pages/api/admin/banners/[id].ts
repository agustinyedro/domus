// src/pages/api/admin/banners/[id].ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { normalizarBanner } from '@/lib/banners';
import { createSupabaseServer, getUsuarioActual } from '@/lib/supabase';
import { BannerBaseSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ params, request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Banner no encontrado' }), { status: 404 });
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
  const body = await request.json();
  const parsed = BannerBaseSchema.partial().safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400,
    });
  }

  const campos = Object.fromEntries(Object.entries(parsed.data).filter(([clave]) => clave in body));
  if (!Object.keys(campos).length) {
    return new Response(JSON.stringify({ error: 'Sin cambios' }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('banners')
    .update(normalizarBanner(campos))
    .eq('id', id)
    .eq('usuario_id', user.id)
    .select()
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: error?.message || 'Banner no encontrado' }), {
      status: error ? 400 : 404,
    });
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
  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('banners')
    .delete()
    .eq('id', id)
    .eq('usuario_id', user.id)
    .select()
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: error?.message || 'Banner no encontrado' }), {
      status: error ? 400 : 404,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
