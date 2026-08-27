# ADR-0002: Der Formatierer lässt den ausgelieferten Bestand in Ruhe

Stand: 2026-08-27 · Status: gültig

## Zusammenhang

Prettier gehört zur Toolchain. Angewandt auf `public/` würde er HTML, CSS und
das gewachsene `app.js` umformatieren.

## Entscheidung

`public/` steht in `.prettierignore`. Der Formatierer gilt für Werkzeug- und
Testcode, für Konfiguration und Dokumentation.

## Begründung

Whitespace ist in HTML bedeutungstragend: Zwischen Inline-Elementen wird er zu
sichtbarem Abstand. Das Plakat ist auf den Millimeter gesetzt und wird gedruckt;
eine Umformatierung könnte es verschieben, ohne dass ein Test es meldet. Der
Gewinn – einheitliche Einrückung in einer Datei, die eine Person pflegt – wiegt
das nicht auf.

Der Linter prüft `public/js/app.js` weiterhin auf echte Fehler. Geprüft wird
also die Substanz, nur nicht die Form.

## Bedingung für eine Neubewertung

Wenn das Plakat-Layout einmal durch Tests abgedeckt ist, die Verschiebungen
sichtbar machen (Bildvergleich), kann der Bestand einmalig durchformatiert
werden.
