# Sicherheit

## Etwas gefunden?

Bitte **nicht** als öffentliches Issue melden, sondern an
<info@malziland.at>. Eine Rückmeldung kommt, sobald es geht; bis dahin bitte
nichts veröffentlichen.

## Was hier zu holen ist – und was nicht

malziCARE hat keinen Server, kein Konto, keine Datenbank und keine
Schnittstelle. Die Seite ist statisch; alles läuft im Browser der Nutzerin.
Es gibt daher keine Sitzung zu übernehmen und keine fremden Daten abzugreifen.

Interessant bleiben:

- **Eingaben, die im Browser landen** – Regeltexte, Klassenname, Vornamen der
  Admins. Sie stehen im lokalen Speicher des Geräts und im erzeugten PDF.
- **Der Entwurfs-Import**: Eine geladene Datei ist fremde Eingabe und wird als
  solche behandelt.
- **Die Auslieferkette**: Zugangsdaten zum Webspace stehen in `.env`, niemals
  im Repository.

## Unterstützte Fassung

Gepflegt wird der jeweils aktuelle Stand des Hauptzweigs.
