import { config } from '../config';
import { clampRecargo, precioTarjeta, RECARGO_TARJETA_DEFAULT } from '../lib/precios';

export const CLAVE_CARRITO = 'domus_cart_v2';

export type MetodoPago = 'EFECTIVO' | 'MP';

export interface ItemCarrito {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  stock?: number;
  recargo?: number;
}

export function leerCarrito(): ItemCarrito[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(CLAVE_CARRITO) || '[]');
    return Array.isArray(data) ? (data as ItemCarrito[]) : [];
  } catch {
    return [];
  }
}

export function cantidadEnCarrito(cart: ItemCarrito[]): number {
  return cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
}

export function subtotal(cart: ItemCarrito[]): number {
  return cart.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0);
}

// El precio del item ya está en efectivo (es el precio visible en la tienda).
// Efectivo: se cobra tal cual. Tarjeta/MP: se agrega el recargo por producto.
export function calcularTotales(cart: ItemCarrito[], metodo: MetodoPago): { base: number; final: number } {
  const base = subtotal(cart);
  if (metodo !== 'EFECTIVO') {
    const final = cart.reduce(
      (total, item) =>
        total +
        precioTarjeta(Number(item.price), clampRecargo(Number(item.recargo) || RECARGO_TARJETA_DEFAULT)) *
          Number(item.quantity),
      0,
    );
    return { base, final };
  }
  return { base, final: base };
}

export function mensajeWhatsAppConsultar(cart: ItemCarrito[]): string {
  let message = 'Hola! Me gustaría consultar por estos productos:\n\n';
  cart.forEach((item) => {
    message += `- ${item.name} (x${item.quantity}) - $${Number(item.price) * Number(item.quantity)}\n`;
  });
  message += `\nTotal estimado: $${subtotal(cart)}\n\n¿Están disponibles?`;
  return message;
}

export function urlWhatsApp(mensaje: string): string {
  return `https://wa.me/${config.whatsapp.phoneNumber}?text=${encodeURIComponent(mensaje)}`;
}

export function abrirUrl(url: string): void {
  const w = window.open(url, '_blank');
  if (!w) window.location.href = url;
}

type CartManagerGlobal = {
  updateCartCount?: () => void;
  updateCartDisplay?: () => void;
};

export function limpiarCarrito(): void {
  localStorage.setItem(CLAVE_CARRITO, '[]');
  const manager = (window as unknown as { CartManager?: CartManagerGlobal }).CartManager;
  manager?.updateCartCount?.();
  manager?.updateCartDisplay?.();
  window.dispatchEvent(new CustomEvent('domus:cart-updated', { detail: { ids: [] } }));
  window.dispatchEvent(new Event('domus:cart-cleared'));
}

export interface PedidoEnviado {
  whatsapp_url?: string;
  init_point?: string;
  venta_id?: number | string;
  [clave: string]: unknown;
}

export interface PedidoPayload {
  items: { producto_id: string; cantidad: number }[];
  cliente: { nombre: string; telefono: string };
  metodo: MetodoPago;
}

function mensajeDeError(data: Record<string, unknown>): string {
  const err = data.error;
  if (typeof err === 'string' && err.trim()) return err;
  if (err && typeof err === 'object') {
    const detalle = Object.values(err as Record<string, string[]>)
      .flat()
      .filter(Boolean);
    if (detalle.length) return detalle.join(' ');
  }
  return 'No se pudo crear el pedido.';
}

export async function enviarPedido(payload: PedidoPayload): Promise<PedidoEnviado> {
  const res = await fetch('/api/checkout/crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(mensajeDeError(data));
  return data as PedidoEnviado;
}
