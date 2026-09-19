// src/pages/api/auth/register.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { createSupabaseServer, supabaseConfigurado } from '@/lib/supabase';
import { RegisterSchema } from '@/lib/validations';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!supabaseConfigurado()) {
      return new Response(
        JSON.stringify({ error: 'Servidor sin configurar: faltan las variables de Supabase.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, nombre } = parsed.data;
    // Sign-up con el cliente servidor: la sesión (si hay) queda en cookies oficiales.
    const supabase = createSupabaseServer(request, cookies);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, user: data.user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
