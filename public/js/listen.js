/* Die Listen in der Seitenleiste: Regeln, Admins, Folgen.
   Enthaelt das Verschieben per Zeiger und per Pfeiltasten. */

import { $, IC, el, iconBtn } from './dom.js';
import { penColor, renderPoster } from './plakat.js';
import { persist, state } from './zustand.js';

export function renderAdminChips() {
  var wrap = $('adminChips');
  wrap.textContent = '';
  state.admins.forEach(function (name, i) {
    var chip = el('span', 'chip', name);
    var x = iconBtn('chip-x', IC.x, name + ' entfernen');
    x.addEventListener('click', function () {
      state.admins.splice(i, 1);
      persist();
      renderAdminChips();
      renderPoster();
      var xs = $('adminChips').querySelectorAll('.chip-x');
      if (xs.length) {
        xs[Math.min(i, xs.length - 1)].focus();
      } else {
        $('inAdmin').focus();
      }
    });
    chip.appendChild(x);
    wrap.appendChild(chip);
  });
}

export function addAdmin() {
  var input = $('inAdmin');
  var name = input.value.trim();
  if (!name) return;
  if (state.admins.length >= 8) return;
  state.admins.push(name.slice(0, 25));
  input.value = '';
  input.focus();
  persist();
  renderAdminChips();
  renderPoster();
}

/* Drag-and-drop (Pointer Events: funktioniert mit Maus und Touch)
   plus Pfeiltasten auf dem Griff für Tastaturbedienung. */

export function moveItem(key, from, to, containerId) {
  var arr = state[key];
  if (to < 0 || to >= arr.length || from === to) return;
  arr.splice(to, 0, arr.splice(from, 1)[0]);
  persist();
  renderAllLists();
  renderPoster();
  var grips = $(containerId).querySelectorAll('.row-grip');
  if (grips[to]) grips[to].focus();
}

export let activeDragPointer = null;

export function makeDraggable(handle, row, containerId, key) {
  handle.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (activeDragPointer !== null) return;
    activeDragPointer = e.pointerId;
    e.preventDefault();
    handle.focus({ preventScroll: true });
    handle.setPointerCapture(e.pointerId);
    var wrap = $(containerId);
    var startIdx = Array.prototype.indexOf.call(wrap.children, row);
    var moved = false;
    row.classList.add('dragging');

    function onMove(ev) {
      if (ev.pointerId !== e.pointerId) return;
      moved = true;
      /* So lange nachrücken, bis die Zeile an der Zeigerposition liegt —
         auch ein einzelnes schnelles Move-Event darf mehrere Plätze springen */
      var guard = 0;
      var changed = true;
      while (changed && guard++ < 30) {
        changed = false;
        var rows = Array.prototype.slice.call(wrap.children);
        var rowIdx = rows.indexOf(row);
        for (var k = 0; k < rows.length; k++) {
          if (rows[k] === row) continue;
          var rect = rows[k].getBoundingClientRect();
          var mid = rect.top + rect.height / 2;
          if (k < rowIdx && ev.clientY < mid) {
            wrap.insertBefore(row, rows[k]);
            changed = true;
            break;
          }
          if (k > rowIdx && ev.clientY > mid) {
            wrap.insertBefore(row, rows[k].nextSibling);
            changed = true;
            break;
          }
        }
      }
    }
    function onUp(ev) {
      if (ev.pointerId !== e.pointerId) return;
      activeDragPointer = null;
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      row.classList.remove('dragging');
      var endIdx = Array.prototype.indexOf.call(wrap.children, row);
      if (moved && endIdx !== -1 && row.isConnected && endIdx !== startIdx) {
        var arr = state[key];
        arr.splice(endIdx, 0, arr.splice(startIdx, 1)[0]);
        persist();
        renderAllLists();
        renderPoster();
        var grips = $(containerId).querySelectorAll('.row-grip');
        if (grips[endIdx]) grips[endIdx].focus();
      }
    }
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  });

  handle.addEventListener('keydown', function (e) {
    var idx = Array.prototype.indexOf.call($(containerId).children, row);
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveItem(key, idx, idx - 1, containerId);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveItem(key, idx, idx + 1, containerId);
    }
  });
}

export function focusRowDel(containerId, index, addBtnId) {
  var rows = $(containerId).querySelectorAll('.rule-row');
  if (!rows.length) {
    $(addBtnId).focus();
    return;
  }
  var row = rows[Math.max(0, Math.min(index, rows.length - 1))];
  var del = row.querySelector('.row-del');
  if (del) del.focus();
}

export function renderRuleList(containerId, key, numbered, itemWord, listLabel, addBtnId) {
  var wrap = $(containerId);
  wrap.textContent = '';
  var arr = state[key];
  arr.forEach(function (val, i) {
    var row = el('div', 'rule-row');
    var name = itemWord + ' ' + (i + 1);

    var grip = iconBtn(
      'row-btn row-grip',
      IC.grip,
      name + ' verschieben – ' + listLabel + ' (ziehen oder Pfeiltasten)'
    );
    makeDraggable(grip, row, containerId, key);
    row.appendChild(grip);

    if (numbered) {
      var num = el('span', 'pen-num', String(i + 1));
      num.style.background = penColor(i, arr.length, 0.28);
      num.style.color = '#404749';
      row.appendChild(num);
    }

    var input = el('input');
    input.type = 'text';
    input.value = val;
    input.maxLength = 90;
    input.setAttribute('aria-label', name + ' – ' + listLabel);
    input.addEventListener('input', function () {
      arr[i] = input.value;
      persist();
      renderPoster();
    });
    row.appendChild(input);

    var del = iconBtn('row-btn row-del', IC.trash, name + ' löschen – ' + listLabel);
    del.addEventListener('click', function () {
      arr.splice(i, 1);
      persist();
      renderAllLists();
      renderPoster();
      focusRowDel(containerId, i, addBtnId);
    });
    row.appendChild(del);

    wrap.appendChild(row);
  });
}

export function sideTitles() {
  $('sideTitleGood').textContent = state.texts.chipGood.trim() || 'Erster Abschnitt';
  $('sideTitleBad').textContent = state.texts.chipBad.trim() || 'Zweiter Abschnitt';
  $('sideTitlePen').textContent = state.texts.pensLabel.trim() || 'Stufen';
}

export function renderAllLists() {
  sideTitles();
  renderRuleList(
    'listGood',
    'good',
    false,
    'Regel',
    state.texts.chipGood.trim() || 'erster Abschnitt',
    'btnAddGood'
  );
  renderRuleList(
    'listBad',
    'bad',
    false,
    'Regel',
    state.texts.chipBad.trim() || 'zweiter Abschnitt',
    'btnAddBad'
  );
  renderRuleList(
    'listPen',
    'penalties',
    true,
    'Stufe',
    state.texts.pensLabel.trim() || 'Stufen',
    'btnAddPen'
  );
}

export function addTo(key, containerId) {
  if (state[key].length >= 20) return;
  state[key].push('');
  persist();
  renderAllLists();
  renderPoster();
  var inputs = $(containerId).querySelectorAll('input');
  if (inputs.length) inputs[inputs.length - 1].focus();
}

/* ---------- Verstoß-Farbskala: Gelb → Orange → Rot → Dunkelrot ---------- */
