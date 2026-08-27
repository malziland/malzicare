/* Baut das Auslieferpaket dist/ aus public/.
 *
 * Zwei Aufgaben, beide gegen denselben Fehler gerichtet: Am 21.07.2026 fehlte
 * die unsichtbare .htaccess im von Hand gepackten ZIP, live war der Fehler
 * nicht zu sehen.
 *   1. dist/ enthaelt public/ vollstaendig, Dotfiles eingeschlossen. Das wird
 *      nach dem Kopieren nachgemessen, nicht angenommen.
 *   2. dist/version.json traegt die Kennung des Standes und die Pruefsumme
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

export async function build({ quiet = false } = {}) {
  const sources = await listFiles(PUBLIC_DIR);
  if (sources.length === 0) throw new Error('public/ ist leer - da stimmt etwas nicht.');

  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });
  await cp(PUBLIC_DIR, DIST_DIR, { recursive: true });

  // Nachmessen statt annehmen: jede Quelldatei muss im Paket liegen.
  const built = await listFiles(DIST_DIR);
  const fehlend = sources.filter((f) => !built.includes(f));
  if (fehlend.length > 0) {
    throw new Error(`Im Paket fehlen ${fehlend.length} Datei(en): ${fehlend.join(', ')}`);
  }

  const files = {};
  for (const rel of sources) files[rel] = await sha256(path.join(DIST_DIR, rel));

  const commit = git('rev-parse', 'HEAD');
  const dirty = git('status', '--porcelain') !== '';
  const version = {
    commit,
    commit_short: commit.slice(0, 10),
    tag: git('describe', '--tags', '--exact-match') || null,
    dirty,
    built_at: new Date().toISOString(),
    file_count: sources.length,
    files,
  };
  await writeFile(path.join(DIST_DIR, 'version.json'), JSON.stringify(version, null, 2) + '\n');

  if (!quiet) {
    console.log(`Paket gebaut: dist/  (${sources.length} Dateien + version.json)`);
    console.log(`Kennung: ${version.commit_short}${dirty ? ' (Arbeitsbaum veraendert)' : ''}`);
  }
  return version;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  build().catch((err) => {
    console.error('Build fehlgeschlagen:', err.message);
    process.exit(1);
  });
}
