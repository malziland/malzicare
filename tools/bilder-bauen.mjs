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

async function seite(breite, hoehe, skalierung = 1) {
  const ctx = await browser.newContext({
    viewport: { width: breite, height: hoehe },
    deviceScaleFactor: skalierung,
  });
  return { ctx, p: await ctx.newPage() };
}

// 1. Der Editor als Ganzes
{
  // Einfache Punktdichte genuegt: Im README wird das Bild ohnehin auf
  // Textbreite skaliert. Bei doppelter waren es 477 KB fuer nichts.
  const { ctx, p } = await seite(1440, 900, 1);
  await p.goto(basis + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  await p.screenshot({ path: path.join(ZIEL, 'editor.png') });
  await ctx.close();
  console.log('  docs/bilder/editor.png');
}

// 2. Das Plakat in allen vier Optiken, nebeneinander
{
  const { ctx, p } = await seite(1400, 520, 1);
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

// 3. Das Vorschaubild der Seite (og:image, 1200 x 630)
{
  const { ctx, p } = await seite(1200, 630, 2);
  await p.goto(basis + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  /* Gezeigt wird das Plakat mit der Wortmarke darueber - wer den Link teilt,
     soll sehen, was das Werkzeug macht UND wie es heisst. */
  const daten = await p.locator('#poster').screenshot();
  await p.setContent(`<body style="margin:0;width:1200px;height:630px;background:#f9f7f4;
      font-family:Poppins,system-ui,sans-serif;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:18px;overflow:hidden">
    <div style="display:inline-flex;align-items:center;gap:5px;font-size:34px;line-height:1;
        letter-spacing:-0.02em;color:#156480;font-weight:400">malzi<span
        style="display:inline-flex;align-items:center;justify-content:center;
        padding:6px 13.2px 8px 12.7px;border-radius:9px;background:#156480;color:#f9f7f4;
        font-weight:700">CARE</span></div>
    <div style="font-size:19px;color:#6e675e">Klassenchat-Regeln gemeinsam festlegen und als A3-Plakat drucken</div>
    <img src="data:image/png;base64,${daten.toString('base64')}"
      style="width:900px;height:360px;object-fit:cover;object-position:top center;
      border-radius:12px 12px 0 0;border:1px solid #e2ded8;border-bottom:none;
      box-shadow:0 8px 28px #0000000f">
  </body>`);
  await p.waitForTimeout(700);
  const fertig = await p.screenshot({ type: 'jpeg', quality: 88 });
  const { writeFile: schreib } = await import('node:fs/promises');
  await schreib(path.join(PUBLIC_DIR, 'assets', 'og-image.jpg'), fertig);
  console.log(`  public/assets/og-image.jpg  1200x630, ${Math.round(fertig.length / 1024)} KB`);
  await ctx.close();
}

// 4. Die Karte, die GitHub beim Teilen zeigt (1280 x 640)
{
  const { ctx, p } = await seite(1280, 640, 2);
  await p.goto(basis + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const daten = await p.locator('#poster').screenshot();
  await p.setContent(`<body style="margin:0;width:1280px;height:640px;background:#f9f7f4;
      font-family:Poppins,system-ui,sans-serif;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:14px;overflow:hidden">
    <div style="display:inline-flex;align-items:center;gap:5px;font-size:40px;line-height:1;
        letter-spacing:-0.02em;color:#156480;font-weight:400">malzi<span
        style="display:inline-flex;align-items:center;justify-content:center;
        padding:7px 15.5px 9px 14.9px;border-radius:11px;background:#156480;color:#f9f7f4;
        font-weight:700">CARE</span></div>
    <div style="font-size:20px;color:#404749;font-weight:500">Editor für Klassenchat-Regeln</div>
    <div style="font-size:15px;color:#6e675e">Läuft im Browser · kein Konto · kein Server · MIT-Lizenz</div>
    <img src="data:image/png;base64,${daten.toString('base64')}"
      style="width:920px;height:330px;object-fit:cover;object-position:top center;
      border-radius:12px 12px 0 0;border:1px solid #e2ded8;border-bottom:none;
      box-shadow:0 8px 28px #0000000f">
  </body>`);
  await p.waitForTimeout(700);
  /* Bewusst NICHT in docs/bilder: Die Karte wird einmal in den
     GitHub-Einstellungen hinterlegt und danach nie wieder gebraucht. Sie im
     Repo mitzuschleppen kostete 297 KB fuer einen einmaligen Handgriff. */
  const ablage = process.env.TMPDIR || '/tmp';
  await p.screenshot({ path: path.join(ablage, 'malzicare-github-vorschau.png') });
  console.log(`  ${ablage}/malzicare-github-vorschau.png  1280x640`);
  console.log('    -> einmalig unter Settings > General > Social preview hinterlegen');
  await ctx.close();
}

await browser.close();
server.close();
console.log('\nDie Bilder in docs/bilder/ liegen ausserhalb von public/ und werden nicht');
console.log('mit ausgeliefert. Das Vorschaubild der Seite (og-image.jpg) schon.');
