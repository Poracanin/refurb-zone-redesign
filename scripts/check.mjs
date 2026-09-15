import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const json = async (name) => JSON.parse(await readFile(resolve(root, `data/${name}.json`), 'utf8'));
const products = await json('products');
const ids = new Set(products.map((product) => product.id));
assert.equal(ids.size, products.length, 'Duplicitní ID produktu.');
const variantIds = new Set();
for (const product of products) {
  assert(product.id && product.name && product.variants.length, 'Neúplný produkt.');
  assert(Number.isFinite(product.price) && product.price >= 0, 'Neplatná cena.');
  for (const variant of product.variants) {
    assert(!variantIds.has(variant.id), `Duplicitní varianta ${variant.id}`);
    variantIds.add(variant.id);
  }
}
for (const source of ['groups', 'brands', 'devices']) {
  for (const entry of await json(source))
    assert(
      entry.product_ids.every((id) => ids.has(id)),
      `Neplatná vazba v ${source}.`,
    );
}
function checkAssetReferences(value) {
  if (typeof value === 'string' && value.startsWith('/assets/'))
    assert(existsSync(resolve(root, '.' + value)), `Chybí ${value}`);
  if (Array.isArray(value)) value.forEach(checkAssetReferences);
  else if (value && typeof value === 'object') Object.values(value).forEach(checkAssetReferences);
}
for (const file of await readdir(resolve(root, 'data')))
  checkAssetReferences(JSON.parse(await readFile(resolve(root, 'data', file), 'utf8')));
for (const file of [
  'index.html',
  'katalog.html',
  'produkt.html',
  'sluzby.html',
  'doprava.html',
  'administrace.html',
  'obchodni-podminky.html',
]) {
  const html = await readFile(resolve(root, file), 'utf8');
  if (file !== 'administrace.html') {
    assert(html.includes('data-repository.js'), `Chybí datová vrstva v ${file}.`);
    assert(html.includes('shipping-countdown.js'), `Chybí odpočet expedice v ${file}.`);
  }
  for (const script of [
    'operations-core.js',
    'operations-store.js',
    file === 'administrace.html' ? 'admin.js' : 'service-shop.js',
  ])
    assert(html.includes(script), `Chybí ${script} v ${file}.`);
  for (const match of html.matchAll(/(?:src|href)=["'](\/[^"'#?]+)["'?]/g))
    assert(existsSync(resolve(root, '.' + match[1])), `${file}: chybí ${match[1]}`);
}
for (const directory of ['src/js', 'scripts'])
  for (const file of await readdir(resolve(root, directory))) {
    if (!/\.m?js$/.test(file)) continue;
    const result = spawnSync(process.execPath, ['--check', resolve(root, directory, file)], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
  }
console.log(
  `OK: ${products.length} produktů, ${variantIds.size} variant, JSON vazby, stránky, assety a syntaxe JavaScriptu.`,
);
