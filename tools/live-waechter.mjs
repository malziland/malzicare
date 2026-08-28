/* Misst am laufenden System, ob der Stand-Waechter tut, was er soll.
 *
 * live-check.mjs prueft, was auf dem Server LIEGT. Das beantwortet nicht die
 * Frage, ob der Waechter im Browser auch AUSSCHLAEGT - dafuer muss eine Seite
 * geladen und ein Tabwechsel nachgestellt werden. Genau das passiert hier, in
 * WebKit, weil es Safari am naechsten kommt und der gemeldete Fall dort auftrat.
 *
 * Zwei Proben, und die zweite ist die wichtigere:
 *   1. Der Server meldet einen anderen Stand  -> die Seite muss neu laden.
 *   2. Der Server meldet denselben Stand      -> die Seite muss stehenbleiben.
 * Ohne Probe 2 wuerde ein Waechter, der einfach immer neu laedt, als bestanden
 * durchgehen - und waere das schlimmere Problem.
 *
 * Aufruf: node tools/live-waechter.mjs [--adresse https://…]
 */
import { webkit } from 'playwright';
import { ladeEnv } from './env.mjs';

const args = process.argv.slice(2);
const i = args.indexOf('--adresse');
const env = { ...(await ladeEnv()), ...process.env };
const ZIEL = (i >= 0 ? args[i + 1] : env.LIVE_BASE_URL || '').replace(/\/?$/, '/');
if (!ZIEL || ZIEL === '/') {
  console.error('Keine Adresse: --adresse angeben oder LIVE_BASE_URL in .env setzen.');
  process.exit(2);
}

const browser = await webkit.launch();

async function probe({ fremderStand }) {
  const seite = await (await browser.newContext()).newPage();
  const abfragen = [];
  seite.on('request', (r) => {
    if (r.url().includes('version.json')) abfragen.push(r.url());
  });
  /* Der Waechter fragt hoechstens einmal je Minute nach. Statt eine Minute zu
     warten, wird nur Date.now vorgestellt - die Zeitgeber der Seite laufen
     unveraendert weiter, sonst misst man etwas anderes als gemeint. */
  await seite.addInitScript(() => {
    const echt = Date.now;
    let versatz = 0;
    Date.now = () => echt() + versatz;
    window.__zeitVor = (ms) => (versatz += ms);
    const n = Number(sessionStorage.getItem('laden') || '0') + 1;
    sessionStorage.setItem('laden', String(n));
  });
  if (fremderStand) {
    await seite.route('**/version.json*', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ commit_short: fremderStand }),
      })
    );
  }
  await seite.goto(ZIEL, { waitUntil: 'networkidle' });
  const stand = await seite.getAttribute('meta[name="malzicare-stand"]', 'content');

  await seite.evaluate(() => window.__zeitVor(61000));
  await seite.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await seite.waitForTimeout(4000);

  const ladevorgaenge = await seite.evaluate(() => Number(sessionStorage.getItem('laden') || '0'));
  await seite.context().close();
  return { stand, abfragen, ladevorgaenge };
}

const befunde = [];
console.log(`Gemessen gegen ${ZIEL} (WebKit)\n`);

const veraltet = await probe({ fremderStand: '0000000000' });
console.log('Probe 1 - der Server meldet einen anderen Stand:');
console.log(`  Kennung in der Seite: ${veraltet.stand}`);
console.log(`  version.json abgefragt: ${veraltet.abfragen.length}`);
console.log(`  Ladevorgaenge: ${veraltet.ladevorgaenge} (erwartet 2)`);
if (veraltet.abfragen.length === 0) befunde.push('Der Waechter hat gar nicht nachgefragt.');
if (veraltet.ladevorgaenge !== 2)
  befunde.push('Die Seite hat trotz fremdem Stand nicht neu geladen.');

const aktuell = await probe({ fremderStand: null });
console.log('\nProbe 2 - der Server meldet denselben Stand:');
console.log(`  Kennung in der Seite: ${aktuell.stand}`);
console.log(`  version.json abgefragt: ${aktuell.abfragen.length}`);
console.log(`  Ladevorgaenge: ${aktuell.ladevorgaenge} (erwartet 1)`);
if (aktuell.abfragen.length === 0) befunde.push('Der Waechter hat gar nicht nachgefragt.');
if (aktuell.ladevorgaenge !== 1) befunde.push('Die Seite hat ohne Anlass neu geladen.');

await browser.close();

if (befunde.length > 0) {
  console.error(`\n${befunde.length} Befund(e):`);
  for (const b of befunde) console.error('  - ' + b);
  process.exit(1);
}
console.log('\nDer Stand-Waechter arbeitet am laufenden System wie vorgesehen.');
