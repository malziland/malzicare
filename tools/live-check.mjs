/* Misst, was wirklich auf dem Webspace liegt - nicht, was hochgeladen wurde.
 *
 * Drei Fragen, die ein Upload-Protokoll nicht beantwortet:
 *   1. Traegt die Seite den erwarteten Stand? (version.json)
 *   2. Ist jede Datei Byte fuer Byte die erwartete? (Pruefsummen)
 *   3. Wirkt die .htaccess? Sie selbst ist von aussen nicht abrufbar - aber
 *      ihre Wirkung ist messbar: HTML ohne Cache, Assets mit langem Cache.
 *      Genau diese Datei fehlte am 21.07.2026 im Paket, ohne dass es auffiel.
 *
 * Aufruf:
 *   node tools/live-check.mjs                 gegen ausgeliefert.json
 *   node tools/live-check.mjs --paket         gegen dist/version.json (nach dem Bauen)
 *   node tools/live-check.mjs --erwartet <commit>
 *   node tools/live-check.mjs --negativprobe
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { ROOT, DIST_DIR } from './paths.mjs';
import { ladeEnv } from './env.mjs';

const args = process.argv.slice(2);
const negativprobe = args.includes('--negativprobe');
const erwartetIdx = args.indexOf('--erwartet');
const erwartetCommit = erwartetIdx >= 0 ? args[erwartetIdx + 1] : null;

const env = { ...(await ladeEnv()), ...process.env };
const basis = (env.LIVE_BASE_URL || '').replace(/\/$/, '');
if (!basis) {
  console.error('LIVE_BASE_URL fehlt (.env oder Umgebung). Ohne Adresse keine Messung.');
  process.exit(2);
}

/* Wogegen gemessen wird - und das ist die ganze Frage.
 *
 * Bis zum 28.08.2026 war der Sollwert dist/version.json, also das zuletzt
 * GEBAUTE Paket. Damit beantwortete die Pruefung "entspricht live meinem
 * aktuellen Arbeitsstand?" statt "liegt oben noch, was ich hochgeladen habe?".
 * Der Unterschied faellt auf, seit der Bauschritt die Commit-Kennung in jede
 * Seite stempelt: Schon ein reiner Doku-Commit nach der Auslieferung machte
 * die Pruefung rot - fuenf Befunde, obwohl an der Seite nichts falsch war.
 * Eine Pruefung, die ohne Anlass rot ist, wird nach dem zweiten Mal ignoriert.
 *
 * Der Sollwert ist deshalb ausgeliefert.json: eine Kopie der version.json aus
 * dem Paket, das tools/deploy.mjs tatsaechlich uebertragen hat. Sie stammt aus
 * dem lokalen Bauvorgang, nicht vom Server - ein vom Server geholter Sollwert
 * waere im Kreis gemessen und koennte nie rot werden.
 */
const AUSGELIEFERT = path.join(ROOT, 'ausgeliefert.json');
const gegenPaket = args.includes('--paket');
let sollDatei = AUSGELIEFERT;
if (gegenPaket || !existsSync(AUSGELIEFERT)) sollDatei = path.join(DIST_DIR, 'version.json');
const lokal = JSON.parse(await readFile(sollDatei, 'utf8'));
const befunde = [];
let geprueft = 0;

