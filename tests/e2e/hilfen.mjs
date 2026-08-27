/* Erweitert Playwrights `test` um das Sammeln der Code-Abdeckung.
 *
 * Gemessen wird, was die Tests TATSAECHLICH ausfuehren - deshalb haengt die
 * Messung an den Tests selbst und nicht an einem Skript daneben, das
 * womoeglich andere Wege geht.
 *
 * Nur Chromium kann das; in WebKit laeuft alles unveraendert weiter.
 */
import { test as basis, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ABLAGE = path.join(WURZEL, '.abdeckung');

export const test = basis.extend({
  page: async ({ page, browserName }, benutzen, testInfo) => {
    const misst = browserName === 'chromium';
    if (misst) await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await benutzen(page);
    if (!misst) return;
    let daten;
    try {
      daten = await page.coverage.stopJSCoverage();
    } catch {
      return; // Seite schon geschlossen - dann gibt es nichts zu messen.
    }
    const eigen = daten.filter((e) => e.url.includes('/js/') && !e.url.includes('/vendor/'));
    if (eigen.length === 0) return;
    await mkdir(ABLAGE, { recursive: true });
    const name = testInfo.title.replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 60);
    await writeFile(
      path.join(ABLAGE, `${name}-${testInfo.workerIndex}-${testInfo.retry}.json`),
      JSON.stringify(eigen)
    );
  },
});

export { expect };
