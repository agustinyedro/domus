// src/lib/tienda-catalogo.ts
// Lectura pública del catálogo para páginas SSR de la tienda.
// Usa la service role (sólo en servidor): no enviar al cliente.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface ProductoTienda {
  producto_id: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  imagen_url: string | null;
  precio_venta: number;
  precio_final: number;
  precio_oferta: number | null;
  es_oferta: boolean;
  descuento_pct: number;
  variante: string;
  nombre_opcion: string;
  grupo_id: string;
  stock_actual: number;
  stock_minimo: number;
  vendidos_90d: number;
  rating_promedio: number;
  rating_cantidad: number;
  destacado: boolean;
}

const COLUMNAS =
  'producto_id, sku, nombre, descripcion, categoria, imagen_url, precio_venta, precio_final, precio_oferta, es_oferta, descuento_pct, variante, nombre_opcion, grupo_id, stock_actual, stock_minimo, vendidos_90d, rating_promedio, rating_cantidad, destacado';

let cliente: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Tienda sin configurar: falta SUPABASE_SERVICE_ROLE_KEY.');
  if (!cliente) cliente = createClient(url, key, { auth: { persistSession: false } });
  return cliente;
}

const esUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function buscarProducto(sku: string): Promise<ProductoTienda | null> {
  const valor = sku.trim();
  if (!valor) return null;
  try {
    const supabase = getClient();
    const campo = esUuid(valor) ? 'producto_id' : 'sku';
    const { data, error } = await supabase
      .from('v_stock_actual')
      .select(COLUMNAS)
      .eq(campo, valor)
      .eq('activo', true)
      .maybeSingle();
    if (error || !data) return null;
    return data as ProductoTienda;
  } catch {
    return null;
  }
}

export async function variantesDeGrupo(grupoId: string): Promise<ProductoTienda[]> {
  if (!grupoId) return [];
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('v_stock_actual')
      .select(COLUMNAS)
      .eq('grupo_id', grupoId)
      .eq('activo', true)
      .order('variante', { ascending: true });
    if (error || !data) return [];
    return data as ProductoTienda[];
  } catch {
    return [];
  }
}
