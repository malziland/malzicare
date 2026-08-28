/* Liefert dist/ auf den IONOS-Webspace aus - in der Reihenfolge
 * Riegel, Auslieferung, Beweis.
 *
 * Uebertragen wird per SFTP. Gemessen am 27.08.2026: Der Server beherrscht
 * kein FTPS ("500 'AUTH': command unrecognized"), Port 21 waere also Klartext.
 * Port 22 nimmt dieselben Zugangsdaten verschluesselt entgegen.
 *
 * Der Handgriff, den das ersetzt: ZIP packen, im IONOS-Dateimanager hochladen
 * und entpacken. Dabei ist am 21.07.2026 die unsichtbare .htaccess
 * verlorengegangen - unbemerkt, bis diese Kette sie am 27.08. vermisste.
 *
 * Aufruf:
 *   node tools/deploy.mjs               Riegel, Upload, Live-Pruefung
 *   node tools/deploy.mjs --probe       Trockenlauf ohne Verbindung
 *   node tools/deploy.mjs --verbindung  nur anmelden und lesen, nichts aendern
 *   node tools/deploy.mjs --aufraeumen  entfernt oben auch Dateien, die nicht
 *                                       ins Paket gehoeren (sonst nur Meldung)
 *   node tools/deploy.mjs --eilig       ohne Oberflaechentests (wird gemeldet)
 */
import { execFileSync } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, DIST_DIR, listFiles } from './paths.mjs';
import { pflichtwerte } from './env.mjs';
import { build } from './build.mjs';

const args = process.argv.slice(2);
const probe = args.includes('--probe');
const nurVerbindung = args.includes('--verbindung');
const aufraeumen = args.includes('--aufraeumen');
const eilig = args.includes('--eilig');

function schritt(text) {
  console.log(`\n=== ${text} ===`);
}

/** Zugangsdaten. SFTP_* ist der richtige Name; FTP_* bleibt als Ruecksicht auf
 *  bestehende .env-Dateien gueltig. */
async function zugang() {
  const namen = ['SFTP_HOST', 'SFTP_USER', 'SFTP_PASSWORD', 'SFTP_REMOTE_DIR', 'LIVE_BASE_URL'];
  const alt = {
    SFTP_HOST: 'FTP_HOST',
    SFTP_USER: 'FTP_USER',
    SFTP_PASSWORD: 'FTP_PASSWORD',
    SFTP_REMOTE_DIR: 'FTP_REMOTE_DIR',
  };
  const { ladeEnv } = await import('./env.mjs');
  const env = { ...(await ladeEnv()), ...process.env };
  const fehlend = namen.filter((n) => !env[n] && !env[alt[n]]);
  if (fehlend.length > 0) return pflichtwerte(namen); // meldet und beendet
  const out = {};
  for (const n of namen) out[n] = env[n] || env[alt[n]];
  return out;
}

async function verbinden(env) {
  const Client = (await import('ssh2-sftp-client')).default;
  const c = new Client();
  await c.connect({
    host: env.SFTP_HOST,
    port: Number(process.env.SFTP_PORT || 22),
    username: env.SFTP_USER,
    password: env.SFTP_PASSWORD,
    readyTimeout: 20_000,
  });
  return c;
}

/** Fehlermeldungen duerfen das Passwort nie weitertragen. */
function ohneGeheimnis(text, geheim) {
  return geheim ? String(text).split(geheim).join('***') : String(text);
}

const env = await zugang();

