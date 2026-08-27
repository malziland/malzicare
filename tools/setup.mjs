/* Richtet die Arbeitsumgebung ein. Idempotent: mehrfaches Ausfuehren aendert
 * nichts und loescht nichts. Fehlt eine Voraussetzung, bricht es mit klarer
 * Meldung ab, statt halb fertig zu melden. */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './paths.mjs';

const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const noetig = pkg.engines.node.replace('>=', '');
const [nMaj, nMin] = process.versions.node.split('.').map(Number);
const [sMaj, sMin] = noetig.split('.').map(Number);
if (nMaj < sMaj || (nMaj === sMaj && nMin < (sMin || 0))) {
  console.error(`Node ${noetig} oder neuer noetig, gefunden ${process.versions.node}.`);
  process.exit(1);
}

function lauf(cmd, args) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
}

lauf('npm', existsSync(path.join(ROOT, 'package-lock.json')) ? ['ci'] : ['install']);
lauf('npx', ['playwright', 'install', 'chromium', '--with-deps=false']);

console.log('\nEingerichtet. Naechste Schritte:');
console.log('  npm run lint   Formatierer, Linter, Verweis- und Adresspruefung');
console.log('  npm test       Unit- und Oberflaechentests');
console.log('  npm run run    Editor lokal starten');
if (!existsSync(path.join(ROOT, '.env'))) {
  console.log('\nFuer die Auslieferung fehlt noch .env (Vorlage: .env.example).');
}
