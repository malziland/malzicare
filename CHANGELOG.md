# Änderungen

Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).
Versionierung nach [SemVer](https://semver.org/lang/de/).

Jede Fassung mit Datum ist ausgeliefert und unter <https://malzi.care>
erreichbar. Steht einmal ein Abschnitt „Unveröffentlicht" darüber, ist das
gemeint, was schon im Repository, aber noch nicht online ist.

## [1.8.0] – 2026-08-28

### Entfernt

Durchsicht des Repositorys: Was gehört öffentlich, was nicht?

- **`CLAUDE.md`** – sieben ihrer neun Regeln standen bereits in
  `CONTRIBUTING.md`, im README oder in den ADRs. Doppelte Angaben driften
  auseinander; die zwei Punkte, die es nur dort gab, stehen jetzt in der
  Beitragsanleitung, wo sie jeden Mitwirkenden erreichen.
- **`docs/bilder/github-vorschau.png`** (297 KB) – die Karte wird einmal in den
  GitHub-Einstellungen hinterlegt und danach nie wieder gebraucht.
  `tools/bilder-bauen.mjs` legt sie jetzt in den temporären Ordner.
- **Zwei ungenutzte Markendateien aus `public/`** (212 KB) – sie gingen bei
  jeder Auslieferung mit, ohne je abgerufen zu werden. In der Git-Historie
  bleiben sie erhalten.

### Geändert

- Die README-Bilder entstehen in einfacher statt doppelter Punktdichte: Sie
  werden ohnehin auf Textbreite skaliert. **1,25 MB → 499 KB.**

## [1.7.0] – 2026-08-27

### Öffentlich

**Ab dieser Fassung ist der Quelltext öffentlich** – unter
<https://github.com/malziland/malzicare>, MIT-Lizenz.

Das ist bewusst der letzte Schritt und nicht der erste. Vorher wurde geklärt,
was ein offenes Projekt schuldig ist:

- **Die Lizenzlage.** Eine mitgelieferte Bibliothek lag ohne Copyright-Hinweis
  im Verzeichnis – die MIT-Lizenz verlangt genau das eine, dass er in jeder
  Kopie mitgeht. Nachgetragen. Alle Lizenzen stehen belegt in `docs/LIZENZEN.md`
  und sichtbar in den Nutzungsbedingungen, mit Name, Version und Rechteinhaber.
- **Die Abgrenzung der Marke.** Der Code ist frei, der Name nicht
  ([TRADEMARK.md](TRADEMARK.md)). Der Vorbehalt steht in einer eigenen Datei,
  weil er in `LICENSE` die Lizenzerkennung zerstört hätte.
- **Die Nutzungsbedingungen.** Umgeschrieben auf ein offenes Modell: Sie gelten
  für den Dienst unter malzi.care, nicht für eigene Installationen; stelle ich
  den Betrieb ein, bleibt der Quelltext nutzbar.
- **Der Quelltext selbst.** Keine Zugangsdaten in der Historie – geprüft über
  alle 32 Commits, nicht nur über den aktuellen Stand. `.env` war nie
  versioniert.

Erst danach ging das Repository auf öffentlich. Ab sofort gilt zusätzlich:
Schutz des Hauptzweigs mit der Prüfkette als Pflicht, und der Push-Schutz von
GitHub verhindert, dass ein Geheimnis überhaupt hochgeht.

## [1.6.0] – 2026-08-27

### Geändert

- **Aus den AGB werden die Nutzungsbedingungen** – neu geschrieben in
  Abschnitten mit Fließtext statt vierzig nummerierten Unterpunkten, in
  eigener Stimme und in verständlicher Sprache. Die Datei heißt jetzt
  `nutzungsbedingungen.html`; die alte Adresse wird dauerhaft dorthin
  weitergeleitet.
- Die **Lizenzen der mitgelieferten Arbeit stehen jetzt sichtbar auf der
  Seite** – mit Name, Version und Rechteinhaber. „Steht im Quelltext" ist für
  ein Projekt, das mit Transparenz wirbt, zu wenig.

### Behoben

- **GitHub erkannte die Lizenz nicht mehr als MIT** (`NOASSERTION`), weil ich
  den Markenvorbehalt an `LICENSE` angehängt hatte. Die Lizenzerkennung
  vergleicht den Text; jeder Zusatz macht sie blind. `LICENSE` enthält jetzt
  wieder den unveränderten MIT-Text, der Vorbehalt steht in `TRADEMARK.md`.
- Zwei Links waren nur an der Farbe erkennbar: Eine Klassenregel im
  Grundstylesheet war spezifischer als meine Korrektur und hat sie überstimmt.
- Der Verweis auf den Quelltext hat jetzt dieselbe Größe wie in der Vorlage.

## [1.5.0] – 2026-08-27

### Entfernt

- **Verweise auf ein anderes meiner Projekte** an vierzehn Stellen in
  Changelog, Kommentaren und CSS. Sie standen dort als Begründung für
  übernommene Werte – für Außenstehende Rauschen. `tools/sperrliste.mjs` hält
  sie künftig fern, zusammen mit liegengebliebenen Arbeitsnotizen und
  Entwicklungsadressen im ausgelieferten Text.

### Behoben

- **Lizenzverstoß bei einer mitgelieferten Bibliothek.** `html-to-image` lag
  ohne Copyright-Hinweis und ohne Lizenztext im Verzeichnis. Die MIT-Lizenz
  verlangt genau das eine: dass beides in jeder Kopie mitgeht – und jeder
  Browser, der die Seite lädt, bekommt eine Kopie. Der Hinweis ist nachgetragen.
- Die **AGB** waren auf ein geschlossenes Modell geschrieben – die Software
  bleibe mein geistiges Eigentum. Vollständig überarbeitet: Geltungsbereich (die AGB
  gelten für den Dienst, den ich unter malzi.care betreibe, nicht für eigene
  Installationen), Weiterbestand bei Einstellung des Betriebs, Abgrenzung von
  Lizenz und Marke, Haftung für quelloffenen Code und für Beiträge Dritter.
- **jsPDF war zwei Hauptversionen alt** (2.5.2 statt 4.2.1) – ohne Dependabot
  hätte das niemand bemerkt. Aktualisiert; der PDF-Test prüft jetzt auch den
  Inhalt der Datei statt nur den Namen.
- Die Vorschaubilder trugen keinen Cache-Buster: Soziale Netze hätten
  monatelang das alte Bild gezeigt.

### Neu

- **`docs/LIZENZEN.md`** – was für welchen Teil gilt: mein Code (MIT),
  Bibliotheken (MIT), Schrift (OFL), und ausdrücklich, dass **Name, Wortmarke
  und Zeichen nicht mitlizenziert** sind. Wer den Code weiterverwendet, tut das
  unter eigenem Namen. Derselbe Vorbehalt steht jetzt auch in `LICENSE`.
- **`tools/fremdcode.mjs`** wacht über die mitgelieferten Bibliotheken: Version,
  Lizenzhinweis, Rechteinhaber und Prüfsumme. `--neuigkeiten` meldet neuere
  Fassungen. Läuft in der Prüfkette mit.
- **`docs/fremdcode.md`** – Herkunft, Prüfsummen und der Weg zum Aktualisieren.
- **Vorschaubilder**, erzeugt aus der laufenden Seite: das `og:image` der Seite
  und eine Karte für GitHub.
- Issue-Vorlagen und eine Dependabot-Konfiguration für die Werkzeuge.

### Geändert

- Kontaktadresse ist **info@malzi.care** (15 Fundstellen). Eine Prüfung
  verlangt auf allen Seiten dieselbe Adresse.
- Der Verweis auf den Quelltext steht in einem eigenen Bereich zwischen Inhalt
  und Fußzeile statt in der Fußzeile.

## [1.4.0] – 2026-08-27

### Neu

- **Verweis auf den Quelltext** auf jeder Seite, im Stil meiner übrigen
  Dienste. _Der Link führt ins Leere, solange das Repository privat ist._
- **Prüfungen des Barrierefreiheitsbaums** (`tests/e2e/vorlesen.spec.mjs`):
  Sie lesen, was ein Screenreader vorlesen würde – Namen aller Bedienelemente,
  Bereiche zum Springen, Überschriften ohne Sprung, Dialogrolle, und dass das
  Plakat Text hergibt statt eines Bildes. Sie ersetzen keine Prüfung durch
  einen Menschen mit VoiceOver, fangen aber ab, was dabei am meisten stört.
- **Test für den Lesefehler beim Öffnen eines Entwurfs** – der letzte Pfad, den
  kein Test erreichte. Damit laufen alle 61 Funktionen in mindestens einem Test.

### Behoben

- **Überschriften sprangen von `h1` auf `h3`.** Ein Screenreader meldet dabei
  eine fehlende Ebene. Die acht Karten der Seitenleiste sind jetzt `h2`.
- **Die Regellisten und die Admin-Liste hatten keinen vorlesbaren Namen.** Wer
  sie durchhört, wusste nicht, in welcher Spalte er ist; sie tragen jetzt ihre
  Überschrift als Namen.
- **Die Adressprüfung ließ gefälschte Adressen durch.** `malzi.care.fremde.example`
  galt als eigene Adresse, weil der Vergleich am Wortanfang hing statt an der
  Herkunft. Die `canonical`-Angabe wird jetzt ausdrücklich geprüft – drei
  Gegenproben belegen es.

## [1.3.0] – 2026-08-27

### Geändert

- **Der Editor besteht aus elf Modulen statt einer Datei mit 1161 Zeilen.**
  Geladen als ES-Module, ohne Bündler – die ausgelieferte Datei bleibt die, die
  im Repository steht. Begründung und Schnitt in
  [ADR-0004](docs/adr/0004-module-statt-einer-datei.md).
- Die Zerlegung wurde aus einer Abhängigkeitsanalyse erzeugt, nicht
  abgeschrieben; alle 29 Oberflächentests blieben dabei grün.

### Neu

- **Testabdeckung als Riegel:** `tools/abdeckung.mjs` misst, welcher Anteil des
  ausgelieferten JavaScripts von den Tests ausgeführt wird, und fällt unter
  80 % durch. Von 69,0 auf 84,3 % – 60 von 61 Funktionen laufen.
- Tests für Datumswähler, Entwurf öffnen, Ablehnen fremder Dateien,
  Zurücksetzen mit Rückfrage, Löschen und Umsortieren per Tastatur.
- CONTRIBUTING, Verhaltenskodex, Screenshots im README (erzeugt aus der
  laufenden Seite), `og:`- und `twitter:`-Angaben auch auf den Rechtsseiten.
- Ein Hinweis, wenn die Seite aus einem Ordner statt über eine Adresse geöffnet
  wird – vorher wäre sie mit Modulen still leer geblieben.

### Behoben

- Der Prüfschritt für den neutralen Download-Typ sah nur in `app.js` nach und
  hätte den Umbau überstanden, ohne etwas zu prüfen. Er durchsucht jetzt alle
  Module.

## [1.2.0] – 2026-08-27

### Geändert

- **Markensymbol zeigt `CARE`** statt nur `C` – analog zum malziland-Symbol,
  das das `m` trägt.
- **Ränder der Kachel an den Bildpunkten ausgemessen**, nicht aus der Textbox
  gerechnet: waagrecht 0,00 px Unterschied (vorher 0,58 px). Senkrecht bleiben
  0,75 px – Großbuchstaben sitzen in Poppins nicht mittig in der Zeilenbox, und
  der Browser rundet die Textlage auf ganze Pixel.
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
  den Buchstabenabstand ausgeglichen, weniger Verdichtung. Die übernommenen Werte waren auf zwei Buchstaben abgestimmt, nicht auf vier.
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
