// src/lib/banners.ts
// Utilidades compartidas de banners (admin + tienda pública)

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BannerInput } from './validations';

export type BannerProducto = {
  producto_id: string;
  nombre: string;
  sku: string;
  precio_efectivo: number | null;
  imagen_url: string | null;
  activo: boolean;
};

const CAMPOS_FECHA = new Set(['fecha_desde', 'fecha_hasta']);

// Normaliza solo las claves presentes en el objeto (sirve para POST y PUT parcial).
export function normalizarBanner(data: Partial<BannerInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(data)) {
    if (valor === undefined) continue;
    if (CAMPOS_FECHA.has(clave)) {
      out[clave] = valor ? new Date(valor as string).toISOString() : null;
    } else if (typeof valor === 'string') {
      out[clave] = valor.trim() || null;
    } else {
      out[clave] = valor;
    }
  }
  return out;
}

export function hrefDeBanner(banner: { link_url?: string | null }, producto?: BannerProducto | null): string {
  if (banner.link_url) return banner.link_url;
  if (producto?.sku) return `/tienda/producto/${encodeURIComponent(producto.sku.trim())}`;
  return '';
}

export async function resolverProductos(
  supabase: SupabaseClient,
  usuarioId: string | null,
  ids: string[],
): Promise<Map<string, BannerProducto>> {
  const map = new Map<string, BannerProducto>();
  const unicos = [...new Set(ids.filter(Boolean))];
  if (!unicos.length) return map;

  let query = supabase
    .from('v_stock_actual')
    .select('producto_id, nombre, sku, precio_efectivo, imagen_url, activo')
    .in('producto_id', unicos);
  if (usuarioId) query = query.eq('usuario_id', usuarioId);

  const { data } = await query;

  for (const p of data || []) {
    map.set(p.producto_id as string, p as BannerProducto);
  }
  return map;
}
