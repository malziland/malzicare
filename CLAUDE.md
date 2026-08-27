# Hinweise für die Arbeit an diesem Projekt

## Was das hier ist

malziCARE – ein Editor für Klassenchat-Regeln. Statische Seite, Vanilla JS,
**kein Server, kein Konto, keine Datenbank**. Alles läuft im Browser.

## Die drei Regeln, die dieses Projekt eigen machen

**1. `public/` ist die Auslieferung.** Was dort liegt, geht auf den Webspace –
vollständig, unsichtbare Dateien eingeschlossen. Was nicht dort liegt, geht nie
mit. Keine Ausschlusslisten.

**2. Jeder Download ist `application/octet-stream`.** Auch das PDF, auch der
Entwurf. iPhone-Safari zeigt Typen an, die es kennt, statt sie zu laden – und
der Editor wird auf iPhones benutzt. Ein Test wacht darüber; er ist kein
Formalismus.

**3. Wer eine zwischenspeicherbare Datei ändert, erhöht den Cache-Buster.**
CSS, JavaScript, Symbole, Manifest – alles trägt `max-age=604800`. Bleibt der
Buster stehen, sehen Browser sieben Tage lang die alte Fassung; genau so
verschwand am 27.08. die Wortmarke in Safari. `node tools/cache-buster.mjs
--erhoehen` zieht alles nach, ein Wächter in der Prüfkette meldet den Fall.

**4. Das Plakat wird gedruckt und aus zwei bis drei Metern gelesen.**
Kontrastwerte am Bildschirm sind nicht der Maßstab. Was Inhalt trägt, muss
lesbar sein; die App-Nachbildung tritt dahinter zurück (ADR-0003).

## Vor jedem Commit

```bash
npm run verify         # vor jedem Commit
npm run vor-dem-push   # vor jedem Push: dasselbe wie die Pipeline, alle Mängel auf einmal
```

Läuft die Kette nicht durch, wird nicht committet. Ein übersprungener Schritt
ist ein Fehlschlag, kein Hinweis.

## Aufbau des Editors

Elf Module in `public/js/`, geladen als ES-Module (ADR-0004). `app.js` ist der
Einstieg. Kein Bündler: Was ausgeliefert wird, ist die Datei aus dem
Repository. Kein Modul darf über 15 KB wachsen – ein Test wacht darüber.

## Was nicht angefasst wird

- `public/js/vendor/` – Fremdcode, unverändert ausgeliefert
- Die Formatkennung `klassenchat-plakat-v1` und der Speicherschlüssel in
  `app.js`: Wer eine ältere Entwurfsdatei öffnet, soll sie öffnen können.
- Der PDF-Dateiname `Klassenchat-Regeln.pdf` – er beschreibt das Ergebnis,
  nicht die Marke.
- `public/` wird nicht durchformatiert (ADR-0002).

## Sprache

Dokumentation, Kommentare und Commit-Nachrichten auf Deutsch. Bezeichner im
Code folgen der vorhandenen Konvention der jeweiligen Datei.

## Wo was steht

| Frage                                         | Datei                    |
| --------------------------------------------- | ------------------------ |
| Warum ist etwas so entschieden?               | `docs/adr/`              |
| Wie liefere ich aus, was tue ich bei Störung? | `docs/RUNBOOK.md`        |
| Welcher Nachweis gilt, und bis wann?          | `docs/VERIFICATION.md`   |
| Was ist zu schützen?                          | `docs/SECURITY-MODEL.md` |
