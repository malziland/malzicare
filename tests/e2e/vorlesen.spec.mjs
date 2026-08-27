import { test, expect } from './hilfen.mjs';

/* Was ein Screenreader vorliest, steht nicht im HTML, sondern im
 * Barrierefreiheitsbaum, den der Browser daraus bildet. Diese Pruefungen
 * lesen genau diesen Baum.
 *
 * Sie ersetzen KEINE Pruefung durch einen Menschen mit VoiceOver - Sprachfluss,
 * Verstaendlichkeit und Reihenfolge im Betrieb beurteilt nur, wer wirklich
 * damit arbeitet. Sie fangen aber die Fehler ab, die dabei am meisten stoeren:
 * unbenannte Schaltflaechen, Felder ohne Beschriftung, fehlende Bereiche.
 */

const SEITEN = ['/', '/impressum.html', '/datenschutz.html', '/agb.html'];

test('jede Schaltflaeche und jedes Feld hat einen vorlesbaren Namen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#poster')).toBeVisible();

  const ohneNamen = await page.evaluate(() => {
    const treffer = [];
    const bedienbar = document.querySelectorAll(
      'button, input, select, textarea, a[href], [role="button"], [role="tab"]'
    );
    for (const el of bedienbar) {
      if (el.closest('[aria-hidden="true"]') || el.hidden) continue;
      const name =
        el.getAttribute('aria-label') ||
        (el.labels && el.labels[0] && el.labels[0].textContent) ||
        el.textContent?.trim() ||
        el.getAttribute('title') ||
        el.getAttribute('placeholder') ||
        '';
      if (!name.trim()) {
        treffer.push(
          `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + String(el.className).split(' ')[0] : ''}`
        );
      }
    }
    return treffer;
  });
  expect(ohneNamen, `ohne vorlesbaren Namen: ${ohneNamen.join(', ')}`).toHaveLength(0);
});

test('die Seite hat die Bereiche, ueber die ein Screenreader springt', async ({ page }) => {
  await page.goto('/');
  const bereiche = await page.evaluate(() => ({
    ueberschrift1: document.querySelectorAll('h1').length,
    haupt: document.querySelectorAll('main, [role="main"]').length,
    fuss: document.querySelectorAll('footer, [role="contentinfo"]').length,
    kopf: document.querySelectorAll('header, [role="banner"]').length,
  }));
  expect(bereiche.ueberschrift1, 'genau eine erste Ueberschrift erwartet').toBe(1);
  expect(bereiche.haupt, 'kein Hauptbereich').toBeGreaterThan(0);
  expect(bereiche.kopf, 'kein Kopfbereich').toBeGreaterThan(0);
  expect(bereiche.fuss, 'kein Fussbereich').toBeGreaterThan(0);
});

test('die Ueberschriften steigen ohne Sprung', async ({ page }) => {
  for (const pfad of SEITEN) {
    await page.goto(pfad);
    const stufen = await page.evaluate(() =>
      [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]))
    );
    let vorher = 0;
    for (const stufe of stufen) {
      expect(
        stufe - vorher,
        `${pfad}: Sprung von h${vorher} auf h${stufe} - ein Screenreader meldet eine fehlende Ebene`
      ).toBeLessThanOrEqual(1);
      vorher = stufe;
    }
  }
});

test('die Listen der Seitenleiste sind als Listen angesagt', async ({ page }) => {
  await page.goto('/');
  // Wer die Regeln durchhoert, muss wissen, wie viele es sind und wo er ist.
  const listen = await page.evaluate(() =>
    [...document.querySelectorAll('#listGood, #listBad, #listPen')].map((l) => ({
      id: l.id,
      rolle: l.getAttribute('role') || l.tagName.toLowerCase(),
      beschriftet: !!(l.getAttribute('aria-label') || l.getAttribute('aria-labelledby')),
      eintraege: l.children.length,
    }))
  );
  for (const l of listen) {
    expect(l.eintraege, `${l.id} ist leer`).toBeGreaterThan(0);
    expect(l.beschriftet, `${l.id} hat keine vorlesbare Beschriftung`).toBeTruthy();
  }
});

test('der Dialog meldet sich als Dialog und faengt den Fokus', async ({ page }) => {
  await page.goto('/');
  await page.click('#btnReset');
  const dialog = page.locator('#mlModal .modal');
  await expect(dialog).toHaveAttribute('role', 'dialog');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toHaveAttribute('aria-labelledby', /.+/);
  // Der Titel, auf den verwiesen wird, muss auch Text haben.
  const titel = await page.locator('#mlModalTitle').textContent();
  expect(titel?.trim().length, 'der Dialogtitel ist leer').toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#mlModal')).toBeHidden();
});

test('das Plakat ist keine Bilderwueste: sein Inhalt steht als Text da', async ({ page }) => {
  await page.goto('/');
  // Das Plakat wird als HTML gezeichnet, nicht als Bild. Wer es vorliest,
  // muss die Regeln hoeren koennen - sonst waere der Editor fuer blinde
  // Lehrkraefte unbenutzbar.
  const text = await page.locator('#poster').innerText();
  expect(text).toContain('Hausübungen');
  expect(text).toContain('Verwarnung');
  expect(text.length, 'das Plakat gibt kaum Text her').toBeGreaterThan(200);
});
