/* Wertet aus, welcher Anteil des ausgelieferten JavaScripts von den
 * Oberflaechentests ausgefuehrt wird, und faellt unter der vereinbarten
 * Schwelle durch.
 *
 * Die Zahl allein sagt wenig - deshalb nennt der Bericht auch, WELCHE
 * Funktionen nie laufen. Eine Abdeckung, die man nicht lesen kann, verleitet
 * dazu, Tests zu schreiben, die nur die Zahl heben.
 */
import { readdir, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.mjs';

const SCHWELLE = Number(process.env.ABDECKUNG_SCHWELLE || 80);
const ABLAGE = path.join(ROOT, '.abdeckung');

if (!existsSync(ABLAGE)) {
  console.error('Keine Messdaten. Erst die Oberflaechentests laufen lassen:');
  console.error('  npx playwright test --project=chromium');
  process.exit(1);
}

const dateien = (await readdir(ABLAGE)).filter((f) => f.endsWith('.json'));
if (dateien.length === 0) {
  console.error('Keine Messdaten in .abdeckung - das ist ein Fehlschlag, kein Hinweis.');
  process.exit(1);
}

/* Je Quelldatei: ein Feld ueber alle Zeichen. Aeussere Bereiche zuerst,
   innere ueberschreiben sie - sonst zaehlt verschachtelter Code mehrfach. */
const quellen = new Map();
for (const f of dateien) {
  for (const eintrag of JSON.parse(await readFile(path.join(ABLAGE, f), 'utf8'))) {
    const name = eintrag.url.split('/').pop().split('?')[0];
    if (!eintrag.source) continue;
    if (!quellen.has(name)) {
      quellen.set(name, {
        laenge: eintrag.source.length,
        abgedeckt: new Uint8Array(eintrag.source.length),
        funktionen: new Map(),
      });
    }
    const q = quellen.get(name);
    /* V8 liefert verschachtelte Bereiche: der aeussere sagt "gelaufen", die
       inneren markieren, was darin NICHT gelaufen ist. Deshalb zuerst die
       grossen, dann die kleinen - und die kleinen ueberschreiben. Erst danach
       wird das Ergebnis dieses einen Laufs mit den anderen verodert; sonst
       loescht ein Lauf, der einen Zweig nicht nimmt, die Treffer eines
       anderen. */
    const lauf = new Uint8Array(q.laenge);
    const bereiche = eintrag.functions
      .flatMap((fn) => fn.ranges)
      .sort((a, b) => b.endOffset - b.startOffset - (a.endOffset - a.startOffset));
    for (const r of bereiche) {
      const wert = r.count > 0 ? 1 : 0;
      for (let i = r.startOffset; i < Math.min(r.endOffset, q.laenge); i++) lauf[i] = wert;
    }
    for (let i = 0; i < q.laenge; i++) if (lauf[i]) q.abgedeckt[i] = 1;
    for (const fn of eintrag.functions) {
      const gelaufen = fn.ranges.some((r) => r.count > 0);
      const bisher = q.funktionen.get(fn.functionName || '(namenlos)') || false;
      q.funktionen.set(fn.functionName || '(namenlos)', bisher || gelaufen);
    }
  }
}

let gesamtLaenge = 0;
let gesamtTreffer = 0;
const offen = [];
console.log(`Abdeckung aus ${dateien.length} Testlaeufen:\n`);
for (const [name, q] of quellen) {
  let treffer = 0;
  for (let i = 0; i < q.laenge; i++) treffer += q.abgedeckt[i];
  gesamtLaenge += q.laenge;
  gesamtTreffer += treffer;
  const nie = [...q.funktionen.entries()].filter(([, l]) => !l).map(([n]) => n);
  console.log(
    `  ${name.padEnd(14)} ${((treffer / q.laenge) * 100).toFixed(1).padStart(5)} %   ` +
      `${q.funktionen.size - nie.length}/${q.funktionen.size} Funktionen gelaufen`
  );
  if (nie.length) offen.push([name, nie]);
}

const anteil = (gesamtTreffer / gesamtLaenge) * 100;
console.log(`\n  Gesamt: ${anteil.toFixed(1)} %   (Schwelle ${SCHWELLE} %)`);

if (offen.length) {
  console.log('\nNie ausgefuehrte Funktionen:');
  for (const [name, nie] of offen) {
    console.log(`  ${name}: ${nie.filter(Boolean).join(', ') || '(nur namenlose)'}`);
  }
}

await rm(ABLAGE, { recursive: true, force: true });

if (anteil < SCHWELLE) {
  console.error(`\nUnter der Schwelle: ${anteil.toFixed(1)} % statt ${SCHWELLE} %.`);
  process.exit(1);
}
console.log('\nSchwelle erreicht.');
