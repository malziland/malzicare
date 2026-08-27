/* Wacht über die Bibliotheken, die wir mitliefern.
 *
 * Sie stehen bewusst NICHT in package.json - sie gehen unveraendert an den
 * Browser (ADR-0004). Der Preis: Dependabot sieht sie nicht. Wenn dort eine
 * Luecke bekannt wird, erfaehrt es niemand. Dieses Werkzeug schliesst die
 * Luecke:
 *
 *   - Ist die Datei noch die, die dokumentiert ist? (Pruefsumme)
 *   - Traegt sie den Lizenzhinweis, den die Lizenz verlangt?
 *   - Gibt es eine neuere Fassung? (nur mit --neuigkeiten, braucht Netz)
 */
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { PUBLIC_DIR } from './paths.mjs';

/* Kanonische Angaben. Wer eine Bibliothek austauscht, aendert sie hier -
   und die Pruefung sagt, ob Datei und Angabe zusammenpassen. */
const BIBLIOTHEKEN = [
  {
    datei: 'js/vendor/html-to-image.js',
    paket: 'html-to-image',
    version: '1.11.13',
    lizenz: 'MIT',
    inhaber: 'W.Y.',
    // Pruefsumme OHNE den nachgetragenen Lizenzkopf: so laesst sie sich
    // gegen das npm-Paket vergleichen.
    rumpf_sha256: 'a90b42909d80',
  },
  {
    datei: 'js/vendor/jspdf.umd.min.js',
    paket: 'jspdf',
    version: '4.2.1',
    lizenz: 'MIT',
    inhaber: 'James Hall u. a.',
    rumpf_sha256: null,
  },
];

const befunde = [];

for (const b of BIBLIOTHEKEN) {
  const voll = path.join(PUBLIC_DIR, b.datei);
  let inhalt;
  try {
    inhalt = await readFile(voll, 'utf8');
  } catch {
    befunde.push(`${b.datei}: Datei fehlt, ist aber dokumentiert`);
    continue;
  }

  /* Die Lizenz verlangt, dass Hinweis und Inhaber mitwandern. Fehlt das,
     liefern wir fremden Code unter Verletzung seiner Bedingung aus. */
  if (!new RegExp(b.lizenz, 'i').test(inhalt)) {
    befunde.push(`${b.datei}: kein Hinweis auf die ${b.lizenz}-Lizenz in der Datei`);
  }
  if (!inhalt.includes(b.inhaber.split(' ')[0])) {
    befunde.push(`${b.datei}: der Rechteinhaber (${b.inhaber}) wird nicht genannt`);
  }
  if (!inhalt.includes(b.version)) {
    befunde.push(`${b.datei}: die Version ${b.version} steht nicht in der Datei`);
  }

  if (b.rumpf_sha256) {
    // Der nachgetragene Kopf endet mit " */\n" - alles danach ist das Original.
    const trenner = inhalt.indexOf(' */\n');
    const rumpf = trenner >= 0 ? inhalt.slice(trenner + 4) : inhalt;
    const ist = createHash('sha256').update(rumpf).digest('hex').slice(0, 12);
    if (ist !== b.rumpf_sha256) {
      befunde.push(
        `${b.datei}: Inhalt weicht von der dokumentierten Fassung ab (${ist} statt ${b.rumpf_sha256})`
      );
    }
  }
}

console.log(`Geprueft: ${BIBLIOTHEKEN.length} mitgelieferte Bibliotheken.`);
for (const b of BIBLIOTHEKEN) {
  console.log(`  ${b.paket.padEnd(15)} ${b.version.padEnd(8)} ${b.lizenz}, ${b.inhaber}`);
}

if (process.argv.includes('--neuigkeiten')) {
  console.log('\nNeuere Fassungen (npm):');
  for (const b of BIBLIOTHEKEN) {
    try {
      const neu = execFileSync('npm', ['view', b.paket, 'version'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      const stand = neu === b.version ? 'aktuell' : `NEUER: ${neu}`;
      console.log(`  ${b.paket.padEnd(15)} bei uns ${b.version.padEnd(10)} ${stand}`);
    } catch {
      console.log(`  ${b.paket.padEnd(15)} nicht abfragbar (kein Netz?)`);
    }
  }
}

if (befunde.length > 0) {
  console.error(`\n${befunde.length} Befund(e):`);
  for (const f of befunde) console.error('  - ' + f);
  console.error('\nHerkunft und Aktualisierungsweg: docs/fremdcode.md');
  process.exit(1);
}
console.log('\nAlle Angaben stimmen mit den Dateien ueberein.');
