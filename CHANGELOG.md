# Änderungen

Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).
Versionierung nach [SemVer](https://semver.org/lang/de/).

## [Unveröffentlicht]

## [1.0.0] – 2026-08-27

Erster festgehaltener Stand. Der Editor lief zu diesem Zeitpunkt bereits seit
dem 21.07.2026 öffentlich; dies ist die erste Fassung mit Versionsverwaltung,
Prüfkette und nachmessbarer Auslieferung.

### Neu

- Git-Repository; der erste Commit ist der unveränderte Live-Stand
- MIT-Lizenz
- Prüfkette `npm run verify`: Formatierung, Linter, Verweis- und
  Adressprüfung, Geheimnis-Scan, Unit- und Oberflächentests
- Oberflächentests in Chromium und WebKit, Barrierefreiheitsprüfung über alle
  Seiten und alle vier App-Optiken
- Auslieferung per Skript (FTPS) mit Riegeln davor und Messung danach
- `dist/version.json` mit Kennung des Standes und Prüfsumme jeder Datei

### Geändert

- Der Dienst heißt **malziCARE**; Wortmarke im Seitenkopf
- Ausgeliefert wird ausschließlich `public/`
- Lesbarkeit: Beschriftungen im Plakat, Kopfzeilen-Untertitel und
  Datumstrenner erfüllen WCAG AA (siehe ADR-0003)
- Rechtsseiten: Datum nicht mehr durch Transparenz abgeschwächt, Links im
  Fließtext unterstrichen
- „malziland" in der Fußzeile verweist auf malziland.at

### Entfernt

- Versionsanzeige in der Fußzeile (ersetzt durch `version.json`)
- zwei Wortmarken-Grafiken mit dem alten Produktnamen, die keine Seite einband

### Behoben

- Die Rechtsseiten luden ihr Stylesheet ohne Cache-Buster; eine Änderung daran
  wäre bis zu sieben Tage nicht angekommen.
