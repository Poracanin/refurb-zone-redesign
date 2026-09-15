import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const root = args.includes('--dist') ? resolve(project, 'dist') : project;
const portFlag = args.indexOf('--port');
const port = Number(portFlag >= 0 ? args[portFlag + 1] : process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Neplatný port.');
const pages = new Set([
  'index.html',
  'katalog.html',
  'produkt.html',
  'sluzby.html',
  'doprava.html',
  'administrace.html',
  'obchodni-podminky.html',
]);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end();
  }
  let relative;
  try {
    relative =
      decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/+/, '') ||
      'index.html';
  } catch {
    response.writeHead(400);
    return response.end('Neplatná cesta.');
  }
  if (
    relative.split('/').some((part) => part.startsWith('.')) ||
    !(pages.has(relative) || /^(assets|data|src)\//.test(relative))
  ) {
    response.writeHead(404);
    return response.end('Stránka nebyla nalezena.');
  }
  const file = resolve(root, relative);
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Content-Length': info.size,
    });
    if (request.method === 'HEAD') return response.end();
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404);
    response.end('Soubor nebyl nalezen.');
  }
});
server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Refurb.zone: http://127.0.0.1:${port}/`));
