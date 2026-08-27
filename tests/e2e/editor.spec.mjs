import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#poster')).toBeVisible();
});

test('die Seite laedt ohne Fehler in der Konsole', async ({ page }) => {
  const fehler = [];
  page.on('console', (m) => m.type() === 'error' && fehler.push(m.text()));
  page.on('pageerror', (e) => fehler.push(String(e)));
  await page.reload();
  await expect(page.locator('#poster')).toBeVisible();
  expect(fehler, fehler.join('\n')).toHaveLength(0);
});

test('eine neue Regel erscheint auf dem Plakat', async ({ page }) => {
  const text = 'Keine Sprachnachrichten nach 20 Uhr';
  await page.click('#btnAddGood');
  const feld = page.locator('#listGood input[type="text"]').last();
  await feld.fill(text);
  await feld.blur();
  await expect(page.locator('#chat')).toContainText(text);
});

test('der Klassenname steht im Plakatkopf', async ({ page }) => {
  await page.fill('#inGroup', 'Klasse 2B');
  await page.locator('#inGroup').blur();
  await expect(page.locator('#phTitle')).toContainText('Klasse 2B');
});

test('ein Admin-Vorname landet in der Admin-Spalte', async ({ page }) => {
  await page.fill('#inAdmin', 'Yusuf');
  await page.click('#btnAddAdmin');
  await expect(page.locator('#posterAdmins')).toContainText('Yusuf');
});

test('der Wechsel der App aendert die Optik des Plakats', async ({ page }) => {
  const vorher = await page.locator('#poster').getAttribute('class');
  await page.click('#segSi');
  await expect
    .poll(async () => page.locator('#poster').getAttribute('class'))
    .not.toBe(vorher);
});

test('eingegebene Regeln ueberleben das Neuladen', async ({ page }) => {
  await page.fill('#inGroup', 'Klasse 3C');
  await page.locator('#inGroup').blur();
  await page.reload();
  await expect(page.locator('#inGroup')).toHaveValue('Klasse 3C');
});

test('der Entwurf wird als neutraler Binaertyp geladen', async ({ page }) => {
  // Der Dateiname traegt den Klassennamen, der Typ ist bewusst neutral -
  // sonst zeigt iPhone-Safari die Datei an, statt sie zu speichern.
  await page.fill('#inGroup', 'Klasse 4D');
  await page.locator('#inGroup').blur();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#btnSave'),
  ]);
  expect(download.suggestedFilename()).toBe('klassenchat-klasse-4d.json');
});

test('der PDF-Export liefert eine Datei mit dem erwarteten Namen', async ({ page }) => {
  test.slow();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60_000 }),
    page.click('#btnExport'),
  ]);
  expect(download.suggestedFilename()).toBe('Klassenchat-Regeln.pdf');
  const pfad = await download.path();
  expect(pfad).toBeTruthy();
});

test('der Editor ist mit der Tastatur bedienbar', async ({ page }) => {
  await page.keyboard.press('Tab');
  const erstes = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  expect(erstes).toBeTruthy();
  // Der sichtbare Fokus darf nicht wegformatiert sein.
  const umriss = await page.evaluate(() => {
    const el = document.querySelector('#btnAddGood');
    el.focus();
    const s = getComputedStyle(el);
    return { outline: s.outlineStyle, width: s.outlineWidth, schatten: s.boxShadow };
  });
  expect(
    umriss.outline !== 'none' || umriss.schatten !== 'none',
    `kein sichtbarer Fokus: ${JSON.stringify(umriss)}`
  ).toBeTruthy();
});
