# ADR-0006: Die Seite erkennt selbst, dass sie veraltet ist

Stand: 2026-08-28 · Status: gültig

## Zusammenhang

Am 28.08.2026 zeigte ein seit Tagen geöffneter Safari-Tab weiter die Fassung
vor dem Umbau auf malziCARE – alter Name in der Kopfzeile, „AGB" statt
„Nutzungsbedingungen" in der Fußzeile, die alte Versionsnummer. Auf dem Server
lag längst der neue Stand: Unter beiden Adressen kam dieselbe Datei mit
demselben `ETag` und `cache-control: no-cache`.

Die Cache-Regeln waren also richtig und haben trotzdem nichts genutzt. Sie
greifen erst bei einer Anfrage, und ein Tab, der nie neu lädt, stellt keine.
Eine Kopfzeile, die niemand abruft, wirkt nicht.

Beim Nachmessen kam ein zweiter Weg zutage, auf dem Veraltetes durchkommt:
`index.html` fordert `js/app.js` mit Cache-Buster an, aber dessen
`import './start.js'` trägt keinen Namen, der sich je ändert. Alle zwölf
Module kamen live mit `max-age=604800`. Dieselbe Denkfigur fand sich eine
Ebene tiefer bei den `url()`-Verweisen auf die Schriften. Ein wiederkehrender Browser bekäme
also neues HTML und bis zu sieben Tage alte Module – eine Mischung, die so nie
jemand getestet hat.

## Entscheidungen

**Die Seite lädt sich still neu, ohne zu fragen.** Kehrt jemand zu einem Tab
zurück, vergleicht sie ihre eingebaute Kennung mit `version.json` auf dem
Server. Weichen sie ab, lädt sie neu. Kein Hinweisfenster, kein Balken, keine
Rückfrage: Die Seite kommt ohne Overlays aus, und eine Frage mit nur einer
sinnvollen Antwort ist keine Frage. Der Plakat-Stand liegt in `localStorage`
und ist nach dem Neuladen unverändert da; vor dem Neuladen wird er zusätzlich
gesichert.

Verworfen wurde, den Leuten zu sagen, sie sollten ihren Zwischenspeicher
leeren. Wer mit einer Klasse vor der Tafel steht, räumt keinen Browser auf.

**Geprüft wird bei der Rückkehr, nicht im Takt.** Kein Wecker im Hintergrund:
Wer den Tab stundenlang sichtbar offen hat, arbeitet gerade damit, womöglich
vor einer Klasse. Mitten in einer Eingabe und während ein PDF entsteht, wird
ebenfalls nicht neu geladen, sondern beim nächsten Mal.

**Höchstens ein Neuladen je gemeldetem Stand.** Läge auf dem Server eine halb
ausgelieferte Fassung, in der `version.json` schon neu und die Seite noch alt
ist, lüde die Seite sonst bei jeder Rückkehr neu – ein Fehler, der schlimmer
wäre als der, den sie behebt. `tools/live-check.mjs` misst diesen Zustand nach
jeder Auslieferung ausdrücklich nach.

**Gestempelt wird im Paket, nicht in der Quelle.** `tools/build.mjs` trägt die
Kennung des Standes in jede Seite ein und hängt den Cache-Buster an jeden
Import auf ein eigenes Modul sowie an jedes `url()` im CSS – dort hängen die
acht Schriftschnitte, in `fonts.css` und noch einmal in `legal.css`. In `public/` bliebe beides eine Bitte, zwölf
Stellen von Hand mitzuziehen. Das schließt an ADR-0001 an: Der Bauschritt
kopiert und stempelt, mehr nicht. Fremdcode unter `js/vendor/` bleibt
unberührt; er wird über `<script src="…?v=…">` geladen und trägt den Buster
bereits.

**Ein Stempel, der ausfällt, fällt auf.** Der Bauschritt liest nach dem
Schreiben nach und bricht ab, wenn eine Seite ohne Kennung oder ein Import
ohne Buster übrig bleibt. Ein Schutz, der still nicht greift, wäre schlimmer
als keiner – er sähe aus wie Schutz.

**Die Datenklasse aus ADR-0001 bleibt unverändert.** Dort steht als Auslöser
für eine Neubewertung: „sobald irgendetwas übertragen wird". Das ist geprüft
worden. Der Abruf von `version.json` sendet keine Inhalte, keine Kennung und
keinen Wiedererkennungswert – er ist derselbe Vorgang wie das Laden einer
CSS-Datei und fällt unter die Zusage, die die Datenschutzerklärung im
Abschnitt Hosting bereits macht. Neu ist allein, dass er sich wiederholt, ohne
dass jemand etwas anklickt; deshalb steht er dort jetzt ausdrücklich.

## Folgen

Wer die Seite offen lässt, bekommt Änderungen ohne Zutun – spätestens beim
nächsten Blick auf den Tab. Wer offline arbeitet, merkt nichts: Bleibt die
Antwort aus, passiert nichts, und der Editor läuft weiter.

Der Preis sind bis zu einer Abfrage je Minute und Tab, jede ein paar hundert
Byte. Gemessen wird der Zustand nach jeder Auslieferung mit
`node tools/live-check.mjs`; die Nachweise stehen in
[VERIFICATION.md](../VERIFICATION.md).
