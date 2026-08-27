/* malziCARE – Editor für Klassenchat-Regeln · malziland
   Läuft komplett im Browser, keine Server-Speicherung.

   Einstiegspunkt. Der Code liegt in Modulen daneben:

     daten.js      feste Werte, Voreinstellungen, Grenzen
     dom.js        Helfer fuer das Dokument, eingebettete Symbole
     zustand.js    laden, pruefen, sichern
     plakat.js     alles, was das Plakat zeichnet
     listen.js     die Listen in der Seitenleiste
     eingaben.js   Eingabefelder, mitwachsende Textfelder
     dialog.js     der eine Dialog
     datum.js      Datumswaehler
     dateien.js    Entwurf speichern und oeffnen
     pdf.js        Export als A3-PDF
     start.js      Verdrahtung und Start

   Wird die Seite ueber file:// geoeffnet, laedt der Browser keine Module -
   dann bleibt der Editor leer. Deshalb sagt er es in diesem Fall. */

import './start.js';
