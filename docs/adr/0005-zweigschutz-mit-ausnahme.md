# ADR-0005: Zweigschutz mit Ausnahme für den Eigentümer

Stand: 2026-08-27 · Status: gültig

## Zusammenhang

Seit der Veröffentlichung schützt ein Regelwerk den Hauptzweig: Löschen und
Überschreiben der Historie sind gesperrt, und die Prüfkette muss grün sein.

Der erste Versuch sperrte auch den Eigentümer aus: Ein direkter Push auf `main`
wurde abgewiesen, weil die Pflichtprüfung für den neuen Commit noch nicht
gelaufen war (`push declined due to repository rule violations`). Das Projekt
wird von einer Person gepflegt, die direkt auf `main` arbeitet – ein Schutz,
der das verhindert, führt dazu, dass man ihn abschaltet.

## Entscheidung

Das Regelwerk bleibt aktiv, mit einer Ausnahme für die Rolle **Administrator**
(`bypass_mode: always`). Für alle anderen – jeden Beitrag von außen – gilt es
vollständig.

## Was das schützt und was nicht

**Es schützt:** vor Beiträgen Dritter, die die Prüfkette nicht bestehen; vor
dem Löschen des Hauptzweigs; vor überschriebener Historie.

**Es schützt nicht:** vor einem unbedachten direkten Push des Eigentümers.
Dagegen steht `npm run vor-dem-push`, das dieselben Prüfungen lokal fährt –
freiwillig aufgerufen, nach ausdrücklicher Entscheidung gegen einen Git-Hook.

Das ist die ehrliche Grenze dieser Konfiguration und keine Nachlässigkeit: Ein
Riegel, den der einzige Bearbeiter täglich umgehen muss, wird nach einer Woche
abgeschaltet – und dann schützt er auch die Beiträge Dritter nicht mehr.

## Bedingung für eine Neubewertung

Sobald eine zweite Person Schreibrechte bekommt. Dann arbeiten beide über Pull
Requests, und die Ausnahme entfällt.
