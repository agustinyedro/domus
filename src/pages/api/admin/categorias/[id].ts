// src/pages/api/admin/categorias/[id].ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { getUsuarioActual, createSupabaseServer } from '@/lib/supabase';

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

  // Bloquear si tiene productos asociados
  const { data: cat } = await supabase
    .from('categorias')
    .select('nombre')
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single();

  if (!cat) {
    return new Response(JSON.stringify({ error: 'Categoría no encontrada' }), { status: 404 });
  }

  const { count } = await supabase
    .from('productos')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', user.id)
    .eq('categoria', cat.nombre);

  if ((count || 0) > 0) {
    return new Response(
      JSON.stringify({ error: `No se puede eliminar: tiene ${count} producto(s) asociados. Cambiales la categoría primero.` }),
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('categorias')
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
