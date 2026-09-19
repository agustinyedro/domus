// src/pages/api/admin/movimientos/index.ts
// Ajustes de stock con motivo obligatorio. Bloquea stock negativo.
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { MovimientoSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 100);
  const supabase = createSupabaseServer(request, cookies);

  const { data, error } = await supabase
    .from('movimientos_stock')
    .select('id, tipo, cantidad, motivo, created_at, producto_id, productos ( nombre )')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

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
  const parsed = MovimientoSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400 });
  }

  const { producto_id, tipo, cantidad, motivo } = parsed.data;
  const tipoDB = tipo === 'ENTRADA' ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO';
  const supabase = createSupabaseServer(request, cookies);

  // Verificar producto del usuario
  const { data: prod, error: prodError } = await supabase
    .from('productos')
    .select('id, nombre')
    .eq('id', producto_id)
    .eq('usuario_id', user.id)
    .single();

  if (prodError || !prod) {
    return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });
  }

  // Si es salida: verificar stock suficiente (nunca negativo)
  if (tipo === 'SALIDA') {
    const { data: movs } = await supabase
      .from('movimientos_stock')
      .select('tipo, cantidad')
      .eq('producto_id', producto_id)
      .eq('usuario_id', user.id);

    const stock = (movs || []).reduce((s, m) => {
      if (m.tipo === 'ENTRADA' || m.tipo === 'AJUSTE_POSITIVO') return s + m.cantidad;
      return s - m.cantidad;
    }, 0);

    if (cantidad > stock) {
      return new Response(
        JSON.stringify({ error: `Stock insuficiente: hay ${stock} u. de "${prod.nombre}" y querés sacar ${cantidad}.` }),
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from('movimientos_stock')
    .insert([{
      usuario_id: user.id,
      producto_id,
      tipo: tipoDB,
      cantidad,
      motivo: motivo.trim(),
    }])
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
