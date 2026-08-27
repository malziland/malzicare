# Nachweise

Diese Datei ist die kanonische Quelle für alle veränderlichen Zahlen des
Projekts – Testanzahlen, Prüfumfänge, Messwerte. An keiner anderen Stelle
steht eine dieser Zahlen; sonst driften sie auseinander.

**Stand aller Einträge: 2026-08-27, Tag `v1.3.0`.** Auf einen Commit-Hash
verweist diese Datei bewusst nicht: Sie liegt selbst in dem Commit, den sie
benennen müsste. Welcher Stand gemeint ist, sagt `git rev-parse v1.0.0`.
Jeder Eintrag trägt einen Auslöser, der ihn ungültig macht. Ist er
eingetreten, gilt der Nachweis als offen, auch wenn hier noch „grün" steht.

## Grundlage

| Anforderung           | Befehl                              | Ergebnis                                                                                                 | Ungültig, sobald                                  |
| --------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Prüfkette vollständig | `npm run verify`                    | 6 Schritte, alle grün                                                                                    | jeder Commit                                      |
| Unit-Tests            | `npm run test:unit`                 | 2 Testdateien, 8 Tests, 8 grün, 0 rot                                                                    | jeder Commit                                      |
| Oberflächentests      | `npm run test:e2e`                  | 36 grün (18 Tests × Chromium und WebKit)                                                                 | jeder Commit                                      |
| Verweise und Adressen | `node tools/lint-html.mjs`          | 4 Seiten, 46 lokale Verweise, 18 eigene Adressen, keine Befunde                                          | jede Änderung in `public/`                        |
| Geheimnis-Scan        | `npm run scan:secrets`              | 52 versionierte Textdateien, 6 Muster, keine Funde                                                       | jeder Commit, spätestens vor der Veröffentlichung |
| Abhängigkeiten        | `npm audit --audit-level=high`      | in der Pipeline grün                                                                                     | jede Änderung an `package-lock.json`              |
| Testabdeckung         | `node tools/abdeckung.mjs`          | 84,3 % des ausgelieferten JavaScripts, 60 von 61 Funktionen laufen; Schwelle 80 %                        | jede Änderung in `public/js/`                     |
| Modulgröße            | `npm run test:unit`                 | kein Modul über 15 KB (größtes: `plakat.js`, 11 KB)                                                      | jede Änderung in `public/js/`                     |
| Pipeline              | GitHub Actions, Workflow „Pruefung" | Lauf 33103787728 auf `main` grün: Prüfkette und Abhängigkeitsprüfung, 36 Oberflächentests auf dem Runner | jeder Push                                        |

## Dass die Prüfungen überhaupt scheitern können

Eine Prüfung, die nicht rot werden kann, ist selbst der Befund. Jede der
folgenden Gegenproben wurde ausgeführt, nicht überlegt.

| Prüfung              | Gegenprobe                                             | Ergebnis                                      | Ungültig, sobald                        |
| -------------------- | ------------------------------------------------------ | --------------------------------------------- | --------------------------------------- |
| Linter               | Datei mit ungenutzter und undefinierter Variable       | rot, 2 Befunde                                | Änderung an `eslint.config.js`          |
| Paketvollständigkeit | `.htaccess` aus `public/` entfernt                     | rot: „die unsichtbare .htaccess ist dabei"    | Änderung an `tools/build.mjs`           |
| Download-Typ         | PDF-Blob auf `application/pdf` gesetzt                 | rot                                           | Änderung an `saveFile`/`runPdfExport`   |
| Verwaiste Dateien    | unbenutzte Datei in `public/assets/` abgelegt          | rot, 1 Befund                                 | Änderung an `tools/lint-html.mjs`       |
| Cache-Buster         | Zustand vor der Behebung                               | rot, 3 Befunde                                | Änderung an `site.json`                 |
| Geheimnis-Scan       | Datei mit echtem Passwort-Literal und Zugangsdaten-URL | rot, 2 Funde                                  | Änderung an den Mustern                 |
| Geheimnis-Scan       | 4 Gegenproben wie `password: env.FTP_PASSWORD`         | schweigt, wie es soll (im Selbsttest geprüft) | Änderung an den Mustern                 |
| axe-Messung          | kontrastarmes Element in die Seite eingefügt           | rot                                           | Änderung an der Messfunktion            |
| Test-Runner          | Aufrufmuster ohne Treffer                              | rot: „Keine Testdatei gefunden"               | Änderung an `tools/run-tests.mjs`       |
| Live-Prüfung         | `node tools/live-check.mjs --negativprobe`             | rot mit verfälschtem Sollwert, wie verlangt   | jede Änderung an `tools/live-check.mjs` |

