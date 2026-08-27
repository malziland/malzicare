/* Liest .env. Fehlt ein Pflichtwert, bricht der Aufrufer ab - lieber gar
 * nicht ausliefern als halb. */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.mjs';

export async function ladeEnv() {
  const datei = path.join(ROOT, '.env');
  if (!existsSync(datei)) return {};
  const werte = {};
  const text = await readFile(datei, 'utf8');
  for (const zeile of text.split('\n')) {
    const t = zeile.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const schluessel = t.slice(0, i).trim();
    let wert = t.slice(i + 1).trim();
    if (
      (wert.startsWith('"') && wert.endsWith('"')) ||
      (wert.startsWith("'") && wert.endsWith("'"))
    ) {
      wert = wert.slice(1, -1);
    }
    werte[schluessel] = wert;
  }
  return werte;
}

/** Holt Werte aus .env oder Umgebung. Fehlt einer, endet der Lauf hier -
 *  mit der Liste dessen, was fehlt, und ohne je einen Wert auszugeben. */
export async function pflichtwerte(namen) {
  const env = { ...(await ladeEnv()), ...process.env };
  const fehlend = namen.filter((n) => !env[n]);
  if (fehlend.length > 0) {
    console.error('Es fehlen Zugangsdaten:\n  ' + fehlend.join('\n  '));
    console.error('\nVorlage: .env.example nach .env kopieren und ausfuellen.');
    console.error('.env steht in .gitignore und darf niemals committet werden.');
    process.exit(2);
  }
  const out = {};
  for (const n of namen) out[n] = env[n];
  return out;
}
