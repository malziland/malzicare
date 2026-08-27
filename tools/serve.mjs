/* Lokaler Statikserver fuer Entwicklung und Tests.
   Liefert public/ aus - denselben Baum, der auch auf den Webspace geht. */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { PUBLIC_DIR, MIME } from './paths.mjs';

const port = Number(process.env.PORT || 8181);
const root = process.env.SERVE_DIR ? path.resolve(process.env.SERVE_DIR) : PUBLIC_DIR;

export function createServer(dir = root) {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let rel = decodeURIComponent(url.pathname);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.join(dir, rel);
      // Kein Ausbruch aus dem Auslieferverzeichnis.
      if (!file.startsWith(dir)) {
        res.writeHead(403).end('Verboten');
        return;
      }
      const info = await stat(file);
      if (!info.isFile()) throw new Error('kein File');
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': body.length,
      });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
    }
  });
}

// Direktaufruf: dauerhaft laufen lassen. Import: nur die Fabrik benutzen.
if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(port, () => {
    console.log(`Editor laeuft auf http://localhost:${port}/  (Verzeichnis: ${root})`);
  });
}
