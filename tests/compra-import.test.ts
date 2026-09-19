import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareCompraImport, parseCompraCsv, parseImportNumber, readCompraFile } from '../src/lib/compra-import.ts';

const catalog = [
  { producto_id: 'p1', sku: '001', nombre: 'Vela cítrica' },
  { producto_id: 'p2', sku: 'SAH-2', nombre: 'Sahumerio, sándalo' },
];
test('CSV de Excel con BOM, punto y coma, decimales argentinos y SKU con ceros', () => {
  const rows = parseCompraCsv('\uFEFFSKU;Cantidad;Costo unitario\r\n001;2;"$1.234,50"\r\nSAH-2;3;0\r\n');
  assert.deepEqual(prepareCompraImport(rows, catalog), [
    { producto_id: 'p1', cantidad: 2, costo_unitario: 1234.5 },
    { producto_id: 'p2', cantidad: 3, costo_unitario: 0 },
  ]);
});
test('CSV con comas, nombres entre comillas, acentos y saltos internos', () => {
  assert.equal(prepareCompraImport(parseCompraCsv('Producto,Cantidad,Costo\n"Sahumerio, sándalo",4,20.50'), catalog)[0].producto_id, 'p2');
  assert.equal(prepareCompraImport(parseCompraCsv('Producto;Cantidad;Costo\n"Vela\ncítrica";1;20'), catalog)[0].producto_id, 'p1');
});
test('identificadores no se mezclan: SKU incorrecto no cae al nombre', () => {
  assert.throws(() => prepareCompraImport([['SKU', 'Producto', 'Cantidad', 'Costo'], ['NO', 'Vela cítrica', 1, 20]], catalog), /no se encontró/);
});
test('rechaza cantidades fraccionarias, costos vacíos y valores no numéricos', () => {
  for (const [cantidad, costo] of [[1.5, 10], [0, 10], [1, ''], [1, -2], [1, Infinity], [1, true], [1, '=1+1'], [1, 1.234], [1, '1e3']]) {
    assert.throws(() => prepareCompraImport([['SKU', 'Cantidad', 'Costo'], ['001', cantidad, costo]], catalog), /Fila 2/);
  }
});
test('rechaza duplicados, nombres ambiguos y filas inválidas sin resultado parcial', () => {
  assert.throws(() => prepareCompraImport([['SKU', 'Cantidad', 'Costo'], ['001', 1, 10], ['001', 2, 10]], catalog), /repetido/);
  assert.throws(() => prepareCompraImport([['Producto', 'Cantidad', 'Costo'], ['Vela cítrica', 1, 10]], [...catalog, { id: 'p3', sku: '003', nombre: 'Vela cítrica' }]), /varios productos/);
  assert.throws(() => prepareCompraImport([['SKU', 'Cantidad', 'Costo'], ['001', 1, 10], ['NO', 1, 10]], catalog), /Fila 3/);
});
test('valida encabezados, celdas vacías, límites y CSV mal formado', () => {
  assert.throws(() => prepareCompraImport([], catalog), /vacío/);
  assert.throws(() => prepareCompraImport([['SKU', 'Cantidad', 'Total']], catalog), /Faltan columnas/);
  assert.throws(() => prepareCompraImport([['SKU', 'Cantidad', 'Costo', 'Costo unitario']], catalog), /más de una/);
  assert.throws(() => prepareCompraImport([['SKU', 'Cantidad', 'Costo'], ...Array.from({ length: 51 }, () => ['001', 1, 2])], catalog), /50/);
  assert.throws(() => parseCompraCsv('SKU,Cantidad,Costo\n"001,1,2'), /comillas/);
});
test('interpreta precios explícitos y respeta sep= de Excel', () => {
  for (const value of ['1.250,50', '1250,50', '1250.50', '1,250.50']) assert.equal(parseImportNumber(value), 1250.5);
  assert.equal(prepareCompraImport(parseCompraCsv('sep=;\r\nSKU;Cantidad;Costo\r\n001;1;0'), catalog)[0].costo_unitario, 0);
});
test('valida tamaño, extensión y lectura CSV real con File', async () => {
  await assert.rejects(readCompraFile(new File(['x'], 'compra.xls')), /xlsx/);
  await assert.rejects(readCompraFile(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'compra.csv')), /5 MB/);
  const file = new File(['SKU;Cantidad;Costo\n001;1;25'], 'compra.csv');
  assert.equal(prepareCompraImport((await readCompraFile(file)).rows, catalog)[0].costo_unitario, 25);
});
