// src/lib/precios.ts
// Fuente única de precios: efectivo (base) y recargo de tarjeta, más medios de pago.
//
// El admin carga el precio EN EFECTIVO; el precio de tarjeta/MP se deriva:
//   tarjeta = round(efectivo * (1 + recargo / 100))
// En la tienda el precio principal es el de efectivo y el de tarjeta se muestra tachado.
export const RECARGO_TARJETA_DEFAULT = 15;

export const METODOS_PAGO_VENTA = ['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'MP', 'OTRO'] as const;
export type MetodoPagoVenta = (typeof METODOS_PAGO_VENTA)[number];

export const ETIQUETAS_METODO_PAGO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  MP: 'Mercado Pago',
  OTRO: 'Otro',
  MANUAL: 'Manual',
};

export function clampRecargo(recargo: number): number {
  if (!Number.isFinite(recargo)) return RECARGO_TARJETA_DEFAULT;
  return Math.min(95, Math.max(0, Math.round(recargo)));
}

// Medios que se cobran al precio en efectivo (sin recargo de tarjeta)
export function esPagoSinRecargo(metodo?: string | null): boolean {
  return metodo === 'EFECTIVO' || metodo === 'TRANSFERENCIA';
}

// Precio de tarjeta (publicado) -> precio en efectivo
export function precioEfectivo(precio: number, recargo = RECARGO_TARJETA_DEFAULT): number {
  const r = clampRecargo(Number(recargo));
  return Math.round(Number(precio) / (1 + r / 100));
}

// Precio en efectivo -> precio de tarjeta/MP
export function precioTarjeta(precio: number, recargo = RECARGO_TARJETA_DEFAULT): number {
  const r = clampRecargo(Number(recargo));
  return Math.round(Number(precio) * (1 + r / 100));
}