## Barrierefreiheit (Profil UI)

| Anforderung                       | Befehl                       | Ergebnis                                                              | Ungültig, sobald              |
| --------------------------------- | ---------------------------- | --------------------------------------------------------------------- | ----------------------------- |
| WCAG 2.1 AA, alle Seiten          | `npm run test:e2e`           | 4 Seiten ohne schwere Verstöße                                        | jede CSS- oder HTML-Änderung  |
| WCAG 2.1 AA, alle App-Optiken     | `npm run test:e2e`           | WhatsApp, Snapchat, TikTok, Signal ohne schwere Verstöße              | jede Änderung an `poster.css` |
| Benannte Ausnahmen                | ebd., Ausgabe bei jedem Lauf | 2: Uhrzeiten der Chatblasen, Beschriftung der Eingabezeile (ADR-0003) | jede Änderung an ADR-0003     |
| Tastaturbedienung, Fokus sichtbar | `npm run test:e2e`           | grün                                                                  | jede Änderung an `editor.css` |
| Manuelle Prüfung mit Screenreader | –                            | **offen** – vor der Veröffentlichung des Repos durchzuführen          | –                             |

## Reproduzierbarkeit und Rückweg

| Anforderung               | Befehl                                                                 | Ergebnis                                                                                                | Ungültig, sobald               |
| ------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Rollback-Probe            | `git worktree add --detach <tmp> v1.0.0` + `npm ci` + `npm run verify` | 69 Dateien, alle 6 Schritte grün                                                                        | jeder neue Tag                 |
| Reproduzierbarer Build    | ebd. + `node tools/build.mjs`                                          | 34 Dateien + `version.json`, Kennung gleich dem getaggten Commit, Arbeitsbaum sauber                    | jeder neue Tag                 |
| Verbindung zum Webspace   | `node tools/deploy.mjs --verbindung`                                   | Anmeldung erfolgreich, verschlüsselt, 13 Einträge gelesen                                               | jede Änderung der Zugangsdaten |
| Auslieferung, vollständig | `npm run deploy -- --aufraeumen`                                       | 35 Dateien per SFTP übertragen, Fremddatei entfernt, Live-Check grün: Kennung und 33 Prüfsummen stimmen | jede Auslieferung              |
| Auslieferung, Trockenlauf | `node tools/deploy.mjs --probe`                                        | Riegel greifen; ohne Zugangsdaten Rückgabewert 2, kein Teil-Upload                                      | Änderung an `tools/deploy.mjs` |

## Erste Messung am laufenden System (27.08.2026)

Die Auslieferkette wurde zum ersten Mal gegen den echten Webspace geführt –
lesend, ohne etwas zu übertragen. Drei Befunde, alle bestätigt:

