/* Der Stand-Waechter im Browser, gemessen am gebauten Paket.
 *
 * Absichtlich nicht gegen public/: Dort steht nur der Platzhalter, und der
 * Waechter waere aus. Geprueft wird das, was auch auf den Webspace geht -
 * mit echter Kennung in der Seite und echter version.json daneben. Nur die
 * Antwort des Servers wird im ersten Fall verfaelscht, damit ein Stand
 * entsteht, wie ihn ein tagelang offener Tab sieht.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from '../../tools/serve.mjs';
import { build } from '../../tools/build.mjs';
import { test, expect } from './hilfen.mjs';

const ANDERER_STAND = '0123456789';
let server;
let basis;
let ziel;

test.beforeAll(async () => {
  /* Eigenes Verzeichnis statt dist/: Ein Testlauf soll das Auslieferpaket im
     Arbeitsbaum nicht anfassen. */
  ziel = await mkdtemp(path.join(tmpdir(), 'malzicare-e2e-'));
  await build({ quiet: true, ziel });
  server = createServer(ziel);
  await new Promise((fertig) => server.listen(0, fertig));
  basis = `http://localhost:${server.address().port}/`;
});

test.afterAll(async () => {
  await new Promise((fertig) => server.close(fertig));
  await rm(ziel, { recursive: true, force: true });
});

/* Zaehlt die Ladevorgaenge und macht die Uhr vorspulbar. Nur Date.now wird
   ersetzt - genau das, woran der Mindestabstand des Waechters haengt. Die
   Zeitgeber der Seite laufen unveraendert weiter, sonst wuerde der Editor
   beim Start stehenbleiben und der Test etwas anderes messen als gemeint. */
async function vorbereiten(page) {
  await page.addInitScript(() => {
    const echteZeit = Date.now;
    let versatz = 0;
    Date.now = () => echteZeit() + versatz;
    window.__zeitVor = (ms) => {
      versatz += ms;
    };
    const bisher = Number(sessionStorage.getItem('ladezaehler') || '0');
    sessionStorage.setItem('ladezaehler', String(bisher + 1));
  });
}

const ladevorgaenge = (page) =>
  page.evaluate(() => Number(sessionStorage.getItem('ladezaehler') || '0'));

/** Der Moment, um den es geht: Jemand kehrt zu einem lange offenen Tab zurueck. */
async function zurueckZumTab(page) {
  await page.evaluate(() => window.__zeitVor(61000));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
}

test('ein veralteter Tab laedt bei der Rueckkehr neu', async ({ page }) => {
  await vorbereiten(page);
  await page.route('**/version.json*', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ commit_short: ANDERER_STAND }),
    })
  );

  await page.goto(basis);
  expect(await ladevorgaenge(page)).toBe(1);

  await zurueckZumTab(page);
  await page.waitForFunction(
    () => Number(sessionStorage.getItem('ladezaehler') || '0') === 2,
    null,
    { timeout: 15000 }
  );
});

test('der Arbeitsstand ueberlebt das Neuladen', async ({ page }) => {
  await vorbereiten(page);
  await page.route('**/version.json*', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ commit_short: ANDERER_STAND }),
    })
  );

  await page.goto(basis);
  await page.fill('#inGroup', 'Klasse 3C');

  /* Der Cursor steht noch im Feld - dort wird nicht neu geladen. Erst wenn
     er es verlaesst, ist der Moment guenstig. */
  await zurueckZumTab(page);
  await page.waitForTimeout(1500);
  expect(await ladevorgaenge(page)).toBe(1);

  await page.locator('#inGroup').blur();
  await zurueckZumTab(page);
  await page.waitForFunction(
    () => Number(sessionStorage.getItem('ladezaehler') || '0') === 2,
    null,
    { timeout: 15000 }
  );
  await expect(page.locator('#inGroup')).toHaveValue('Klasse 3C');
});

test('bei uebereinstimmendem Stand bleibt die Seite stehen', async ({ page }) => {
  /* Gegenprobe: Ohne sie bewiese der Test oben nur, dass die Seite ueberhaupt
     neu laedt - nicht, dass sie es aus dem richtigen Grund tut. */
  await vorbereiten(page);
  await page.goto(basis);
  await zurueckZumTab(page);
  await page.waitForTimeout(2000);
  expect(await ladevorgaenge(page)).toBe(1);
});

test('eine anhaltende Abweichung laedt trotzdem nur einmal neu', async ({ page }) => {
  /* Der gefaehrlichste Ausfall waere eine Schleife: Liegt auf dem Server eine
     halb ausgelieferte Fassung, meldet version.json dauerhaft etwas anderes,
     als in der Seite steht. */
  await vorbereiten(page);
  await page.route('**/version.json*', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ commit_short: ANDERER_STAND }),
    })
  );

  await page.goto(basis);
  await zurueckZumTab(page);
  await page.waitForFunction(
    () => Number(sessionStorage.getItem('ladezaehler') || '0') === 2,
    null,
    { timeout: 15000 }
  );

  await zurueckZumTab(page);
  await page.waitForTimeout(2000);
  expect(await ladevorgaenge(page)).toBe(2);
});

test('im Foto-Modus laedt nichts neu', async ({ page }) => {
  /* Waehrend eine Aufnahme entsteht, darf die Seite nicht unter der Kamera
     verschwinden. */
  await vorbereiten(page);
  await page.route('**/version.json*', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ commit_short: ANDERER_STAND }),
    })
  );

  await page.goto(basis + '?foto');
  await zurueckZumTab(page);
  await page.waitForTimeout(2000);
  expect(await ladevorgaenge(page)).toBe(1);
});
