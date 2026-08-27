# Lizenzen – was gilt für welchen Teil

malziCARE steht unter der [MIT-Lizenz](../LICENSE). Das gilt für **den Code**.
Nicht alles im Repository ist Code, und nicht alles darf jede und jeder
weiterverwenden. Diese Übersicht sagt für jeden Teil, was gilt.

## Der eigene Code — MIT

`public/js/*.js` (ohne `vendor/`), `public/css/`, die HTML-Dateien, `tools/`,
`tests/`.

**Du darfst:** verwenden, ändern, weitergeben, verkaufen, in eigene Projekte
einbauen — auch kommerziell, ohne zu fragen.

**Eine Bedingung:** Der Copyright-Hinweis und der Lizenztext müssen mitgehen.
Das ist alles, was MIT verlangt — aber es ist verbindlich.

## Mitgelieferte Bibliotheken — MIT

| Was             | Version | Lizenz | Rechteinhaber                |
| --------------- | ------- | ------ | ---------------------------- |
| `html-to-image` | 1.11.13 | MIT    | © 2017–2025 W.Y.             |
| `jsPDF`         | 4.2.1   | MIT    | © 2010–2025 James Hall u. a. |

Beide liefern ihren Lizenztext im Kopf der Datei mit – damit ist die Bedingung
erfüllt. jsPDF enthält seinerseits Fremdcode (unter anderem von Adobe Systems)
mit eigenen MIT-Blöcken; sie stehen alle in der Datei.

Herkunft, Prüfsummen und der Weg zum Aktualisieren stehen in
[fremdcode.md](fremdcode.md). `node tools/fremdcode.mjs` prüft bei jedem Lauf,
ob Angaben und Dateien zusammenpassen, und meldet auf Wunsch neuere Fassungen —
denn Dependabot sieht diese Dateien nicht.

## Die Schrift Poppins — SIL Open Font License 1.1

`public/assets/fonts/*.woff2`, Lizenztext in `public/assets/fonts/OFL.txt`.

**Wichtig bei der OFL:** Die Schrift darf mitgeliefert und eingebettet werden,
auch kommerziell. Sie darf **nicht** allein verkauft werden, und eine geänderte
Fassung darf **nicht** weiter Poppins heißen.

## Marke, Logo und Gestaltung — nicht von der MIT-Lizenz erfasst

**Das ist der Punkt, den Open-Source-Projekte am häufigsten übersehen.**

Nicht unter MIT stehen:

- der Name **malziCARE** und die Wortmarke
- **malziland – learning | training | consulting e.U.**, das „m"-Zeichen und
  alle Dateien in `public/assets/` mit Markenbezug
- das Markensymbol (`favicon.*`, `icon-512.png`, `apple-touch-icon.png`)

**Was das heißt:** Du darfst den Code forken, ändern und betreiben. Du darfst
den Fork **nicht** malziCARE nennen und **nicht** mit dem malziland-Zeichen
versehen. Wer den Code weiterverwendet, ersetzt Name und Zeichen durch eigene.

Der Grund ist kein Geiz: Eine Marke sagt, wer für etwas geradesteht. Trüge
jeder Fork denselben Namen, wüsste keine Schule mehr, wessen Zusage zum
Datenschutz sie gerade liest.

## Nachgebildete App-Oberflächen

Die Plakate bilden die Optik von WhatsApp, Snapchat, TikTok und Signal nach.
Diese Namen und Zeichen gehören ihren jeweiligen Inhabern; malziCARE steht in
keiner Verbindung zu ihnen. Die Darstellungen sind zu Bildungszwecken
nachempfunden und verwenden **keine Original-Logos** — nachgezeichnete Symbole
in eigener Gestaltung.

## Die Inhalte, die eine Klasse einträgt

Gehören der Klasse. Sie werden nirgends übertragen und nirgends gespeichert
außer auf dem Gerät. Das erzeugte PDF darf frei verwendet, gedruckt und
weitergegeben werden – auch das ist keine Großzügigkeit, sondern die Folge
daraus, dass der Betreiber die Inhalte nie zu sehen bekommt.
