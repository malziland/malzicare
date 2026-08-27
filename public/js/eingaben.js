/* Die Eingabefelder der Seitenleiste und die mitwachsenden Textfelder. */

import { TEXT_FIELDS } from './daten.js';
import { $, IC, el } from './dom.js';
import { state } from './zustand.js';

export function initInputs() {
  $('inGroup').value = state.groupName;
  $('inDate').value = state.workshopDate;
  Object.keys(TEXT_FIELDS).forEach(function (id) {
    var el = $(id);
    if (el) el.value = state.texts[TEXT_FIELDS[id]] || '';
  });
  autosizeAllTextareas();
}

/* ---------- Direkter PDF-Export (browserunabhängig, immer A3 quer) ---------- */

/* Datei-Download über einen eigenen Link mit download-Attribut —
   bewusst NICHT über pdf.save(), denn dessen eingebaute Safari-Weiche
   zeigt die Datei am iPhone im Tab an, statt sie herunterzuladen. */
/* Die Blob-URL darf erst beim NÄCHSTEN Download freigegeben werden:
   iPhone-Safari zeigt erst einen „Laden?"-Dialog, und wenn die URL da
   schon weg ist, greift der bestätigte Download ins Leere. */

export function enhanceTextarea(ta) {
  var wrap = document.createElement('div');
  wrap.className = 'ta-wrap';
  ta.parentNode.insertBefore(wrap, ta);
  wrap.appendChild(ta);

  var grip = el('span', 'ta-grip');
  grip.innerHTML = IC.resize;
  grip.setAttribute('aria-hidden', 'true');
  wrap.appendChild(grip);

  function autosize() {
    ta.style.height = 'auto';
    var min = parseInt(ta.dataset.minH || '0', 10) || 0;
    ta.style.height = Math.max(ta.scrollHeight + 2, min, 60) + 'px';
  }
  ta.__autosize = autosize;
  ta.addEventListener('input', autosize);

  grip.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    grip.setPointerCapture(e.pointerId);
    var startY = e.clientY;
    var startH = ta.getBoundingClientRect().height;
    function onMove(ev) {
      if (ev.pointerId !== e.pointerId) return;
      var h = Math.max(60, Math.round(startH + (ev.clientY - startY)));
      ta.dataset.minH = h;
      ta.style.height = h + 'px';
    }
    function onUp(ev) {
      if (ev.pointerId !== e.pointerId) return;
      grip.removeEventListener('pointermove', onMove);
      grip.removeEventListener('pointerup', onUp);
      grip.removeEventListener('pointercancel', onUp);
    }
    grip.addEventListener('pointermove', onMove);
    grip.addEventListener('pointerup', onUp);
    grip.addEventListener('pointercancel', onUp);
  });
}

export function autosizeAllTextareas() {
  Array.prototype.forEach.call(document.querySelectorAll('textarea'), function (ta) {
    if (ta.__autosize) ta.__autosize();
  });
}

/* ---------- Designte Modals (nur Zurücksetzen und Fehlerfälle) ---------- */
