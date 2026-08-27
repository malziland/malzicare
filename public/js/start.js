/* Verdrahtung: verbindet die Bedienelemente mit den Modulen und startet. */

import { loadFile, saveFile } from './dateien.js';
import { DEFAULTS, SEG_IDS, TEXT_FIELDS } from './daten.js';
import { closeDatePick, openDatePick } from './datum.js';
import { closeModal, showModal } from './dialog.js';
import { $, IC } from './dom.js';
import { autosizeAllTextareas, enhanceTextarea, initInputs } from './eingaben.js';
import { addAdmin, addTo, renderAdminChips, renderAllLists } from './listen.js';
import { exportPdf } from './pdf.js';
import {
  autofit,
  fitHeaderSub,
  fitStage,
  renderPoster,
  renderStaticIcons,
  setPlatform,
} from './plakat.js';
import { persist, setState, state } from './zustand.js';

export function showTab(which) {
  var inhalt = which === 'inhalt';
  $('tabInhalt').classList.toggle('is-active', inhalt);
  $('tabTexte').classList.toggle('is-active', !inhalt);
  $('tabInhalt').setAttribute('aria-selected', String(inhalt));
  $('tabTexte').setAttribute('aria-selected', String(!inhalt));
  $('panelInhalt').hidden = !inhalt;
  $('panelTexte').hidden = inhalt;
  /* Erst jetzt sind die Textfelder messbar – Höhe an Inhalt anpassen */
  if (!inhalt) autosizeAllTextareas();
}

export function init() {
  var params = new URLSearchParams(location.search);

  /* Foto-Modus (?foto): nur das Plakat rendern, z. B. für Vorschaubilder */
  if (params.has('foto')) document.body.classList.add('shot');

  renderStaticIcons();
  Array.prototype.forEach.call(document.querySelectorAll('textarea'), enhanceTextarea);
  initInputs();
  renderAdminChips();
  renderAllLists();
  setPlatform(state.platform, true);
  fitStage();

  /* Nach dem Poppins-Load neu messen: die Init-Messung lief noch mit dem
     Fallback-Font, sonst stimmen --cs und die Platz-Ampel nicht. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      renderPoster();
      fitStage();
    });
  }

  $('inGroup').addEventListener('input', function () {
    state.groupName = this.value;
    persist();
    renderPoster();
  });
  $('inDate').addEventListener('input', function () {
    state.workshopDate = this.value;
    persist();
    renderPoster();
  });
  $('btnDatePick').innerHTML = IC.cal;
  $('btnDatePick').addEventListener('click', function () {
    if ($('datePick').hidden) openDatePick();
    else closeDatePick();
  });
  document.addEventListener('click', function (e) {
    var dp = $('datePick');
    if (
      !dp.hidden &&
      !dp.contains(e.target) &&
      e.target !== $('btnDatePick') &&
      !$('btnDatePick').contains(e.target)
    ) {
      closeDatePick();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('mlModal').hidden) {
      closeModal(false);
      return;
    }
    if (!$('datePick').hidden) {
      closeDatePick();
      $('btnDatePick').focus();
    }
  });
  $('tabInhalt').addEventListener('click', function () {
    showTab('inhalt');
  });
  $('tabTexte').addEventListener('click', function () {
    showTab('texte');
  });

  Object.keys(TEXT_FIELDS).forEach(function (id) {
    var key = TEXT_FIELDS[id];
    $(id).addEventListener('input', function () {
      state.texts[key] = this.value;
      persist();
      /* Listen neu aufbauen, damit auch aria-labels/Tooltips den neuen
         Abschnittsnamen tragen (Fokus liegt im Textfeld, geht nicht verloren) */
      if (key === 'chipGood' || key === 'chipBad' || key === 'pensLabel') renderAllLists();
      renderPoster();
    });
  });

  $('btnAddAdmin').addEventListener('click', addAdmin);
  $('inAdmin').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAdmin();
    }
  });

  $('btnAddGood').addEventListener('click', function () {
    addTo('good', 'listGood');
  });
  $('btnAddBad').addEventListener('click', function () {
    addTo('bad', 'listBad');
  });
  $('btnAddPen').addEventListener('click', function () {
    addTo('penalties', 'listPen');
  });

  Object.keys(SEG_IDS).forEach(function (p) {
    $(SEG_IDS[p]).addEventListener('click', function () {
      setPlatform(p);
    });
  });

  $('btnSave').addEventListener('click', saveFile);
  $('btnLoad').addEventListener('click', function () {
    $('fileInput').click();
  });
  $('fileInput').addEventListener('change', function () {
    if (this.files && this.files[0]) loadFile(this.files[0]);
    this.value = '';
  });

  $('btnReset').addEventListener('click', function () {
    showModal({
      title: 'Auf Vorlage zurücksetzen',
      message:
        'Alle Eingaben werden verworfen und die Beispiel-Vorlage wird geladen. Das kann nicht rückgängig gemacht werden.',
      confirmLabel: 'Zurücksetzen',
      cancelLabel: 'Abbrechen',
      danger: true,
      onConfirm: function () {
        setState(JSON.parse(JSON.stringify(DEFAULTS)));
        persist();
        initInputs();
        renderAdminChips();
        renderAllLists();
        setPlatform(state.platform);
      },
    });
  });

  $('mlModalOk').addEventListener('click', function () {
    closeModal('confirm');
  });
  $('mlModalAlt').addEventListener('click', function () {
    closeModal('alt');
  });
  $('mlModalCancel').addEventListener('click', function () {
    closeModal(false);
  });
  $('mlModal').addEventListener('click', function (e) {
    if (e.target === $('mlModal')) closeModal(false);
  });
  /* Fokus-Falle: Tab kreist zwischen den sichtbaren Modal-Buttons */
  $('mlModal').addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var btns = [$('mlModalCancel'), $('mlModalAlt'), $('mlModalOk')].filter(function (b) {
      return !b.hidden;
    });
    if (!btns.length) return;
    var idx = btns.indexOf(document.activeElement);
    e.preventDefault();
    if (idx === -1) {
      btns[0].focus();
      return;
    }
    var next = (idx + (e.shiftKey ? -1 : 1) + btns.length) % btns.length;
    btns[next].focus();
  });

  $('btnExport').addEventListener('click', exportPdf);

  var baseTitle = document.title;
  window.addEventListener('beforeprint', function () {
    /* Dateiname des PDF-Exports */
    document.title = 'Klassenchat-Regeln';
    fitHeaderSub();
    autofit();
  });
  window.addEventListener('afterprint', function () {
    document.title = baseTitle;
    $('btnExport').focus();
  });

  window.addEventListener('resize', fitStage);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(fitStage).observe($('stage'));
  }
}

/* Der Editor startet, sobald das Dokument steht. Als Modul laeuft dieser Code
   ohnehin erst nach dem Parsen - die Abfrage bleibt trotzdem, damit ein
   spaeteres Einbinden auf anderem Weg nicht stillschweigend nichts tut. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
