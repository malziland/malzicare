/* Sucht Zugangsdaten im versionierten Bestand - vor jeder Veroeffentlichung.
 *
 * Ein leeres Ergebnis ist zuerst ein Verdacht gegen das Messmittel. Deshalb
 * prueft sich das Skript vor der eigentlichen Suche an einer bekannten
 * Testzeichenkette: schlaegt es dort nicht an, bricht es ab, statt "sauber"
 * zu melden.
 */
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './paths.mjs';

const MUSTER = [
  { name: 'Privater Schluessel', re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'AWS-Zugriffsschluessel', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Zugangsdaten in URL', re: /\b(?:ftp|ftps|https?):\/\/[^/\s:@]+:[^/\s@]+@/ },
  {
    name: 'Passwort-Zuweisung',
    re: /\b(?:password|passwort|passwd|pwd)\s*[:=]\s*["']?[^\s"'<>{}$,)]{6,}/i,
  },
  {
    name: 'Schluessel-Zuweisung',
    re: /\b(?:api[_-]?key|secret|token|auth[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9_-]{16,}/i,
  },
  { name: 'Google-API-Schluessel', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
];

// Selbsttest: je Muster eine Probe, aus Teilen zusammengesetzt, damit die
// Suche nicht sich selbst findet. Ohne Probe kein Muster - sonst liefe eine
// Suche mit, von der niemand weiss, ob sie ueberhaupt anschlagen kann.
const PROBE = {
  'Privater Schluessel': '-----BEGIN ' + 'PRIVATE KEY-----',
  'AWS-Zugriffsschluessel': 'AKIA' + 'ABCDEFGHIJKLMNOP',
  'Zugangsdaten in URL': 'ftp://' + 'nutzer:geheim@' + 'server.example',
  'Passwort-Zuweisung': 'pass' + 'word=' + 'GeheimGeheim123',
  'Schluessel-Zuweisung': 'api_' + 'key=' + 'ABCDEFGHIJKLMNOPQRST',
  'Google-API-Schluessel': 'AIza' + 'A'.repeat(35),
};
for (const muster of MUSTER) {
  const probe = PROBE[muster.name];
  if (probe === undefined) {
    console.error(`Selbsttest fehlgeschlagen: Muster "${muster.name}" hat keine Probe.`);
    process.exit(2);
  }
  if (!muster.re.test(probe)) {
    console.error(
      `Selbsttest fehlgeschlagen: Muster "${muster.name}" schlaegt an der Probe nicht an.`
    );
    console.error('Die Suche waere blind - Abbruch, kein Ergebnis.');
    process.exit(2);
  }
}

const BINAER = /\.(png|jpe?g|ico|woff2?|pdf|zip|gz)$/i;
const AUSGENOMMEN = [/^public\/js\/vendor\//, /^package-lock\.json$/];

const dateien = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => !BINAER.test(f))
  .filter((f) => !AUSGENOMMEN.some((re) => re.test(f)));

if (dateien.length === 0) {
  console.error('Keine Dateien zu pruefen - das kann nicht stimmen. Abbruch.');
  process.exit(2);
}

const funde = [];
for (const rel of dateien) {
  const text = await readFile(path.join(ROOT, rel), 'utf8').catch(() => '');
  text.split('\n').forEach((zeile, i) => {
    for (const m of MUSTER) {
      if (m.re.test(zeile)) {
        // Wert nie ausgeben, nur Fundstelle und Muster.
        funde.push(`${rel}:${i + 1}  [${m.name}]`);
      }
    }
  });
}

console.log(`Geprueft: ${dateien.length} versionierte Textdateien, ${MUSTER.length} Muster.`);
console.log(`Selbsttest: ${MUSTER.length} Muster, je eine Probe, alle angeschlagen.`);
if (funde.length > 0) {
  console.error(`\n${funde.length} Fund(e) - vor Veroeffentlichung klaeren:`);
  for (const f of funde) console.error('  - ' + f);
  process.exit(1);
}
console.log('Keine Funde.');
