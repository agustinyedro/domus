// src/pages/api/cron/keep-alive.ts
// Keep-alive diario para Supabase Free: 1 consulta real a Postgres.
// Lo dispara cron-job.org 1 vez por día con ?key=CRON_SECRET.
// Además expira PENDIENTE_PAGO de +24h (devuelve stock).
// Pasa libre por el middleware (solo protege /admin/* y /api/admin/*);
// el secreto en query es la protección.
export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { env } from 'cloudflare:workers';

type WorkerEnv = {
  PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  CRON_SECRET?: string;
};

export const GET: APIRoute = async ({ url }) => {
  // Los Secrets configurados en Cloudflare existen en el runtime del Worker.
  // El fallback mantiene el endpoint utilizable durante el desarrollo local.
  const workerEnv = env as WorkerEnv;
  const supabaseUrl = workerEnv.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
  const serviceKey = workerEnv.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  const cronSecret = workerEnv.CRON_SECRET || import.meta.env.CRON_SECRET;

  // 1. Validar secreto (sin secreto no hay tick para nadie)
  const key = url.searchParams.get('key');
  if (!cronSecret || key !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Missing Supabase runtime configuration',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Una consulta real a Postgres (esto es lo que resetea el timer de inactividad)
  // 3. Expirar PENDIENTE_PAGO de más de 24h (best-effort)
  try {
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { error } = await supabase.from('productos').select('id').limit(1);

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let expirados = 0;
    try {
      const corte = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: viejos } = await supabase
        .from('ventas')
        .select('id, usuario_id')
        .eq('estado', 'PENDIENTE_PAGO')
        .lt('fecha', corte);

      for (const v of viejos || []) {
        const { data: items } = await supabase
          .from('ventas_items')
          .select('producto_id, cantidad, costo_unitario')
          .eq('venta_id', v.id);

        for (const it of items || []) {
          await supabase.from('movimientos_stock').insert([{
            usuario_id: v.usuario_id,
            producto_id: it.producto_id,
            tipo: 'AJUSTE_POSITIVO',
            cantidad: it.cantidad,
            costo_unitario: it.costo_unitario,
            motivo: `Expira pedido #${String(v.id).slice(0, 8)} (24h sin pago)`,
            referencia_id: v.id,
          }]);
        }

        await supabase.from('ventas').update({ estado: 'CANCELADA' }).eq('id', v.id);
        expirados++;
      }
    } catch {
      // best-effort: no rompe el keep-alive
    }

    return new Response(JSON.stringify({ ok: true, ts: new Date().toISOString(), expirados }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'DB unreachable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
