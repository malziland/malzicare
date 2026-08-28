/* Der Stand-Waechter: sorgt dafuer, dass ein lange offener Tab nicht auf
 * Dauer eine alte Fassung zeigt.
 *
 * Anlass, 28.08.2026: Nach dem Umbau auf malziCARE zeigte ein seit Tagen
 * offener Safari-Tab weiter die Fassung davor - alter Name in der Kopfzeile,
 * alter Fusszeilen-Link, alte Versionsnummer. Auf dem Server lag laengst der
 * neue Stand; unter beiden Adressen wurde dieselbe Datei mit demselben ETag
 * gemessen. Die Cache-Regeln waren also richtig und haben trotzdem nichts
 * genutzt, denn sie greifen erst bei einer Anfrage. Ein Tab, der nie neu
 * laedt, stellt keine, und eine Kopfzeile, die niemand abruft, wirkt nicht.
 *
 * Die naheliegende Antwort waere, den Leuten zu sagen, sie sollen ihren
 * Zwischenspeicher leeren. Das ist keine. Also sieht die Seite selbst nach:
 * Kehrt jemand zum Tab zurueck, vergleicht sie ihre eingebaute Kennung mit
 * der, die auf dem Server liegt. Weichen sie ab, laedt sie neu. Der
 * Plakat-Stand liegt in localStorage und ist danach unveraendert da.
 *
 * Zwei Dinge bewusst nicht:
 *   Kein Hinweisfenster und keine Rueckfrage. Die Seite kommt ohne Overlays
 *   aus, und eine Frage mit nur einer sinnvollen Antwort ist keine Frage.
 *   Kein Wecker im Hintergrund. Wer den Tab stundenlang sichtbar offen hat,
 *   arbeitet gerade damit, womoeglich vor einer Klasse. Der richtige Moment
 *   zum Neuladen ist die Rueckkehr, nicht die Benutzung.
 */

/* Wie ein gestempelter Stand aussieht: die zehn Stellen aus version.json.
   Alles andere - der Platzhalter aus public/, ein leeres Feld, ein halb
   ersetzter Wert - schaltet den Waechter ab, statt zu raten. */
const KENNUNG = /^[0-9a-f]{10}$/;

/* Mindestabstand zwischen zwei Abfragen. Ohne ihn schickt jeder Tabwechsel
   eine Anfrage; damit bleibt es bei hoechstens einer je Minute. */
export const ABSTAND_MS = 60000;

/* Hoechstens ein Neuladen je gemeldetem Stand. Liegt auf dem Server eine halb
   ausgelieferte Fassung, in der version.json schon neu und die Seite noch alt
   ist, wuerde die Seite sonst bei jeder Rueckkehr neu laden - ein Fehler,
   der schlimmer waere als der, den sie beheben soll. */
const MARKE = 'malzicare:neu-geladen-fuer';

let letztePruefung = 0;
let laeuft = false;

/* Die Regel allein, ohne Dokument und ohne Netz: So laesst sie sich pruefen,
   und nicht nur ihr Zusammenspiel. */
export function sollNeuLaden(eingebaut, live) {
  if (!KENNUNG.test(String(eingebaut))) return false;
  if (!KENNUNG.test(String(live))) return false;
  return eingebaut !== live;
}

/* Die Kennung, die beim Bauen in die Seite gestempelt wurde. Fehlt sie oder
   sieht sie nicht aus wie eine, gibt es keinen Waechter - das ist der Fall
   beim Arbeiten aus public/ heraus. Damit dieses Aus nicht unbemerkt in die
   Auslieferung geraet, verlangt tools/lint-html.mjs den Stempel und
   tests/unit/stempel.test.mjs einen echten Wert im gebauten Paket. */
export function eingebauterStand(dok) {
  const meta = (dok || document).querySelector('meta[name="malzicare-stand"]');
  const wert = meta ? meta.getAttribute('content') || '' : '';
  return KENNUNG.test(wert) ? wert : null;
}

async function liveStand() {
  /* Der Zeitstempel haengt die Abfrage vom Zwischenspeicher ab: Jede bekommt
     eine eigene Adresse. Die Kopfzeile allein wuerde genuegen, wenn sich jeder
     Browser in jeder Lage an sie hielte - und genau diese Annahme hat das
     Problem hier ueberhaupt erst erzeugt. */
  const antwort = await fetch('version.json?_t=' + Date.now(), { cache: 'no-store' });
  if (!antwort.ok) return null;
  const daten = await antwort.json();
  return daten ? daten.commit_short : null;
}

/* Mitten in einer Eingabe und waehrend das PDF entsteht wird nicht neu
   geladen. Beides dauert Sekunden, und die naechste Rueckkehr kommt bestimmt. */
function geradeUngelegen() {
  const aktiv = document.activeElement;
  if (aktiv && /^(INPUT|TEXTAREA|SELECT)$/.test(aktiv.tagName)) return true;
  const exportKnopf = document.getElementById('btnExport');
  return Boolean(exportKnopf && exportKnopf.disabled);
}

function schonGeladenFuer(stand) {
  try {
    if (sessionStorage.getItem(MARKE) === stand) return true;
    sessionStorage.setItem(MARKE, stand);
  } catch (e) {
    /* Privater Modus ohne Speicher: dann eben ohne diesen Riegel. Der
       Mindestabstand und der Start-Zeitpunkt halten weiterhin. */
  }
  return false;
}

async function pruefen(vorDemNeuladen) {
  const eingebaut = eingebauterStand();
  if (!eingebaut || laeuft) return;
  if (Date.now() - letztePruefung < ABSTAND_MS) return;
  letztePruefung = Date.now();
  laeuft = true;
  try {
    const live = await liveStand();
    if (!sollNeuLaden(eingebaut, live)) return;
    if (geradeUngelegen()) {
      /* Nicht jetzt - aber bei der naechsten Rueckkehr sofort wieder, nicht
         erst nach Ablauf des Mindestabstands. */
      letztePruefung = 0;
      return;
    }
    if (schonGeladenFuer(live)) return;
    if (typeof vorDemNeuladen === 'function') vorDemNeuladen();
    location.reload();
  } catch (e) {
    /* Kein Netz, keine Antwort, kein brauchbares JSON: Der Editor arbeitet
       ohne Server, also darf dessen Ausbleiben nichts kaputtmachen. Beim
       naechsten Mal wieder. */
  } finally {
    laeuft = false;
  }
}

/* Haengt den Waechter ein. `vorDemNeuladen` sichert den Arbeitsstand; die
   Rechtsseiten haben keinen und uebergeben nichts. Rueckgabe sagt, ob der
   Waechter laeuft - danach fragen die Oberflaechentests. */
export function ueberwacheStand(vorDemNeuladen) {
  if (!eingebauterStand()) return false;
  /* Frisch geladen ist frisch: Die erste Abfrage kommt fruehestens nach dem
     Mindestabstand. Das haelt die Schleife auch dann auf, wenn kein
     sessionStorage zur Verfuegung steht. */
  letztePruefung = Date.now();

  const nachsehen = function () {
    pruefen(vorDemNeuladen);
  };
  /* Rueckkehr zum Tab hat drei Formen, und nicht jeder Browser bedient in
     jeder Lage alle drei. Der Mindestabstand macht daraus hoechstens eine
     Anfrage. */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) nachsehen();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') nachsehen();
  });
  window.addEventListener('focus', nachsehen);
  return true;
}
