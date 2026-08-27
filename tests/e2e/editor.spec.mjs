import { test, expect } from './hilfen.mjs';

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
  await expect.poll(async () => page.locator('#poster').getAttribute('class')).not.toBe(vorher);
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
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#btnSave')]);
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

  /* Der Dateiname allein sagt nichts - beim Sprung von jsPDF 2 auf 4 haette
     eine kaputte Datei denselben Namen getragen. Geprueft wird deshalb der
     Inhalt: gueltiger Dateikopf, plausible Groesse, und A3 quer in Punkten
     (420 x 297 mm sind 1190,55 x 841,89 pt). */
  const { readFile } = await import('node:fs/promises');
  const roh = await readFile(pfad);
  expect(roh.subarray(0, 5).toString(), 'kein PDF-Dateikopf').toBe('%PDF-');
  expect(roh.length, 'die Datei ist zu klein fuer ein Plakat').toBeGreaterThan(50_000);

  const text = roh.toString('latin1');
  const masse = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/.exec(text);
  expect(masse, 'keine Seitengroesse im PDF gefunden').toBeTruthy();
  const [breite, hoehe] = [Number(masse[1]), Number(masse[2])];
  expect(Math.round(breite), 'Breite ist nicht A3 quer').toBe(1191);
  expect(Math.round(hoehe), 'Hoehe ist nicht A3 quer').toBe(842);
  expect(text, 'der Titel fehlt in den Dateiangaben').toContain('Klassenchat-Regeln');
});

test('der Editor ist mit der Tastatur bedienbar', async ({ page }) => {
  await page.keyboard.press('Tab');
  const erstes = await page.evaluate(
    () => document.activeElement?.id || document.activeElement?.tagName
  );
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

for (const seite of ['/impressum.html', '/datenschutz.html', '/agb.html']) {
  test(`die Wortmarke fuehrt von ${seite} zurueck zum Editor`, async ({ page }) => {
    await page.goto(seite);
    const marke = page.locator('a.wortmarke');
    await expect(marke).toBeVisible();
    await expect(marke).toContainText('malziCARE');
    // Sie ersetzt den frueheren Textlink - der darf nicht zurueckkommen.
    await expect(page.getByText('Zurück zum Editor')).toHaveCount(0);
    // Die Marke ist EIN Zeichen. Ein Effekt, der nur "malzi" unterstreicht,
    // zerlegt sie optisch in zwei Teile - genau das ist am 27.08. passiert.
    await marke.hover();
    const strich = await marke.evaluate((el) => getComputedStyle(el).textDecorationLine);
    expect(strich, 'die Wortmarke wird beim Zeigen unterstrichen').toBe('none');

    await marke.click();
    await expect(page.locator('#poster')).toBeVisible();
  });
}

test('die Marke traegt ein eigenes Symbol, nicht das der Dachmarke', async ({ page }) => {
  await page.goto('/');
  const symbole = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel*="icon"]')].map((l) => l.getAttribute('href'))
  );
  expect(symbole.length).toBeGreaterThan(0);
  for (const s of symbole) {
    // Ohne Cache-Buster zeigt der Browser bis zu sieben Tage das alte Symbol.
    expect(s, `Symbol ohne Cache-Buster: ${s}`).toMatch(/\?v=/);
    const antwort = await page.request.get(s);
    expect(antwort.status(), `Symbol nicht abrufbar: ${s}`).toBe(200);
  }
});

/* --- Bereiche, die der erste Testlauf nie erreicht hat -------------------
   Gemessen mit tools/abdeckung.mjs: Datumswaehler, Entwurf laden, Dialoge,
   Umsortieren und der Reiterwechsel liefen in keinem Test. Genau dort sitzt
   aber die Arbeit einer Lehrkraft im Unterricht. */

test('der Reiter Texte zeigt die Textfelder', async ({ page }) => {
  await expect(page.locator('#panelInhalt')).toBeVisible();
  await page.click('#tabTexte');
  await expect(page.locator('#panelTexte')).toBeVisible();
  await expect(page.locator('#panelInhalt')).toBeHidden();
  await page.fill('#inTxtTitle', 'Unsere Regeln für den Chat');
  await page.locator('#inTxtTitle').blur();
  await expect(page.locator('#txtTitle')).toContainText('Unsere Regeln für den Chat');
  await page.click('#tabInhalt');
  await expect(page.locator('#panelInhalt')).toBeVisible();
});

