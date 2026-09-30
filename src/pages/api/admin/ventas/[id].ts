export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSupabaseServer, getUsuarioActual } from '@/lib/supabase';
import { VentaBatchSchema } from '@/lib/validations';

const EditarSchema = VentaBatchSchema.extend({ accion: z.literal('editar') });
const CompletarSchema = z.object({ accion: z.literal('completar') });

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  if (!params.id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });

  const body = await request.json().catch(() => ({}));
  const supabase = createSupabaseServer(request, cookies);

  if (body.accion === 'completar') {
    const parsed = CompletarSchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Acción inválida.' }), { status: 400 });
    const { data, error } = await supabase.rpc('completar_venta_manual', { p_venta_id: params.id });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

    const { data: check } = await supabase
      .from('ventas')
      .select('estado')
      .eq('id', params.id)
      .eq('usuario_id', user.id)
      .single();
    if (check?.estado !== 'COMPLETADA') {
      return new Response(JSON.stringify({ error: 'No se pudo confirmar el cierre de la venta.' }), {
        status: 400,
      });
    }
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  if (body.accion === 'anular') {
    const { data: venta } = await supabase
      .from('ventas')
      .select('id, estado, source')
      .eq('id', params.id)
      .eq('usuario_id', user.id)
      .single();

    if (!venta) {
      return new Response(JSON.stringify({ error: 'Venta no encontrada.' }), { status: 404 });
    }
    if ((venta.source || 'MANUAL') !== 'MANUAL') {
      return new Response(JSON.stringify({ error: 'Solo se pueden anular ventas manuales (POS).' }), {
        status: 400,
      });
    }
    if (venta.estado !== 'PAGADA' && venta.estado !== 'COMPLETADA') {
      return new Response(JSON.stringify({ error: 'Solo se pueden anular ventas pagadas o completadas.' }), {
        status: 400,
      });
    }

    const { data: items } = await supabase
      .from('ventas_items')
      .select('producto_id, cantidad, costo_unitario, kit_id, componentes')
      .eq('venta_id', params.id);

    // Idempotencia: si el stock ya se devolvió (doble clic/reintento), no duplicar.
    const { data: devuelto } = await supabase
      .from('movimientos_stock')
      .select('id')
      .eq('referencia_id', params.id)
      .like('motivo', 'Anula venta #%')
      .limit(1);

    if (!devuelto || devuelto.length === 0) {
      for (const it of items || []) {
        const componentes = it.componentes as Array<{
          producto_id: string;
          cantidad: number;
          costo_unitario: number;
        }> | null;
        if (it.kit_id && Array.isArray(componentes)) {
          for (const c of componentes) {
            await supabase.from('movimientos_stock').insert([
              {
                usuario_id: user.id,
                producto_id: c.producto_id,
                tipo: 'AJUSTE_POSITIVO',
                cantidad: c.cantidad * it.cantidad,
                costo_unitario: c.costo_unitario,
                motivo: `Anula venta #${String(params.id).slice(0, 8)} · kit`,
                referencia_id: params.id,
              },
            ]);
          }
        } else {
          await supabase.from('movimientos_stock').insert([
            {
              usuario_id: user.id,
              producto_id: it.producto_id,
              tipo: 'AJUSTE_POSITIVO',
              cantidad: it.cantidad,
              costo_unitario: it.costo_unitario,
              motivo: `Anula venta #${String(params.id).slice(0, 8)}`,
              referencia_id: params.id,
            },
          ]);
        }
      }
    }

    const { error } = await supabase.from('ventas').update({ estado: 'CANCELADA' }).eq('id', params.id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    const { data: check } = await supabase.from('ventas').select('estado').eq('id', params.id).single();
    if (check?.estado !== 'CANCELADA') {
      return new Response(JSON.stringify({ error: 'No se pudo anular la venta.' }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, estado: 'CANCELADA' }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const parsed = EditarSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues.map((issue) => issue.message) }), {
      status: 400,
    });
  }
  const { error } = await supabase.rpc('editar_venta_manual', {
    p_venta_id: params.id,
    p_metodo_pago: parsed.data.metodo_pago,
    p_items: parsed.data.items,
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  const { data: check } = await supabase
    .from('ventas')
    .select(
      'id, fecha, total, ganancia, estado, metodo_pago, ventas_items ( cantidad, precio_unitario, producto_id, productos ( nombre, variante ) )',
    )
    .eq('id', params.id)
    .eq('usuario_id', user.id)
    .single();
  if (check?.estado !== 'PAGADA') {
    return new Response(JSON.stringify({ error: 'La edición no pudo verificarse.' }), { status: 400 });
  }
  return new Response(JSON.stringify(check), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
