import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const port = Number(process.env.PORT || 3400);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('PORT must be a valid port number.');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    const requested = pathname === '/' ? '/index.html' : pathname;
    const allowed =
      requested === '/index.html' || /^\/(?:js|css|assets)\//.test(requested);
    const file = path.resolve(root, '.' + requested);
    if (
      !allowed ||
      !file.startsWith(root + path.sep) ||
      !types[path.extname(file)]
    ) {
      response.writeHead(404).end('Not found');
      return;
    }
    const content = await readFile(file);
    response.writeHead(200, {
      'Content-Type': `${types[path.extname(file)]}; charset=utf-8`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => {
  console.info(`Product Manager: http://127.0.0.1:${port}`);
});
