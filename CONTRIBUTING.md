# Mitarbeiten

Danke fürs Interesse. malziCARE ist ein kleines Werkzeug mit einem klaren
Zweck: Eine Schulklasse soll ihre Chat-Regeln selbst festlegen und als Plakat
aufhängen können. Beiträge sind willkommen, wenn sie diesem Zweck dienen.

## Bevor du loslegst

```bash
npm run setup          # Abhängigkeiten und Testbrowser
npm run run            # Editor lokal starten
npm run vor-dem-push   # alle Prüfungen, zeigt jeden Mangel auf einmal
```

`npm run vor-dem-push` muss grün sein. Läuft eine Prüfung rot, wird nicht
gepusht – die Pipeline würde denselben Fehler melden, nur acht Minuten später.

## Drei Regeln, die dieses Projekt eigen machen

**1. `public/` ist die Auslieferung.** Was dort liegt, geht auf den Webspace –
vollständig, unsichtbare Dateien eingeschlossen. Was nicht dort liegt, geht nie
mit. Keine Ausschlusslisten.

**2. Jeder Download ist `application/octet-stream`.** Auch das PDF, auch der
Entwurf. iPhone-Safari zeigt Typen an, die es kennt, statt sie zu laden – und
der Editor wird auf iPhones benutzt. Ein Test wacht darüber.

**3. Wer eine zwischenspeicherbare Datei ändert, erhöht den Cache-Buster:**
`node tools/cache-buster.mjs --erhoehen`. Sonst sehen Besucher bis zu sieben
Tage die alte Fassung. Auch darüber wacht eine Prüfung.

## Was gebraucht wird

- Fehlerberichte mit Browser, Gerät und dem Weg zum Fehler
- Barrierefreiheit: Wer mit Screenreader oder nur mit der Tastatur arbeitet und
  auf Hindernisse stößt, hilft am meisten
- Übersetzungen der Oberfläche
- Rückmeldungen aus dem Unterricht: Was fehlt einer Klasse beim Ausfüllen?

## Was eher nicht

Kein Konto, kein Server, keine Datenbank, kein Tracking. Der Editor läuft
vollständig im Browser, und das ist keine Sparmaßnahme, sondern die Zusage an
Schulen: Die Namen der Jugendlichen verlassen das Gerät nicht. Beiträge, die
daran rühren, brauchen vorher eine Absprache.

Ebenso zurückhaltend sind wir bei zusätzlichen Bibliotheken. Alles, was
mitgeliefert wird, muss jemand pflegen.

## Wie du einreichst

1. Zweig von `main` abzweigen
2. Änderung mit einer Prüfung, die sie abdeckt
3. `npm run vor-dem-push` grün
4. Pull Request mit einer Zeile dazu, **warum** die Änderung nötig ist

Commit-Nachrichten und Kommentare auf Deutsch, passend zum Bestand.

## Sicherheitslücken

Bitte nicht öffentlich melden, sondern an <info@malzi.care>. Siehe
[SECURITY.md](SECURITY.md).
