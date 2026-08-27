/* Erzeugt die Bilder, die das Projekt vorstellen - aus der laufenden Seite,
 * nicht von Hand abfotografiert. Wer die Oberflaeche aendert, laesst das
 * Skript neu laufen; so zeigt das README nie einen Stand, den es nicht gibt.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, PUBLIC_DIR } from './paths.mjs';
import { createServer } from './serve.mjs';

const ZIEL = path.join(ROOT, 'docs', 'bilder');
await mkdir(ZIEL, { recursive: true });

const server = createServer(PUBLIC_DIR);
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const basis = `http://localhost:${port}`;

const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();

async function seite(breite, hoehe, skalierung = 2) {
  const ctx = await browser.newContext({
    viewport: { width: breite, height: hoehe },
    deviceScaleFactor: skalierung,
  });
  return { ctx, p: await ctx.newPage() };
}

// 1. Der Editor als Ganzes
{
  const { ctx, p } = await seite(1440, 900);
  await p.goto(basis + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  await p.screenshot({ path: path.join(ZIEL, 'editor.png') });
  await ctx.close();
  console.log('  docs/bilder/editor.png');
}

// 2. Das Plakat in allen vier Optiken, nebeneinander
{
  const { ctx, p } = await seite(1400, 520, 2);
  const bilder = [];
  for (const [id, name] of [
    ['segWa', 'WhatsApp'],
    ['segSc', 'Snapchat'],
    ['segTt', 'TikTok'],
    ['segSi', 'Signal'],
  ]) {
    await p.goto(basis + '/', { waitUntil: 'networkidle' });
    await p.click('#' + id);
    await p.waitForTimeout(700);
    const bild = await p.locator('#poster').screenshot();
    bilder.push({ name, daten: 'data:image/png;base64,' + bild.toString('base64') });
  }
  await p.setContent(`<body style="margin:0;background:#f9f7f4;font-family:system-ui;padding:22px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:1340px">
      ${bilder
        .map(
          (b) => `<figure style="margin:0">
        <img src="${b.daten}" style="width:100%;display:block;border-radius:8px;border:1px solid #e2ded8">
        <figcaption style="font-size:13px;color:#6e675e;margin-top:7px">${b.name}</figcaption></figure>`
        )
        .join('')}
    </div></body>`);
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(ZIEL, 'vier-optiken.png'), fullPage: true });
  await ctx.close();
  console.log('  docs/bilder/vier-optiken.png');
}

await browser.close();
server.close();
console.log('\nBilder liegen in docs/bilder/ - ausserhalb von public/, sie werden also');
console.log('nicht mit ausgeliefert.');
