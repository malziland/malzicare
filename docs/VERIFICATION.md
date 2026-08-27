# Nachweise

Diese Datei ist die kanonische Quelle für alle veränderlichen Zahlen des
Projekts – Testanzahlen, Prüfumfänge, Messwerte. An keiner anderen Stelle
steht eine dieser Zahlen; sonst driften sie auseinander.

**Stand aller Einträge: 2026-08-27, Tag `v1.0.0`.** Auf einen Commit-Hash
verweist diese Datei bewusst nicht: Sie liegt selbst in dem Commit, den sie
benennen müsste. Welcher Stand gemeint ist, sagt `git rev-parse v1.0.0`.
Jeder Eintrag trägt einen Auslöser, der ihn ungültig macht. Ist er
eingetreten, gilt der Nachweis als offen, auch wenn hier noch „grün" steht.

## Grundlage

| Anforderung           | Befehl                         | Ergebnis                                                        | Ungültig, sobald                                  |
| --------------------- | ------------------------------ | --------------------------------------------------------------- | ------------------------------------------------- |
| Prüfkette vollständig | `npm run verify`               | 6 Schritte, alle grün                                           | jeder Commit                                      |
| Unit-Tests            | `npm run test:unit`            | 2 Testdateien, 8 Tests, 8 grün, 0 rot                           | jeder Commit                                      |
| Oberflächentests      | `npm run test:e2e`             | 36 grün (18 Tests × Chromium und WebKit)                        | jeder Commit                                      |
| Verweise und Adressen | `node tools/lint-html.mjs`     | 4 Seiten, 46 lokale Verweise, 18 eigene Adressen, keine Befunde | jede Änderung in `public/`                        |
| Geheimnis-Scan        | `npm run scan:secrets`         | 52 versionierte Textdateien, 6 Muster, keine Funde              | jeder Commit, spätestens vor der Veröffentlichung |
| Abhängigkeiten        | `npm audit --audit-level=high` | läuft in der Pipeline bei jedem Push                            | jede Änderung an `package-lock.json`              |

## Dass die Prüfungen überhaupt scheitern können

Eine Prüfung, die nicht rot werden kann, ist selbst der Befund. Jede der
folgenden Gegenproben wurde ausgeführt, nicht überlegt.

| Prüfung              | Gegenprobe                                             | Ergebnis                                      | Ungültig, sobald                      |
| -------------------- | ------------------------------------------------------ | --------------------------------------------- | ------------------------------------- |
| Linter               | Datei mit ungenutzter und undefinierter Variable       | rot, 2 Befunde                                | Änderung an `eslint.config.js`        |
| Paketvollständigkeit | `.htaccess` aus `public/` entfernt                     | rot: „die unsichtbare .htaccess ist dabei"    | Änderung an `tools/build.mjs`         |
| Download-Typ         | PDF-Blob auf `application/pdf` gesetzt                 | rot                                           | Änderung an `saveFile`/`runPdfExport` |
| Verwaiste Dateien    | unbenutzte Datei in `public/assets/` abgelegt          | rot, 1 Befund                                 | Änderung an `tools/lint-html.mjs`     |
| Cache-Buster         | Zustand vor der Behebung                               | rot, 3 Befunde                                | Änderung an `site.json`               |
| Geheimnis-Scan       | Datei mit echtem Passwort-Literal und Zugangsdaten-URL | rot, 2 Funde                                  | Änderung an den Mustern               |
| Geheimnis-Scan       | 4 Gegenproben wie `password: env.FTP_PASSWORD`         | schweigt, wie es soll (im Selbsttest geprüft) | Änderung an den Mustern               |
| axe-Messung          | kontrastarmes Element in die Seite eingefügt           | rot                                           | Änderung an der Messfunktion          |
| Test-Runner          | Aufrufmuster ohne Treffer                              | rot: „Keine Testdatei gefunden"               | Änderung an `tools/run-tests.mjs`     |
| Live-Prüfung         | `node tools/live-check.mjs --negativprobe`             | **offen** – braucht die laufende Seite        | sobald Zugangsdaten vorliegen         |

## Barrierefreiheit (Profil UI)

| Anforderung                       | Befehl                       | Ergebnis                                                              | Ungültig, sobald              |
| --------------------------------- | ---------------------------- | --------------------------------------------------------------------- | ----------------------------- |
| WCAG 2.1 AA, alle Seiten          | `npm run test:e2e`           | 4 Seiten ohne schwere Verstöße                                        | jede CSS- oder HTML-Änderung  |
| WCAG 2.1 AA, alle App-Optiken     | `npm run test:e2e`           | WhatsApp, Snapchat, TikTok, Signal ohne schwere Verstöße              | jede Änderung an `poster.css` |
| Benannte Ausnahmen                | ebd., Ausgabe bei jedem Lauf | 2: Uhrzeiten der Chatblasen, Beschriftung der Eingabezeile (ADR-0003) | jede Änderung an ADR-0003     |
| Tastaturbedienung, Fokus sichtbar | `npm run test:e2e`           | grün                                                                  | jede Änderung an `editor.css` |
| Manuelle Prüfung mit Screenreader | –                            | **offen** – vor der Veröffentlichung des Repos durchzuführen          | –                             |

## Reproduzierbarkeit und Rückweg

| Anforderung               | Befehl                                                                 | Ergebnis                                                                             | Ungültig, sobald               |
| ------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------ |
| Rollback-Probe            | `git worktree add --detach <tmp> v1.0.0` + `npm ci` + `npm run verify` | 68 Dateien, alle 6 Schritte grün                                                     | jeder neue Tag                 |
| Reproduzierbarer Build    | ebd. + `node tools/build.mjs`                                          | 34 Dateien + `version.json`, Kennung gleich dem getaggten Commit, Arbeitsbaum sauber | jeder neue Tag                 |
| Auslieferung, Trockenlauf | `node tools/deploy.mjs --probe`                                        | Riegel greifen; ohne Zugangsdaten Rückgabewert 2, kein Teil-Upload                   | Änderung an `tools/deploy.mjs` |

## Was noch offen ist

**Die Auslieferung ist nie gelaufen.** Die FTP-Zugangsdaten liegen nicht vor
(Stand 27.08.2026). Damit sind unbewiesen: der Upload selbst, die Messung des
Live-Standes, die Wirkungsprüfung der `.htaccess` und deren Negativprobe.
Prüfbar, sobald die Zugangsdaten in `.env` stehen – der Ablauf dafür steht im
Runbook.

**Die Pipeline ist nie gelaufen.** Sie ist angelegt, aber das Repository hat
noch keine Gegenstelle. Prüfbar mit dem ersten Push.

**Screenreader-Prüfung von Hand.** Automatische Prüfung findet nur einen Teil.
Fällig vor der Veröffentlichung des Repositories.

## Abnahme

Alle Nachweise dieser Datei wurden in derselben Sitzung erzeugt, in der die
geprüften Änderungen entstanden sind. **Selbst abgenommen** – die
Vollständigkeit gilt als unbestätigt, bis ein späterer Lauf sie prüft.
