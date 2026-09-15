import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { jsPDF } from 'jspdf';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { create } = require('../src/js/withdrawal-document.js');
const terms = JSON.parse(await readFile(resolve(root, 'data/terms.json'), 'utf8'));
const [regular, bold] = await Promise.all(
  ['regular', 'bold'].map(async (weight) =>
    (await readFile(resolve(root, `assets/fonts/noto-sans-${weight}-pdf.ttf`))).toString('base64'),
  ),
);
const directory = resolve(root, 'assets/documents');
await mkdir(directory, { recursive: true });
const pdf = create(jsPDF, { regular, bold }, terms.company);
await writeFile(resolve(directory, 'odstoupeni-vzor.pdf'), Buffer.from(pdf.output('arraybuffer')));
console.log('Hotovo: assets/documents/odstoupeni-vzor.pdf');
