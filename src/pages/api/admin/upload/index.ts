// src/pages/api/admin/upload/index.ts
// Sube fotos al bucket indicado por 'carpeta' (default 'productos').
//   - productos: ruta productos/<SKU>.<ext>, upsert (re-subir mismo SKU reemplaza).
//   - banners:   ruta banners/<slug>-<timestamp>.<ext>, sin SKU.
// Usa service_role (bypass RLS) + auth por cookie de admin.
// Límites: jpg/png/webp, máx 2 MB.
export const prerender = false;

import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';
import { getUsuarioActual } from '@/lib/supabase';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

const PERMITIDOS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_BYTES = 2 * 1024 * 1024;
const CARPETAS = new Set(['productos', 'banners']);

function skuSeguro(sku: string): string {
  return (
    sku
      .toUpperCase()
      .replace(/[^A-Z0-9-_]+/g, '')
      .slice(0, 60) || 'SIN-SKU'
  );
}

function nombreSeguro(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getUsuarioActual(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Body debe ser multipart/form-data.' }), { status: 400 });
  }

  const archivo = form.get('archivo');
  const sku = String(form.get('sku') || '').trim();
  const nombre = String(form.get('nombre') || '').trim();
  const carpetaRaw = String(form.get('carpeta') || 'productos').trim();
  const carpeta = CARPETAS.has(carpetaRaw) ? carpetaRaw : 'productos';

  if (!(archivo instanceof File) || archivo.size === 0) {
    return new Response(JSON.stringify({ error: 'Falta el archivo.' }), { status: 400 });
  }
  if (carpeta === 'productos' && !sku) {
    return new Response(JSON.stringify({ error: 'Falta el SKU para nombrar la foto.' }), { status: 400 });
  }

  const ext = PERMITIDOS[archivo.type];
  if (!ext) {
    return new Response(JSON.stringify({ error: 'Formato no permitido. Usá JPG, PNG o WebP.' }), {
      status: 400,
    });
  }
  if (archivo.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: 'La foto supera los 2 MB.' }), { status: 400 });
  }

  const ruta =
    carpeta === 'banners'
      ? `banners/${nombreSeguro(nombre) || 'banner'}-${Date.now()}.${ext}`
      : `productos/${skuSeguro(sku)}.${ext}`;

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { error } = await supabase.storage
    .from(carpeta)
    .upload(ruta, archivo, { contentType: archivo.type, upsert: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  const { data } = supabase.storage.from(carpeta).getPublicUrl(ruta);

  return new Response(JSON.stringify({ url: data.publicUrl, ruta }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
