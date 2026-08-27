/* Der PDF-Export: Plakat als Bild, dann in ein A3-Dokument. */

import { $ } from './dom.js';

import { downloadBlob } from './dateien.js';
import { showModal } from './dialog.js';
import { autofit, fitHeaderSub } from './plakat.js';

export function exportPdf() {
  runPdfExport('download', null);
}

export function runPdfExport(mode, tab) {
  var btn = $('btnExport');
  if (btn.disabled) return;
  var label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'PDF wird erstellt …';

  var poster = $('poster');
  fitHeaderSub();
  autofit();

  /* Schutz: sollte die Bild-Erzeugung in einer Umgebung hängen bleiben
     (z. B. lokal per Doppelklick geöffnete Datei), nach 30 s abbrechen
     und den Druck-Fallback anbieten statt stumm zu warten. Großzügig
     bemessen, damit langsame Geräte nicht fälschlich abbrechen. */
  var rendern = htmlToImage.toJpeg(poster, {
    quality: 0.95,
    pixelRatio: 2.6,
    backgroundColor: '#eceae5',
    width: poster.offsetWidth,
    height: poster.offsetHeight,
  });
  var zeitlimit = new Promise(function (resolve, reject) {
    setTimeout(function () {
      reject(new Error('Zeitüberschreitung'));
    }, 30000);
  });

  Promise.race([rendern, zeitlimit])
    .then(function (dataUrl) {
      var pdf = new window.jspdf.jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [420, 297],
        compress: true,
      });
      pdf.setProperties({ title: 'Klassenchat-Regeln' });
      pdf.addImage(dataUrl, 'JPEG', 0, 0, 420, 297);
      if (mode === 'view' && tab) {
        tab.location = pdf.output('bloburl');
      } else {
        /* Bewusst als neutraler Binärtyp statt application/pdf:
         iPhone-Safari ignoriert das download-Attribut bei PDF-Blobs
         und ZEIGT sie an — einen unbekannten Typ muss es herunterladen.
         Die Datei heißt weiterhin .pdf und öffnet normal. */
        var pdfBlob = new Blob([pdf.output('arraybuffer')], { type: 'application/octet-stream' });
        downloadBlob(pdfBlob, 'Klassenchat-Regeln.pdf');
      }
    })
    .catch(function () {
      if (tab) {
        try {
          tab.close();
        } catch (e) {
          /* egal */
        }
      }
      showModal({
        title: 'PDF-Export nicht möglich',
        message:
          'Der direkte Export hat in diesem Browser nicht geklappt. Als Ausweg kann der Druckdialog geöffnet werden – dort „Als PDF sichern" wählen.',
        confirmLabel: 'Druckdialog öffnen',
        cancelLabel: 'Abbrechen',
        onConfirm: function () {
          setTimeout(function () {
            window.print();
          }, 100);
        },
      });
    })
    .then(function () {
      btn.disabled = false;
      btn.textContent = label;
    });
}

/* ---------- Textfelder: automatische Höhe + Anfasser (auch Touch) ---------- */
