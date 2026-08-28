# Veraltete Stände im Browser

28.08.2026 · Modus FEATURE · Stufe SCHWER · Ausgangsstand `348f46e`, Tag `v1.8.0`

**Stufe SCHWER, nicht gewählt, sondern getroffen:** Die Ausschlussliste in
KERN 15 trifft zweifach – öffentlich erreichbare Fläche und Auslieferkette;
letztere ist ausdrücklich mindestens SCHWER.

## Anlass

Gemeldet wurde ein seit Tagen offener Safari-Tab, der weiter die Fassung vor
dem Umbau auf malziCARE zeigte: alter Name in der Kopfzeile, „AGB" statt
„Nutzungsbedingungen", die alte Versionsnummer.

## Was gemessen wurde, bevor etwas geändert wurde

| Messung                                                        | Ergebnis                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `curl -sS -D -` auf beide Domains                              | `HTTP 200`, gleicher `ETag "40d8-65a0f0e5a357d"`, gleicher SHA-256 |
| fünf Varianten (mit/ohne `www`, `http`/`https`, beide Domains) | alle derselbe `ETag`, alle Titel `malziCARE …`                     |
| `grep` auf den ausgelieferten Text                             | „Klassenchat-Plakat-Editor", „AGB", „v31": je 0 Treffer            |
| `curl` auf `/klassenchat/`                                     | `HTTP 404` unter beiden Domains – kein zweiter Bestand             |

Der Server war in Ordnung. Der veraltete Stand lag im Browser, und die
`Cache-Control`-Regeln konnten daran nichts ändern: Sie greifen erst bei einer
Anfrage, und ein Tab, der nie neu lädt, stellt keine.

## Drei Befunde, eine Wurzel

1. **Ein Tab, der nie neu lädt, bleibt veraltet.** Kein Cache-Kopf hilft, weil
   keine Anfrage stattfindet.
2. **Die Module wurden bis zu sieben Tage alt ausgeliefert.** `index.html`
   fordert `js/app.js?v=…` an, aber dessen `import './start.js'` trägt keinen
   Namen, der sich ändert. Alle 14 Dateien unter `js/` kamen live mit
   `max-age=604800`; betroffen waren 11 Module mit 38 Import-Zeilen.
3. **Die Schriften ebenso** – 16 `url()`-Verweise in `fonts.css` und
   `legal.css`, keiner mit Cache-Buster. Im repo-weiten Nachlauf gefunden.

## Was gebaut wurde

| Teil                     | Wirkung                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `public/js/stand.js`     | vergleicht bei der Rückkehr zum Tab die eingebaute Kennung mit `version.json`, lädt still neu                      |
| `public/js/infoseite.js` | dasselbe auf Impressum, Datenschutz, Nutzungsbedingungen                                                           |
| `tools/build.mjs`        | stempelt Kennung in jede Seite, Cache-Buster an jeden Import und jedes `url()`; bricht ab, wenn etwas übrig bleibt |
| `public/.htaccess`       | `version.json` mit `no-store`                                                                                      |
| `tools/lint-html.mjs`    | verlangt das Stempelfeld je Seite; prüft erstmals die `import`-Verweise                                            |
| `tools/live-check.mjs`   | prüft `no-store` und ob Kennung in `index.html` und `version.json` zusammenpassen                                  |

Entscheidungen und verworfene Wege: [ADR-0006](../adr/0006-veraltete-tabs.md).

## Beweise

Alle Befehle im Verzeichnis `editor/`, gegen den Stand dieses Commits.

| Befehl                     | Ergebnis                                                        |
| -------------------------- | --------------------------------------------------------------- |
| `npm run verify`           | 10 Schritte, alle grün                                          |
| `npm run test:unit`        | 4 Testdateien, 24 Tests, 24 grün, 0 rot                         |
| `npm run test:e2e`         | 92 grün (46 Tests × Chromium und WebKit)                        |
| `node tools/lint-html.mjs` | 4 Seiten, 86 lokale Verweise, 32 eigene Adressen, keine Befunde |
| `node tools/abdeckung.mjs` | 87,5 % (Schwelle 80 %), `stand.js` 87,7 %                       |

Sechs Rückbauproben, jede einzeln ausgeführt und wiederhergestellt – die
Fehlermeldungen wörtlich in [VERIFICATION.md](../VERIFICATION.md), Abschnitt
„Dass die Prüfungen überhaupt scheitern können".

**Der Fall aus dem Screenshot ist in WebKit nachgestellt** – dem Browser, der
Safari am nächsten kommt: gebautes Paket mit echter Kennung, Server meldet
einen anderen Stand, Rückkehr zum Tab. Die Seite lädt neu, der eingegebene
Gruppenname steht danach unverändert da.

## Auffälligkeit außerhalb des Auftrags, behoben

Meine neue Testdatei und `paket.test.mjs` riefen beide `build()` auf, das
dasselbe `dist/` löscht und neu schreibt. `node --test` lässt Testdateien
parallel laufen: Mal war die eine rot, mal die andere, mal keine – der
schlimmste Zustand, weil ein grüner Lauf nichts mehr beweist. `build()` nimmt
jetzt ein Zielverzeichnis entgegen; jeder Test baut in ein eigenes. Fünf Läufe
hintereinander grün, jede Datei einzeln grün, umgekehrte Reihenfolge grün.

## Offene Punkte

1. **Der Live-Beweis steht aus, und zwar begründet:** Auf dem Webspace liegt
   `348f46e`, also der Stand _ohne_ Wächter. Die Wirkung am laufenden System
   ist erst nach der Auslieferung messbar. Ab dann zeigt sie
   `node tools/live-check.mjs`, dessen Negativprobe
   (`--negativprobe`) belegt, dass die Messung rot werden kann.
2. **Entscheidungsfrage: ausliefern?** Empfehlung ja, über `/release`. Folge
   des Nichtstuns: Der gemeldete Fehler bleibt bestehen – jeder Tab, der heute
   offen ist, zeigt weiter den alten Stand, und die nächste Änderung an einem
   Modul erreicht wiederkehrende Browser bis zu sieben Tage nicht.
3. **Die Pipeline hat diesen Stand nicht gesehen.** Der letzte grüne Lauf
   (33103787728) gehört zu `v1.8.0`. Ein Push steht aus und ist nicht erteilt.

## Eingang für das nächste Audit

- **Vergleichsanker:** `348f46e` (`v1.8.0`), letzter Bericht
  `docs/VERIFICATION.md`, Stand 28.08.2026.
- **Geändert:** Auslieferkette (`tools/build.mjs` stempelt jetzt), zwei neue
  ausgelieferte Module, erster Netzaufruf zur Laufzeit im eigenen Code.
- **Nicht neu zur Diskussion:** stilles Neuladen ohne Rückfrage, Prüfung nur
  bei Rückkehr statt im Takt, Stempeln im Paket statt in der Quelle – alles in
  ADR-0006 begründet.
- **Audit fällig?** Ja, mittelfristig: Mit `stand.js` gibt es erstmals einen
  wiederkehrenden Aufruf nach außen. Er geht an die eigene Adresse und sendet
  nichts; `docs/SECURITY-MODEL.md` ist entsprechend neu geschrieben. Vor dem
  nächsten Release lohnt `/audit` in der Tiefe TIEF.

**Abgabekontrolle selbst abgenommen** – erstellt und geprüft in derselben
Sitzung. Die Vollständigkeit gilt als unbestätigt, bis ein späterer Lauf sie
prüft.
