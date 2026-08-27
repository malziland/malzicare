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
  // Seit der Zerlegung liegen die Downloads in mehreren Modulen. Gesucht wird
  // deshalb im ganzen Verzeichnis - ein Test, der nur eine Datei kennt,
  // uebersieht den naechsten Umbau.
  const { readdir } = await import('node:fs/promises');
  const verzeichnis = path.join(PUBLIC_DIR, 'js');
  const blobs = [];
  for (const datei of await readdir(verzeichnis)) {
    if (!datei.endsWith('.js')) continue;
    const quelle = await readFile(path.join(verzeichnis, datei), 'utf8');
    for (const m of quelle.matchAll(/new Blob\([\s\S]{0,300}?type: '([^']+)'/g)) {
      blobs.push({ datei, typ: m[1] });
    }
  }
  assert.ok(blobs.length >= 2, `zu wenige Blob-Erzeugungen gefunden (${blobs.length})`);
  for (const b of blobs) {
    assert.equal(b.typ, 'application/octet-stream', `falscher Typ in ${b.datei}`);
  }
});

test('der Einstieg meldet sich, wenn die Seite aus einem Ordner geoeffnet wird', async () => {
  // Als ES-Module laedt der Browser nichts von file:// - der Editor bliebe
  // stumm und leer. Ein Hinweis ist besser als eine tote Seite.
  // Der Hinweis steht im HTML, nicht im Modul: Bei file:// blockiert der
  // Browser das Modul selbst, ein Hinweis darin liefe nie.
  const html = await readFile(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
  assert.match(html, /location\.protocol === 'file:'/);
  assert.match(html, /malzi\.care/);
});

test('die Startseite laedt den Einstieg als Modul', async () => {
  const html = await readFile(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
  assert.match(html, /<script type="module" src="js\/app\.js\?v=\d+">/);
  // Die Fremdbibliotheken bleiben klassische Skripte: Sie setzen globale
  // Namen, auf die der PDF-Export zugreift.
  assert.match(html, /<script src="js\/vendor\/jspdf[^"]*"><\/script>/);
});

test('kein Modul ist groesser als 15 Kilobyte', async () => {
  // Der Grund fuer die Zerlegung: eine Datei mit 47 KB liest niemand.
  const { readdir, stat } = await import('node:fs/promises');
  const verzeichnis = path.join(PUBLIC_DIR, 'js');
  const gross = [];
  for (const datei of await readdir(verzeichnis)) {
    if (!datei.endsWith('.js')) continue;
    const info = await stat(path.join(verzeichnis, datei));
    if (info.size > 15 * 1024) gross.push(`${datei} (${Math.round(info.size / 1024)} KB)`);
  }
  assert.deepEqual(gross, [], `zu gross: ${gross.join(', ')}`);
});
