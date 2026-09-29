// src/pages/api/admin/banners/index.ts
// Banners promocionales del carrusel de la tienda.
export const prerender = false;

import type { APIRoute } from 'astro';
import { hrefDeBanner, normalizarBanner, resolverProductos } from '@/lib/banners';
import { createSupabaseServer, getUsuarioActual } from '@/lib/supabase';
import { BannerSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('usuario_id', user.id)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  const banners = data || [];
  const productos = await resolverProductos(
    supabase,
    user.id,
    banners.map((b) => b.producto_id).filter(Boolean) as string[],
  );

  const salida = banners.map((b) => {
    const producto = b.producto_id ? productos.get(b.producto_id) || null : null;
    return { ...b, producto, href: hrefDeBanner(b, producto) };
  });

  return new Response(JSON.stringify(salida), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const parsed = BannerSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400,
    });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('banners')
    .insert([{ ...normalizarBanner(parsed.data), usuario_id: user.id }])
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
