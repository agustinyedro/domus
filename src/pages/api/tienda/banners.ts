// src/pages/api/tienda/banners.ts
// Banners activos y vigentes para el carrusel de la tienda.
// Resuelve precio/imagen/link del producto o kit vinculado.
export const prerender = false;

import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';
import { hrefDeBanner, resolverProductos } from '@/lib/banners';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.');
  }
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

export const GET: APIRoute = async () => {
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Tienda sin configurar.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = getClient();
    const ahora = new Date().toISOString();

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('activo', true)
      .or(`fecha_desde.is.null,fecha_desde.lte.${ahora}`)
      .or(`fecha_hasta.is.null,fecha_hasta.gte.${ahora}`)
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    const banners = data || [];
    const productos = await resolverProductos(
      supabase,
      null,
      banners.map((b) => b.producto_id).filter(Boolean) as string[],
    );

    const salida = banners.map((b) => {
      const bruto = b.producto_id ? productos.get(b.producto_id) || null : null;
      const producto = bruto?.activo ? bruto : null;
      return {
        id: b.id,
        titulo: b.titulo,
        descripcion: b.descripcion,
        mostrar_descripcion: b.mostrar_descripcion,
        mostrar_precio: b.mostrar_precio,
        texto_cta: b.texto_cta,
        imagen_url: b.imagen_url,
        posicion_imagen: b.posicion_imagen,
        estilo: b.estilo,
        href: hrefDeBanner(b, producto),
        precio: producto?.precio_efectivo ?? null,
        producto_nombre: producto?.nombre ?? null,
      };
    });

    return new Response(JSON.stringify(salida), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};
