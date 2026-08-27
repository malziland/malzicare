import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PUBLIC_DIR = path.join(ROOT, 'public');
export const DIST_DIR = path.join(ROOT, 'dist');

/** MIME-Typen fuer den lokalen Server. Bewusst klein gehalten: was hier fehlt,
 *  liegt auch nicht im Auslieferverzeichnis. */
export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/** Alle Dateien unterhalb von dir, relativ, mit Schraegstrich, sortiert.
 *  Dotfiles ausdruecklich eingeschlossen - das Fehlen der .htaccess war der
 *  Fehler vom 21.07.2026. */
export async function listFiles(dir) {
  const { readdir } = await import('node:fs/promises');
  const out = [];
  async function walk(rel) {
    const entries = await readdir(path.join(dir, rel), { withFileTypes: true });
    for (const entry of entries) {
      const child = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(child);
      else if (entry.isFile()) out.push(child);
    }
  }
  await walk('');
  return out.sort();
}