/** Cache-Buster, damit nicht der Zwischenspeicher geprueft wird. */
function frisch(pfad) {
  const u = new URL(basis + '/' + pfad.replace(/^\//, ''));
  u.searchParams.set('_pruefung', String(lokal.commit_short));
  return u.toString();
}

async function hole(pfad) {
  const antwort = await fetch(frisch(pfad), { redirect: 'follow' });
  return antwort;
}

// ---- 1. Stand ----------------------------------------------------------
let liveVersion = null;
try {
  const a = await hole('version.json');
  if (!a.ok) befunde.push(`version.json nicht erreichbar (HTTP ${a.status})`);
  else liveVersion = await a.json();
} catch (e) {
  befunde.push(`version.json nicht abrufbar: ${e.message}`);
}

if (liveVersion) {
  const soll = negativprobe ? 'absichtlich-falscher-stand' : erwartetCommit || lokal.commit;
  if (liveVersion.commit !== soll) {
    befunde.push(
      `Stand weicht ab: live ${String(liveVersion.commit).slice(0, 10)}, erwartet ${String(soll).slice(0, 10)}`
    );
  }
}

// ---- 2. Pruefsummen ----------------------------------------------------
for (const [rel, soll] of Object.entries(lokal.files)) {
  // .htaccess wird von Apache nicht ausgeliefert - siehe Wirkungspruefung unten.
  if (rel.startsWith('.ht')) continue;
  geprueft++;
  try {
    const a = await hole(rel);
    if (!a.ok) {
      befunde.push(`${rel}: HTTP ${a.status}`);
      continue;
    }
    const ist = createHash('sha256')
      .update(Buffer.from(await a.arrayBuffer()))
      .digest('hex');
    if (ist !== soll) befunde.push(`${rel}: Inhalt weicht ab`);
  } catch (e) {
    befunde.push(`${rel}: ${e.message}`);
  }
}

// ---- 3. Wirkung der .htaccess -----------------------------------------
const wirkung = [
  ['index.html', /no-cache/, 'HTML muss bei jedem Aufruf neu geprueft werden'],
  ['css/editor.css', /max-age=604800/, 'Assets muessen lange gecacht werden duerfen'],
  ['version.json', /no-store/, 'die Standmeldung darf nie aus dem Zwischenspeicher kommen'],
];
for (const [pfad, muster, zweck] of wirkung) {
  try {
    const a = await hole(pfad);
    const kopf = a.headers.get('cache-control') || '';
    if (!muster.test(kopf)) {
      befunde.push(
        `.htaccess wirkt nicht bei ${pfad}: Cache-Control "${kopf || '(fehlt)'}" - ${zweck}`
      );
    }
  } catch (e) {
    befunde.push(`${pfad}: Kopfzeilen nicht messbar (${e.message})`);
  }
}

// ---- 4. Kann der Stand-Waechter live vergleichen? ----------------------
/* Der Waechter im Browser haelt die Kennung in der Seite gegen die in
   version.json. Weichen die beiden auf dem SERVER voneinander ab - etwa weil
   eine Auslieferung auf halbem Weg abgebrochen ist -, dann haelt sich jede
   ausgelieferte Seite fuer veraltet und laedt bei jeder Rueckkehr einmal
   vergeblich neu. Von aussen sieht man davon nichts; hier schon. */
if (liveVersion) {
  try {
    const a = await hole('index.html');
    const html = await a.text();
    const m = /<meta name="malzicare-stand" content="([^"]*)">/.exec(html);
    if (!m) {
      befunde.push('index.html traegt keine Kennung des Standes - der Waechter ist dort aus');
    } else if (m[1] !== liveVersion.commit_short) {
      befunde.push(
        `Kennung in index.html (${m[1]}) und in version.json ` +
          `(${liveVersion.commit_short}) weichen voneinander ab`
      );
    }
  } catch (e) {
    befunde.push(`Kennung in index.html nicht messbar: ${e.message}`);
  }
}

// ---- 5. Gegenprobe: eine Datei, die es nicht geben darf ----------------
try {
  const a = await hole('gibt-es-nicht-' + lokal.commit_short + '.html');
  if (a.ok)
    befunde.push(
      'Der Server liefert auch fuer nicht vorhandene Dateien HTTP 200 - die Messung waere blind.'
    );
} catch {
  // Netzwerkfehler hier ist unkritisch.
}

console.log(`Gemessen gegen ${basis}`);
console.log(`  Sollwert aus: ${path.relative(ROOT, sollDatei)}`);
console.log(`  Dateien geprueft: ${geprueft}`);
console.log(`  Stand live: ${liveVersion ? liveVersion.commit_short : '(nicht lesbar)'}`);
console.log(`  Stand erwartet: ${(erwartetCommit || lokal.commit).slice(0, 10)}`);

if (befunde.length > 0) {
  console.error(`\n${befunde.length} Befund(e):`);
  for (const b of befunde) console.error('  - ' + b);
  if (negativprobe) {
    console.log('\nNegativprobe bestanden: mit verfaelschtem Sollwert schlaegt die Pruefung fehl.');
    process.exit(0);
  }
  process.exit(1);
}
if (negativprobe) {
  console.error(
    '\nNegativprobe FEHLGESCHLAGEN: die Pruefung meldet gruen, obwohl der Sollwert falsch ist.'
  );
  process.exit(1);
}
console.log('\nLive-Stand stimmt mit dem Paket ueberein.');
