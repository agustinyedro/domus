import Papa from 'papaparse';

export const MAX_COMPRA_ROWS = 50;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export interface ImportProduct { id?: string; producto_id?: string; sku?: string; nombre: string }
export interface ImportItem { producto_id: string; cantidad: number; costo_unitario: number }
const normalize = (value: unknown) => String(value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ');
const header = (value: unknown) => normalize(value).replace(/[^a-z0-9]/g, '');
const aliases = {
  sku: ['sku', 'codigo', 'codigoproducto', 'cod'],
  producto_id: ['productoid', 'idproducto'],
  nombre: ['producto', 'nombre', 'nombreproducto', 'descripcion'],
  cantidad: ['cantidad', 'cant', 'unidades'],
  costo: ['costounitario', 'costou', 'costo', 'preciocompra', 'preciounitario'],
};

/** Accept explicit Argentine and decimal-point prices, never coerce empty cells to zero. */
export function parseImportNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  let text = value.trim().replace(/^(?:ARS\s*\$?|\$)\s*/i, '').replace(/[\s\u00a0]/g, '');
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(text)) text = text.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(text)) text = text.replace(/,/g, '');
  else if (/^\d+(,\d{1,2})?$/.test(text)) text = text.replace(',', '.');
  else if (!/^\d+(\.\d{1,2})?$/.test(text)) return NaN;
  return Number(text);
}

export function parseCompraCsv(text: string): unknown[][] {
  text = text.replace(/^\uFEFF/, '');
  const separator = /^sep=([;,\t])\r?\n/i.exec(text);
  if (separator) text = text.slice(separator[0].length);
  const result = Papa.parse<string[]>(text, {
    delimiter: separator?.[1] || '',
    skipEmptyLines: false,
    dynamicTyping: false,
  });
  if (result.errors.length) throw new Error('No pudimos leer el CSV. Revisá los separadores y las comillas, o usá la plantilla.');
  return result.data;
}

export function prepareCompraImport(rows: unknown[][], products: ImportProduct[]): ImportItem[] {
  const first = rows.findIndex(row => row.some(cell => String(cell ?? '').trim()));
  if (first < 0) throw new Error('El archivo está vacío.');
  const headings = rows[first].map(header);
  const columns = Object.fromEntries(Object.entries(aliases).map(([key, names]) => {
    const indices = headings.flatMap((name, index) => names.includes(name) ? [index] : []);
    if (indices.length > 1) throw new Error(`Hay más de una columna para ${key}. Dejá una sola.`);
    return [key, indices[0] ?? -1];
  })) as Record<keyof typeof aliases, number>;
  if (columns.cantidad < 0 || columns.costo < 0 || [columns.sku, columns.producto_id, columns.nombre].every(n => n < 0)) {
    throw new Error('Faltan columnas: usá SKU (o Producto), Cantidad y Costo unitario. Podés descargar la plantilla.');
  }
  const data = rows.slice(first + 1).map((row, index) => ({ row, line: first + index + 2 }))
    .filter(({ row }) => row.some(cell => String(cell ?? '').trim()));
  if (!data.length) throw new Error('El archivo tiene encabezados, pero no tiene productos.');
  if (data.length > MAX_COMPRA_ROWS) throw new Error(`Máximo ${MAX_COMPRA_ROWS} filas por compra.`);
  const errors: string[] = [];
  const seen = new Set<string>();
  const items: ImportItem[] = [];
  for (const { row, line } of data) {
    const problem = (message: string) => errors.push(`Fila ${line}: ${message}`);
    const identifiers = (['producto_id', 'sku', 'nombre'] as const).filter(key => columns[key] >= 0 && normalize(row[columns[key]]));
    if (!identifiers.length) { problem('falta SKU o nombre del producto.'); continue; }
    const matches = products.filter(product => identifiers.every(key => {
      const value = key === 'producto_id' ? product.producto_id || product.id : product[key];
      return normalize(value) === normalize(row[columns[key]]);
    }));
    if (matches.length !== 1) {
      problem(matches.length ? 'hay varios productos con ese nombre; usá el SKU.' : `no se encontró el producto «${String(row[columns[identifiers[0]]])}». Crealo o corregí su SKU/nombre y volvé a importar.`);
      continue;
    }
    const id = matches[0].producto_id || matches[0].id!;
    const cantidad = parseImportNumber(row[columns.cantidad]);
    const costo_unitario = parseImportNumber(row[columns.costo]);
    if (!Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > 2147483647) { problem('la cantidad debe ser un entero mayor que cero.'); continue; }
    if (!Number.isFinite(costo_unitario) || costo_unitario < 0 || Math.abs(costo_unitario * 100 - Math.round(costo_unitario * 100)) > 0.0001 || cantidad * costo_unitario > 9999999999.99) {
      problem('el costo debe ser un número válido, no negativo, con hasta dos decimales y total menor a $10.000.000.000.'); continue;
    }
    if (seen.has(id)) { problem('el producto está repetido; unificá sus cantidades en una sola fila.'); continue; }
    seen.add(id);
    items.push({ producto_id: id, cantidad, costo_unitario });
  }
  if (errors.length) throw new Error(errors.slice(0, 20).join('\n') + (errors.length > 20 ? `\nY ${errors.length - 20} errores más.` : ''));
  return items;
}

export async function readCompraFile(file: File, sheet?: string): Promise<{ sheets: string[]; rows: unknown[][] }> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error('El archivo supera el máximo de 5 MB.');
  if (/\.csv$/i.test(file.name)) {
    const bytes = await file.arrayBuffer();
    let text: string;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { text = new TextDecoder('windows-1252').decode(bytes); }
    return { sheets: [], rows: parseCompraCsv(text) };
  }
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Elegí un archivo .xlsx o .csv. Si es .xls, guardalo como .xlsx desde Excel.');
  const { default: readExcelFile } = await import('read-excel-file/browser');
  const workbook = await readExcelFile(file);
  const sheets = workbook.map(entry => entry.sheet);
  if (sheets.length > 1 && !sheet) return { sheets, rows: [] };
  const selected = sheet ? workbook.find(entry => entry.sheet === sheet) : workbook[0];
  if (!selected) throw new Error('No se encontró una hoja para importar.');
  return { sheets, rows: selected.data };
}
