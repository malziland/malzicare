import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SEITEN = ['/', '/impressum.html', '/datenschutz.html', '/agb.html'];
const APPS = [
  ['segWa', 'WhatsApp'],
  ['segSc', 'Snapchat'],
  ['segTt', 'TikTok'],
  ['segSi', 'Signal'],
];

/* Bekannte, benannte Ausnahmen. Sie werden bei JEDEM Lauf ausgegeben, auch
 * wenn der Test gruen ist - eine Ausnahme, die niemand mehr sieht, ist nach
 * zwei Monaten kein Sonderfall mehr, sondern der Normalzustand. */
const AUSNAHMEN = [
  {
    treffer: '.b-time',
    grund: 'Uhrzeiten der Chat-Nachbildung: bilden die Optik der echten App nach',
  },
  {
    treffer: '.ph-placeholder',
    grund: 'Beschriftung der nachgebildeten Eingabezeile, gehoert zur App-Optik',
  },
];

/* Die Rechtsseiten blenden ihre Abschnitte ein (@keyframes fadeIn). Wer
 * waehrenddessen misst, bekommt die Kontrastwerte einer halbdurchsichtigen
 * Seite - so entstanden 79 Verstoesse, von denen keiner echt war. */
async function seiteRuhigstellen(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await Promise.all(
      document.getAnimations().map((a) => {
        a.finish();
        return a.finished.catch(() => {});
      })
    );
  });
}

function ausgenommen(node) {
  const ziel = node.target.join(' ');
  return AUSNAHMEN.find((a) => ziel.includes(a.treffer));
}

async function pruefe(page, name) {
  const ergebnis = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const schwer = ergebnis.violations.filter((v) => ['critical', 'serious'].includes(v.impact));

  const offen = [];
  const stillgelegt = new Map();
  for (const v of schwer) {
    for (const n of v.nodes) {
      const a = ausgenommen(n);
      if (a) stillgelegt.set(a.grund, (stillgelegt.get(a.grund) || 0) + 1);
      else offen.push(`${v.id} (${v.impact}): ${n.target.join(' ')} :: ${n.failureSummary?.split('\n')[1]?.trim()}`);
    }
  }
  for (const [grund, anzahl] of stillgelegt) {
    console.log(`  [Ausnahme] ${name}: ${anzahl}x - ${grund}`);
  }
  expect(offen, offen.join('\n')).toHaveLength(0);
}

test('die Messung selbst schlaegt bei schlechtem Kontrast an', async ({ page }) => {
  // Ohne diese Probe waere ein gruener Lauf nicht unterscheidbar von einer
  // Pruefung, die gar nichts mehr misst.
  await page.goto('/impressum.html');
  await seiteRuhigstellen(page);
  await page.evaluate(() => {
    const p = document.createElement('p');
    p.textContent = 'Absichtlich unlesbarer Text fuer die Gegenprobe';
    p.style.cssText = 'color:#eeeeee;background:#ffffff;font-size:14px;padding:8px';
    document.body.prepend(p);
  });
  const ergebnis = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
  const treffer = ergebnis.violations.filter((v) => v.id === 'color-contrast');
  expect(treffer.length, 'axe findet den eingebauten Kontrastfehler nicht').toBeGreaterThan(0);
});

for (const pfad of SEITEN) {
  test(`Barrierefreiheit: ${pfad}`, async ({ page }) => {
    await page.goto(pfad);
    await seiteRuhigstellen(page);
    await pruefe(page, pfad);
  });
}

for (const [id, name] of APPS) {
  test(`Barrierefreiheit des Plakats in ${name}-Optik`, async ({ page }) => {
    await page.goto('/');
    await page.click(`#${id}`);
    await seiteRuhigstellen(page);
    await pruefe(page, name);
  });
}
