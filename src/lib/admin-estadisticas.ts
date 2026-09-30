// src/lib/admin-estadisticas.ts
// Helpers compartidos de la sección Estadísticas del panel.

export type KpiDelta = { ventas: number; facturacion: number; ticket: number };
export type ProductoStat = {
  producto_id: string;
  nombre: string;
  variante: string | null;
  unidades: number;
  ingresos: number;
  ganancia: number;
};
export type Estadisticas = {
  rango: { desde: string; hasta: string; dias: number };
  kpis: {
    ventas: number;
    facturacion: number;
    ticket: number;
    unidades: number;
    ganancia: number;
    delta: KpiDelta;
  };
  serie: Array<{ dia: string; total: number; ventas: number }>;
  por_origen: Array<{ origen: string; ventas: number; total: number }>;
  por_medio: Array<{ metodo: string; ventas: number; total: number }>;
  productos: ProductoStat[];
  stock: { total: number; bajo: number };
  dispersion: Array<{
    nombre: string;
    variante: string | null;
    unidades: number;
    precio: number;
    stock: number;
  }>;
  clientes: {
    total: number;
    recurrentes: number;
    top: Array<{ nombre: string; ventas: number; total: number }>;
  };
};

export const fmt$ = (n: unknown) => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;
export const fmtNum = (n: unknown) => (Number(n) || 0).toLocaleString('es-AR');
export const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const isoLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function rangoPreset(
  preset: string,
  desde?: string | null,
  hasta?: string | null,
): { desde: string; hasta: string } {
  const hoy = new Date();
  if (preset === 'hoy') return { desde: isoLocal(hoy), hasta: isoLocal(hoy) };
  if (preset === '7') {
    const d = new Date(hoy);
    d.setDate(d.getDate() - 6);
    return { desde: isoLocal(d), hasta: isoLocal(hoy) };
  }
  if (preset === '30') {
    const d = new Date(hoy);
    d.setDate(d.getDate() - 29);
    return { desde: isoLocal(d), hasta: isoLocal(hoy) };
  }
  if (preset === 'mes') {
    return { desde: isoLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: isoLocal(hoy) };
  }
  return { desde: desde || isoLocal(hoy), hasta: hasta || isoLocal(hoy) };
}

export async function cargarEstadisticas(desde: string, hasta: string): Promise<Estadisticas> {
  const res = await fetch(
    `/api/admin/estadisticas?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error('No se pudieron cargar las estadísticas.');
  return res.json();
}

export function deltaHtml(v: number): string {
  if (!v) return '<span class="est-delta">sin cambios vs período anterior</span>';
  const clase = v > 0 ? 'up' : 'down';
  return `<span class="est-delta ${clase}">${v > 0 ? '▲' : '▼'} ${Math.abs(v)}% vs período anterior</span>`;
}
