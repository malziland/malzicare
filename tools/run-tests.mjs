/* Startet die Unit-Tests. Zaehlt vorher die Testdateien und bricht bei null ab.
 * Grund: Ein Aufrufmuster, das keine Datei trifft, ist der haeufigste stille
 * Ausfall einer Testkette - "keine Tests" darf nie wie "alles gruen" aussehen. */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, listFiles } from './paths.mjs';

const dir = path.join(ROOT, 'tests', 'unit');
const dateien = (await listFiles(dir)).filter((f) => f.endsWith('.test.mjs'));

if (dateien.length === 0) {
  console.error('Keine Testdatei in tests/unit gefunden. Das ist ein Fehlschlag, kein Hinweis.');
  process.exit(1);
}
console.log(`${dateien.length} Testdatei(en) gefunden.`);

try {
  execFileSync(process.execPath, ['--test', ...dateien.map((f) => path.join(dir, f))], {
    cwd: ROOT,
    stdio: 'inherit',
  });
} catch {
  process.exit(1);
}
