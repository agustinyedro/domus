// src/pages/api/admin/productos/[id].ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { ProductoSchema } from '@/lib/validations';

export const GET: APIRoute = async ({ params, request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('v_stock_actual')
    .select('*')
    .eq('producto_id', id)
    .eq('usuario_id', user.id)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });
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
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
  }

  const body = await request.json();
  const parsed = ProductoSchema.partial().safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400,
    });
  }

  // partial() aplica defaults (ej: activo=true) a los campos ausentes:
  // sólo se actualizan los campos realmente presentes en el body.
  const campos = Object.fromEntries(Object.entries(parsed.data).filter(([k]) => k in body));
  if (Object.keys(campos).length === 0) {
    return new Response(JSON.stringify({ error: 'Sin campos para actualizar' }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('productos')
    .update(campos)
    .eq('id', id)
    .eq('usuario_id', user.id)
    .select()
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: error?.message || 'Producto no encontrado' }), {
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
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);

  const { data: prod } = await supabase
    .from('productos')
    .select('id, sku, kit_id')
    .eq('id', id)
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (!prod) {
    return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });
  }

  const { data: stockRow } = await supabase
    .from('v_stock_actual')
    .select('stock_actual')
    .eq('producto_id', id)
    .eq('usuario_id', user.id)
    .maybeSingle();

  const stock = Number(stockRow?.stock_actual ?? 0);
  if (stock > 0) {
    return new Response(
      JSON.stringify({
        error: `No se puede eliminar «${prod.sku}»: quedan ${stock} unidades en stock.`,
      }),
      { status: 409 }
    );
  }

  if (prod.kit_id) {
    return new Response(
      JSON.stringify({ error: 'Es la ficha de un kit: despublicalo desde la sección Kits.' }),
      { status: 409 }
    );
  }

  const { count: enKits } = await supabase
    .from('kit_items')
    .select('id', { count: 'exact', head: true })
    .eq('producto_id', id);
  if (enKits) {
    return new Response(
      JSON.stringify({ error: 'Forma parte de un kit: quitálo del kit antes de eliminarlo.' }),
      { status: 409 }
    );
  }

  const { count: ventas } = await supabase
    .from('ventas_items')
    .select('id', { count: 'exact', head: true })
    .eq('producto_id', id);
  if (ventas) {
    return new Response(
      JSON.stringify({
        error: 'Tiene ventas registradas: desactivalo para ocultarlo de la tienda sin perder el historial.',
      }),
      { status: 409 }
    );
  }

  const { count: compras } = await supabase
    .from('historial_compras')
    .select('id', { count: 'exact', head: true })
    .eq('producto_id', id);
  if (compras) {
    return new Response(
      JSON.stringify({
        error: 'Tiene compras registradas: desactivalo para ocultarlo de la tienda sin perder el historial.',
      }),
      { status: 409 }
    );
  }

  const { data: borrados, error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id)
    .eq('usuario_id', user.id)
    .select('id');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  if (!borrados?.length) {
    return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
