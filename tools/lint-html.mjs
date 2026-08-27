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

/* Die eigene Seite - mit Abschluss nach dem Namen, sonst zaehlt jede fremde
   Adresse mit, die ihn als Anfang traegt. */
const EIGENE_ADRESSE = /^https?:\/\/(www\.)?(malzi\.care|klassenchat\.malziland\.at)([/?#]|$)/i;

/** Vergleicht Adressen ueber ihre Herkunft, nicht ueber den Wortanfang. */
function herkunft(u) {
  try {
    return new URL(u).origin;
  } catch {
    return u;
  }
}

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
  /* Die canonical-Angabe entscheidet, unter welcher Adresse die Seite gilt.
     Sie wird ausdruecklich gegen die Basis geprueft - im allgemeinen
     Adress-Durchlauf weiter unten wuerde eine falsche Angabe als "fremde
     Adresse" gelten und stillschweigend uebersprungen. */
  const kanonisch = /<link\s+rel="canonical"\s+href="([^"]+)"/.exec(html);
  if (!kanonisch) {
    melde(rel, 'kein canonical');
  } else {
    const erwartet = rel === 'index.html' ? BASE + '/' : `${BASE}/${rel}`;
    if (kanonisch[1] !== erwartet) {
      melde(rel, `canonical zeigt auf ${kanonisch[1]}, erwartet ${erwartet}`);
    }
    geprueft.adressen++;
  }

  const ogUrl = /<meta\s+property="og:url"\s+content="([^"]+)"/.exec(html);
  if (ogUrl && herkunft(ogUrl[1]) !== herkunft(BASE)) {
    melde(rel, `og:url zeigt auf eine fremde Herkunft: ${ogUrl[1]}`);
  }

  // Lokale Verweise muessen auf vorhandene Dateien zeigen.
  for (const m of html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
    const ziel = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:|#)/.test(ziel)) continue;
    geprueft.verweise++;
    const ohneQuery = ziel.split('?')[0].split('#')[0];
    if (ohneQuery === '') continue;
    const abs = path.join(PUBLIC_DIR, dir, ohneQuery);
    if (!existsSync(abs)) melde(rel, `Verweis zeigt ins Leere: ${ziel}`);
    // Symbole und Manifest zaehlen mit: Ohne Buster zeigt der Browser sie
    // bis zu sieben Tage lang aus dem Zwischenspeicher (siehe .htaccess).
    if (/\.(css|js|ico|png|webmanifest)$/.test(ohneQuery)) {
      const v = /[?&]v=([^&"]*)/.exec(ziel);
      if (!v) melde(rel, `Verweis ohne Cache-Buster: ${ziel}`);
      else if (v[1] !== BUSTER)
        melde(rel, `Cache-Buster ${v[1]} statt ${BUSTER} (site.json): ${ziel}`);
    }
  }

  // Absolute Adressen auf die eigene Seite.
  for (const m of html.matchAll(/https?:\/\/[^"'\s<>)]+/g)) {
    const url = m[0];
    // Nur die eigene Seite pruefen. Der Verweis auf den Quelltext zeigt auf
    // github.com und enthaelt den Projektnamen - er ist keine eigene Adresse.
    // Der Abschluss nach dem Namen ist wichtig: Ohne ihn gilt auch
    // malzi.care.fremde-seite.example als eigene Adresse.
    if (!EIGENE_ADRESSE.test(url)) continue;
    geprueft.adressen++;
    if (herkunft(url) !== herkunft(BASE)) {
      melde(rel, `fremde Basis-Adresse: ${url} (erwartet ${BASE})`);
    }
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
    // Nur die eigene Seite pruefen. Der Verweis auf den Quelltext zeigt auf
    // github.com und enthaelt den Projektnamen - er ist keine eigene Adresse.
    // Der Abschluss nach dem Namen ist wichtig: Ohne ihn gilt auch
    // malzi.care.fremde-seite.example als eigene Adresse.
    if (!EIGENE_ADRESSE.test(url)) continue;
    geprueft.adressen++;
    if (herkunft(url) !== herkunft(BASE)) {
      melde(rel, `fremde Basis-Adresse: ${url} (erwartet ${BASE})`);
    }
  }
}

/* Was ausgeliefert wird, muss auch gebraucht werden. Verwaiste Dateien
   kosten Ladezeit und tragen alte Staende weiter - die beiden Wortmarken mit
   dem alten Produktnamen lagen so monatelang im Auslieferverzeichnis, ohne
   dass eine Seite sie einband. Die Ausnahmen sind benannt und werden bei
   jedem Lauf mit ausgegeben. */
const BRAUCHT_KEINEN_VERWEIS = [
  {
    datei: 'assets/fonts/OFL.txt',
    grund: 'Lizenztext der Schrift Poppins, muss mitgeliefert werden',
  },
  {
    datei: 'assets/malziland-logo-petrol.svg',
    grund: 'Markenmaterial, fuer spaetere Verwendung vorgehalten',
  },
  {
    datei: 'assets/malziland-m-white.png',
    grund: 'Wasserzeichen fuer ein dunkles Thema, noch nicht in Gebrauch',
  },
];
const IMMER_NOETIG =
  /^(index|impressum|datenschutz|agb)\.html$|^(robots\.txt|sitemap\.xml|llms\.txt|site\.webmanifest|favicon\.ico|\.htaccess)$/;

const textInhalte = [];
for (const rel of alleDateien) {
  if (/\.(html|css|js|json|webmanifest|xml|txt)$/.test(rel)) {
    textInhalte.push(await readFile(path.join(PUBLIC_DIR, rel), 'utf8'));
  }
}
const gesamttext = textInhalte.join('\n');
for (const rel of alleDateien) {
  if (IMMER_NOETIG.test(rel)) continue;
  const ausnahme = BRAUCHT_KEINEN_VERWEIS.find((a) => a.datei === rel);
  const name = rel.split('/').pop();
  if (gesamttext.includes(name)) continue;
  if (ausnahme) {
    console.log(`  [Ausnahme] ${rel}: ${ausnahme.grund}`);
    continue;
  }
  melde(rel, 'liegt im Auslieferverzeichnis, wird aber von keiner Datei eingebunden');
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
