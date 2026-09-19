// src/lib/kits.ts
// Resolución de kits para venta: stock derivado de componentes y snapshot
// para descontar/devolver stock en las ventas.

export interface KitComponente {
  producto_id: string;
  cantidad: number; // por unidad de kit
  costo_unitario: number;
}

export interface KitResuelto {
  componentes: KitComponente[];
  stock: number; // kits armables según componentes
  costo: number; // costo por unidad de kit
}

type Cliente = {
  from: (tabla: string) => any;
};

function stockComponente(movs: Array<{ tipo: string; cantidad: number }>): number {
  return movs.reduce((s, m) => {
    if (m.tipo === 'ENTRADA' || m.tipo === 'AJUSTE_POSITIVO') return s + m.cantidad;
    return s - m.cantidad;
  }, 0);
}

/**
 * Resuelve los componentes de un kit: stock disponible (mínimo entre
 * componentes) y costo por unidad. Devuelve null si el kit no tiene items.
 */
export async function resolverKit(supabase: Cliente, kitId: string): Promise<KitResuelto | null> {
  const { data: items } = await supabase
    .from('kit_items')
    .select('producto_id, cantidad, productos ( costo )')
    .eq('kit_id', kitId);

  if (!items || !items.length) return null;

  const componentes: KitComponente[] = [];
  let costo = 0;
  let stock = Infinity;

  for (const it of items as Array<{ producto_id: string; cantidad: number; productos: { costo: number } | null }>) {
    const cant = Number(it.cantidad) || 0;
    if (cant <= 0) continue;

    const { data: movs } = await supabase
      .from('movimientos_stock')
      .select('tipo, cantidad')
      .eq('producto_id', it.producto_id);

    const compStock = stockComponente((movs || []) as Array<{ tipo: string; cantidad: number }>);

    const { data: ultimaCompra } = await supabase
      .from('historial_compras')
      .select('costo_unitario')
      .eq('producto_id', it.producto_id)
      .order('fecha', { ascending: false })
      .limit(1)
      .single();

    const costoUnit = ultimaCompra
      ? Number(ultimaCompra.costo_unitario)
      : Number(it.productos?.costo) || 0;

    componentes.push({ producto_id: it.producto_id, cantidad: cant, costo_unitario: costoUnit });
    costo += cant * costoUnit;
    stock = Math.min(stock, Math.floor(compStock / cant));
  }

  if (!componentes.length) return null;
  return { componentes, stock: Number.isFinite(stock) ? stock : 0, costo };
}
