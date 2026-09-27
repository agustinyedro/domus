// src/lib/fotos.ts
// Fotos de producto con fallback por categoría (mientras no haya foto propia).
export const IMG_AROMAS = 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400&h=400&fit=crop';
export const IMG_COMIDA = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop';
export const IMG_ROPA = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop';
export const IMG_EXPERIENCIAS = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop';

export const FALLBACKS: Record<string, string> = {
  Sahumerios: IMG_AROMAS,
  Difusores: IMG_AROMAS,
  Velas: IMG_AROMAS,
  Aromas: IMG_AROMAS,
  Comida: IMG_COMIDA,
  Ropa: IMG_ROPA,
  Experiencias: IMG_EXPERIENCIAS,
};

export const fallbackImg = IMG_AROMAS;

export function urlFallback(categoria: string | null | undefined): string {
  return FALLBACKS[(categoria || '').trim()] || fallbackImg;
}

export function fotoDe(p: { imagen_url?: string | null; categoria?: string | null }): string {
  if (p.imagen_url) return p.imagen_url;
  return urlFallback(p.categoria);
}
