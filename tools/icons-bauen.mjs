/* Erzeugt die Symbole der Marke aus einer Beschreibung, nicht von Hand.
 *
 * Gezeichnet wird im Browser mit derselben Schrift, die die Seite ausliefert
 * (Poppins) - so stimmt das Symbol mit der Wortmarke ueberein. Wer die Marke
 * aendert, laesst dieses Skript neu laufen, statt Dateien nachzupflegen.
 *
 * Die .ico entsteht hier ebenfalls: Das Format ist ein Verzeichnis mit
 * eingebetteten PNG, und dafuer braucht es kein Fremdwerkzeug.
 */
import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { PUBLIC_DIR } from './paths.mjs';
import { createServer } from './serve.mjs';

const TEAL = '#156480';
const SCHRIFT = '#ffffff';
/* Das Symbol zeigt die Endung der Marke, wie das malziland-Symbol das m
   zeigt. Vier Buchstaben brauchen deutlich weniger Schrifthoehe als einer -
   der Faktor haengt an der Zeichenzahl, nicht an einem festen Wert. */
const WORT = 'CARE';

/** Ein Symbol als HTML. rund = Anteil der Kantenlaenge; 0 heisst eckig. */
function seite(groesse, rund, port) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="http://localhost:${port}/css/fonts.css">
<style>
  html,body{margin:0;padding:0;background:transparent}
  .i{width:${groesse}px;height:${groesse}px;display:flex;align-items:center;justify-content:center;
     background:${TEAL};color:${SCHRIFT};border-radius:${rund}%;
     font-family:Poppins,system-ui,sans-serif;font-weight:700;
     font-size:${Math.round(groesse * (WORT.length > 1 ? 0.235 : 0.64))}px;
     letter-spacing:-0.02em;line-height:1}
  /* Grossbuchstaben sitzen optisch zu hoch, wenn man sie rein rechnerisch
     zentriert - die Unterlaenge fehlt. */
  .i span{padding-bottom:${Math.max(1, Math.round(groesse * 0.03))}px}
</style></head><body><div class="i"><span>${WORT}</span></div></body></html>`;
}

/** ICO: Kopf, je Bild ein Verzeichniseintrag, dann die PNG-Daten. */
function baueIco(bilder) {
  const kopf = Buffer.alloc(6);
  kopf.writeUInt16LE(0, 0);
  kopf.writeUInt16LE(1, 2);
  kopf.writeUInt16LE(bilder.length, 4);
  const eintraege = [];
  let versatz = 6 + bilder.length * 16;
  for (const { groesse, daten } of bilder) {
    const e = Buffer.alloc(16);
    e.writeUInt8(groesse >= 256 ? 0 : groesse, 0);
    e.writeUInt8(groesse >= 256 ? 0 : groesse, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(daten.length, 8);
    e.writeUInt32LE(versatz, 12);
    versatz += daten.length;
    eintraege.push(e);
  }
  return Buffer.concat([kopf, ...eintraege, ...bilder.map((b) => b.daten)]);
}

const server = createServer(PUBLIC_DIR);
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();

async function zeichne(groesse, rund) {
  const ctx = await browser.newContext({
    viewport: { width: groesse, height: groesse },
    deviceScaleFactor: 1,
  });
  const p = await ctx.newPage();
  await p.setContent(seite(groesse, rund, port));
  await p.waitForTimeout(400);
  const bild = await p.screenshot({ omitBackground: true });
  await ctx.close();
  return bild;
}

/* Rundung 22 % entspricht der Kachel der Wortmarke. Das Apple-Symbol bleibt
   eckig: iOS rundet selbst, sonst rundet es ein zweites Mal. */
const ZIELE = [
  ['assets/favicon-32.png', 32, 22],
  ['assets/favicon-192.png', 192, 22],
  ['assets/icon-512.png', 512, 22],
  ['assets/apple-touch-icon.png', 180, 0],
];

for (const [rel, groesse, rund] of ZIELE) {
  const bild = await zeichne(groesse, rund);
  await writeFile(path.join(PUBLIC_DIR, rel), bild);
  console.log(`  ${rel.padEnd(32)} ${groesse}x${groesse}, ${bild.length} B`);
}

const icoBilder = [];
for (const g of [16, 32, 48]) icoBilder.push({ groesse: g, daten: await zeichne(g, 22) });
const ico = baueIco(icoBilder);
await writeFile(path.join(PUBLIC_DIR, 'favicon.ico'), ico);
console.log(`  favicon.ico                      16+32+48, ${ico.length} B`);

await browser.close();
server.close();

// Gegenprobe: Ist die .ico lesbar und enthaelt sie die drei Groessen?
const geschrieben = await readFile(path.join(PUBLIC_DIR, 'favicon.ico'));
const anzahl = geschrieben.readUInt16LE(4);
if (anzahl !== 3) throw new Error(`Die .ico meldet ${anzahl} Bilder statt 3.`);
for (let i = 0; i < anzahl; i++) {
  const e = 6 + i * 16;
  const g = geschrieben.readUInt8(e) || 256;
  const laenge = geschrieben.readUInt32LE(e + 8);
  const start = geschrieben.readUInt32LE(e + 12);
  const png = geschrieben.subarray(start, start + 8).toString('hex');
  if (!png.startsWith('89504e47')) throw new Error(`Bild ${g} in der .ico ist kein PNG.`);
  console.log(`  geprueft: ${g}x${g} im ICO, ${laenge} B, gueltiger PNG-Kopf`);
}
console.log(`\nFertig. Der Cache-Buster in site.json sollte danach erhoeht werden,`);
console.log(`sonst zeigen Browser das alte Symbol weiter.`);
