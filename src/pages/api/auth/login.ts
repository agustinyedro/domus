// src/pages/api/auth/login.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { createSupabaseServer, supabaseConfigurado } from '@/lib/supabase';
import { LoginSchema } from '@/lib/validations';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (!supabaseConfigurado()) {
      return new Response(
        JSON.stringify({ error: 'Servidor sin configurar: faltan las variables PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY. Cargalas en Cloudflare Pages y hacé redeploy.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email, password } = parsed.data;
    // Sign-in con el cliente servidor: persiste la sesión en las cookies
    // oficiales de Supabase (setAll), que el middleware sí reconoce.
    const supabase = createSupabaseServer(request, cookies);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, user: data.user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
