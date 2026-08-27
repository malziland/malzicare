/* Regeln, die erst auf dem Webspace wirken, aber hier schon pruefbar sind. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PUBLIC_DIR } from '../../tools/paths.mjs';

const htaccess = await readFile(path.join(PUBLIC_DIR, '.htaccess'), 'utf8');

test('HTML wird bei jedem Aufruf neu geprueft', () => {
  assert.match(htaccess, /FilesMatch\s+"\\\.\(html\)\$"/);
  assert.match(htaccess, /Cache-Control\s+"no-cache"/);
});

test('Assets duerfen lange gecacht werden - deshalb der Cache-Buster', () => {
  assert.match(htaccess, /max-age=604800/);
  for (const typ of ['css', 'js', 'png', 'woff2']) {
    assert.ok(htaccess.includes(typ), `Dateityp ${typ} fehlt in der Cache-Regel`);
  }
});

test('jeder Download bekommt einen neutralen Binaertyp', async () => {
  // iPhone-Safari zeigt Typen an, die es kennt, statt sie zu laden. Ein
  // Blob mit application/pdf oder application/json bricht den Download auf
  // dem Geraet, auf dem der Editor am haeufigsten benutzt wird.
  const app = await readFile(path.join(PUBLIC_DIR, 'js', 'app.js'), 'utf8');
  const blobs = [...app.matchAll(/new Blob\([\s\S]{0,300}?type: '([^']+)'/g)].map((m) => m[1]);
  assert.ok(blobs.length >= 2, `zu wenige Blob-Erzeugungen gefunden (${blobs.length})`);
  for (const typ of blobs) assert.equal(typ, 'application/octet-stream');
});
