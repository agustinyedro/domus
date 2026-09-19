// src/pages/api/admin/kits/[id]/publicar.ts
// Publica o despublica un kit como producto de la tienda (categoría "Kits").
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';
import { resolverKit } from '@/lib/kits';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const publicar = body?.publicar !== false; // por defecto publicar

  const supabase = createSupabaseServer(request, cookies);

  const { data: kit, error: kitError } = await supabase
    .from('kits')
    .select('id, nombre, descripcion, imagen_url, precio_venta')
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single();

  if (kitError || !kit) {
    return new Response(JSON.stringify({ error: 'Kit no encontrado.' }), { status: 404 });
  }

  const { data: espejo } = await supabase
    .from('productos')
    .select('id')
    .eq('kit_id', id)
    .maybeSingle();

  // Despublicar: solo apaga el producto espejo (conserva historial)
  if (!publicar) {
    if (!espejo) {
      return new Response(JSON.stringify({ success: true, publicado: false }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const { error } = await supabase.from('productos').update({ activo: false }).eq('id', espejo.id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(JSON.stringify({ success: true, publicado: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Publicar: no permitir sin componentes
  const resuelto = await resolverKit(supabase, id);
  if (!resuelto) {
    return new Response(
      JSON.stringify({ error: 'Agregá productos al kit antes de publicarlo.' }),
      { status: 400 }
    );
  }

  const datos = {
    nombre: kit.nombre,
    descripcion: kit.descripcion,
    categoria: 'Kits',
    imagen_url: kit.imagen_url || null,
    precio_venta: Number(kit.precio_venta) || 0,
    costo: resuelto.costo,
    activo: true,
  };

  if (espejo) {
    const { error } = await supabase.from('productos').update(datos).eq('id', espejo.id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    return new Response(JSON.stringify({ success: true, publicado: true, producto_id: espejo.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sku = `KIT-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
  const { data: nuevo, error } = await supabase
    .from('productos')
    .insert([{ ...datos, usuario_id: user.id, kit_id: id, sku, stock_minimo: 1 }])
    .select('id')
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true, publicado: true, producto_id: nuevo.id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
