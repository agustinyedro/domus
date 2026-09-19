// src/pages/api/admin/kits/[id].ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { KitSchema, KitItemSchema } from '@/lib/validations';
import { resolverKit } from '@/lib/kits';

// Verificar que el kit pertenece al usuario
async function kitPropio(supabase: ReturnType<typeof createSupabaseServer>, kitId: string, userId: string) {
  const { data } = await supabase
    .from('kits')
    .select('id')
    .eq('id', kitId)
    .eq('usuario_id', userId)
    .single();
  return Boolean(data);
}

// Si el kit está publicado, actualiza el costo del producto espejo
async function sincronizarCostoEspejo(supabase: ReturnType<typeof createSupabaseServer>, kitId: string) {
  const { data: espejo } = await supabase
    .from('productos')
    .select('id')
    .eq('kit_id', kitId)
    .maybeSingle();
  if (!espejo) return;
  const resuelto = await resolverKit(supabase, kitId);
  await supabase
    .from('productos')
    .update(resuelto ? { costo: resuelto.costo } : { activo: false })
    .eq('id', espejo.id);
}

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
  const { data: kit, error } = await supabase
    .from('kits')
    .select('*')
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single();

  if (error || !kit) {
    return new Response(JSON.stringify({ error: 'Kit no encontrado' }), { status: 404 });
  }

  const { data: items } = await supabase
    .from('kit_items')
    .select('id, cantidad, producto_id, productos ( nombre, costo, precio_venta )')
    .eq('kit_id', id);

  return new Response(JSON.stringify({ ...kit, items: items || [] }), {
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
  const parsed = KitSchema.partial().safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);
  const { data, error } = await supabase
    .from('kits')
    .update(parsed.data)
    .eq('id', id)
    .eq('usuario_id', user.id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  // Si el kit está publicado, sincronizar el producto espejo de la tienda
  const { data: espejo } = await supabase
    .from('productos')
    .select('id')
    .eq('kit_id', id)
    .maybeSingle();

  if (espejo) {
    const resuelto = await resolverKit(supabase, id);
    await supabase
      .from('productos')
      .update({
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio_venta: Number(data.precio_venta) || 0,
        imagen_url: data.imagen_url || null,
        ...(resuelto ? { costo: resuelto.costo } : {}),
      })
      .eq('id', espejo.id);
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
  const { error } = await supabase
    .from('kits')
    .delete()
    .eq('id', id)
    .eq('usuario_id', user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST /api/admin/kits/[id] con { _action: 'add-item' | 'remove-item', ... }
// Agregar item: { _action: 'add-item', producto_id, cantidad }
// Quitar item: { _action: 'remove-item', item_id }
export const POST: APIRoute = async ({ params, request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
  }

  const supabase = createSupabaseServer(request, cookies);
  if (!(await kitPropio(supabase, id, user.id))) {
    return new Response(JSON.stringify({ error: 'Kit no encontrado' }), { status: 404 });
  }

  const body = await request.json();

  if (body._action === 'remove-item') {
    if (!body.item_id) {
      return new Response(JSON.stringify({ error: 'item_id requerido' }), { status: 400 });
    }
    const { error } = await supabase.from('kit_items').delete().eq('id', body.item_id).eq('kit_id', id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    await sincronizarCostoEspejo(supabase, id);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // add-item (default)
  const parsed = KitItemSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400 });
  }

  // Verificar producto del usuario
  const { data: prod } = await supabase
    .from('productos')
    .select('id')
    .eq('id', parsed.data.producto_id)
    .eq('usuario_id', user.id)
    .single();

  if (!prod) {
    return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });
  }

  const { data, error } = await supabase
    .from('kit_items')
    .insert([{ kit_id: id, producto_id: parsed.data.producto_id, cantidad: parsed.data.cantidad }])
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  await sincronizarCostoEspejo(supabase, id);

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
