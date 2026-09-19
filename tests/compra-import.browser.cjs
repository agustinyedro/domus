// Run with PLAYWRIGHT_MODULE pointing to the installed Playwright package.
// Admin HTML/scripts are exercised in a local harness; every admin API is mocked.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { zipSync, strToU8 } = require('fflate');
const base = process.env.TEST_BASE_URL || 'http://localhost:4321';
const catalog = [{ producto_id: '11111111-1111-4111-8111-111111111111', nombre: 'Vela cítrica', sku: '001', costo: 100 }];

function workbook() {
  const xml = '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>SKU</t></is></c><c r="B1" t="inlineStr"><is><t>Cantidad</t></is></c><c r="C1" t="inlineStr"><is><t>Costo unitario</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>001</t></is></c><c r="B2"><v>3</v></c><c r="C2"><v>150.25</v></c></row></sheetData></worksheet>';
  const files = {
    '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Compra" sheetId="1" r:id="rId1"/><sheet name="Otra hoja" sheetId="2" r:id="rId2"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': xml,
    'xl/worksheets/sheet2.xml': xml,
  };
  return Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)]))));
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let saved = [];
    let failSave = false;
    await page.route('**/api/admin/**', async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/admin/productos') return route.fulfill({ json: catalog });
      if (url.pathname === '/api/admin/categorias') return route.fulfill({ json: [] });
      if (url.pathname === '/api/admin/compras' && route.request().method() === 'POST') {
        if (failSave) return route.fulfill({ status: 400, json: { error: 'No se pudo guardar' } });
        saved.push(route.request().postDataJSON());
        return route.fulfill({ status: 201, json: { cantidad_items: 1, total: 2501 } });
      }
      return route.fulfill({ json: [] });
    });
    const source = fs.readFileSync('src/pages/admin/compras/index.astro', 'utf8');
    const layout = fs.readFileSync('src/layouts/AdminLayout.astro', 'utf8');
    const body = source.replace(/^---[\s\S]*?---/, '').replace(/<\/?AdminLayout[^>]*>/g, '').replace(/<script>[\s\S]*?<\/script>/g, '');
    const css = layout.match(/<style[\s\S]*?<\/style>/)?.[0] || '';
    await page.route('**/__test-compras', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">${css}</head><body style="padding:24px">${body}<script type="module" src="/src/pages/admin/compras/index.astro?astro&type=script&index=0&lang.ts"></script></body></html>` }));
    await page.goto(`${base}/__test-compras`);
    await page.waitForFunction(() => document.querySelector('.c-prod')?.options.length === 2);
    const csv = { name: 'compra.csv', mimeType: 'text/csv', buffer: Buffer.from('SKU;Cantidad;Costo unitario\r\n001;2;1250,50') };
    await page.locator('#c-file').setInputFiles(csv);
    await page.waitForFunction(() => document.querySelector('#c-import-status').textContent.includes('1 filas cargadas'));
    assert.equal(saved.length, 0, 'Reading a file must not save stock');
    assert.equal(await page.locator('.c-costo').inputValue(), '1250.5');
    assert.equal(await page.locator('.c-cant').inputValue(), '2');
    assert.match(await page.locator('#c-total').innerText(), /2\.501,00/);
    // Re-import must not silently double quantity.
    await page.locator('#c-file').setInputFiles(csv);
    await page.waitForFunction(() => !document.querySelector('#c-import-error').hidden);
    assert.match(await page.locator('#c-import-error').innerText(), /duplicarlas/);
    assert.equal(await page.locator('.c-row').count(), 1);
    failSave = true;
    await page.locator('#c-btn').click();
    await page.locator('#c-error').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.c-costo').inputValue(), '1250.5');
    failSave = false;
    await page.locator('#c-btn').click();
    await page.locator('#c-ok').waitFor({ state: 'visible' });
    assert.equal(saved.length, 1);
    assert.deepEqual(saved[0].items, [{ producto_id: catalog[0].producto_id, cantidad: 2, costo_unitario: 1250.5 }]);
    // Real zipped XLSX, including sheet selection and preservation of text SKU.
    await page.locator('#c-file').setInputFiles({ name: 'compra.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: workbook() });
    await page.locator('#c-sheet-box').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('#c-sheet').selectOption('Compra');
    await page.waitForFunction(() => document.querySelector('#c-import-status').textContent.includes('1 filas cargadas'));
    assert.equal(await page.locator('.c-cant').inputValue(), '3');
    assert.equal(await page.locator('.c-costo').inputValue(), '150.25');
    assert.equal(saved.length, 1);
    await page.locator('#c-file').setInputFiles({ name: 'error.csv', mimeType: 'text/csv', buffer: Buffer.from('SKU;Cantidad;Costo\nNO-EXISTE;1;10') });
    await page.waitForFunction(() => !document.querySelector('#c-import-error').hidden);
    assert.match(await page.locator('#c-import-error').innerText(), /Fila 2/);
    assert.equal(await page.locator('.c-cant').inputValue(), '3');
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#c-template').click();
    assert.equal((await downloadEvent).suggestedFilename(), 'plantilla-compra-domus.csv');
    assert.deepEqual(errors, []);
    console.log('Browser import OK: CSV, XLSX, sheets, duplicates, errors, template, totals and one-click save (mock API; no real purchases).');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
