/* Die Entscheidung des Stand-Waechters, fuer sich geprueft.
 *
 * Der Waechter laedt die Seite neu - eine Handlung, die man nicht zuruecknimmt.
 * Deshalb wird die Regel dahinter einzeln geprueft und nicht nur ihr
 * Zusammenspiel im Browser: Sie muss bei jeder unbrauchbaren Antwort
 * schweigen und darf nur bei einer echten Abweichung ausschlagen. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { sollNeuLaden } from '../../public/js/stand.js';

const STAND = '348f46eaf3';

test('gleicher Stand: nichts tun', () => {
  assert.equal(sollNeuLaden(STAND, STAND), false);
});

test('abweichender Stand: neu laden', () => {
  assert.equal(sollNeuLaden(STAND, '0a1b2c3d4e'), true);
});

test('ungestempelte Seite bleibt unberuehrt', () => {
  // So sieht die Seite aus, solange sie aus public/ kommt statt aus dist/.
  assert.equal(sollNeuLaden('entwicklung', '0a1b2c3d4e'), false);
});

test('keine brauchbare Antwort loest nichts aus', () => {
  const kaputt = [
    null,
    undefined,
    '',
    'nicht-json',
    '<html>',
    '348f46eaf',
    '348f46eaf3x',
    'GHIJKLMNOP',
  ];
  for (const wert of kaputt) {
    assert.equal(
      sollNeuLaden(STAND, wert),
      false,
      `haette bei ${JSON.stringify(wert)} geschwiegen`
    );
  }
});

test('die Pruefung kann ueberhaupt ausschlagen', () => {
  /* Gegenprobe zum Test darueber: Waere die Regel immer falsch, blieben alle
     Faelle oben gruen und niemand merkte es. */
  assert.equal(sollNeuLaden(STAND, 'ffffffffff'), true);
});
