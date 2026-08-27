/* Wacht darueber, dass der Cache-Buster steigt, wenn sich Dateien aendern.
 *
 * Anlass, 27.08.2026: Die Wortmarke erschien in Safari als reiner Text. Die
 * neue editor.css lag korrekt auf dem Server, aber die Seite forderte weiter
 * "?v=31" an - denselben Namen wie vorher. Der Browser nahm die sieben Tage
 * gueltige Kopie aus seinem Zwischenspeicher. Ein Cache-Buster, der bei
 * Aenderungen nicht steigt, ist keiner.
 *
 * Aufruf:
 *   node tools/cache-buster.mjs --pruefen   meldet, wenn er steigen muesste
 *   node tools/cache-buster.mjs --erhoehen  erhoeht ihn und zieht alle Verweise nach
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { ROOT, PUBLIC_DIR, listFiles } from './paths.mjs';

/** Alles, was der Browser lange behalten darf (siehe .htaccess). */
const GECACHT = /\.(css|js|png|jpe?g|ico|svg|woff2|webmanifest)$/;

export async function inhaltsHash() {
  const dateien = (await listFiles(PUBLIC_DIR)).filter((f) => GECACHT.test(f)).sort();
  const h = createHash('sha256');
  for (const rel of dateien) {
    h.update(rel);
    h.update(await readFile(path.join(PUBLIC_DIR, rel)));
  }
  return { hash: h.digest('hex').slice(0, 16), anzahl: dateien.length };
}

const site = JSON.parse(await readFile(path.join(ROOT, 'site.json'), 'utf8'));
const { hash, anzahl } = await inhaltsHash();
const passt = site.asset_hash === hash;

if (process.argv.includes('--erhoehen')) {
  const neu = String(Number(site.cache_buster) + 1);
  const alt = site.cache_buster;

  let geaendert = 0;
  for (const rel of await listFiles(PUBLIC_DIR)) {
    if (!/\.(html|webmanifest)$/.test(rel)) continue;
    const datei = path.join(PUBLIC_DIR, rel);
    const text = await readFile(datei, 'utf8');
    const ersetzt = text.split(`?v=${alt}`).join(`?v=${neu}`);
    if (ersetzt !== text) {
      await writeFile(datei, ersetzt);
      geaendert++;
    }
  }
  /* Der Stand wird ERST JETZT vermerkt: Das Nachziehen aendert das Manifest,
     und das zaehlt selbst mit. Wer vorher vermerkt, schreibt einen Wert fest,
     den es im naechsten Moment nicht mehr gibt - beim ersten Versuch genau
     so passiert. */
  const danach = await inhaltsHash();
  site.cache_buster = neu;
  site.asset_hash = danach.hash;
  await writeFile(path.join(ROOT, 'site.json'), JSON.stringify(site, null, 2) + '\n');

  console.log(`Cache-Buster ${alt} -> ${neu}, ${geaendert} Datei(en) nachgezogen.`);
  console.log(`Stand von ${danach.anzahl} zwischengespeicherten Dateien: ${danach.hash}`);
  process.exit(0);
}

console.log(`Cache-Buster ${site.cache_buster}, ${anzahl} zwischenspeicherbare Dateien.`);
if (!passt) {
  console.error(`\nDie Dateien haben sich geaendert, der Cache-Buster nicht.`);
  console.error(`  vermerkt: ${site.asset_hash ?? '(noch keiner)'}`);
  console.error(`  jetzt:    ${hash}`);
  console.error(`\nBrowser wuerden bis zu sieben Tage die alte Fassung anzeigen.`);
  console.error(`Beheben:  node tools/cache-buster.mjs --erhoehen`);
  process.exit(1);
}
console.log('Der Cache-Buster passt zum Inhalt.');