// ---- Nur nachsehen ------------------------------------------------------
if (nurVerbindung) {
  schritt('Verbindungsprobe (liest nur)');
  const c = await verbinden(env).catch((e) => {
    console.error('Anmeldung fehlgeschlagen:', ohneGeheimnis(e.message, env.SFTP_PASSWORD));
    process.exit(1);
  });
  const oben = await c.list(env.SFTP_REMOTE_DIR);
  console.log(`Angemeldet, verschluesselt. In ${env.SFTP_REMOTE_DIR}: ${oben.length} Eintraege`);
  for (const e of oben.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  ${e.type === 'd' ? 'ORDNER' : 'Datei '}  ${e.name}`);
  }
  await c.end();
  process.exit(0);
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

console.log(
  `\nZiel: ${env.SFTP_HOST}${env.SFTP_REMOTE_DIR}, Nutzer ${env.SFTP_USER.slice(0, 3)}***`
);
if (probe) {
  console.log('\nTrockenlauf (--probe): keine Verbindung aufgebaut, nichts uebertragen.');
  process.exit(0);
}

// ---- Auslieferung -------------------------------------------------------
schritt('Auslieferung');
const c = await verbinden(env).catch((e) => {
  console.error('Anmeldung fehlgeschlagen:', ohneGeheimnis(e.message, env.SFTP_PASSWORD));
  process.exit(1);
});
try {
  const vorher = await c.list(env.SFTP_REMOTE_DIR);
  await c.uploadDir(DIST_DIR, env.SFTP_REMOTE_DIR);
  console.log(`${dateien.length} Dateien uebertragen.`);

  // Was oben liegt, aber nicht ins Paket gehoert. uploadDir ueberschreibt nur,
  // es raeumt nicht auf - deshalb wird der Rest benannt statt verschwiegen.
  const oben = await c.list(env.SFTP_REMOTE_DIR);
  const paketNamen = new Set(dateien.map((f) => f.split('/')[0]));
  const fremd = oben.filter((e) => !paketNamen.has(e.name));
  if (fremd.length > 0) {
    console.log(`\n${fremd.length} Eintrag/Eintraege oben gehoeren nicht zum Paket:`);
    for (const e of fremd) console.log(`  ${e.type === 'd' ? 'ORDNER' : 'Datei '}  ${e.name}`);
    if (aufraeumen) {
      for (const e of fremd) {
        const ziel = `${env.SFTP_REMOTE_DIR.replace(/\/$/, '')}/${e.name}`;
        if (e.type === 'd') await c.rmdir(ziel, true);
        else await c.delete(ziel);
        console.log(`  entfernt: ${e.name}`);
      }
    } else {
      console.log('  (nicht entfernt - mit --aufraeumen loeschen)');
    }
  }
  console.log(
    `\nVorher lagen ${vorher.length} Eintraege oben, jetzt ${(await c.list(env.SFTP_REMOTE_DIR)).length}.`
  );
} catch (e) {
  console.error('Auslieferung fehlgeschlagen:', ohneGeheimnis(e.message, env.SFTP_PASSWORD));
  process.exit(1);
} finally {
  await c.end();
}

// ---- Beweis -------------------------------------------------------------
schritt('Beweis');
try {
  // --paket: Hier ist dist/ der Sollwert - genau das wurde gerade uebertragen.
  execFileSync(process.execPath, [path.join(ROOT, 'tools', 'live-check.mjs'), '--paket'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
} catch {
  console.error('\nDie Live-Pruefung ist rot. Der Stand oben stimmt nicht mit dem Paket ueberein.');
  console.error('Rueckweg steht in docs/RUNBOOK.md.');
  process.exit(1);
}

/* Erst jetzt, nach dem Beweis: festhalten, WAS oben liegt. Ab hier misst
   `npm run verify:live` gegen diesen Stand und nicht mehr gegen den jeweils
   letzten Build - sonst ist die Pruefung schon nach dem naechsten Commit rot,
   ohne dass an der Seite etwas falsch waere. Die Datei gehoert ins
   Repository; sie ist die kanonische Angabe, welcher Stand ausgeliefert ist. */
await copyFile(path.join(DIST_DIR, 'version.json'), path.join(ROOT, 'ausgeliefert.json'));
console.log(`\nausgeliefert.json geschrieben: Stand ${version.commit_short}.`);
console.log('Bitte mitcommitten - sie sagt der naechsten Sitzung, was live liegt.');

console.log('\nAusgeliefert und nachgemessen.');
