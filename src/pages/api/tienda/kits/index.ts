// src/pages/api/tienda/kits/index.ts
// Kits publicados en la tienda (para la sección "Regalar DOMUS" del index).
export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const GET: APIRoute = async () => {
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Tienda sin configurar.' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from('v_stock_actual')
    .select('producto_id, nombre, descripcion, imagen_url, precio_final, precio_venta, stock_actual')
    .eq('activo', true)
    .eq('categoria', 'Kits')
    .order('nombre');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify(data || []), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
