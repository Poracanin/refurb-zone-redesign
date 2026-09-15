import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
const baseArgument = process.argv.find((arg) => arg.startsWith('--base='));
const base = baseArgument ? baseArgument.slice(7) : '/';
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base))
  throw new Error('Base musí být např. / nebo /refurb-zone-redesign/.');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const item of [
  'index.html',
  'katalog.html',
  'produkt.html',
  'sluzby.html',
  'doprava.html',
  'administrace.html',
  'obchodni-podminky.html',
  'assets',
  'data',
  'src',
]) {
  await cp(resolve(root, item), resolve(output, item), { recursive: true });
}
async function applyBase(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, item.name);
    if (item.isDirectory()) {
      await applyBase(file);
      continue;
    }
    if (!['.html', '.js', '.css', '.json'].includes(extname(file))) continue;
    let text = await readFile(file, 'utf8');
    text = text.replace(/(["'`])\/(assets|data|src)\//g, `$1${base}$2/`);
    text = text.replace(
      /(["'`])\/(index|katalog|produkt|sluzby|doprava|administrace|obchodni-podminky)\.html/g,
      `$1${base}$2.html`,
    );
    // CSS fonts can use unquoted url(/assets/...), unlike HTML and JS strings.
    text = text.replace(/(\burl\(\s*)\/(assets|data|src)\//g, `$1${base}$2/`);
    text = text.replace(/href=(["'])\/\1/g, `href="${base}"`);
    await writeFile(file, text);
  }
}
if (base !== '/') await applyBase(output);
await writeFile(resolve(output, '.nojekyll'), '');
console.log(`Hotovo: dist/ (base ${base})`);
