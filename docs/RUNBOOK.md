# Runbook

Was im Betrieb zu tun ist – und was zu tun ist, wenn etwas schiefgeht.

## Ausliefern

```bash
npm run deploy
```

Der Ablauf in dieser Reihenfolge, jeder Schritt ein Riegel:

1. **Arbeitsbaum sauber?** Sonst Abbruch. Ausgeliefert wird nur ein
   festgehaltener Stand, sonst lässt sich später nicht sagen, was oben liegt.
2. **Prüfkette grün?** Sonst Abbruch. `--eilig` überspringt die
   Oberflächentests und sagt das laut.
3. **Paket bauen.** `dist/` entsteht neu aus `public/`; fehlt die `.htaccess`,
   Abbruch.
4. **Zugangsdaten vollständig?** Sonst Abbruch mit der Liste dessen, was fehlt.
5. **Hochladen** per SFTP in `SFTP_REMOTE_DIR`.
6. **Nachmessen** von außen (siehe unten). Erst danach gilt die Auslieferung
   als erfolgreich.

Ohne Verbindung, nur zum Prüfen des Ablaufs: `npm run deploy -- --probe`.
Nur anmelden und nachsehen, ohne etwas zu ändern: `npm run deploy -- --verbindung`.

**Warum SFTP und nicht FTPS:** Gemessen am 27.08.2026 lehnt der Server
verschlüsseltes FTP ab (`500 'AUTH': command unrecognized`); Port 21 wäre
Klartext. Port 22 nimmt dieselben Zugangsdaten verschlüsselt entgegen.

**Fremde Dateien im Zielverzeichnis** werden nach dem Hochladen benannt, aber
nicht angetastet – `--aufraeumen` entfernt sie. Grund für die Zurückhaltung:
Was oben liegt und nicht aus dem Paket stammt, kann auch absichtlich dort sein.

## Vor dem Push

```bash
npm run vor-dem-push
```

Fährt dieselben Prüfungen ab wie die Pipeline, zeigt **alle** Mängel auf einmal
und prüft zusätzlich, dass `.env` nicht versioniert ist. Dauert unter einer
Minute; ein roter Pipeline-Lauf kostet ein Vielfaches davon.

## Nachmessen

```bash
npm run verify:live
```

Geprüft wird gegen `LIVE_BASE_URL`:

- die Kennung in `version.json` gegen den erwarteten Commit,
- die Prüfsumme **jeder** Datei,
- die **Wirkung** der `.htaccess`: HTML muss `no-cache` liefern, Assets
  `max-age=604800`. Die Datei selbst ist von außen nicht abrufbar – ihr Fehlen
  aber messbar. Genau sie fehlte am 21.07.2026 unbemerkt im Paket.
- eine Gegenprobe auf eine Datei, die es nicht geben darf.

Ob die Messung selbst noch funktioniert:

```bash
node tools/live-check.mjs --negativprobe   # MUSS fehlschlagen
```

Schlägt die Negativprobe _nicht_ fehl, ist die Messung blind. Dann gilt kein
grünes Ergebnis mehr, bis der Fehler gefunden ist.

## Rückweg

**Es gibt keinen automatischen Rückweg – der Rückweg ist ein zweites
Ausliefern.** Der Webspace hält keine Fassungen vor.

```bash
git checkout <letzter guter Commit>
npm run deploy
git checkout main
```

Die Kennung des letzten guten Standes steht in `docs/VERIFICATION.md` und in
`version.json` der laufenden Seite. Vor jedem Ausliefern lohnt der Blick auf
`npm run verify:live` – dann ist die Kennung bekannt, bevor sie gebraucht wird.

## Notschalter

Jeder Riegel lässt sich umgehen, damit ein dringender Hotfix nicht am
Werkzeug scheitert:

| Riegel             | Notschalter                 | Bedingung                                   |
| ------------------ | --------------------------- | ------------------------------------------- |
| Oberflächentests   | `npm run deploy -- --eilig` | nur bei Störung, wird im Lauf laut gemeldet |
| Arbeitsbaum sauber | committen, kein Schalter    | bewusst keiner: ohne Commit keine Kennung   |
| Live-Prüfung rot   | keiner                      | rot heißt: der Stand oben stimmt nicht      |

## Störungen

**Die Seite zeigt einen alten Stand.** Erst `npm run verify:live`. Weicht nur
die Kennung ab, war der Upload unvollständig – erneut ausliefern. Stimmen
Kennung und Prüfsummen, ist es ein Zwischenspeicher: `.htaccess` prüfen (siehe
Wirkungsmessung oben).

**Der PDF-Export klappt bei einer Nutzerin nicht.** Der Editor bietet dann den
Druckdialog als Ausweg an. Auf iPhones hängt der Download daran, dass jeder
Blob als `application/octet-stream` erzeugt wird – ein Test wacht darüber.

**Zugangsdaten verloren oder kompromittiert.** Im IONOS-Panel neues
SFTP-Passwort setzen, `.env` aktualisieren. Die Datei steht in `.gitignore`;
sollte sie je committet worden sein, gilt das Passwort als verbrannt und muss
gewechselt werden – Entfernen aus der Historie genügt nicht.

## Wenn Anweisungen ins IONOS-Panel gehen

Vor jeder Änderung an einer fremden Oberfläche wird der Ist-Zustand
festgehalten, die Änderung als Tabelle mit exakten Feldwerten beschrieben, die
Nachbareinträge namentlich als „nicht anfassen" benannt und danach von außen
nachgemessen. Für die anstehende Verknüpfung von `malzi.care` gilt
insbesondere: **Das Wildcard-Zertifikat `*.malziland.at` wird nicht angefasst** –
daran hängt die Hauptseite.
