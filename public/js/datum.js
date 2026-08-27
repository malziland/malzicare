/* Der Datumswaehler fuer das Unterschriftenfeld. */

import { MONTHS } from './daten.js';
import { $, IC, el, iconBtn } from './dom.js';
import { renderPoster } from './plakat.js';
import { persist, state } from './zustand.js';

export let pickView = null;

export function formatDate(d) {
  return d.getDate() + '. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}

export function closeDatePick() {
  $('datePick').hidden = true;
  $('btnDatePick').setAttribute('aria-expanded', 'false');
  pickView = null;
}

export function openDatePick() {
  var today = new Date();
  pickView = { y: today.getFullYear(), m: today.getMonth() };
  renderDatePick();
  $('datePick').hidden = false;
  $('btnDatePick').setAttribute('aria-expanded', 'true');
}

export function pickDate(y, m, day) {
  state.workshopDate = formatDate(new Date(y, m, day));
  $('inDate').value = state.workshopDate;
  persist();
  renderPoster();
  closeDatePick();
  $('inDate').focus();
}

export function renderDatePick() {
  var box = $('datePick');
  box.textContent = '';
  var today = new Date();

  var head = el('div', 'dp-head');
  var prev = iconBtn('dp-nav', IC.chevL, 'Voriger Monat');
  prev.addEventListener('click', function () {
    pickView.m -= 1;
    if (pickView.m < 0) {
      pickView.m = 11;
      pickView.y -= 1;
    }
    renderDatePick();
  });
  head.appendChild(prev);
  head.appendChild(el('span', 'dp-title', MONTHS[pickView.m] + ' ' + pickView.y));
  var next = iconBtn('dp-nav', IC.chevR, 'Nächster Monat');
  next.addEventListener('click', function () {
    pickView.m += 1;
    if (pickView.m > 11) {
      pickView.m = 0;
      pickView.y += 1;
    }
    renderDatePick();
  });
  head.appendChild(next);
  box.appendChild(head);

  var week = el('div', 'dp-week');
  ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(function (w) {
    week.appendChild(el('span', null, w));
  });
  box.appendChild(week);

  var grid = el('div', 'dp-grid');
  var offset = (new Date(pickView.y, pickView.m, 1).getDay() + 6) % 7;
  var days = new Date(pickView.y, pickView.m + 1, 0).getDate();
  for (var i = 0; i < offset; i++) grid.appendChild(el('span'));
  for (var d = 1; d <= days; d++) {
    (function (day) {
      var b = el('button', 'dp-day', String(day));
      b.type = 'button';
      if (
        day === today.getDate() &&
        pickView.m === today.getMonth() &&
        pickView.y === today.getFullYear()
      ) {
        b.classList.add('dp-today');
      }
      b.addEventListener('click', function () {
        pickDate(pickView.y, pickView.m, day);
      });
      grid.appendChild(b);
    })(d);
  }
  box.appendChild(grid);

  var foot = el('div', 'dp-foot');
  var btnToday = el('button', 'btn-ghost', 'Heute');
  btnToday.type = 'button';
  btnToday.addEventListener('click', function () {
    pickDate(today.getFullYear(), today.getMonth(), today.getDate());
  });
  foot.appendChild(btnToday);
  var btnClear = el('button', 'btn-ghost', 'Löschen');
  btnClear.type = 'button';
  btnClear.addEventListener('click', function () {
    state.workshopDate = '';
    $('inDate').value = '';
    persist();
    renderPoster();
    closeDatePick();
  });
  foot.appendChild(btnClear);
  box.appendChild(foot);
}

/* ---------- Reiter in der Seitenleiste ---------- */
