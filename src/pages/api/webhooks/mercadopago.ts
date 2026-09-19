// src/pages/api/webhooks/mercadopago.ts
// Webhook de Mercado Pago: confirma o rechaza pedidos PENDIENTE_PAGO.
// Sin MP_WEBHOOK_SECRET configurado responde 400 (integración dormida).
// Idempotente: un pago aprobado marca una sola vez (mp_payment_id único).
export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const mpAccessToken = import.meta.env.MP_ACCESS_TOKEN;
const mpWebhookSecret = import.meta.env.MP_WEBHOOK_SECRET;

// Valida la firma x-signature de MP: HMAC-SHA256 de
// `id:{data.id};request-id:{x-request-id};ts:{ts}` con el secret.
async function firmaValida(req: Request, dataId: string): Promise<boolean> {
  if (!mpWebhookSecret) return false;
  const header = req.headers.get('x-signature') || '';
  const reqId = req.headers.get('x-request-id') || '';
  const partes = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const ts = partes['ts'];
  const v1 = partes['v1'];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(mpWebhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === v1.toLowerCase();
}

export const POST: APIRoute = async ({ request }) => {
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

  if (!mpWebhookSecret || !mpAccessToken || !supabaseUrl || !serviceKey) {
    return json({ error: 'Webhook no configurado.' }, 400);
  }

  let body: { type?: string; data?: { id?: string } };
  try {
    body = await request.json();
  } catch {
    return json({ ok: true });
  }

  const dataId = body?.data?.id;
  // Solo nos interesan notificaciones de pagos con id
  if (body?.type !== 'payment' || !dataId) {
    return json({ ok: true });
  }

  if (!(await firmaValida(request, dataId))) {
    return json({ error: 'Firma inválida.' }, 401);
  }

  // Traer el pago desde MP (fuente de verdad)
  const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
    headers: { 'Authorization': `Bearer ${mpAccessToken}` },
  });
  if (!payRes.ok) return json({ ok: true });

  const pago = await payRes.json();
  const ventaId = pago.external_reference;
  if (!ventaId) return json({ ok: true });

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: venta } = await supabase
    .from('ventas')
    .select('id, estado, usuario_id')
    .eq('id', ventaId)
    .single();

  if (!venta || venta.estado === 'PAGADA') {
    return json({ ok: true }); // idempotencia: ya procesado
  }

  if (pago.status === 'approved') {
    const { error } = await supabase
      .from('ventas')
      .update({ estado: 'PAGADA', mp_payment_id: String(pago.id) })
      .eq('id', ventaId);
    // Conflicto de mp_payment_id = ya procesado por otro aviso
    if (error && !error.message.includes('duplicate')) {
      return json({ error: error.message }, 500);
    }
    return json({ ok: true });
  }

  if (pago.status === 'rejected' || pago.status === 'cancelled' || pago.status === 'refunded') {
    // Rechazado: se devuelve el stock automáticamente
    const { data: items } = await supabase
      .from('ventas_items')
      .select('producto_id, cantidad, costo_unitario')
      .eq('venta_id', ventaId);

    for (const it of items || []) {
      await supabase.from('movimientos_stock').insert([{
        usuario_id: venta.usuario_id,
        producto_id: it.producto_id,
        tipo: 'AJUSTE_POSITIVO',
        cantidad: it.cantidad,
        costo_unitario: it.costo_unitario,
        motivo: `Devuelve pedido #${String(ventaId).slice(0, 8)} (MP ${pago.status})`,
        referencia_id: ventaId,
      }]);
    }

    await supabase
      .from('ventas')
      .update({ estado: 'RECHAZADA', mp_payment_id: String(pago.id) })
      .eq('id', ventaId);

    return json({ ok: true });
  }

  // pending / in_process / authorized: se espera; la expiración de 24h lo cubre
  return json({ ok: true });
};
