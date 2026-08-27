# ADR-0001: Grundentscheidungen

Stand: 2026-08-27 · Status: gültig

## Zusammenhang

malziCARE lief seit dem 21.07.2026 auf dem IONOS-Webspace, ohne
Versionsverwaltung, ohne Tests und ohne Lizenz. Ausgeliefert wurde von Hand:
ZIP packen, im Dateimanager entpacken. Christoph Krieger hat am 27.08.2026
entschieden, dass daraus ein offenes Projekt unter MIT wird und der Umbau nach
der Audit-Familie erfolgt.

## Entscheidungen

**Ausbaustufe STANDARD.** Die Seite ist öffentlich erreichbar; damit scheidet
MINIMAL aus. ENTERPRISE verlangt eine regulatorische Pflicht oder vertraglich
geforderte Nachweise – beides liegt nicht vor.

**Aktives Profil: UI.** Kein Backend, keine Schnittstelle, kein Container,
keine Infrastruktur als Code, kein Monorepo. Barrierefreiheitsziel: WCAG 2.1
Stufe AA, geprüft mit axe über alle Seiten und alle vier App-Optiken.

**Datenklasse: keine personenbezogenen Daten beim Betreiber.** Eingaben können
Vornamen Jugendlicher enthalten, verlassen aber das Gerät nicht. Es gibt keinen
Server, der sie entgegennehmen könnte. Neubewertung, sobald irgendetwas
übertragen wird – etwa bei einem Zähler für abgeschlossene Vereinbarungen.

**Statisch bleibt statisch.** Kein Framework, kein Bündler, kein Backend. Der
Editor ist Vanilla JS und soll es bleiben; der Bauschritt kopiert und stempelt,
mehr nicht. Verworfen wurde ein Wechsel zu Firebase: Es gibt nichts zu hosten,
was ein Webspace nicht könnte, und die Verlagerung brächte Aufwand ohne
Gegenwert.

**Ausgeliefert wird `public/`, nichts anderes.** Nicht die Wurzel mit einer
Ausschlussliste. Eine Ausschlussliste bittet um Sorgfalt; eine Ordnergrenze ist
eine Tatsache. Anlass: Am 21.07.2026 fehlte die unsichtbare `.htaccess` im
gepackten ZIP, und live war der Fehler nicht sichtbar.

**Die Kennung des Standes steht in `dist/version.json`,** zusammen mit der
Prüfsumme jeder Datei. Vorher trug nur die Fußzeile eine Versionsnummer, die
von Hand gepflegt wurde. Die Anzeige ist auf Wunsch entfallen; die maschinell
prüfbare Kennung ersetzt sie.

**Der Auslieferweg bleibt IONOS per FTPS.** Kein Hosting-Umzug. Der Handgriff
im Dateimanager wird durch ein Skript ersetzt, nicht der Anbieter.

## Folgen

Ein frischer Clone lässt sich mit `npm run setup` aufsetzen und mit
`npm run verify` vollständig prüfen. Jede Auslieferung ist einem Commit
zuordenbar, und was oben liegt, ist von außen nachmessbar.
