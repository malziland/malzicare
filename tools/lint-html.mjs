/* Prueft den ausgelieferten Baum auf das, was ein Browser spaeter merkt:
 *   - jeder lokale Verweis zeigt auf eine Datei, die es gibt
 *   - jede Seite hat Sprache, Titel, Beschreibung und canonical
 *   - jede absolute Adresse auf die eigene Seite nennt dieselbe Basis
 *   - jeder Verweis auf CSS und JS traegt denselben Cache-Buster
 * Die Sollwerte stehen in site.json, damit ein Adresswechsel an einer Stelle
 * beginnt und die Pruefung den Rest sichtbar macht.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, PUBLIC_DIR, listFiles } from './paths.mjs';

const site = JSON.parse(await readFile(path.join(ROOT, 'site.json'), 'utf8'));
const BASE = site.base_url.replace(/\/$/, '');
const BUSTER = String(site.cache_buster);

const fehler = [];
const geprueft = { seiten: 0, verweise: 0, adressen: 0 };

function melde(datei, text) {
  fehler.push(`${datei}: ${text}`);
}

const alleDateien = await listFiles(PUBLIC_DIR);
const htmlDateien = alleDateien.filter((f) => f.endsWith('.html'));
if (htmlDateien.length === 0)
  throw new Error('Keine HTML-Datei gefunden - Pruefung waere sinnlos.');

for (const rel of htmlDateien) {
  geprueft.seiten++;
  const html = await readFile(path.join(PUBLIC_DIR, rel), 'utf8');
  const dir = path.dirname(rel);

  if (!/<html[^>]+lang="de"/.test(html)) melde(rel, 'kein lang="de" am html-Element');
  if (!/<title>[^<]{10,}<\/title>/.test(html)) melde(rel, 'kein brauchbarer Titel');
  if (!/<meta\s+name="description"\s+content="[^"]{40,}"/.test(html))
    melde(rel, 'keine Beschreibung (meta description)');
  if (!/<link\s+rel="canonical"\s+href="[^"]+"/.test(html)) melde(rel, 'kein canonical');

  // Lokale Verweise muessen auf vorhandene Dateien zeigen.
  for (const m of html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
    const ziel = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:|#)/.test(ziel)) continue;
    geprueft.verweise++;
    const ohneQuery = ziel.split('?')[0].split('#')[0];
    if (ohneQuery === '') continue;
    const abs = path.join(PUBLIC_DIR, dir, ohneQuery);
    if (!existsSync(abs)) melde(rel, `Verweis zeigt ins Leere: ${ziel}`);
    if (/\.(css|js)$/.test(ohneQuery)) {
      const v = /[?&]v=([^&"]*)/.exec(ziel);
      if (!v) melde(rel, `Verweis ohne Cache-Buster: ${ziel}`);
      else if (v[1] !== BUSTER)
        melde(rel, `Cache-Buster ${v[1]} statt ${BUSTER} (site.json): ${ziel}`);
    }
  }

  // Absolute Adressen auf die eigene Seite.
  for (const m of html.matchAll(/https?:\/\/[^"'\s<>)]+/g)) {
    const url = m[0];
    if (!/klassenchat|malzi\.care|malzicare/i.test(url)) continue;
    geprueft.adressen++;
    if (!url.startsWith(BASE)) melde(rel, `fremde Basis-Adresse: ${url} (erwartet ${BASE})`);
  }
}

// Auch die Nicht-HTML-Dateien nennen die Adresse.
for (const rel of ['sitemap.xml', 'robots.txt', 'llms.txt', 'site.webmanifest']) {
  if (!alleDateien.includes(rel)) {
    melde(rel, 'Datei fehlt im Auslieferverzeichnis');
    continue;
  }
  const text = await readFile(path.join(PUBLIC_DIR, rel), 'utf8');
  for (const m of text.matchAll(/https?:\/\/[^"'\s<>)]+/g)) {
    const url = m[0];
    if (!/klassenchat|malzi\.care|malzicare/i.test(url)) continue;
    geprueft.adressen++;
    if (!url.startsWith(BASE)) melde(rel, `fremde Basis-Adresse: ${url} (erwartet ${BASE})`);
  }
}

console.log(
  `Geprueft: ${geprueft.seiten} Seiten, ${geprueft.verweise} lokale Verweise, ` +
    `${geprueft.adressen} eigene Adressen (Basis ${BASE}, Cache-Buster ${BUSTER}).`
);
if (fehler.length > 0) {
  console.error(`\n${fehler.length} Befund(e):`);
  for (const f of fehler) console.error('  - ' + f);
  process.exit(1);
}
console.log('Keine Befunde.');
