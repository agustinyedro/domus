import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type PdfItem = {
  cantidad: number;
  nombre: string;
  variante?: string | null;
  precio_unitario: number;
};

type PdfComprobante = {
  id: string;
  fecha: string;
  total: number;
  titulo: string;
  datos: Array<[string, string]>;
  items: PdfItem[];
};

type ProductoPdf = {
  nombre?: string;
  variante?: string;
  nombre_opcion?: string;
  sku?: string;
  categoria?: string;
  stock_actual?: number;
  precio_efectivo?: number;
  precio_final?: number;
  precio_venta?: number;
  precio_oferta?: number | null;
  es_oferta?: boolean;
  recargo_tarjeta?: number;
};

const TIERRA: [number, number, number] = [96, 72, 17];
const OLIVA: [number, number, number] = [152, 140, 45];
const HUESO: [number, number, number] = [219, 209, 144];

const dinero = (value: number) => `$${Math.round(Number(value) || 0).toLocaleString('es-AR')}`;
const archivoSeguro = (value: string) => value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-');

function guardarPdf(doc: jsPDF, nombre: string) {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function descargarComprobantePdf(comprobante: PdfComprobante) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const corto = String(comprobante.id).slice(0, 8);

  doc.setTextColor(...TIERRA);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('D O M U S', 15, 18);
  doc.setFontSize(8);
  doc.setTextColor(110, 95, 66);
  doc.text('domus.com.ar', 15, 23);

  doc.setTextColor(...OLIVA);
  doc.setFontSize(10);
  doc.text(comprobante.titulo.toUpperCase(), 195, 15, { align: 'right' });
  doc.setTextColor(...TIERRA);
  doc.setFontSize(15);
  doc.text(`#${corto}`, 195, 21, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110, 95, 66);
  doc.text(new Date(comprobante.fecha).toLocaleString('es-AR'), 195, 26, { align: 'right' });
  doc.setDrawColor(...OLIVA);
  doc.setLineWidth(0.6);
  doc.line(15, 31, 195, 31);

  let y = 38;
  comprobante.datos.forEach(([label, value], index) => {
    const x = index % 2 === 0 ? 15 : 108;
    if (index > 0 && index % 2 === 0) y += 12;
    doc.setFontSize(7);
    doc.setTextColor(120, 105, 76);
    doc.text(label.toUpperCase(), x, y);
    doc.setFontSize(10);
    doc.setTextColor(...TIERRA);
    doc.setFont('helvetica', 'bold');
    doc.text(value || '—', x, y + 5);
    doc.setFont('helvetica', 'normal');
  });
  y += 12;

  autoTable(doc, {
    startY: y,
    head: [['Cant.', 'Detalle', 'P. unit.', 'Subtotal']],
    body: comprobante.items.map((item) => [
      String(item.cantidad),
      `${item.nombre}${item.variante && item.variante !== 'Única' ? ` · ${item.variante}` : ''}`,
      dinero(item.precio_unitario),
      dinero(item.precio_unitario * item.cantidad),
    ]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: TIERRA },
    headStyles: { fillColor: OLIVA, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { halign: 'center', cellWidth: 18 }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: 15, right: 15 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFillColor(...TIERRA);
  doc.roundedRect(15, finalY, 180, 14, 2, 2, 'F');
  doc.setTextColor(...HUESO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL', 21, finalY + 9);
  doc.text(dinero(comprobante.total), 189, finalY + 9, { align: 'right' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(110, 95, 66);
  doc.text('Gracias por tu compra · todo lo que hace de un lugar, hogar.', 105, finalY + 22, {
    align: 'center',
  });

  guardarPdf(doc, `${archivoSeguro(comprobante.titulo.toLowerCase())}-${corto}.pdf`);
}

export function descargarStockPdf(producto: ProductoPdf, movimientos: Array<any>) {
  const alto = Math.max(120, 86 + movimientos.length * 9);
  const doc = new jsPDF({ unit: 'mm', format: [80, alto] });
  const centro = 40;
  doc.setTextColor(...TIERRA);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('D O M U S', centro, 12, { align: 'center' });
  doc.setFontSize(9);
  doc.text('CONTROL DE STOCK', centro, 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(new Date().toLocaleString('es-AR'), centro, 24, { align: 'center' });
  doc.setDrawColor(...OLIVA);
  doc.line(6, 29, 74, 29);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(String(producto.nombre || ''), 6, 37, { maxWidth: 68 });
  doc.setFontSize(9);
  doc.text(`${producto.nombre_opcion || 'Opción'}: ${producto.variante || 'Única'}`, 6, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(`SKU: ${producto.sku || '—'}`, 6, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`STOCK: ${producto.stock_actual ?? 0} u.`, 6, 60);
  doc.setDrawColor(...OLIVA);
  doc.line(6, 65, 74, 65);
  doc.setFontSize(8);
  doc.text('Últimos movimientos', 6, 71);
  doc.setFont('helvetica', 'normal');
  let y = 77;
  if (!movimientos.length) doc.text('Sin movimientos.', 6, y);
  movimientos.forEach((mov) => {
    const signo = mov.tipo === 'VENTA' || mov.tipo === 'AJUSTE_NEGATIVO' ? '−' : '+';
    const fecha = new Date(mov.created_at).toLocaleDateString('es-AR');
    doc.text(`${fecha}  ${signo}${mov.cantidad}  ${mov.motivo || mov.tipo || ''}`, 6, y, { maxWidth: 68 });
    y += 9;
  });
  doc.setFont('helvetica', 'italic');
  doc.text('domus.com.ar', centro, alto - 8, { align: 'center' });
  guardarPdf(doc, `stock-${archivoSeguro(String(producto.nombre || 'producto'))}.pdf`);
}

export function descargarListaPreciosPdf(productos: ProductoPdf[], fecha: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setTextColor(...TIERRA);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('D O M U S · LISTA DE PRECIOS', 15, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110, 95, 66);
  doc.text(`Vigente al ${fecha}`, 15, 25);

  autoTable(doc, {
    startY: 32,
    head: [['Producto / opción', 'SKU', 'Categoría', 'Stock', 'Precio']],
    body: productos.map((p) => [
      `${p.nombre || ''}${p.variante && p.variante !== 'Única' ? ` · ${p.variante}` : ''}`,
      p.sku || '—',
      p.categoria || '—',
      String(p.stock_actual ?? 0),
      dinero(Number(p.precio_efectivo ?? p.precio_final ?? p.precio_venta ?? 0)),
    ]),
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, textColor: TIERRA },
    headStyles: { fillColor: OLIVA, textColor: [255, 255, 255] },
    columnStyles: { 3: { halign: 'right', cellWidth: 18 }, 4: { halign: 'right', cellWidth: 28 } },
    margin: { left: 15, right: 15 },
  });
  guardarPdf(doc, `domus-lista-precios-${new Date().toISOString().slice(0, 10)}.pdf`);
}
