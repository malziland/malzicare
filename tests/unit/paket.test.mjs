/* Das Auslieferpaket muss vollstaendig sein - besonders die Dateien, die man
 * nicht sieht. Am 21.07.2026 fehlte die .htaccess im von Hand gepackten ZIP;
 * live war davon nichts zu bemerken. */
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from '../../tools/build.mjs';
import { PUBLIC_DIR, listFiles, gehoertInsPaket, NIE_AUSLIEFERN } from '../../tools/paths.mjs';

/* In ein eigenes Verzeichnis, nicht nach dist/: node --test laesst die
   Testdateien parallel laufen, und zwei Laeufe in dasselbe Ziel loeschen
   einander die Dateien unter den Fuessen weg. */
const ZIEL = await mkdtemp(path.join(tmpdir(), 'malzicare-paket-'));
after(() => rm(ZIEL, { recursive: true, force: true }));

/* Eine Finder-Datei, wie sie am 30.09.2026 live in assets/ lag. Ohne sie waere
   der Test auf jedem Rechner gruen, auf dem der Finder den Ordner nie
   geoeffnet hat - also auch in der Pipeline. Eine vorhandene bleibt liegen. */
const FINDER = path.join(PUBLIC_DIR, 'assets', '.DS_Store');
const selbstAngelegt = await access(FINDER).then(
  () => false,
  async () => (await writeFile(FINDER, 'Testdatei aus paket.test.mjs'), true)
);

/* Aufgeraeumt wird im finally, nicht in after(): Bricht build() schon beim
   Laden ab, laufen keine after-Haken, und die Testdatei bliebe liegen. */
let version;
try {
  version = await build({ quiet: true, ziel: ZIEL });
} finally {
  if (selbstAngelegt) await rm(FINDER, { force: true });
}
const quellen = (await listFiles(PUBLIC_DIR)).filter(gehoertInsPaket);
const paket = await listFiles(ZIEL);

test('Finder-Dateien kommen nicht ins Paket', () => {
  const muell = paket.filter((f) => NIE_AUSLIEFERN.has(f.split('/').pop()));
  assert.deepEqual(muell, [], `Im Paket liegt: ${muell.join(', ')}`);
  assert.equal(version.files['assets/.DS_Store'], undefined, 'im Manifest vermerkt');
});

test('jede Datei aus public/ liegt im Paket', () => {
  const fehlend = quellen.filter((f) => !paket.includes(f));
  assert.deepEqual(fehlend, [], `Im Paket fehlen: ${fehlend.join(', ')}`);
});

test('das Paket enthaelt keine Datei, die nicht aus public/ stammt', () => {
  const fremd = paket.filter((f) => !quellen.includes(f) && f !== 'version.json');
  assert.deepEqual(fremd, [], `Unerwartet im Paket: ${fremd.join(', ')}`);
});

test('die unsichtbare .htaccess ist dabei', () => {
  assert.ok(paket.includes('.htaccess'), '.htaccess fehlt im Paket');
  assert.ok(version.files['.htaccess'], '.htaccess fehlt im Manifest version.json');
});

test('jede Pruefsumme im Manifest passt zur Datei im Paket', async () => {
  assert.equal(Object.keys(version.files).length, quellen.length);
  for (const [rel, soll] of Object.entries(version.files)) {
    const ist = createHash('sha256')
      .update(await readFile(path.join(ZIEL, rel)))
      .digest('hex');
    assert.equal(ist, soll, `Pruefsumme weicht ab: ${rel}`);
  }
});

test('das Paket traegt eine Kennung des Standes', () => {
  assert.match(version.commit, /^[0-9a-f]{40}$/, 'kein Commit im Manifest');
  assert.equal(version.commit_short.length, 10);
  assert.ok(Date.parse(version.built_at) > 0, 'kein brauchbarer Zeitstempel');
});
