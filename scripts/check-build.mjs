import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const base = process.argv.find((arg) => arg.startsWith('--base='))?.slice(7) || '/';
assert(/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base), 'Neplatný prefix buildu.');
let checked = 0;
function checkUrl(url, file) {
  if (!url.startsWith('/') || url.startsWith('//') || url.includes('${')) return;
  assert(url.startsWith(base), `${file}: cesta mimo ${base}: ${url}`);
  const pathname = decodeURIComponent(new URL(url, 'https://build.invalid').pathname);
  const asset = pathname.slice(base.length) || 'index.html';
  assert(existsSync(resolve(output, asset)), `${file}: chybí ${url}`);
  checked++;
}
function checkJson(value, file) {
  if (typeof value === 'string' && value.startsWith(`${base}assets/`)) checkUrl(value, file);
  else if (Array.isArray(value)) value.forEach((item) => checkJson(item, file));
  else if (value && typeof value === 'object')
    Object.values(value).forEach((item) => checkJson(item, file));
}
async function inspect(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, item.name);
    if (item.isDirectory()) {
      await inspect(file);
      continue;
    }
    const type = extname(file);
    if (!['.html', '.css', '.js', '.json'].includes(type)) continue;
    const text = await readFile(file, 'utf8');
    const label = relative(output, file);
    if (base !== '/') {
      assert(
        !/(?:["'`]|\burl\(\s*)\/(?:assets|data|src)\//.test(text),
        `${label}: chybí prefix assetu`,
      );
      assert(
        !/["'`]\/(?:index|katalog|produkt|sluzby|doprava)\.html/.test(text),
        `${label}: chybí prefix stránky`,
      );
    }
    if (type === '.html') {
      for (const match of text.matchAll(/(?:src|href)=["'](\/[^"']*)["']/g))
        checkUrl(match[1], label);
    } else if (type === '.css') {
      for (const match of text.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g))
        checkUrl(match[1], label);
    } else if (type === '.json') {
      checkJson(JSON.parse(text), label);
    } else {
      // Includes the JSON fetch URLs and static links rendered by JavaScript.
      for (const match of text.matchAll(/["'`](\/[^"'`\r\n]*)["'`]/g)) {
        const path = match[1].slice(base.length);
        if (
          match[1].startsWith(base) &&
          (path === '' ||
            /^(assets|data|src)\//.test(path) ||
            /^(index|katalog|produkt|sluzby|doprava)\.html/.test(path))
        ) {
          checkUrl(match[1], label);
        }
      }
    }
  }
}
await inspect(output);
assert(checked > 0, 'Build neobsahuje kontrolované odkazy.');
console.log(`OK: ${checked} odkazů na stránky, styly, skripty, fonty a data v buildu ${base}.`);
