/* Liefert dist/ auf den IONOS-Webspace aus - in der Reihenfolge
 * Riegel, Auslieferung, Beweis.
 *
 * Der Handgriff, den das ersetzt: ZIP packen, im IONOS-Dateimanager
 * hochladen und entpacken. Dabei ist am 21.07.2026 die unsichtbare
 * .htaccess verlorengegangen, und niemand konnte es sehen.
 *
 * Aufruf:
 *   node tools/deploy.mjs            Riegel, Upload, Live-Pruefung
 *   node tools/deploy.mjs --probe    Trockenlauf ohne Verbindung
 *   node tools/deploy.mjs --eilig    ohne Oberflaechentests (wird gemeldet)
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, DIST_DIR, listFiles } from './paths.mjs';
import { pflichtwerte } from './env.mjs';
import { build } from './build.mjs';

const args = process.argv.slice(2);
const probe = args.includes('--probe');
const eilig = args.includes('--eilig');

function schritt(text) {
  console.log(`\n=== ${text} ===`);
}

// ---- Riegel 1: Arbeitsbaum ---------------------------------------------
schritt('Riegel');
const unsauber = execFileSync('git', ['status', '--porcelain'], {
  cwd: ROOT,
  encoding: 'utf8',
}).trim();
if (unsauber) {
  console.error('Der Arbeitsbaum ist veraendert. Ausgeliefert wird nur ein festgehaltener Stand,');
  console.error('sonst laesst sich spaeter nicht sagen, was oben liegt:');
  console.error(unsauber.split('\n').slice(0, 10).join('\n'));
  process.exit(1);
}

// ---- Riegel 2: Pruefkette ----------------------------------------------
try {
  execFileSync(process.execPath, ['tools/pruefkette.mjs', ...(eilig ? ['--schnell'] : [])], {
    cwd: ROOT,
    stdio: 'inherit',
  });
} catch {
  if (!eilig) {
    console.error('\nPruefkette rot - es wird nicht ausgeliefert.');
    process.exit(1);
  }
  console.error('\nACHTUNG: --eilig, die Oberflaechentests sind NICHT gelaufen.');
}

// ---- Paket bauen --------------------------------------------------------
schritt('Paket');
const version = await build({ quiet: true });
const dateien = await listFiles(DIST_DIR);
console.log(`${dateien.length} Dateien, Kennung ${version.commit_short}`);
const dotfiles = dateien.filter((f) => f.split('/').pop().startsWith('.'));
console.log(`darunter ${dotfiles.length} unsichtbare: ${dotfiles.join(', ') || '(keine)'}`);
if (!dateien.includes('.htaccess')) {
  console.error('Die .htaccess fehlt im Paket. Abbruch.');
  process.exit(1);
}

// ---- Zugangsdaten -------------------------------------------------------
schritt('Zugangsdaten');
const env = await pflichtwerte([
  'FTP_HOST',
  'FTP_USER',
  'FTP_PASSWORD',
  'FTP_REMOTE_DIR',
  'LIVE_BASE_URL',
]);
console.log(
  `Server ${env.FTP_HOST}, Verzeichnis ${env.FTP_REMOTE_DIR}, Nutzer ${env.FTP_USER.slice(0, 3)}***`
);

if (probe) {
  console.log('\nTrockenlauf (--probe): keine Verbindung aufgebaut, nichts uebertragen.');
  console.log('Alles, was ohne Server pruefbar ist, ist geprueft.');
  process.exit(0);
}

// ---- Auslieferung -------------------------------------------------------
schritt('Auslieferung');
const { Client } = await import('basic-ftp');
const client = new Client(30_000);
client.ftp.verbose = false;
try {
  await client.access({
    host: env.FTP_HOST,
    user: env.FTP_USER,
    password: env.FTP_PASSWORD,
    secure: String(process.env.FTP_SECURE ?? 'true') !== 'false',
    secureOptions: { rejectUnauthorized: true },
  });
  await client.ensureDir(env.FTP_REMOTE_DIR);
  await client.clearWorkingDir();
  await client.uploadFromDir(DIST_DIR);
  const oben = await client.list();
  console.log(`Uebertragen. Im Zielverzeichnis liegen ${oben.length} Eintraege.`);
} catch (e) {
  console.error(`Auslieferung fehlgeschlagen: ${e.message}`);
  process.exit(1);
} finally {
  client.close();
}

// ---- Beweis -------------------------------------------------------------
schritt('Beweis');
try {
  execFileSync(process.execPath, [path.join(ROOT, 'tools', 'live-check.mjs')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
} catch {
  console.error('\nDie Live-Pruefung ist rot. Der Stand oben stimmt nicht mit dem Paket ueberein.');
  console.error('Rueckweg steht in docs/RUNBOOK.md.');
  process.exit(1);
}
console.log('\nAusgeliefert und nachgemessen.');
