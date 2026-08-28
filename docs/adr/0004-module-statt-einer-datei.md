# ADR-0004: Elf Module statt einer Datei, ohne Bündler

Stand: 2026-08-27 · Status: gültig

## Zusammenhang

`public/js/app.js` war eine Datei mit 47 KB, 1161 Zeilen und 114 Funktionen in
einer selbstaufrufenden Funktion. Sie funktionierte, aber sie ließ sich nicht
überblicken: Wer eine Stelle ändern wollte, musste die ganze Datei lesen.

Christoph Krieger am 27.08.2026: „Wer will eine Datei haben mit 1200 Zeilen.
Das ist für mich nicht State of the Art. Das fordere ich eigentlich immer."

## Entscheidung

Der Code liegt in elf Modulen mit klaren Aufgaben, geladen als **ES-Module**
(`<script type="module">`). **Kein Bündler.**

| Modul         | Aufgabe                                    |
| ------------- | ------------------------------------------ |
| `daten.js`    | feste Werte, Voreinstellungen, Grenzen     |
| `dom.js`      | Helfer fürs Dokument, eingebettete Symbole |
| `zustand.js`  | laden, prüfen, sichern                     |
| `plakat.js`   | alles, was das Plakat zeichnet             |
| `listen.js`   | die Listen der Seitenleiste, Verschieben   |
| `eingaben.js` | Eingabefelder, mitwachsende Textfelder     |
| `dialog.js`   | der eine Dialog                            |
| `datum.js`    | Datumswähler                               |
| `dateien.js`  | Entwurf speichern und öffnen               |
| `pdf.js`      | Export als A3-PDF                          |
| `start.js`    | Verdrahtung und Start                      |

`app.js` bleibt der Einstiegspunkt und importiert `start.js` – der Name in
`index.html` ändert sich dadurch nicht.

Später hinzugekommen (28.08.2026, [ADR-0006](0006-veraltete-tabs.md)):
`stand.js` erkennt, dass ein lange offener Tab veraltet ist, und
`infoseite.js` bindet das auf Impressum, Datenschutz und Nutzungsbedingungen
ein.

## Begründung

**Warum kein Bündler:** Er brächte einen Bauschritt zwischen Quelle und
Auslieferung. Wer im Browser in eine Datei hineinsieht, soll den Quelltext
sehen – nicht das Ergebnis einer Maschine. Das ist bei einem Projekt, das
Schulen prüfen können sollen, mehr wert als eine gesparte HTTP-Anfrage. Über
HTTP/2 kosten elf kleine Dateien kaum mehr als eine große.

Seit dem 28.08.2026 ist die ausgelieferte Datei nicht mehr in jedem Byte die
aus dem Repository: `tools/build.mjs` hängt an jede `import`-Zeile den
Cache-Buster, sonst liefert der Webspace die Module bis zu sieben Tage alt aus
([ADR-0006](0006-veraltete-tabs.md)). Was der Bauschritt tut, bleibt aber
lesbar und umkehrbar – aus `'./dom.js'` wird `'./dom.js?v=54'`, mehr nicht.
Es wird nichts gebündelt, nichts umgeschrieben, nichts unkenntlich gemacht.
Der Grund für die Entscheidung gilt damit unverändert.

**Warum die Reihenfolge erst Tests, dann Zerlegung:** Vor dem Umbau lag die
Abdeckung bei 69 %, 11 Funktionen liefen in keinem Test. Eine Zerlegung ohne
Netz hätte Fehler erzeugt, die niemand bemerkt. Erst wurden die Tests auf
84,3 % gebracht, dann wurde geschnitten – und alle 29 Tests blieben grün.

**Warum mechanisch statt von Hand:** Die Zerlegung wurde aus einer
Abhängigkeitsanalyse erzeugt, nicht abgeschrieben. Abtippen von 1161 Zeilen
erzeugt Fehler, die keine Prüfung findet, weil sie plausibel aussehen.

## Folgen

**Der Editor läuft nicht mehr aus einem Ordner heraus.** Browser laden Module
nicht über `file://`. Wer `index.html` doppelklickt, sieht jetzt einen Hinweis
auf die Adresse – vorher wäre die Seite still leer geblieben. Der Hinweis steht
bewusst als klassisches Skript im HTML: Ein Modul träfe dieselbe Sperre.

**Eine Prüfung hält die Grenze:** Kein Modul darf über 15 KB wachsen.

## Was unverändert bleibt

Die Substanz. Es wurde nichts umgeschrieben, nur getrennt – die Funktionen sind
Zeile für Zeile dieselben. Vanilla JS bleibt Vanilla JS (ADR-0001).
