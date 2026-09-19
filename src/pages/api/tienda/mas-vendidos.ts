// src/pages/api/tienda/mas-vendidos.ts
// Top productos más vendidos: últimos 90 días, sumatoria de unidades
export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.');
  }
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

export const GET: APIRoute = async ({ url }) => {
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Tienda sin configurar.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const supabase = getClient();
    const limit = Math.min(Number(url.searchParams.get('limit')) || 6, 20);

    const { data, error } = await supabase
      .from('v_stock_actual')
      .select('*')
      .eq('activo', true)
      .gt('vendidos_90d', 0)
      .order('vendidos_90d', { ascending: false })
      .limit(limit);

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
