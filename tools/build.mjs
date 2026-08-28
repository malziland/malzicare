/* Baut das Auslieferpaket dist/ aus public/.
 *
 * Drei Aufgaben, alle gegen denselben Fehler gerichtet: dass jemand etwas
 * anderes bekommt, als er bekommen soll.
 *   1. dist/ enthaelt public/ vollstaendig, Dotfiles eingeschlossen. Das wird
 *      nach dem Kopieren nachgemessen, nicht angenommen. Am 21.07.2026 fehlte
 *      die unsichtbare .htaccess im von Hand gepackten ZIP, und live war
 *      davon nichts zu sehen.
 *   2. Das Paket wird gestempelt - Naeheres bei stempeln().
 *   3. dist/version.json traegt die Kennung des Standes und die Pruefsumme
 *      jeder Datei. Damit kann nach der Auslieferung von aussen geprueft
 *      werden, was wirklich oben liegt.
 */
import { rm, mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, PUBLIC_DIR, DIST_DIR, listFiles } from './paths.mjs';

function git(...args) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

async function sha256(file) {
  return createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
}

/** Ein relativer Verweis auf ein eigenes Modul, noch ohne Cache-Buster. */
const IMPORT_OHNE_BUSTER = /(\bfrom\s+|\bimport\s+)(['"])(\.{1,2}\/[^'"?]+\.js)\2/g;

/* Dasselbe in CSS: Die Schriften haengen an url()-Verweisen, die keine
   Pruefung sah. Eingebettete data:-Grafiken bleiben aussen vor - sie haben
   keinen Namen, den ein Zwischenspeicher festhalten koennte. */
const CSS_URL_OHNE_BUSTER =
  /url\((['"]?)((?!data:|https?:|#)[^'")?]+?\.(?:woff2|woff|ttf|png|jpe?g|gif|svg|ico))\1\)/g;
const KENNUNG = /^[0-9a-f]{10}$/;

/** Eigener Modulcode im Paket - Fremdcode unter js/vendor/ bleibt unberuehrt. */
const eigenesModul = (rel) =>
  rel.startsWith('js/') && rel.endsWith('.js') && !rel.startsWith('js/vendor/');

/* Der Stempel, zweimal derselbe Gedanke.
 *
 * Jede Seite bekommt die Kennung des Standes. Daran erkennt der Stand-Waechter
 * im Browser, dass ein lange offener Tab veraltet ist (public/js/stand.js).
 *
 * Jeder Import auf ein eigenes Modul und jedes url() im CSS bekommt den
 * Cache-Buster. Ohne ihn holt
 * der Browser die Module bis zu sieben Tage aus dem Zwischenspeicher:
 * index.html fordert zwar js/app.js mit Buster an, aber dessen
 * `import './start.js'` traegt einen Namen, der sich nie aendert. Am
 * 28.08.2026 nachgemessen - alle zwoelf Module kamen live mit
 * max-age=604800. Ein wiederkehrender Browser bekaeme also neues HTML und
 * alte Module, eine Mischung, die so nie jemand getestet hat.
 *
 * Gestempelt wird im Paket, nicht in der Quelle. In public/ bliebe beides
 * eine Bitte, zwoelf Stellen von Hand mitzuziehen; hier ist es eine Tatsache.
 */
async function stempeln(kennung, buster, ziel) {
  if (!KENNUNG.test(kennung)) {
    throw new Error(
      `Ohne Kennung des Standes wird nicht gestempelt (bekommen: "${kennung}").\n` +
        'Ein Paket ohne Kennung sieht aus wie eines mit - der Waechter im Browser waere\n' +
        'still abgeschaltet. Ursache ist meist ein Verzeichnis ohne Git-Historie.'
    );
  }

  const dateien = await listFiles(ziel);

  for (const rel of dateien.filter((f) => f.endsWith('.html'))) {
    const datei = path.join(ziel, rel);
    const text = await readFile(datei, 'utf8');
    await writeFile(
      datei,
      text.replace(/(<meta name="malzicare-stand" content=")[^"]*(">)/, `$1${kennung}$2`)
    );
  }

  for (const rel of dateien.filter(eigenesModul)) {
    const datei = path.join(ziel, rel);
    const text = await readFile(datei, 'utf8');
    await writeFile(datei, text.replace(IMPORT_OHNE_BUSTER, `$1$2$3?v=${buster}$2`));
  }

  for (const rel of dateien.filter((f) => f.endsWith('.css'))) {
    const datei = path.join(ziel, rel);
    const text = await readFile(datei, 'utf8');
    await writeFile(datei, text.replace(CSS_URL_OHNE_BUSTER, `url($1$2?v=${buster}$1)`));
  }

  /* Gegenprobe am geschriebenen Paket, nicht am Vorsatz: Ein Stempel, der
     stillschweigend nicht greift, waere schlimmer als gar keiner - er sieht
     aus wie Schutz. Deshalb wird hier gelesen, was gerade geschrieben wurde. */
  const offen = [];
  for (const rel of dateien) {
    if (rel.endsWith('.html')) {
      const text = await readFile(path.join(ziel, rel), 'utf8');
      if (!text.includes(`<meta name="malzicare-stand" content="${kennung}">`)) {
        offen.push(`${rel}: traegt die Kennung des Standes nicht`);
      }
    }
    if (eigenesModul(rel)) {
      const text = await readFile(path.join(ziel, rel), 'utf8');
      const ohne = Array.from(text.matchAll(IMPORT_OHNE_BUSTER), (m) => m[3]);
      if (ohne.length > 0) offen.push(`${rel}: Import ohne Cache-Buster: ${ohne.join(', ')}`);
    }
    if (rel.endsWith('.css')) {
      const text = await readFile(path.join(ziel, rel), 'utf8');
      const ohne = Array.from(text.matchAll(CSS_URL_OHNE_BUSTER), (m) => m[2]);
      if (ohne.length > 0) offen.push(`${rel}: url() ohne Cache-Buster: ${ohne.join(', ')}`);
    }
  }
  if (offen.length > 0) {
    throw new Error(`Stempel unvollstaendig:\n  ${offen.join('\n  ')}`);
  }
}

/* `ziel` ist der Ausweg aus einer Falle, in die zwei Testdateien am
   28.08.2026 gemeinsam gelaufen sind: Beide riefen build() auf, node --test
   liess sie parallel laufen, und beide loeschten und beschrieben dasselbe
   dist/. Mal war die eine rot, mal die andere, mal keine - der schlimmste
   Zustand, weil ein gruener Lauf nichts mehr beweist. Wer baut, sagt jetzt,
   wohin. */
export async function build({ quiet = false, ziel = DIST_DIR } = {}) {
  const sources = await listFiles(PUBLIC_DIR);
  if (sources.length === 0) throw new Error('public/ ist leer - da stimmt etwas nicht.');

  await rm(ziel, { recursive: true, force: true });
  await mkdir(ziel, { recursive: true });
  await cp(PUBLIC_DIR, ziel, { recursive: true });

  // Nachmessen statt annehmen: jede Quelldatei muss im Paket liegen.
  const built = await listFiles(ziel);
  const fehlend = sources.filter((f) => !built.includes(f));
  if (fehlend.length > 0) {
    throw new Error(`Im Paket fehlen ${fehlend.length} Datei(en): ${fehlend.join(', ')}`);
  }

  /* Erst stempeln, dann messen. Der Stempel aendert Dateien, und ein Manifest,
     das vor ihm entsteht, beschreibt ein Paket, das es nicht mehr gibt. */
  const commit = git('rev-parse', 'HEAD');
  const commit_short = commit.slice(0, 10);
  const site = JSON.parse(await readFile(path.join(ROOT, 'site.json'), 'utf8'));
  await stempeln(commit_short, String(site.cache_buster), ziel);

  const files = {};
  for (const rel of sources) files[rel] = await sha256(path.join(ziel, rel));

  const dirty = git('status', '--porcelain') !== '';
  const version = {
    commit,
    commit_short,
    tag: git('describe', '--tags', '--exact-match') || null,
    dirty,
    built_at: new Date().toISOString(),
    file_count: sources.length,
    files,
  };
  await writeFile(path.join(ziel, 'version.json'), JSON.stringify(version, null, 2) + '\n');

  if (!quiet) {
    console.log(
      `Paket gebaut: ${path.relative(ROOT, ziel)}/  (${sources.length} Dateien + version.json)`
    );
    console.log(`Kennung: ${version.commit_short}${dirty ? ' (Arbeitsbaum veraendert)' : ''}`);
    console.log(
      `Gestempelt: Kennung in jede Seite, Cache-Buster ${site.cache_buster} an jeden Import und jedes url().`
    );
  }
  return version;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  build().catch((err) => {
    console.error('Build fehlgeschlagen:', err.message);
    process.exit(1);
  });
}
