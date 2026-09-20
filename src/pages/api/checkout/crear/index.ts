// src/pages/api/checkout/crear/index.ts
// Crea el pedido desde la tienda: valida stock, descuenta al crear.
// EFECTIVO -> PENDIENTE_EFECTIVO + link WhatsApp con N° de pedido.
// MP -> PENDIENTE_PAGO + preferencia de Mercado Pago (requiere credenciales).
export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { CheckoutSchema } from '@/lib/validations';
import { config } from '@/config';
import { resolverKit } from '@/lib/kits';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const mpAccessToken = import.meta.env.MP_ACCESS_TOKEN;
const siteUrl = import.meta.env.SITE_URL || 'https://domus.com.ar';

// Precio publicado = tarjeta/MP. En efectivo se descuenta este porcentaje.
const DESCUENTO_EFECTIVO = 0.15;

function getAdmin() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Falta configuración de Supabase en el servidor.');
  }
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

function precioVigente(p: { precio_venta: number; precio_oferta: number | null; es_oferta: boolean }): number {
  if (p.es_oferta && p.precio_oferta !== null && Number(p.precio_oferta) < Number(p.precio_venta)) {
    return Number(p.precio_oferta);
  }
  return Number(p.precio_venta);
}

export const POST: APIRoute = async ({ request }) => {
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body inválido.' }, 400);
  }

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.flatten().fieldErrors }, 400);
  }

  const { items, cliente, metodo } = parsed.data;

  if (metodo === 'MP' && !mpAccessToken) {
    return json({ error: 'Mercado Pago todavía no está configurado. Elegí Efectivo por ahora.' }, 400);
  }

  let supabase;
  try {
    supabase = getAdmin();
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }

  // Fase 1: resolver precio/stock de TODO antes de escribir nada
  const ids = [...new Set(items.map((i) => i.producto_id))];
  const { data: prods, error: prodsError } = await supabase
    .from('productos')
    .select('id, nombre, variante, precio_venta, precio_oferta, es_oferta, activo, usuario_id, kit_id')
    .in('id', ids);

  if (prodsError) return json({ error: prodsError.message }, 400);

  // El pedido pertenece al dueño de los productos: así el RLS del admin
  // lo ve sin migraciones ni políticas nuevas.
  const ownerId = (prods || [])[0]?.usuario_id;
  const duenos = new Set((prods || []).map((p) => p.usuario_id));
  if (!ownerId || duenos.size !== 1) {
    return json({ error: 'Productos no disponibles.' }, 400);
  }

  const porId = new Map((prods || []).map((p) => [p.id, p]));
  const resueltos = [];

  for (const item of items) {
    const p = porId.get(item.producto_id);
    if (!p || !p.activo) {
      return json({ error: `Producto no disponible.` }, 400);
    }

    const nombreVenta = p.variante && p.variante !== 'Única'
      ? `${p.nombre} — ${p.variante}`
      : p.nombre;
    const precioBase = metodo === 'EFECTIVO'
      ? Math.round(precioVigente(p) * (1 - DESCUENTO_EFECTIVO))
      : precioVigente(p);

    // Kit: stock y costo derivados de los componentes
    if (p.kit_id) {
      const kit = await resolverKit(supabase, p.kit_id);
      if (!kit) {
        return json({ error: `El kit "${p.nombre}" no tiene productos cargados.` }, 400);
      }
      if (item.cantidad > kit.stock) {
        return json({ error: `Stock insuficiente de "${p.nombre}": quedan ${kit.stock} kit(s). No se registró nada.` }, 400);
      }
      resueltos.push({
        producto_id: item.producto_id,
        kit_id: p.kit_id,
        componentes: kit.componentes,
        nombre: nombreVenta,
        cantidad: item.cantidad,
        precio: precioBase,
        precioLista: precioVigente(p),
        costo: kit.costo,
      });
      continue;
    }

    const { data: movs } = await supabase
      .from('movimientos_stock')
      .select('tipo, cantidad')
      .eq('producto_id', item.producto_id);

    const stock = (movs || []).reduce((s, m) => {
      if (m.tipo === 'ENTRADA' || m.tipo === 'AJUSTE_POSITIVO') return s + m.cantidad;
      return s - m.cantidad;
    }, 0);

    if (item.cantidad > stock) {
      return json({ error: `Stock insuficiente de "${p.nombre}": quedan ${stock} u. No se registró nada.` }, 400);
    }

    // Costo vigente = última compra
    const { data: ultimaCompra } = await supabase
      .from('historial_compras')
      .select('costo_unitario')
      .eq('producto_id', item.producto_id)
      .order('fecha', { ascending: false })
      .limit(1)
      .single();

    resueltos.push({
      producto_id: item.producto_id,
      kit_id: null,
      componentes: null,
      nombre: nombreVenta,
      cantidad: item.cantidad,
      precio: precioBase,
      precioLista: precioVigente(p),
      costo: ultimaCompra ? Number(ultimaCompra.costo_unitario) : 0,
    });
  }

  const total = resueltos.reduce((s, r) => s + r.precio * r.cantidad, 0);
  const totalLista = resueltos.reduce((s, r) => s + r.precioLista * r.cantidad, 0);
  const ganancia = resueltos.reduce((s, r) => s + (r.precio - r.costo) * r.cantidad, 0);
  const estado = metodo === 'MP' ? 'PENDIENTE_PAGO' : 'PENDIENTE_EFECTIVO';

  // Fase 2: venta + items + movimientos (descuenta stock ya)
  const { data: venta, error: ventaError } = await supabase
    .from('ventas')
    .insert([{
      usuario_id: ownerId,
      total,
      ganancia,
      estado,
      metodo_pago: metodo,
      source: 'TIENDA',
      cliente_nombre: cliente.nombre.trim(),
      cliente_telefono: cliente.telefono.trim(),
    }])
    .select()
    .single();

  if (ventaError) return json({ error: ventaError.message }, 400);

  const motivoMov = `Pedido tienda #${venta.id.slice(0, 8)} (${metodo}${metodo === 'EFECTIVO' ? ' -15%' : ''})`;

  for (const r of resueltos) {
    const itemRow: Record<string, unknown> = {
      venta_id: venta.id,
      producto_id: r.producto_id,
      cantidad: r.cantidad,
      precio_unitario: r.precio,
      costo_unitario: r.costo,
    };
    if (r.kit_id) {
      itemRow.kit_id = r.kit_id;
      itemRow.componentes = r.componentes;
    }
    await supabase.from('ventas_items').insert([itemRow]);

    // Kit: descuenta cada componente. Producto normal: descuenta el producto.
    if (r.kit_id && Array.isArray(r.componentes)) {
      for (const c of r.componentes as Array<{ producto_id: string; cantidad: number; costo_unitario: number }>) {
        await supabase.from('movimientos_stock').insert([{
          usuario_id: ownerId,
          producto_id: c.producto_id,
          tipo: 'VENTA',
          cantidad: c.cantidad * r.cantidad,
          costo_unitario: c.costo_unitario,
          motivo: `${motivoMov} · kit ${r.nombre}`,
          referencia_id: venta.id,
        }]);
      }
    } else {
      await supabase.from('movimientos_stock').insert([{
        usuario_id: ownerId,
        producto_id: r.producto_id,
        tipo: 'VENTA',
        cantidad: r.cantidad,
        costo_unitario: r.costo,
        motivo: motivoMov,
        referencia_id: venta.id,
      }]);
    }
  }

  // ---- EFECTIVO: link de WhatsApp con el pedido ----
  if (metodo === 'EFECTIVO') {
    const lineas = resueltos.map((r) => `- ${r.nombre} x${r.cantidad} - $${(r.precio * r.cantidad).toLocaleString('es-AR')}`);
    const msg = `Hola DOMUS! Hice el pedido #${venta.id.slice(0, 8)} en la tienda:\n\n${lineas.join('\n')}\n\nTotal lista: ~$${totalLista.toLocaleString('es-AR')}~\nTotal en efectivo (-15%): $${total.toLocaleString('es-AR')}\nSoy ${cliente.nombre} (${cliente.telefono}). Pago en efectivo, ¿coordinamos?`;
    const whatsapp_url = `https://wa.me/${config.whatsapp.phoneNumber}?text=${encodeURIComponent(msg)}`;
    return json({ venta_id: venta.id, estado, total, totalLista, descuento_pct: 15, whatsapp_url }, 201);
  }

  // ---- MP: crear preferencia ----
  try {
    const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify({
        items: resueltos.map((r) => ({
          title: r.nombre.slice(0, 200),
          quantity: r.cantidad,
          unit_price: r.precio,
          currency_id: 'ARS',
        })),
        payer: { name: cliente.nombre, phone: { number: cliente.telefono } },
        back_urls: {
          success: `${siteUrl}/gracias?estado=exito&pedido=${venta.id}`,
          failure: `${siteUrl}/gracias?estado=fallo&pedido=${venta.id}`,
          pending: `${siteUrl}/gracias?estado=pendiente&pedido=${venta.id}`,
        },
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        external_reference: venta.id,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        statement_descriptor: 'DOMUS',
      }),
    });

    if (!prefRes.ok) {
      throw new Error(`MP respondió ${prefRes.status}`);
    }

    const pref = await prefRes.json();
    await supabase.from('ventas').update({ mp_preference_id: pref.id }).eq('id', venta.id);

    return json({ venta_id: venta.id, estado, total, init_point: pref.init_point }, 201);
  } catch (e) {
    // Si MP falla, se marca la venta como cancelada para no dejar stock colgado
    await supabase.from('ventas').update({ estado: 'CANCELADA' }).eq('id', venta.id);
    for (const r of resueltos) {
      if (r.kit_id && Array.isArray(r.componentes)) {
        for (const c of r.componentes as Array<{ producto_id: string; cantidad: number; costo_unitario: number }>) {
          await supabase.from('movimientos_stock').insert([{
            usuario_id: ownerId,
            producto_id: c.producto_id,
            tipo: 'AJUSTE_POSITIVO',
            cantidad: c.cantidad * r.cantidad,
            costo_unitario: c.costo_unitario,
            motivo: `Cancela pedido #${venta.id.slice(0, 8)} (falló MP) · kit ${r.nombre}`,
            referencia_id: venta.id,
          }]);
        }
      } else {
        await supabase.from('movimientos_stock').insert([{
          usuario_id: ownerId,
          producto_id: r.producto_id,
          tipo: 'AJUSTE_POSITIVO',
          cantidad: r.cantidad,
          costo_unitario: r.costo,
          motivo: `Cancela pedido #${venta.id.slice(0, 8)} (falló MP)`,
          referencia_id: venta.id,
        }]);
      }
    }
    return json({ error: 'No se pudo iniciar el pago con Mercado Pago. Probá de nuevo o elegí Efectivo.' }, 502);
  }
};
