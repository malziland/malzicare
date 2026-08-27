#!/bin/sh
# vor-dem-push.sh — faehrt genau die Pruefungen der Pipeline ab, vor dem Push.
# Wird von Hand aufgerufen: `npm run vor-dem-push` oder `sh tools/vor-dem-push.sh`.
#
# Warum von Hand und nicht als Git-Hook: Ein Hook funkt bei jedem Commit
# dazwischen, auch bei einem Zwischenstand, den man bewusst festhalten will.
# Entscheidung von Christoph Krieger am 27.08.2026: gleicher Schutz, aber der
# Zeitpunkt gehoert dem Menschen.
#
# Anders als bei malziME laufen hier ALLE Pruefungen mit, auch die
# Oberflaechentests: Sie brauchen zusammen weniger als eine Minute. Was hier
# gruen ist, ist auch in der Pipeline gruen.
#
# Kein `set -e`: Dieses Skript ist ein Sammel-Berichter. Es zeigt ALLE Maengel,
# nicht nur den ersten - sonst behebt man einen und faellt in den naechsten.

WURZEL=$(cd "$(dirname "$0")/.." && pwd)
cd "$WURZEL" || exit 2

FEHLER=0
LISTE=""

lauf() {
  BESCHREIBUNG="$1"
  shift
  AUSGABE=$("$@" 2>&1)
  RC=$?
  if [ "$RC" -eq 0 ]; then
    printf '  ok    %s\n' "$BESCHREIBUNG"
  else
    printf '  ROT   %s\n' "$BESCHREIBUNG"
    printf '%s\n' "$AUSGABE" | sed 's/^/        /' | tail -20
    FEHLER=$((FEHLER + 1))
    LISTE="$LISTE
  - $BESCHREIBUNG"
  fi
}

START=$(date +%s)
echo "Vor dem Push - dieselben Pruefungen wie in der Pipeline"
echo "-----------------------------------------------------------"

lauf "Formatierung"           npx prettier --check .
lauf "Linter"                 npx eslint public/js/app.js tools tests eslint.config.js
lauf "Verweise und Adressen"  node tools/lint-html.mjs
lauf "Cache-Buster"           node tools/cache-buster.mjs
lauf "Geheimnis-Scan"         node tools/scan-secrets.mjs
lauf "Unit-Tests"             node tools/run-tests.mjs
lauf "Oberflaechentests"      npx playwright test

# Was die Pipeline zusaetzlich prueft.
lauf "Abhaengigkeiten"        npm audit --audit-level=high

# Kein Geheimnis darf je in die Historie geraten - auch nicht durch ein
# vergessenes `git add -f`.
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  printf '  ROT   .env ist versioniert - das FTP-Passwort darf nie ins Repo\n'
  FEHLER=$((FEHLER + 1))
  LISTE="$LISTE
  - .env ist versioniert"
else
  printf '  ok    .env ist nicht versioniert\n'
fi

DAUER=$(($(date +%s) - START))
echo "-----------------------------------------------------------"

if [ "$FEHLER" -eq 0 ]; then
  echo "Alles gruen in ${DAUER} s. Der Push wird die Pipeline nicht brechen."
  exit 0
fi

printf 'ROT: %s Pruefung(en) wuerden die Pipeline brechen:%s\n' "$FEHLER" "$LISTE"
echo ""
echo "Erst beheben, dann pushen."
exit 1
