// src/pages/api/tienda/buscar-sugerencias.ts
// Sugerencias instantáneas estilo Tiendanube: hasta 6 productos para lo que
// el usuario va escribiendo (imagen + nombre + precio). El listado completo
// sigue en /api/tienda/productos?q=.
export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { palabrasBusqueda } from '@/lib/busqueda';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

const LIMITE = 6;

export const GET: APIRoute = async ({ url }) => {
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Tienda sin configurar.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const q = (url.searchParams.get('q') || '').trim();
    if (q.length < 2) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }
    const palabras = palabrasBusqueda(q, LIMITE);
    if (!palabras.length) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    let query = supabase
      .from('v_stock_actual')
      .select(
        'producto_id, sku, nombre, variante, imagen_url, categoria, precio_final, precio_efectivo, descuento_pct, stock_actual, destacado, vendidos_90d',
      )
      .eq('activo', true);

    for (const w of palabras) {
      query = query.or(
        `nombre.ilike.%${w}%,variante.ilike.%${w}%,sku.ilike.%${w}%,descripcion.ilike.%${w}%`,
      );
    }

    const { data, error } = await query
      .order('destacado', { ascending: false })
      .order('vendidos_90d', { ascending: false })
      .limit(LIMITE);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify(data || []), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};
