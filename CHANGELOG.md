# Änderungen

Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).
Versionierung nach [SemVer](https://semver.org/lang/de/).

## [Unveröffentlicht]

## [1.2.0] – 2026-08-27

### Geändert

- **Markensymbol zeigt `CARE`** statt nur `C` – analog zum malziland-Symbol,
  das das `m` trägt.
- **Ränder der Kachel an den Bildpunkten ausgemessen**, nicht aus der Textbox
  gerechnet: waagrecht 0,00 px Unterschied (vorher 0,58 px). Senkrecht bleiben
  0,75 px – Großbuchstaben sitzen in Poppins nicht mittig in der Zeilenbox, und
  der Browser rundet die Textlage auf ganze Pixel. Zum Vergleich, gleich
  gemessen: die Vorlage malzi.me liegt bei 1,09 px waagrecht und 4,58 px
  senkrecht.
- Der Zusatz „Klassenchat-Regeln" neben der Marke entfällt – das Plakat zeigt
  den Gegenstand selbst.

### Behoben

- Beim Zeigen auf die Wortmarke wurde nur „malzi" unterstrichen: Die
  allgemeine Regel `a:hover` überschrieb die Marke und zerlegte sie optisch in
  zwei Teile. Jetzt reagiert sie als ein Zeichen.

## [1.1.0] – 2026-08-27

Erste echte Auslieferung über die neue Kette – und drei Befunde, die dabei
sichtbar wurden.

### Neu

- **malzi.care** ist die kanonische Adresse. Umgestellt wird an einer Stelle
  (`site.json`), die Prüfung meldet jede Fundstelle, die nicht passt.
- **Eigenes Markensymbol** statt des malziland-„m": Teal-Kachel mit weißem C.
  Erzeugt von `tools/icons-bauen.mjs` aus der Schrift der Seite; die `.ico`
  baut das Werkzeug selbst und prüft jeden eingebetteten Bildkopf nach.
- **Wächter über den Cache-Buster** (`tools/cache-buster.mjs`): meldet, wenn
  sich zwischenspeicherbare Dateien geändert haben, ohne dass der Buster
  gestiegen ist. `--erhoehen` zieht Buster und alle Verweise in einem Zug nach.
- **`npm run vor-dem-push`**: dieselben Prüfungen wie die Pipeline, zeigt alle
  Mängel auf einmal statt beim ersten stehenzubleiben. Von Hand aufgerufen,
  bewusst kein Git-Hook.
- **Auslieferung per SFTP** mit `--verbindung` (nur nachsehen), `--probe`
  (Trockenlauf) und `--aufraeumen` (entfernt Fremddateien im Zielverzeichnis).

### Geändert

- Die Wortmarke sitzt jetzt richtig: 18 px statt 22 px, rechter Innenrand um
  den Buchstabenabstand ausgeglichen, weniger Verdichtung. Die Werte von
  malzi.me sind auf zwei Buchstaben abgestimmt, nicht auf vier.
- Auf allen Unterseiten führt die Wortmarke zurück zum Editor; der Textlink
  „Zurück zum Editor" entfällt.
- Stand der Nutzungsvereinbarung und der Datenschutzerklärung: 27. August 2026.
- Übertragen wird per SFTP statt FTPS – der Server beherrscht kein FTPS, Port 21
  wäre Klartext gewesen.

### Behoben

- **Die `.htaccess` lag seit dem 21.07.2026 nicht auf dem Server.** Der Fehler
  von damals war nie behoben, nur nie sichtbar. Seither wurde HTML ohne
  `no-cache` ausgeliefert.
- **Ein lokales Startskript lag öffentlich im Web** (`HTTP 200`) und wurde
  entfernt.
- **Die Wortmarke erschien in Safari als reiner Text.** Ursache war der nicht
  erhöhte Cache-Buster: Die Seite forderte weiter `?v=31` an, der Browser nahm
  seine sieben Tage gültige Kopie. Dagegen wacht jetzt ein eigener Riegel.
- Beim Zeigen auf die Wortmarke wurde nur „malzi" unterstrichen und die Marke
  damit optisch in zwei Teile zerlegt.

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
