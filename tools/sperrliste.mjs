/* Begriffe, die in den Texten dieses Projekts nichts zu suchen haben.
 *
 * Anlass, 27.08.2026: In Changelog, Kommentaren und CSS standen an vierzehn
 * Stellen Verweise auf ein anderes Projekt desselben Anbieters - als
 * Begruendung fuer uebernommene Werte. Fuer Aussenstehende ist das
 * Rauschen, und die beiden Projekte werden ausdruecklich nicht vermischt.
 *
 * Eine Bitte um Sorgfalt haette das nicht verhindert; eine Pruefung schon.
 */
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './paths.mjs';

const GESPERRT = [
  {
    muster: /malzi\.me|malziME|malzime/i,
    probe: 'siehe malzi.me',
    grund: 'anderes Projekt desselben Anbieters - wird nicht vermischt',
  },
  {
    muster: /\bTODO\b|\bFIXME\b|\bXXX\b/,
    // Die Probe wird zusammengesetzt, damit diese Datei ihr eigenes Muster
    // nicht ausloest - dieselbe Falle wie im Changelog, wo das Wort als
    // Beispiel stand und die Pruefung anschlug.
    probe: 'TO' + 'DO: spaeter aufraeumen',
    grund: 'liegengebliebene Arbeitsnotiz im ausgelieferten Text',
  },
  {
    muster: /localhost:\d+/,
    probe: 'http://localhost:8080/',
    grund: 'Entwicklungsadresse im ausgelieferten Text',
  },
  {
    /* Der Firmenwortlaut wird nie gekuerzt. Er ist die Rechtsform-Angabe im
       Impressum; eine Kurzform waere dort schlicht falsch. */
    muster: /malziland\s+e\.?\s?U\./i,
    probe: 'malziland e.U.',
    grund:
      'gekuerzter Firmenwortlaut - er lautet "malziland – learning | training | consulting e.U."',
  },
  {
    /* Und zwar mit Halbgeviertstrich (–, U+2013), nicht mit Bindestrich. */
    muster: /malziland\s*-\s*learning/,
    probe: 'malziland - learning',
    grund: 'Bindestrich statt Halbgeviertstrich im Firmenwortlaut',
  },
];

/* Der Fremdcode ist ausgenommen: Wir aendern ihn nicht, und was dort steht,
   verantwortet sein Hersteller. Ebenso diese Datei selbst - sie muss die
   Muster nennen duerfen. */
const AUSGENOMMEN = [/^public\/js\/vendor\//, /^tools\/sperrliste\.mjs$/, /^package-lock\.json$/];
const BINAER = /\.(png|jpe?g|ico|woff2?|pdf|zip|gz)$/i;

const dateien = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => !BINAER.test(f))
  .filter((f) => !AUSGENOMMEN.some((re) => re.test(f)));

if (dateien.length === 0) {
  console.error('Keine Dateien zu pruefen - das kann nicht stimmen. Abbruch.');
  process.exit(2);
}

/* Selbsttest: Jedes Muster braucht eine ausdrueckliche Probe. Der erste
   Versuch leitete sie aus dem Suchmuster selbst ab - und scheiterte an den
   Maskierungen darin. Eine Probe, die man ausrechnen muss, ist keine. */
for (const g of GESPERRT) {
  if (!g.probe || !g.muster.test(g.probe)) {
    console.error(`Selbsttest fehlgeschlagen: Muster ${g.muster} trifft seine Probe nicht.`);
    console.error('Die Suche waere blind - Abbruch, kein Ergebnis.');
    process.exit(2);
  }
}

const funde = [];
for (const rel of dateien) {
  const text = await readFile(path.join(ROOT, rel), 'utf8').catch(() => '');
  text.split('\n').forEach((zeile, i) => {
    for (const g of GESPERRT) {
      if (g.muster.test(zeile)) funde.push(`${rel}:${i + 1}  ${g.grund}`);
    }
  });
}

console.log(
  `Geprueft: ${dateien.length} versionierte Textdateien, ${GESPERRT.length} Sperrmuster.`
);
if (funde.length > 0) {
  console.error(`\n${funde.length} Fund(e):`);
  for (const f of funde) console.error('  - ' + f);
  process.exit(1);
}
console.log('Keine gesperrten Begriffe.');