| Befund                                                 | Beleg                                                                                                                                                                         | Folge                                                                                                                                     |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Die `.htaccess` liegt **nicht** auf dem Server         | SFTP-Auflistung: 13 Einträge, keine unsichtbaren; `curl -I` liefert für HTML und CSS **keinen** `Cache-Control`-Kopf, während Apache mit `last-modified` und `etag` antwortet | Der Fehler vom 21.07.2026 ist nie behoben worden. HTML wird ohne `no-cache` ausgeliefert; eine Änderung kann bei Besuchern hängenbleiben. |
| `Editor-lokal-starten.command` liegt öffentlich im Web | `HTTP 200`, 403 B, Inhalt abrufbar                                                                                                                                            | Ein lokales Startskript gehört nicht auf einen Webserver. Kein Geheimnis darin.                                                           |
| Der Server beherrscht kein FTPS                        | `500 'AUTH': command unrecognized` auf Port 21; Port 22 nimmt dieselben Zugangsdaten verschlüsselt an                                                                         | Auslieferung läuft über SFTP. Unverschlüsseltes FTP kommt nicht in Frage.                                                                 |

**Alle drei am 27.08.2026 mit der ersten Auslieferung behoben und gegengeprüft:**

| Gegenprobe                                                           | Ergebnis                                   |
| -------------------------------------------------------------------- | ------------------------------------------ |
| `curl -I https://malzi.care/`                                        | `cache-control: no-cache`                  |
| `curl -I https://malzi.care/css/editor.css`                          | `cache-control: public, max-age=604800`    |
| `curl -o /dev/null -w %{http_code} .../Editor-lokal-starten.command` | `404`                                      |
| `curl -s https://malzi.care/ \| grep canonical`                      | `https://malzi.care/`, Titel `malziCARE …` |

Damit wirkt die `.htaccess` erstmals seit dem 21.07.2026 nachweislich.

## Was noch offen ist

**Screenreader-Prüfung von Hand.** Automatische Prüfung findet nur einen Teil.
Fällig vor der Veröffentlichung des Repositories.

**Erledigt am 27.08.2026 mit der Veröffentlichung:** Schutz des Hauptzweigs
(Regelwerk aktiv, Prüfkette als Pflicht, Ausnahme für den Eigentümer – siehe
[ADR-0005](adr/0005-zweigschutz-mit-ausnahme.md)) und Push-Schutz für
Geheimnisse (`secret_scanning_push_protection: enabled`).

**`reader.onerror`** ist die einzige Funktion ohne Test: der Fehlerfall beim
Lesen einer Datei, der sich von außen nicht zuverlässig auslösen lässt.

## Modularisierung (27.08.2026)

Die Zerlegung von `app.js` in elf Module ist mechanisch aus einer
Abhängigkeitsanalyse entstanden, nicht abgeschrieben. Beleg, dass dabei nichts
verlorenging:

| Prüfung                                         | Ergebnis                                                 |
| ----------------------------------------------- | -------------------------------------------------------- |
| Alle Oberflächentests vor und nach dem Schnitt  | 29 grün, unverändert                                     |
| Konsolenfehler auf der Live-Seite               | keine, in Chromium und WebKit                            |
| Plakat, Regelzeilen, Chatblasen, Wortmarke live | vollständig vorhanden                                    |
| Größtes Modul                                   | `plakat.js`, 11 KB (vorher: eine Datei mit 47 KB)        |
| Vorher/Nachher-Stand der Datei                  | gesichert vor dem Umbau, Vergleich über die Git-Historie |

## Gegenstelle

Das Repository liegt seit dem 27.08.2026 auf GitHub unter `malziland/malzicare`,
**privat**. Die Veröffentlichung ist Schritt 4 der Reihenfolge und ausdrücklich
noch nicht erfolgt.

Nachgemessen an der Gegenstelle, nicht aus der eigenen Ausgabe geschlossen:
`git ls-remote --heads --tags origin` zeigt `main` und `v1.0.0` auf dem
erwarteten Stand, `gh repo view` meldet `"isPrivate": true`.

## Abnahme

Alle Nachweise dieser Datei wurden in derselben Sitzung erzeugt, in der die
geprüften Änderungen entstanden sind. **Selbst abgenommen** – die
Vollständigkeit gilt als unbestätigt, bis ein späterer Lauf sie prüft.
