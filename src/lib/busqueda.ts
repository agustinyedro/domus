// src/lib/busqueda.ts
// Búsqueda de tienda estilo Tiendanube: multi-palabra (AND entre palabras,
// OR entre campos) + resaltado de coincidencias para sugerencias.

const MAX_PALABRAS = 6;
const MAX_LARGO_PALABRA = 40;

// Caracteres que rompen la sintaxis `or()` de PostgREST o actúan como
// comodines de LIKE: se eliminan antes de armar el patrón.
const PELIGROSOS = /[%_,()"'\r\n\t\\[\]{};!*+|^$=<>?@#&]/g;

export function palabrasBusqueda(q: string, max = MAX_PALABRAS): string[] {
  if (!q) return [];
  return q
    .replace(PELIGROSOS, ' ')
    .split(/\s+/)
    .map((w) => w.trim().slice(0, MAX_LARGO_PALABRA))
    .filter(Boolean)
    .slice(0, max);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function resaltarCoincidencia(nombre: string, palabras: string[]): string {
  const base = escapeHtml(nombre);
  const unicas = [...new Set(palabras.map((p) => p.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (!unicas.length) return base;
  const patron = new RegExp(`(${unicas.map(escaparRegex).join('|')})`, 'gi');
  return base.replace(patron, '<mark>$1</mark>');
}
