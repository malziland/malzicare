# ADR-0003: Wo die App-Nachbildung vor der Lesbarkeit zurücktritt

Stand: 2026-08-27 · Status: gültig

## Zusammenhang

Das Plakat bildet die Oberfläche einer Messenger-App nach. Die echten Apps
setzen Nebentexte in helles Grau – Kontraste zwischen 3,0:1 und 3,7:1, unter
der Anforderung von WCAG AA (4,5:1). Die Nachbildung ist der didaktische Kern:
Jugendliche sollen ihre eigene App wiedererkennen.

## Entscheidung

Getrennt wird nach Funktion, nicht nach Optik.

**Angehoben wurde, was Inhalt trägt:**

| Element                               | vorher | nachher |
| ------------------------------------- | -----: | ------: |
| Beschriftungen im Plakat (`ADMINS` …) |  3,2:1 |   4,5:1 |
| Kopfzeilen-Untertitel mit Admin-Namen |  3,6:1 |   4,5:1 |
| Datumstrenner im Chatverlauf          |  3,2:1 |   4,7:1 |

**Unverändert bleibt, was reine Nachbildung ist:** die Uhrzeiten in den
Chatblasen und das Wort in der nachgebildeten Eingabezeile. Sie tragen keine
Information; aus zwei Metern liest sie ohnehin niemand.

## Begründung

Christoph Krieger am 27.08.2026: Der Admin-Untertitel ist kein Design, sondern
Inhalt – dort stehen die Namen echter Schülerinnen und Schüler. Wer im
Streitfall wissen will, wer Admin ist, muss das lesen können. Das Plakat hängt
gedruckt an der Wand und wird bei Klassenzimmerbeleuchtung aus zwei bis drei
Metern gelesen; dort ist 3,2:1 nicht grenzwertig, sondern unlesbar.

Nach der Änderung wurden alle vier Optiken angesehen, nicht nur gemessen: Die
Apps bleiben eindeutig wiedererkennbar.

## Wie die Ausnahme sichtbar bleibt

`tests/e2e/barrierefreiheit.spec.mjs` führt die beiden Ausnahmen namentlich und
gibt sie bei **jedem** Lauf aus, auch bei grünem Ergebnis. Eine Ausnahme, die
niemand mehr sieht, ist nach zwei Monaten kein Sonderfall mehr, sondern der
Normalzustand.
