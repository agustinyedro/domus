// src/pages/api/auth/logout.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { createSupabaseServer, supabaseConfigurado } from '@/lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  if (supabaseConfigurado()) {
    const supabase = createSupabaseServer(request, cookies);
    await supabase.auth.signOut();
  }
  // Limpieza de cookies legacy del esquema anterior (por las dudas)
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
