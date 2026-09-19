// src/lib/calculations.ts
// Cálculos de negocio: margen, ganancia, stock

export function calcularMargen(precio: number, costo: number): number {
  if (precio === 0) return 0;
  return ((precio - costo) / precio) * 100;
}

export function calcularGananciaUnitaria(precio: number, costo: number): number {
  return precio - costo;
}

export function calcularGananciaTotal(precio: number, costo: number, cantidad: number): number {
  return (precio - costo) * cantidad;
}

export function calcularCostoTotal(costoUnitario: number, cantidad: number): number {
  return costoUnitario * cantidad;
}

export function calcularSubtotal(precioUnitario: number, cantidad: number): number {
  return precioUnitario * cantidad;
}

export function calcularCostoKit(items: Array<{ cantidad: number; costo: number }>): number {
  return items.reduce((sum, item) => sum + item.cantidad * item.costo, 0);
}

export function calcularStockActual(movimientos: Array<{ tipo: string; cantidad: number }>): number {
  return movimientos.reduce((stock, m) => {
    switch (m.tipo) {
      case 'ENTRADA':
      case 'AJUSTE_POSITIVO':
        return stock + m.cantidad;
      case 'VENTA':
      case 'AJUSTE_NEGATIVO':
        return stock - m.cantidad;
      default:
        return stock;
    }
  }, 0);
}

export function stockBajo(stockActual: number, stockMinimo: number): boolean {
  return stockActual < stockMinimo;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}
