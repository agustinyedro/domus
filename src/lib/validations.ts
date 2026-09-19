// src/lib/validations.ts
// Schemas Zod para validación de formularios y API

import { z } from 'zod';

export const ProductoSchema = z.object({
  sku: z.string().min(1, 'SKU es requerido').max(100),
  nombre: z.string().min(1, 'Nombre es requerido').max(255),
  descripcion: z.string().max(1000).nullable().optional(),
  categoria: z.string().max(100).nullable().optional(),
  imagen_url: z.string().url().max(500).nullable().optional(),
  costo: z.number().min(0, 'Costo debe ser >= 0'),
  precio_venta: z.number().min(0, 'Precio de venta debe ser >= 0'),
  precio_oferta: z.number().min(0).nullable().optional(),
  es_oferta: z.boolean().default(false),
  destacado: z.boolean().default(false),
  rating_promedio: z.number().min(0).max(5).default(0),
  rating_cantidad: z.number().int().min(0).default(0),
  stock_minimo: z.number().int().min(0).default(5),
  activo: z.boolean().default(true),
});

export const CompraSchema = z.object({
  producto_id: z.string().uuid('ID de producto inválido'),
  cantidad: z.number().int().min(1, 'Cantidad mínima es 1'),
  costo_unitario: z.number().min(0, 'Costo unitario debe ser >= 0'),
  observaciones: z.string().max(500).optional(),
});

export const VentaSchema = z.object({
  producto_id: z.string().uuid('ID de producto inválido'),
  cantidad: z.number().int().min(1, 'Cantidad mínima es 1'),
  precio_unitario: z.number().min(0),
  costo_unitario: z.number().min(0),
});

export const GastoSchema = z.object({
  fecha: z.string().min(1, 'Fecha es requerida'),
  concepto: z.string().min(1, 'Concepto es requerido').max(255),
  categoria: z.enum(['Alquiler', 'Servicios', 'Insumos', 'Marketing', 'Personal', 'Otros']).default('Otros'),
  monto: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  observaciones: z.string().max(500).nullable().optional(),
});

export const MovimientoSchema = z.object({
  producto_id: z.string().uuid('ID de producto inválido'),
  tipo: z.enum(['ENTRADA', 'SALIDA'], { message: 'Tipo debe ser ENTRADA o SALIDA' }),
  cantidad: z.number().int().min(1, 'Cantidad mínima es 1'),
  motivo: z.string().min(3, 'El motivo es obligatorio (mínimo 3 caracteres)').max(500),
});

export const KitSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(255),
  descripcion: z.string().max(1000).nullable().optional(),
  imagen_url: z.string().url().max(500).nullable().optional(),
  precio_venta: z.number().min(0, 'Precio de venta debe ser >= 0'),
  activo: z.boolean().default(true),
});

export const KitItemSchema = z.object({
  producto_id: z.string().uuid('ID de producto inválido'),
  cantidad: z.number().int().min(1, 'Cantidad mínima es 1'),
});

export const ClubSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(255),
  descripcion: z.string().max(1000).nullable().optional(),
  precio_mensual: z.number().min(0, 'Precio mensual debe ser >= 0'),
  kit_id: z.string().uuid().nullable().optional(),
  activo: z.boolean().default(true),
});

export const SuscriptorSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(255),
  email: z.string().email('Email inválido').nullable().optional(),
  telefono: z.string().max(20).nullable().optional(),
  club_id: z.string().uuid('Club inválido'),
  estado: z.enum(['ACTIVO', 'PAUSADO', 'CANCELADO']).default('ACTIVO'),
  proximo_envio: z.string().nullable().optional(),
  observaciones: z.string().max(500).nullable().optional(),
});

export const CompraBatchSchema = z.object({
  items: z.array(z.object({
    producto_id: z.string().uuid('ID de producto inválido'),
    cantidad: z.number().int().min(1, 'Cantidad mínima es 1'),
    costo_unitario: z.number().min(0, 'Costo unitario debe ser >= 0'),
  })).min(1, 'Agregá al menos un producto').max(50, 'Máximo 50 productos por compra'),
  observaciones: z.string().max(500).optional(),
});

export const VentaBatchSchema = z.object({
  items: z.array(z.object({
    producto_id: z.string().uuid('ID de producto inválido'),
    cantidad: z.number().int().min(1, 'Cantidad mínima es 1'),
  })).min(1, 'Agregá al menos un producto').max(50, 'Máximo 50 productos por venta'),
});

export const CategoriaSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(100),
});

export const CheckoutSchema = z.object({
  items: z.array(z.object({
    producto_id: z.string().uuid('ID de producto inválido'),
    cantidad: z.number().int().min(1, 'Cantidad mínima es 1'),
  })).min(1, 'El carrito está vacío').max(50, 'Máximo 50 productos por pedido'),
  cliente: z.object({
    nombre: z.string().min(2, 'Contanos tu nombre').max(255),
    telefono: z.string().min(6, 'Teléfono inválido').max(50),
  }),
  metodo: z.enum(['MP', 'EFECTIVO'], { message: 'Método inválido' }),
});

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  nombre: z.string().min(1, 'Nombre es requerido').max(255),
});

export type ProductoInput = z.infer<typeof ProductoSchema>;
export type CompraInput = z.infer<typeof CompraSchema>;
export type VentaInput = z.infer<typeof VentaSchema>;
export type CompraBatchInput = z.infer<typeof CompraBatchSchema>;
export type VentaBatchInput = z.infer<typeof VentaBatchSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type CategoriaInput = z.infer<typeof CategoriaSchema>;
export type GastoInput = z.infer<typeof GastoSchema>;
export type MovimientoInput = z.infer<typeof MovimientoSchema>;
export type KitInput = z.infer<typeof KitSchema>;
export type KitItemInput = z.infer<typeof KitItemSchema>;
export type ClubInput = z.infer<typeof ClubSchema>;
export type SuscriptorInput = z.infer<typeof SuscriptorSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
