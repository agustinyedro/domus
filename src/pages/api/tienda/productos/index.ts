// src/pages/api/tienda/productos/index.ts
// Catálogo público: lee productos activos con stock y precio final
export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el servidor (y PUBLIC_SUPABASE_URL).');
  }
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

function errorConfig() {
  return new Response(
    JSON.stringify({ error: 'Tienda sin configurar: falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}

export const GET: APIRoute = async ({ url }) => {
  if (!supabaseUrl || !serviceKey) return errorConfig();
  try {
    const supabase = getClient();

    // Filtros desde query params
    const q = url.searchParams.get('q') || '';
    const sector = url.searchParams.get('sector') || '';
    const min = url.searchParams.get('min');
    const max = url.searchParams.get('max');
    const orden = url.searchParams.get('orden') || 'relevancia';
    const ofertas = url.searchParams.get('ofertas') === '1';
    const stock = url.searchParams.get('stock') === '1';
    const ratingMin = url.searchParams.get('rating');

    let query = supabase
      .from('v_stock_actual')
      .select('*')
      .eq('activo', true);

    // Filtro búsqueda
    if (q) {
      query = query.or(`nombre.ilike.%${q}%,sku.ilike.%${q}%,descripcion.ilike.%${q}%`);
    }

    // Filtro sector/categoría
    if (sector) {
      query = query.eq('categoria', sector);
    }

    // Filtro precio
    if (min) query = query.gte('precio_final', Number(min));
    if (max) query = query.lte('precio_final', Number(max));

    // Solo ofertas
    if (ofertas) {
      query = query.eq('es_oferta', true);
    }

    // Solo con stock
    if (stock) {
      query = query.gt('stock_actual', 0);
    }

    // Rating mínimo
    if (ratingMin) {
      query = query.gte('rating_promedio', Number(ratingMin));
    }

    // Orden
    switch (orden) {
      case 'precio_asc':
        query = query.order('precio_final', { ascending: true });
        break;
      case 'precio_desc':
        query = query.order('precio_final', { ascending: false });
        break;
      case 'descuento':
        query = query.order('descuento_pct', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating_promedio', { ascending: false });
        break;
      case 'nombre':
        query = query.order('nombre', { ascending: true });
        break;
      case 'relevancia':
      default:
        // Más vendidos + destacados primero
        query = query.order('destacado', { ascending: false })
                     .order('vendidos_90d', { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify(data || []), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};
