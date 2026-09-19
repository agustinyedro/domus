// src/lib/supabase.ts
// Clientes Supabase: browser (anon) + servidor (con cookies)

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// NO lanzar al importar: un throw top-level rompe todas las API routes
// con un 500 opaco ("internal error"). Se valida al crear el cliente.
export function supabaseConfigurado(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function exigirConfig() {
  if (!supabaseConfigurado()) {
    throw new Error('Supabase no configurado: faltan PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en el entorno');
  }
}

// Cliente browser (para componentes Vue/client-side)
export function createSupabaseBrowser() {
  exigirConfig();
  return createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: {
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });
}

// Astro.cookies NO tiene getAll(): se parsea el header Cookie crudo
// del Request. La lib @supabase/ssr maneja sus cookies particionadas
// (...0, ...1) a partir de esa lista.
function parseCookieHeader(header: string | null): Array<{ name: string; value: string }> {
  if (!header) return [];
  const out: Array<{ name: string; value: string }> = [];
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const name = part.slice(0, i).trim();
    if (!name) continue;
    let value = part.slice(i + 1).trim();
    try {
      value = decodeURIComponent(value);
    } catch {
      // valor no codificado: se usa tal cual
    }
    out.push({ name, value });
  }
  return out;
}

// Cliente servidor con cookies (para API routes SSR y middleware).
// Usa @supabase/ssr para leer/escribir las cookies de sesión con los
// nombres que Supabase espera (sb-<ref>-auth-token). Sin esto, el login
// devuelve 200 pero el middleware no reconoce la sesión (redirect loop).
export function createSupabaseServer(request: Request, cookies: AstroCookies) {
  exigirConfig();
  return createServerClient(supabaseUrl as string, supabaseAnonKey as string, {
    cookies: {
      getAll: () => parseCookieHeader(request.headers.get('cookie')),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookies.set(name, value, options as unknown as Parameters<AstroCookies['set']>[2])
        );
      },
    },
  });
}

// Helper: usuario actual desde request+cookies (para API routes)
export async function getUsuarioActual(request: Request, cookies: AstroCookies) {
  const supabase = createSupabaseServer(request, cookies);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}