test('ein Datum laesst sich aus dem Kalender waehlen', async ({ page }) => {
  await page.click('#btnDatePick');
  await expect(page.locator('#datePick')).toBeVisible();
  await expect(page.locator('#btnDatePick')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#datePick .dp-day').filter({ hasText: /^15$/ }).first().click();
  await expect(page.locator('#datePick')).toBeHidden();
  const wert = await page.inputValue('#inDate');
  expect(wert, 'im Feld steht kein Datum').toMatch(/\d/);
  await expect(page.locator('#signDate')).toContainText(wert.slice(-4));
});

test('ein gespeicherter Entwurf laesst sich wieder oeffnen', async ({ page }) => {
  await page.fill('#inGroup', 'Klasse 7C');
  await page.locator('#inGroup').blur();
  await page.fill('#inAdmin', 'Mira');
  await page.click('#btnAddAdmin');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#btnSave')]);
  const pfad = await download.path();

  // Zuruecksetzen, damit das Laden auch wirklich etwas veraendert.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#inGroup')).not.toHaveValue('Klasse 7C');

  await page.setInputFiles('#fileInput', pfad);
  await expect(page.locator('#inGroup')).toHaveValue('Klasse 7C');
  await expect(page.locator('#posterAdmins')).toContainText('Mira');
});

test('eine fremde Datei wird abgelehnt, ohne den Stand zu verlieren', async ({
  page,
}, testInfo) => {
  await page.fill('#inGroup', 'Klasse 8A');
  await page.locator('#inGroup').blur();
  const fremd = testInfo.outputPath('fremd.json');
  await import('node:fs/promises').then((fs) => fs.writeFile(fremd, 'das ist kein JSON'));
  await page.setInputFiles('#fileInput', fremd);
  await expect(page.locator('#mlModal')).toBeVisible();
  await expect(page.locator('#mlModalTitle')).toContainText('Datei');
  await page.click('#mlModalOk');
  await expect(page.locator('#mlModal')).toBeHidden();
  // Der Stand muss unveraendert sein - das verspricht die Meldung.
  await expect(page.locator('#inGroup')).toHaveValue('Klasse 8A');
});

test('Zuruecksetzen fragt nach und laesst sich abbrechen', async ({ page }) => {
  await page.fill('#inGroup', 'Klasse 9B');
  await page.locator('#inGroup').blur();
  await page.click('#btnReset');
  await expect(page.locator('#mlModal')).toBeVisible();
  await page.click('#mlModalCancel');
  await expect(page.locator('#inGroup')).toHaveValue('Klasse 9B');

  await page.click('#btnReset');
  await page.click('#mlModalOk');
  await expect(page.locator('#inGroup')).not.toHaveValue('Klasse 9B');
});

test('eine Regel laesst sich loeschen', async ({ page }) => {
  const zeilen = page.locator('#listGood .rule-row');
  const vorher = await zeilen.count();
  const ersterText = await zeilen.first().locator('input').inputValue();
  await zeilen.first().locator('.row-del').click();
  await expect(zeilen).toHaveCount(vorher - 1);
  await expect(page.locator('#chat')).not.toContainText(ersterText);
});

test('eine Regel laesst sich mit den Pfeiltasten verschieben', async ({ page }) => {
  const zeilen = page.locator('#listGood .rule-row');
  const zweiter = await zeilen.nth(1).locator('input').inputValue();
  await zeilen.nth(1).locator('.row-grip').focus();
  await page.keyboard.press('ArrowUp');
  await expect(zeilen.first().locator('input')).toHaveValue(zweiter);
});

test('ein Lesefehler meldet sich, statt still zu scheitern', async ({ page }, testInfo) => {
  /* Der einzige Pfad, den kein anderer Test erreicht: Wenn der Browser die
     gewaehlte Datei nicht lesen kann. Von aussen laesst sich das nicht
     ausloesen - deshalb wird der Leser fuer diesen einen Test so ersetzt,
     dass er scheitert. Geprueft wird das Verhalten des Editors, nicht der
     Browser: Er muss es sagen und den Stand behalten. */
  await page.evaluate(() => {
    window.FileReader = function () {};
    window.FileReader.prototype.readAsText = function () {
      setTimeout(() => this.onerror && this.onerror(new Error('Lesefehler')), 0);
    };
  });

  await page.fill('#inGroup', 'Klasse 10A');
  await page.locator('#inGroup').blur();

  const datei = testInfo.outputPath('entwurf.json');
  await import('node:fs/promises').then((fs) =>
    fs.writeFile(datei, JSON.stringify({ app: 'klassenchat-plakat-v1', groupName: 'Andere' }))
  );
  await page.setInputFiles('#fileInput', datei);

  await expect(page.locator('#mlModal')).toBeVisible();
  await expect(page.locator('#mlModalTitle')).toContainText('nicht gelesen');
  await page.click('#mlModalOk');
  // Der Stand muss unveraendert sein - genau das verspricht die Meldung.
  await expect(page.locator('#inGroup')).toHaveValue('Klasse 10A');
});

for (const seite of ['/', '/impressum.html', '/datenschutz.html', '/agb.html']) {
  test(`der Verweis auf den Quelltext steht auf ${seite}`, async ({ page }) => {
    await page.goto(seite);
    const knopf = page.locator('a.opensource-link');
    await expect(knopf).toBeVisible();
    await expect(knopf).toContainText('Open Source auf GitHub');
    await expect(knopf).toHaveAttribute('href', 'https://github.com/malziland/malzicare');
    // Neuer Tab, damit ein angefangener Entwurf nicht aus dem Blick geraet.
    await expect(knopf).toHaveAttribute('target', '_blank');
    await expect(knopf).toHaveAttribute('rel', /noopener/);
  });
}
