/* Was der Bauschritt in das Paket stempelt - gemessen am Paket, nicht am
 * Vorsatz.
 *
 * Beide Stempel schuetzen davor, dass jemand Altes zu sehen bekommt: die
 * Kennung, damit ein lange offener Tab seine eigene Veraltung erkennt, und
 * der Cache-Buster an den Imports, damit der Browser nicht neues HTML mit
 * bis zu sieben Tage alten Modulen mischt. Beide wirken still, wenn sie
 * ausfallen - deshalb werden sie hier ausdruecklich nachgemessen. */
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from '../../tools/build.mjs';
import { ROOT, PUBLIC_DIR, listFiles } from '../../tools/paths.mjs';

/* Eigenes Verzeichnis, siehe paket.test.mjs. */
const ZIEL = await mkdtemp(path.join(tmpdir(), 'malzicare-stempel-'));
after(() => rm(ZIEL, { recursive: true, force: true }));

const version = await build({ quiet: true, ziel: ZIEL });
const paket = await listFiles(ZIEL);
const site = JSON.parse(await readFile(path.join(ROOT, 'site.json'), 'utf8'));

const seiten = paket.filter((f) => f.endsWith('.html'));
const module = paket.filter(
  (f) => f.startsWith('js/') && f.endsWith('.js') && !f.startsWith('js/vendor/')
);
const IMPORT = /(?:\bfrom|\bimport)\s+['"](\.{1,2}\/[^'"]+)['"]/g;

test('es gibt ueberhaupt Seiten und Module zu pruefen', () => {
  // Ohne diese Zusicherung liefe jede Schleife unten leer und meldete gruen.
  assert.ok(seiten.length >= 4, `nur ${seiten.length} Seite(n) im Paket`);
  assert.ok(module.length >= 10, `nur ${module.length} Modul(e) im Paket`);
});

test('jede Seite im Paket traegt die Kennung des Standes', async () => {
  for (const rel of seiten) {
    const html = await readFile(path.join(ZIEL, rel), 'utf8');
    assert.ok(
      html.includes(`<meta name="malzicare-stand" content="${version.commit_short}">`),
      `${rel} traegt die Kennung ${version.commit_short} nicht`
    );
  }
});

test('in der Quelle steht weiter der Platzhalter', async () => {
  /* Gestempelt wird im Paket. Stuende die Kennung schon in public/, muesste
     sie jemand von Hand nachziehen - und genau das geht schief. */
  for (const rel of seiten) {
    const html = await readFile(path.join(PUBLIC_DIR, rel), 'utf8');
    assert.ok(
      html.includes('<meta name="malzicare-stand" content="entwicklung">'),
      `${rel} in public/ ist bereits gestempelt`
    );
  }
});

test('kein Modul im Paket importiert ohne Cache-Buster', async () => {
  for (const rel of module) {
    const js = await readFile(path.join(ZIEL, rel), 'utf8');
    for (const m of js.matchAll(IMPORT)) {
      assert.match(m[1], new RegExp(`\\?v=${site.cache_buster}$`), `${rel}: ${m[1]}`);
    }
  }
});

test('jeder gestempelte Import zeigt auf eine Datei im Paket', async () => {
  let geprueft = 0;
  for (const rel of module) {
    const js = await readFile(path.join(ZIEL, rel), 'utf8');
    for (const m of js.matchAll(IMPORT)) {
      geprueft++;
      const ziel = path.posix.join(path.posix.dirname(rel), m[1].split('?')[0]);
      assert.ok(paket.includes(ziel), `${rel} importiert ${m[1]} - liegt nicht im Paket`);
    }
  }
  assert.ok(geprueft > 0, 'kein einziger Import gefunden - die Pruefung waere blind');
});

test('kein url() im CSS ohne Cache-Buster', async () => {
  /* Die Schriften haengen an genau diesen Verweisen. Sie standen bis zum
     28.08.2026 ohne Buster im CSS und wurden mit max-age=604800 geliefert -
     dieselbe Denkfigur wie bei den Imports, nur eine Ebene tiefer. */
  const css = paket.filter((f) => f.endsWith('.css'));
  assert.ok(css.length >= 3, `nur ${css.length} Stylesheet(s) im Paket`);
  let geprueft = 0;
  for (const rel of css) {
    const text = await readFile(path.join(ZIEL, rel), 'utf8');
    for (const m of text.matchAll(/url\((['"]?)((?!data:)[^'")]+)\1\)/g)) {
      geprueft++;
      assert.match(m[2], new RegExp(`\\?v=${site.cache_buster}$`), `${rel}: ${m[2]}`);
    }
  }
  assert.ok(geprueft > 0, 'kein einziges url() gefunden - die Pruefung waere blind');
});

test('eingebettete data:-Grafiken bleiben unberuehrt', async () => {
  const text = await readFile(path.join(ZIEL, 'css/poster.css'), 'utf8');
  assert.ok(text.includes('url("data:image/svg+xml,'), 'die eingebettete Grafik wurde veraendert');
  assert.ok(!/data:image\/svg\+xml[^"]*\?v=/.test(text), 'an eine data:-URL wurde gestempelt');
});

test('Fremdcode wird nicht angefasst', async () => {
  const fremd = paket.filter((f) => f.startsWith('js/vendor/'));
  assert.ok(fremd.length > 0, 'kein Fremdcode im Paket gefunden');
  for (const rel of fremd) {
    const imPaket = await readFile(path.join(ZIEL, rel));
    const inQuelle = await readFile(path.join(PUBLIC_DIR, rel));
    assert.ok(imPaket.equals(inQuelle), `${rel} wurde veraendert`);
  }
});
