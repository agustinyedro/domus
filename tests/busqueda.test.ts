import assert from 'node:assert/strict';
import { test } from 'node:test';
import { escapeHtml, palabrasBusqueda, resaltarCoincidencia } from '../src/lib/busqueda.ts';

test('parte multi-palabra en AND: "vela lavanda" son dos palabras', () => {
  assert.deepEqual(palabrasBusqueda('vela lavanda'), ['vela', 'lavanda']);
});

test('colapsa espacios y vacíos', () => {
  assert.deepEqual(palabrasBusqueda('  vela   noche  '), ['vela', 'noche']);
  assert.deepEqual(palabrasBusqueda(''), []);
  assert.deepEqual(palabrasBusqueda('   '), []);
});

test('elimina caracteres que rompen el or() de PostgREST', () => {
  assert.deepEqual(palabrasBusqueda('vela, (lavanda) "x10" %l_'), ['vela', 'lavanda', 'x10', 'l']);
});

test('limita cantidad y largo de palabras', () => {
  assert.equal(palabrasBusqueda('a b c d e f g h', 6).length, 6);
  assert.ok(palabrasBusqueda('x'.repeat(100))[0].length <= 40);
});

test('resalta coincidencias sin importar mayúsculas', () => {
  const html = resaltarCoincidencia('Velas de Noche Lavanda', ['vela', 'lavanda']);
  assert.match(html, /<mark>Velas?<\/mark>/);
  assert.match(html, /<mark>Lavanda<\/mark>/);
});

test('escapa HTML antes de resaltar (sin XSS)', () => {
  const html = resaltarCoincidencia('<img src=x onerror=alert(1)> Vela', ['vela']);
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
  assert.match(html, /<mark>Vela<\/mark>/);
});

test('sin palabras devuelve el nombre escapado', () => {
  assert.equal(resaltarCoincidencia('Vela <b>', []), 'Vela &lt;b&gt;');
  assert.equal(escapeHtml('a&b"c'), 'a&amp;b&quot;c');
});
