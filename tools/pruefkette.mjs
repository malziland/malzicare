/* Fuehrt alle Pruefungen der Reihe nach aus und endet mit einem einzigen
 * Rueckgabewert.
 *
 * Grund: Eine Vollzugsmeldung darf nicht am blossen Danach eines Befehls
 * haengen, sondern an seinem Erfolg. Beim Bau dieser Kette ist genau das
 * zweimal passiert - ein Commit lief, obwohl die Pruefung davor rot war.
 * Eine Kette, die man von Hand zusammensteckt, macht diesen Fehler
 * wieder; diese hier nicht.
 */
import { execFileSync } from 'node:child_process';
import { ROOT } from './paths.mjs';

const SCHRITTE = [
  ['Formatierung', 'npx', ['prettier', '--check', '.']],
  ['Linter', 'npx', ['eslint', 'public/js/app.js', 'tools', 'tests', 'eslint.config.js']],
  ['Verweise und Adressen', process.execPath, ['tools/lint-html.mjs']],
  ['Cache-Buster', process.execPath, ['tools/cache-buster.mjs']],
  ['Geheimnis-Scan', process.execPath, ['tools/scan-secrets.mjs']],
  ['Unit-Tests', process.execPath, ['tools/run-tests.mjs']],
  ['Oberflaechentests', 'npx', ['playwright', 'test']],
  ['Abdeckung', process.execPath, ['tools/abdeckung.mjs']],
];

const nurSchnell = process.argv.includes('--schnell');
const ergebnisse = [];
let alleGruen = true;

for (const [name, cmd, args] of SCHRITTE) {
  if (nurSchnell && (name === 'Oberflaechentests' || name === 'Abdeckung')) {
    ergebnisse.push([name, 'uebersprungen (--schnell)']);
    alleGruen = false; // Uebersprungen ist nie "bestanden".
    continue;
  }
  process.stdout.write(`\n=== ${name} ===\n`);
  try {
    execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
    ergebnisse.push([name, 'gruen']);
  } catch {
    ergebnisse.push([name, 'ROT']);
    alleGruen = false;
  }
}

console.log('\n---------------- Ergebnis ----------------');
for (const [name, stand] of ergebnisse) console.log(`  ${stand.padEnd(24)} ${name}`);
console.log('------------------------------------------');
if (!alleGruen) {
  console.error('Pruefkette NICHT vollstaendig gruen.');
  process.exit(1);
}
console.log('Pruefkette vollstaendig gruen.');
