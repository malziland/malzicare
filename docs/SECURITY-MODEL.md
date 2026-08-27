# Sicherheitsmodell

Stand: 2026-08-27

## Was zu schützen ist

**Die Eingaben einer Schulklasse.** Regeltexte, Klassenname, Vornamen der
Admins, die Unterschriftenfläche. Darunter sind Namen Minderjähriger und
Aussagen über Konflikte in einer konkreten Gruppe – Angaben, die niemanden
außerhalb der Klasse etwas angehen.

**Die Auslieferkette.** Wer sie übernimmt, kann jeder Klasse eine
manipulierte Seite unterschieben.

## Wo diese Daten liegen

Auf dem Gerät der Nutzerin, sonst nirgends:

| Ort                            | Inhalt                    | Löschung                                         |
| ------------------------------ | ------------------------- | ------------------------------------------------ |
| `localStorage` des Browsers    | aktueller Entwurf         | „Auf Vorlage zurücksetzen", Browserdaten löschen |
| heruntergeladene Entwurfsdatei | JSON, vom Nutzer abgelegt | vom Nutzer                                       |
| erzeugtes PDF                  | das fertige Plakat        | vom Nutzer                                       |

**Es gibt keinen Server, der Inhalte entgegennimmt.** Kein Konto, keine
Datenbank, keine Schnittstelle, kein Tracking, keine externen Aufrufe zur
Laufzeit – Schriften und Bibliotheken liegen im Auslieferverzeichnis. Damit
existiert die Datenschutzfrage „wie lange speichert der Betreiber?" nicht:
Er speichert nichts, weil nichts bei ihm ankommt.

Belegbar am Quelltext: `public/js/app.js` kennt keinen `fetch`- oder
`XMLHttpRequest`-Aufruf; alle Verweise in `public/` zeigen auf lokale Dateien
(geprüft durch `tools/lint-html.mjs`).

## Vertrauensgrenzen

| Von wo                    | Vertrauen        | Behandlung                                              |
| ------------------------- | ---------------- | ------------------------------------------------------- |
| Tastatureingaben          | keins            | Längen begrenzt, als Text gesetzt, nie als HTML         |
| geladene Entwurfsdatei    | keins            | JSON geprüft, Struktur plausibilisiert, sonst abgelehnt |
| `localStorage`            | keins            | wie eine fremde Datei behandelt                         |
| eingebundene Bibliotheken | einmalig geprüft | liegen versioniert im Repo, kein CDN                    |

## Missbrauchsfälle und was ihnen entgegensteht

**Eine präparierte Entwurfsdatei führt Code aus.** Die Datei wird als JSON
gelesen; scheitert das, erscheint eine Meldung und der Stand bleibt. Inhalte
werden als Text gesetzt.

**Jemand übernimmt die Auslieferung.** Zugangsdaten stehen ausschließlich in
`.env` (in `.gitignore`), die Übertragung läuft über FTPS mit geprüftem
Zertifikat. Nach jeder Auslieferung wird von außen gemessen, ob genau das oben
liegt, was gebaut wurde.

**Ein Zwischenspeicher liefert einen alten Stand.** HTML wird bei jedem Aufruf
neu geprüft, Assets tragen einen Cache-Buster. Die Wirkung dieser Regeln wird
live gemessen.

## Bewusste Abweichungen

**Kein Content-Security-Policy-Header.** Die Seite lädt ausschließlich eigene
Dateien; ein CSP-Header wäre bei IONOS über `.htaccess` möglich und ist als
Verbesserung vorgemerkt, aber ohne fremde Quellen gering im Nutzen. Bedingung
für Neubewertung: sobald irgendetwas Externes eingebunden wird.

**Zwei Kontrastausnahmen in der App-Nachbildung**, begründet und geführt in
[ADR-0003](adr/0003-app-optik-und-lesbarkeit.md).

## Wann dieses Modell neu zu bewerten ist

Sobald eines eintritt: der erste Serveraufruf (etwa ein Zähler abgeschlossener
Vereinbarungen), die erste Anmeldung, die erste Übertragung von Inhalten, ein
Wechsel des Auslieferwegs, oder die Öffnung des Repositories.
