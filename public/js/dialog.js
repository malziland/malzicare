/* Der eine Dialog des Editors. Bewusst keine Browser-Meldungen:
   die halten die Seite an und lassen sich nicht gestalten. */

import { $ } from './dom.js';

export let modalState = null;

export function showModal(opts) {
  var ok = $('mlModalOk');
  var alt = $('mlModalAlt');
  var cancel = $('mlModalCancel');
  $('mlModalTitle').textContent = opts.title;
  $('mlModalMsg').textContent = opts.message;
  ok.textContent = opts.confirmLabel || 'OK';
  ok.className = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary');
  alt.hidden = !opts.altLabel;
  if (opts.altLabel) alt.textContent = opts.altLabel;
  cancel.hidden = !opts.cancelLabel;
  if (opts.cancelLabel) cancel.textContent = opts.cancelLabel;
  modalState = {
    onConfirm: opts.onConfirm || null,
    onAlt: opts.onAlt || null,
    returnFocus: document.activeElement,
  };
  $('mlModal').hidden = false;
  /* Bei Bestätigungsfragen startet der Fokus sicher auf „Abbrechen" */
  (opts.cancelLabel ? cancel : ok).focus();
}

export function closeModal(action) {
  $('mlModal').hidden = true;
  var st = modalState;
  modalState = null;
  if (st && st.returnFocus && st.returnFocus.focus) {
    try {
      st.returnFocus.focus();
    } catch (e) {
      /* Element evtl. weg */
    }
  }
  if (!st) return;
  if (action === 'confirm' && st.onConfirm) st.onConfirm();
  if (action === 'alt' && st.onAlt) st.onAlt();
}

/* ---------- Kalender (Date-Picker im malziland-Stil) ---------- */
