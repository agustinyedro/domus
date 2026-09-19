// src/lib/types.ts
// Tipos TypeScript para el dominio DOMUS Stock

export interface Producto {
  id: string;
  usuario_id: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  imagen_url: string | null;
  costo: number;
  precio_venta: number;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductoConStock extends Producto {
  stock_actual: number;
}

export interface MovimientoStock {
  id: string;
  usuario_id: string;
  producto_id: string;
  tipo: 'ENTRADA' | 'VENTA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';
  cantidad: number;
  costo_unitario: number;
  motivo: string | null;
  referencia_id: string | null;
  created_at: string;
}

export interface HistorialCompra {
  id: string;
  usuario_id: string;
  producto_id: string;
  fecha: string;
  cantidad: number;
  costo_unitario: number;
  costo_total: number;
  observaciones: string | null;
  created_at: string;
}

export interface Venta {
  id: string;
  usuario_id: string;
  fecha: string;
  total: number;
  ganancia: number;
  estado: 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA';
  source: string;
  ecommerce_order_id: string | null;
  created_at: string;
}

export interface VentaItem {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
  subtotal: number;
  ganancia_item: number;
}

export interface Kit {
  id: string;
  usuario_id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  precio_venta: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface KitItem {
  id: string;
  kit_id: string;
  producto_id: string;
  cantidad: number;
  created_at: string;
}

export interface Club {
  id: string;
  usuario_id: string;
  nombre: string;
  descripcion: string | null;
  precio_mensual: number;
  kit_id: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Suscriptor {
  id: string;
  usuario_id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  club_id: string;
  estado: 'ACTIVO' | 'PAUSADO' | 'CANCELADO';
  fecha_suscripcion: string;
  fecha_cancelacion: string | null;
  proximo_envio: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  ventas_mes: number;
  costo_cogs: number;
  ganancia: number;
  stock_total: number;
  valor_stock: number;
  productos_stock_bajo: ProductoConStock[];
}
