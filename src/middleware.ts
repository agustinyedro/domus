// src/middleware.ts
// Auth guard: protege rutas /admin/* sin sesión

import { defineMiddleware } from 'astro:middleware';

const publicRoutes = [
  '/',
  '/aromas',
  '/comida',
  '/ropa',
  '/experiencias',
  '/admin/login',
  '/api/auth/login',
  '/api/auth/register',
];

export const onRequest = defineMiddleware(async ({ url, cookies, redirect, request }, next) => {
  const pathname = url.pathname;

  // Rutas públicas: pasar directo (incluye landing y auth endpoints)
  if (publicRoutes.some((r) => pathname === r || pathname.startsWith('/api/auth'))) {
    return next();
  }

  // Rutas admin: verificar sesión (lazy import para evitar error en build de páginas estáticas)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const { createSupabaseServer } = await import('./lib/supabase');
    const supabase = createSupabaseServer(request, cookies);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      if (pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return redirect('/admin/login');
    }
  }

  return next();
});
