/* Klassenchat-Plakat-Editor · malziland
   Läuft komplett im Browser, keine Server-Speicherung. */

(function () {
  'use strict';

  var STORAGE_KEY = 'malziland-klassenchat-plakat-v1';

  var PLATFORMS = {
    whatsapp: { name: 'WhatsApp', placeholder: 'Nachricht' },
    snapchat: { name: 'Snapchat', placeholder: 'Chat senden' },
    tiktok: { name: 'TikTok', placeholder: 'Nachricht senden …' },
    signal: { name: 'Signal', placeholder: 'Signal-Nachricht' }
  };

  var TEXT_LIMITS = {
    eyebrow: 60, title: 70, subtitle: 220,
    chipGood: 45, chipBad: 45, day: 25,
    pinned: 45, adminsLabel: 45, pensLabel: 45,
    signTitle: 40, signText: 220
  };

  var DEFAULTS = {
    platform: 'whatsapp',
    groupName: 'Klasse 1A',
    admins: ['Nicole', 'Emily'],
    good: [
      'Hausübungen',
      'Lernen',
      'Alle haben alle Infos gleichzeitig',
      'Zusammen etwas ausmachen',
      'Zusammenhalten',
      'Nett schreiben'
    ],
    bad: [
      'Beleidigungen (auch gegenüber Lehrern)',
      'Späte Anrufe',
      'Spam (1000 Nachrichten)',
      'Sticker und GIFs',
      'Fake News',
      'Ungefragt schreiben',
      'Kettenbriefe',
      'Streit',
      'Andere Sprachen'
    ],
    penalties: ['Verwarnung', '3 Tage Ausschluss', '1 Woche Ausschluss'],
    workshopDate: '',
    texts: {
      eyebrow: 'Klassenvereinbarung · Unser Gruppenchat',
      title: 'Die Regeln für unseren Klassenchat',
      subtitle: 'Das hat sich die Klasse gemeinsam für ihren {App}-Gruppenchat ausgemacht. Wer dabei ist, unterschreibt rechts.',
      chipGood: 'Das tut unserem Chat gut',
      chipBad: 'Das hat bei uns keinen Platz',
      day: 'Heute',
      pinned: 'Angepinnt in der Gruppe',
      adminsLabel: 'Admins',
      pensLabel: 'Wenn jemand nicht mitmacht',
      signTitle: 'Das sind wir',
      signText: 'Alle unterschreiben hier – kreuz und quer. Jede Unterschrift zeigt: Ich bin dabei und halte mich an unsere Regeln.'
    }
  };

  /* ---------- Icons (inline für Offline- und Druckfähigkeit) ---------- */

  function svg(inner, vb, attrs) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (vb || '0 0 24 24') + '" ' +
      (attrs || 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"') +
      '>' + inner + '</svg>';
  }

  var IC = {
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    trash: svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>'),
    grip: svg('<circle cx="9" cy="5" r="1.4"/><circle cx="15" cy="5" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="19" r="1.4"/><circle cx="15" cy="19" r="1.4"/>', '0 0 24 24', 'fill="currentColor"'),
    check: svg('<path d="M20 6 9 17l-5-5"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"'),
    ticks: svg('<path d="M2 11l5 5L17 6"/><path d="M11 11l5 5L26 6"/>', '0 0 28 22', 'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"'),
    pin: svg('<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"'),
    back: svg('<path d="m15 18-6-6 6-6"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"'),
    video: svg('<path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 11"/><rect x="2" y="6" width="14" height="12" rx="3"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"'),
    phone: svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"'),
    camera: svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.2"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"'),
    mic: svg('<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'),
    send: svg('<path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a1 1 0 0 0-1.39.91l-.01 4.61c0 .5.37.93.87.99L14 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/>', '0 0 24 24', 'fill="currentColor"'),
    smile: svg('<circle cx="12" cy="12" r="9.2"/><path d="M8.6 14a4.6 4.6 0 0 0 6.8 0"/><circle cx="9.2" cy="9.6" r="0.7" fill="currentColor" stroke="none"/><circle cx="14.8" cy="9.6" r="0.7" fill="currentColor" stroke="none"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"'),
    clip: svg('<path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"'),
    dots: svg('<circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/>', '0 0 24 24', 'fill="currentColor"'),
    cal: svg('<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"'),
    resize: svg('<path d="M20 12 12 20M20 17 17 20"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"'),
    chevL: svg('<path d="m14.5 17-5-5 5-5"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"'),
    chevR: svg('<path d="m9.5 7 5 5-5 5"/>', '0 0 24 24', 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"'),
    people: svg('<circle cx="9" cy="7.5" r="3.5"/><path d="M2 19.5c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5v.5H2z"/><circle cx="17.5" cy="8.5" r="2.8"/><path d="M18.5 14.2c2.1.7 3.5 2.3 3.5 4.3v1.5h-4"/>', '0 0 24 24', 'fill="currentColor" stroke="none"'),
    signal: svg('<rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6" width="3" height="8" rx="1"/><rect x="10" y="3" width="3" height="11" rx="1"/><rect x="15" y="0" width="3" height="14" rx="1"/>', '0 0 18 14', 'fill="currentColor"'),
    wifi: svg('<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="19.6" r="1.4" fill="currentColor" stroke="none"/>', '0 2 24 20', 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"'),
    batt: svg('<rect x="1" y="1" width="21" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3.4" y="3.4" width="13" height="7.2" rx="1.6"/><path d="M24.6 4.5v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>', '0 0 27 14', 'fill="currentColor"')
  };

  /* ---------- State ---------- */

  var state = load();

  function load() {
    var s;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      s = raw ? sanitize(JSON.parse(raw)) : JSON.parse(JSON.stringify(DEFAULTS));
    } catch (e) {
      s = JSON.parse(JSON.stringify(DEFAULTS));
    }
    var view = new URLSearchParams(location.search).get('ansicht');
    var map = { wa: 'whatsapp', sc: 'snapchat', tt: 'tiktok', si: 'signal' };
    if (PLATFORMS[view]) s.platform = view;
    else if (map[view]) s.platform = map[view];
    return s;
  }

  function sanitize(data) {
    var s = JSON.parse(JSON.stringify(DEFAULTS));
    if (!data || typeof data !== 'object') return s;
    if (PLATFORMS[data.platform]) s.platform = data.platform;
    if (typeof data.groupName === 'string') s.groupName = data.groupName.slice(0, 40);
    if (typeof data.workshopDate === 'string') s.workshopDate = data.workshopDate.slice(0, 40);
    var limits = { admins: [8, 25], good: [20, 90], bad: [20, 90], penalties: [20, 90] };
    Object.keys(limits).forEach(function (k) {
      if (Array.isArray(data[k])) {
        s[k] = data[k].filter(function (v) { return typeof v === 'string'; })
          .map(function (v) { return v.slice(0, limits[k][1]); })
          .slice(0, limits[k][0]);
      }
    });
    var texts = (data.texts && typeof data.texts === 'object') ? data.texts : {};
    Object.keys(TEXT_LIMITS).forEach(function (k) {
      if (typeof texts[k] === 'string') s.texts[k] = texts[k].slice(0, TEXT_LIMITS[k]);
    });
    /* Selbstheilung: Sind ALLE Texte leer, ist der Stand defekt
       (einzelne leere Felder bleiben erlaubt – das blendet Elemente aus) */
    var alleTexteLeer = Object.keys(TEXT_LIMITS).every(function (k) {
      return !(s.texts[k] || '').trim();
    });
    if (alleTexteLeer) s.texts = JSON.parse(JSON.stringify(DEFAULTS.texts));
    /* Migration alter Speicherstände (signTitle/signText lagen früher oben) */
    if (typeof data.signTitle === 'string' && typeof texts.signTitle !== 'string') s.texts.signTitle = data.signTitle.slice(0, 40);
    if (typeof data.signText === 'string' && typeof texts.signText !== 'string') s.texts.signText = data.signText.slice(0, 220);
    return s;
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* voll/privat – ignorieren */ }
  }

  /* ---------- DOM-Helfer ---------- */

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function iconBtn(cls, icon, label) {
    var b = el('button', cls);
    b.type = 'button';
    b.innerHTML = icon;
    b.title = label;
    b.setAttribute('aria-label', label);
    return b;
  }

  function setTextOrHide(id, text) {
    var n = $(id);
    n.textContent = text;
    n.style.display = text.trim() ? '' : 'none';
  }

  /* ---------- Sidebar ---------- */

  function renderAdminChips() {
    var wrap = $('adminChips');
    wrap.textContent = '';
    state.admins.forEach(function (name, i) {
      var chip = el('span', 'chip', name);
      var x = iconBtn('chip-x', IC.x, name + ' entfernen');
      x.addEventListener('click', function () {
        state.admins.splice(i, 1);
        persist(); renderAdminChips(); renderPoster();
        var xs = $('adminChips').querySelectorAll('.chip-x');
        if (xs.length) { xs[Math.min(i, xs.length - 1)].focus(); } else { $('inAdmin').focus(); }
      });
      chip.appendChild(x);
      wrap.appendChild(chip);
    });
  }

  function addAdmin() {
    var input = $('inAdmin');
    var name = input.value.trim();
    if (!name) return;
    if (state.admins.length >= 8) return;
    state.admins.push(name.slice(0, 25));
    input.value = '';
    input.focus();
    persist(); renderAdminChips(); renderPoster();
  }

  /* Drag-and-drop (Pointer Events: funktioniert mit Maus und Touch)
     plus Pfeiltasten auf dem Griff für Tastaturbedienung. */
  function moveItem(key, from, to, containerId) {
    var arr = state[key];
    if (to < 0 || to >= arr.length || from === to) return;
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    persist(); renderAllLists(); renderPoster();
    var grips = $(containerId).querySelectorAll('.row-grip');
    if (grips[to]) grips[to].focus();
  }

  var activeDragPointer = null;

  function makeDraggable(handle, row, containerId, key) {
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
            if (k < rowIdx && ev.clientY < mid) { wrap.insertBefore(row, rows[k]); changed = true; break; }
            if (k > rowIdx && ev.clientY > mid) { wrap.insertBefore(row, rows[k].nextSibling); changed = true; break; }
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
          persist(); renderAllLists(); renderPoster();
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
      if (e.key === 'ArrowUp') { e.preventDefault(); moveItem(key, idx, idx - 1, containerId); }
      if (e.key === 'ArrowDown') { e.preventDefault(); moveItem(key, idx, idx + 1, containerId); }
    });
  }

  function focusRowDel(containerId, index, addBtnId) {
    var rows = $(containerId).querySelectorAll('.rule-row');
    if (!rows.length) { $(addBtnId).focus(); return; }
    var row = rows[Math.max(0, Math.min(index, rows.length - 1))];
    var del = row.querySelector('.row-del');
    if (del) del.focus();
  }

  function renderRuleList(containerId, key, numbered, itemWord, listLabel, addBtnId) {
    var wrap = $(containerId);
    wrap.textContent = '';
    var arr = state[key];
    arr.forEach(function (val, i) {
      var row = el('div', 'rule-row');
      var name = itemWord + ' ' + (i + 1);

      var grip = iconBtn('row-btn row-grip', IC.grip, name + ' verschieben – ' + listLabel + ' (ziehen oder Pfeiltasten)');
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
        persist(); renderPoster();
      });
      row.appendChild(input);

      var del = iconBtn('row-btn row-del', IC.trash, name + ' löschen – ' + listLabel);
      del.addEventListener('click', function () {
        arr.splice(i, 1);
        persist(); renderAllLists(); renderPoster();
        focusRowDel(containerId, i, addBtnId);
      });
      row.appendChild(del);

      wrap.appendChild(row);
    });
  }

  function sideTitles() {
    $('sideTitleGood').textContent = state.texts.chipGood.trim() || 'Erster Abschnitt';
    $('sideTitleBad').textContent = state.texts.chipBad.trim() || 'Zweiter Abschnitt';
    $('sideTitlePen').textContent = state.texts.pensLabel.trim() || 'Stufen';
  }

  function renderAllLists() {
    sideTitles();
    renderRuleList('listGood', 'good', false, 'Regel', state.texts.chipGood.trim() || 'erster Abschnitt', 'btnAddGood');
    renderRuleList('listBad', 'bad', false, 'Regel', state.texts.chipBad.trim() || 'zweiter Abschnitt', 'btnAddBad');
    renderRuleList('listPen', 'penalties', true, 'Stufe', state.texts.pensLabel.trim() || 'Stufen', 'btnAddPen');
  }

  function addTo(key, containerId) {
    if (state[key].length >= 20) return;
    state[key].push('');
    persist(); renderAllLists(); renderPoster();
    var inputs = $(containerId).querySelectorAll('input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }

  /* ---------- Verstoß-Farbskala: Gelb → Orange → Rot → Dunkelrot ---------- */

  var PEN_ANCHORS = [[232, 180, 0], [239, 125, 0], [224, 43, 43], [142, 20, 20]];

  function penRgb(i, n) {
    var t = n > 1 ? i / (n - 1) : 0.5;
    var pos = t * (PEN_ANCHORS.length - 1);
    var k = Math.min(Math.floor(pos), PEN_ANCHORS.length - 2);
    var f = pos - k;
    var a = PEN_ANCHORS[k], b = PEN_ANCHORS[k + 1];
    return [0, 1, 2].map(function (j) { return Math.round(a[j] + (b[j] - a[j]) * f); });
  }

  function penColor(i, n, alpha) {
    var rgb = penRgb(i, n);
    return alpha ? 'rgba(' + rgb.join(',') + ',' + alpha + ')' : 'rgb(' + rgb.join(',') + ')';
  }

  /* Dunkle Ziffer auf hellen (gelben) Punkten, weiße auf dunklen (roten) */
  function penTextColor(i, n) {
    var rgb = penRgb(i, n);
    var lum = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114;
    return lum > 150 ? '#403c1e' : '#ffffff';
  }

  /* ---------- Plakat ---------- */

  function platformName() {
    return PLATFORMS[state.platform].name;
  }

  function adminsLine() {
    var names = state.admins.map(function (a) { return a.trim(); }).filter(Boolean);
    if (!names.length) return 'alle aus der Klasse';
    return names.join(', ') + ' und alle aus der Klasse';
  }

  function fmtTime(mins) {
    var h = Math.floor(mins / 60) % 24;
    var m = mins % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function bubble(text, kind, time) {
    var b = el('div', 'bubble ' + (kind === 'good' ? 'b-good' : 'b-bad'));
    var ic = el('span', 'b-ic ' + (kind === 'good' ? 'ic-good' : 'ic-bad'));
    ic.innerHTML = kind === 'good' ? IC.check : IC.x;
    b.appendChild(ic);
    b.appendChild(el('span', 'b-text', text));
    var meta = el('span', 'b-meta');
    meta.appendChild(el('span', 'b-time', time));
    if (kind === 'good') {
      var ticks = el('span', 'b-ticks');
      ticks.innerHTML = IC.ticks;
      meta.appendChild(ticks);
    }
    b.appendChild(meta);
    return b;
  }

  function sectionChip(text, kind) {
    var c = el('div', 'chat-chip ' + (kind === 'good' ? 'chip-good' : 'chip-bad'));
    var ic = el('span', 'b-ic ' + (kind === 'good' ? 'ic-good' : 'ic-bad'));
    ic.innerHTML = kind === 'good' ? IC.check : IC.x;
    c.appendChild(ic);
    c.appendChild(el('span', 'chat-chip-text', text));
    return c;
  }

  function renderChat() {
    var chat = $('chat');
    chat.textContent = '';
    if (state.texts.day.trim()) chat.appendChild(el('div', 'chat-day', state.texts.day));

    var good = state.good.map(function (s) { return s.trim(); }).filter(Boolean);
    var bad = state.bad.map(function (s) { return s.trim(); }).filter(Boolean);
    var t = 7 * 60 + 58;

    if (good.length) {
      if (state.texts.chipGood.trim()) chat.appendChild(sectionChip(state.texts.chipGood, 'good'));
      good.forEach(function (rule) {
        chat.appendChild(bubble(rule, 'good', fmtTime(t)));
        t += 1;
      });
    }
    if (bad.length) {
      if (state.texts.chipBad.trim()) chat.appendChild(sectionChip(state.texts.chipBad, 'bad'));
      bad.forEach(function (rule) {
        chat.appendChild(bubble(rule, 'bad', fmtTime(t)));
        t += 1;
      });
    }
  }

  function renderPinned() {
    var adminsWrap = $('posterAdmins');
    adminsWrap.textContent = '';
    var names = state.admins.map(function (a) { return a.trim(); }).filter(Boolean);
    if (names.length) {
      names.forEach(function (name) {
        adminsWrap.appendChild(el('span', 'admin-chip', name));
      });
    } else {
      adminsWrap.appendChild(el('span', 'pen-text', 'Alle gemeinsam'));
    }

    var pens = state.penalties.map(function (p) { return p.trim(); }).filter(Boolean);
    var list = $('posterPens');
    list.textContent = '';
    list.parentElement.style.display = pens.length ? '' : 'none';
    list.parentElement.parentElement.classList.toggle('single', !pens.length);
    list.classList.toggle('cols2', pens.length >= 5);
    pens.forEach(function (p, i) {
      var item = el('div', 'pen-item');
      var dot = el('span', 'pen-dot', String(i + 1));
      dot.style.background = penColor(i, pens.length);
      dot.style.color = penTextColor(i, pens.length);
      item.appendChild(dot);
      var txt = el('span', 'pen-text');
      var strong = el('strong', null, (i + 1) + '. Verstoß: ');
      txt.appendChild(strong);
      txt.appendChild(document.createTextNode(p));
      item.appendChild(txt);
      list.appendChild(item);
    });
  }

  function renderStaticIcons() {
    $('phStIcons').innerHTML = IC.signal + IC.wifi + IC.batt;
    $('phBack').innerHTML = IC.back;
    $('phHIcons').innerHTML =
      '<span class="ph-hic ph-video">' + IC.video + '</span>' +
      '<span class="ph-hic ph-phone">' + IC.phone + '</span>' +
      '<span class="ph-hic ph-menu">' + IC.dots + '</span>';
    $('pinIc').innerHTML = IC.pin;
    $('signCheck').innerHTML = IC.check;
    $('signMark').innerHTML = IC.people;
    $('btnAddAdmin').innerHTML = IC.plus;
  }

  /* Eingabezeile je App nachgebaut: Icon-Anordnung wie im jeweiligen Original */
  function renderInputBar() {
    var bar = $('phInputbar');
    bar.textContent = '';
    var p = state.platform;
    function span(cls, icon) {
      var s = el('span', cls);
      s.innerHTML = icon;
      return s;
    }
    if (p === 'snapchat') bar.appendChild(span('ph-lead ph-lead-circle', IC.camera));
    if (p === 'signal') bar.appendChild(span('ph-lead ph-lead-plain', IC.plus));

    var field = el('div', 'ph-field');
    if (p === 'whatsapp') field.appendChild(span('ph-fic', IC.smile));
    field.appendChild(el('span', 'ph-placeholder', PLATFORMS[p].placeholder));
    if (p === 'whatsapp') {
      field.appendChild(span('ph-fic', IC.clip));
      field.appendChild(span('ph-fic', IC.camera));
    }
    if (p === 'snapchat') {
      field.appendChild(span('ph-fic', IC.mic));
      field.appendChild(span('ph-fic', IC.smile));
    }
    if (p === 'tiktok' || p === 'signal') field.appendChild(span('ph-fic', IC.smile));
    bar.appendChild(field);

    if (p === 'signal') {
      bar.appendChild(span('ph-trail', IC.camera));
      bar.appendChild(span('ph-trail', IC.mic));
    }
    if (p === 'whatsapp' || p === 'tiktok') {
      var send = el('div', 'ph-send');
      send.innerHTML = p === 'whatsapp' ? IC.mic : IC.send;
      bar.appendChild(send);
    }
  }

  function groupInitials() {
    var name = state.groupName.trim() || 'Unser Klassenchat';
    var words = name.split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    if (words.length === 1) return Array.from(words[0]).slice(0, 2).join('').toUpperCase();
    return words.slice(0, 2).map(function (w) { return Array.from(w)[0]; }).join('').toUpperCase();
  }

  function renderAvatar() {
    var av = $('phAvatar');
    if (state.platform === 'snapchat' || state.platform === 'tiktok') {
      av.innerHTML = '';
      av.appendChild(el('span', 'ph-initials', groupInitials()));
    } else {
      av.innerHTML = IC.people;
    }
  }

  /* {App} wird überall im Plakat-Kopf durch den Plattform-Namen ersetzt */
  function appText(s) {
    return s.split('{App}').join(platformName());
  }

  function renderPoster() {
    var poster = $('poster');
    var skin = { whatsapp: 'skin-wa', snapchat: 'skin-sc', tiktok: 'skin-tt', signal: 'skin-si' }[state.platform];
    poster.className = 'poster ' + skin;

    $('phTitle').textContent = state.groupName.trim() || 'Unser Klassenchat';
    $('phSub').textContent = adminsLine();

    setTextOrHide('txtEyebrow', appText(state.texts.eyebrow));
    $('txtEyebrow').parentElement.style.display = state.texts.eyebrow.trim() ? '' : 'none';
    setTextOrHide('txtTitle', appText(state.texts.title));
    setTextOrHide('pSub', appText(state.texts.subtitle));
    setTextOrHide('txtPinned', state.texts.pinned);
    $('txtPinned').parentElement.style.display = state.texts.pinned.trim() ? '' : 'none';
    setTextOrHide('txtAdminsLabel', state.texts.adminsLabel);
    setTextOrHide('txtPensLabel', state.texts.pensLabel);
    setTextOrHide('signTitle', state.texts.signTitle);
    $('signTitle').parentElement.style.display =
      (state.texts.signTitle.trim() || state.workshopDate.trim()) ? '' : 'none';
    setTextOrHide('signDate', state.workshopDate);
    setTextOrHide('signText', state.texts.signText);

    renderAvatar();
    renderInputBar();
    renderChat();
    renderPinned();
    fitHeaderSub();
    autofit();
  }

  /* Admin-Zeile im Chat-Kopf stufenweise verkleinern, bis sie ganz sichtbar ist */
  function fitHeaderSub() {
    var sub = $('phSub');
    var sizes = [13.5, 12.5, 11.5, 10.5];
    for (var i = 0; i < sizes.length; i++) {
      sub.style.fontSize = sizes[i] + 'px';
      if (sub.scrollWidth <= sub.clientWidth + 1) return;
    }
  }

  /* ---------- Platz-Automatik + Ampel ---------- */

  var CHAT_STEPS = [1, 0.93, 0.86, 0.8, 0.74, 0.68, 0.62];

  function autofit() {
    var chat = $('chat');
    var fitted = null;
    for (var i = 0; i < CHAT_STEPS.length; i++) {
      chat.style.setProperty('--cs', CHAT_STEPS[i]);
      if (chat.scrollHeight <= chat.clientHeight + 1) { fitted = CHAT_STEPS[i]; break; }
    }

    /* Kapazitäts-Probe: Wie viel Luft bleibt bei kleinster Darstellung?
       Reicht sie nicht mehr für einen weiteren Eintrag, werden die
       „+ hinzufügen"-Knöpfe inaktiv (statt eines Warn-Hinweises).
       Gemessen wird die Unterkante des letzten Eintrags — scrollHeight
       taugt nicht, weil es nie kleiner als die Sichthöhe ist. */
    var minS = CHAT_STEPS[CHAT_STEPS.length - 1];
    chat.style.setProperty('--cs', minS);
    var freiChat = 0;
    if (chat.lastElementChild) {
      var chatRect = chat.getBoundingClientRect();
      /* Die Vorschau ist per transform verkleinert — Rechteck-Maße sind
         skaliert und müssen auf echte Plakat-Pixel zurückgerechnet werden */
      var scale = chat.offsetHeight ? chatRect.height / chat.offsetHeight : 1;
      var padB = (parseFloat(getComputedStyle(chat).paddingBottom) || 0) * scale;
      freiChat = ((chatRect.bottom - padB) - chat.lastElementChild.getBoundingClientRect().bottom) / (scale || 1);
    }
    chat.style.setProperty('--cs', fitted !== null ? fitted : minS);

    var sign = document.querySelector('.sign');
    var freiRechts = sign ? sign.offsetHeight - 230 : 0;

    var chatVoll = freiChat < 34;
    $('btnAddGood').disabled = chatVoll;
    $('btnAddBad').disabled = chatVoll;
    $('btnAddPen').disabled = freiRechts < 42;
  }

  /* ---------- Bühne (Vorschau-Skalierung) ---------- */

  function fitStage() {
    var stage = $('stage');
    var inner = $('stageInner');
    var poster = $('poster');
    var pad = 40;
    var availW = stage.clientWidth - pad;
    var availH = stage.clientHeight - pad;
    if (availW <= 0 || availH <= 0) return;
    var sc = Math.min(availW / poster.offsetWidth, availH / poster.offsetHeight);
    inner.style.transformOrigin = 'top left';
    inner.style.transform = 'scale(' + sc + ')';
    inner.style.width = poster.offsetWidth * sc + 'px';
    inner.style.height = poster.offsetHeight * sc + 'px';
  }

  /* ---------- Plattform-Umschalter ---------- */

  var SEG_IDS = { whatsapp: 'segWa', snapchat: 'segSc', tiktok: 'segTt', signal: 'segSi' };

  function setPlatform(p, skipPersist) {
    state.platform = p;
    Object.keys(SEG_IDS).forEach(function (key) {
      var btn = $(SEG_IDS[key]);
      btn.classList.toggle('is-active', key === p);
      btn.setAttribute('aria-pressed', String(key === p));
    });
    if (!skipPersist) persist();
    renderPoster();
  }

  /* ---------- Datei sichern / laden ---------- */

  function slug(s) {
    return (s || 'klasse').toLowerCase().replace(/[äöüß]/g, function (c) {
      return { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[c];
    }).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'klasse';
  }

  function saveFile() {
    var data = Object.assign({ app: 'klassenchat-plakat-v1' }, state);
    /* Neutraler Binärtyp wie beim PDF: iPhone-Safari lädt Typen, die es
       nicht anzeigen kann, direkt herunter — bei application/json käme
       stattdessen der „Anzeigen | Laden"-Frage-Dialog. */
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/octet-stream' });
    downloadBlob(blob, 'klassenchat-' + slug(state.groupName) + '.json');
  }

  function loadFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try {
        data = JSON.parse(reader.result);
      } catch (e) {
        showModal({
          title: 'Datei konnte nicht gelesen werden',
          message: 'Bitte eine mit „Entwurf speichern" erstellte Datei wählen. Der aktuelle Stand bleibt unverändert.'
        });
        return;
      }
      var plausibel = data && typeof data === 'object' && !Array.isArray(data) &&
        (data.app === 'klassenchat-plakat-v1' || Array.isArray(data.good) ||
          Array.isArray(data.bad) || typeof data.groupName === 'string');
      if (!plausibel) {
        showModal({
          title: 'Keine Plakat-Datei',
          message: 'Diese Datei stammt nicht aus dem Klassenchat-Plakat-Editor. Der aktuelle Stand bleibt unverändert.'
        });
        return;
      }
      state = sanitize(data);
      persist();
      initInputs();
      renderAdminChips();
      renderAllLists();
      setPlatform(state.platform);
    };
    reader.onerror = function () {
      showModal({
        title: 'Datei konnte nicht gelesen werden',
        message: 'Der aktuelle Stand bleibt unverändert.'
      });
    };
    reader.readAsText(file);
  }

  /* ---------- Init ---------- */

  var TEXT_FIELDS = {
    inTxtEyebrow: 'eyebrow', inTxtTitle: 'title', inTxtSubtitle: 'subtitle',
    inTxtChipGood: 'chipGood', inTxtChipBad: 'chipBad', inTxtDay: 'day',
    inTxtPinned: 'pinned', inTxtAdminsLabel: 'adminsLabel', inTxtPensLabel: 'pensLabel',
    inSignTitle: 'signTitle', inSignText: 'signText'
  };

  function initInputs() {
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
  var letzteBlobUrl = null;
  function downloadBlob(blob, dateiname) {
    if (letzteBlobUrl) { URL.revokeObjectURL(letzteBlobUrl); }
    var url = URL.createObjectURL(blob);
    letzteBlobUrl = url;
    var a = document.createElement('a');
    a.href = url;
    a.download = dateiname;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); }, 1000);
  }

  /* Ein Klick → direkter Download, auf allen Geräten gleich */
  function exportPdf() {
    runPdfExport('download', null);
  }

  function runPdfExport(mode, tab) {
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
      height: poster.offsetHeight
    });
    var zeitlimit = new Promise(function (resolve, reject) {
      setTimeout(function () { reject(new Error('Zeitüberschreitung')); }, 30000);
    });

    Promise.race([rendern, zeitlimit]).then(function (dataUrl) {
      var pdf = new window.jspdf.jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [420, 297],
        compress: true
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
    }).catch(function () {
      if (tab) { try { tab.close(); } catch (e) { /* egal */ } }
      showModal({
        title: 'PDF-Export nicht möglich',
        message: 'Der direkte Export hat in diesem Browser nicht geklappt. Als Ausweg kann der Druckdialog geöffnet werden – dort „Als PDF sichern" wählen.',
        confirmLabel: 'Druckdialog öffnen',
        cancelLabel: 'Abbrechen',
        onConfirm: function () { setTimeout(function () { window.print(); }, 100); }
      });
    }).then(function () {
      btn.disabled = false;
      btn.textContent = label;
    });
  }

  /* ---------- Textfelder: automatische Höhe + Anfasser (auch Touch) ---------- */

  function enhanceTextarea(ta) {
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

  function autosizeAllTextareas() {
    Array.prototype.forEach.call(document.querySelectorAll('textarea'), function (ta) {
      if (ta.__autosize) ta.__autosize();
    });
  }

  /* ---------- Designte Modals (nur Zurücksetzen und Fehlerfälle) ---------- */

  var modalState = null;

  function showModal(opts) {
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
      returnFocus: document.activeElement
    };
    $('mlModal').hidden = false;
    /* Bei Bestätigungsfragen startet der Fokus sicher auf „Abbrechen" */
    (opts.cancelLabel ? cancel : ok).focus();
  }

  function closeModal(action) {
    $('mlModal').hidden = true;
    var st = modalState;
    modalState = null;
    if (st && st.returnFocus && st.returnFocus.focus) {
      try { st.returnFocus.focus(); } catch (e) { /* Element evtl. weg */ }
    }
    if (!st) return;
    if (action === 'confirm' && st.onConfirm) st.onConfirm();
    if (action === 'alt' && st.onAlt) st.onAlt();
  }

  /* ---------- Kalender (Date-Picker im malziland-Stil) ---------- */

  var MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var pickView = null;

  function formatDate(d) {
    return d.getDate() + '. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function closeDatePick() {
    $('datePick').hidden = true;
    $('btnDatePick').setAttribute('aria-expanded', 'false');
    pickView = null;
  }

  function openDatePick() {
    var today = new Date();
    pickView = { y: today.getFullYear(), m: today.getMonth() };
    renderDatePick();
    $('datePick').hidden = false;
    $('btnDatePick').setAttribute('aria-expanded', 'true');
  }

  function pickDate(y, m, day) {
    state.workshopDate = formatDate(new Date(y, m, day));
    $('inDate').value = state.workshopDate;
    persist(); renderPoster();
    closeDatePick();
    $('inDate').focus();
  }

  function renderDatePick() {
    var box = $('datePick');
    box.textContent = '';
    var today = new Date();

    var head = el('div', 'dp-head');
    var prev = iconBtn('dp-nav', IC.chevL, 'Voriger Monat');
    prev.addEventListener('click', function () {
      pickView.m -= 1;
      if (pickView.m < 0) { pickView.m = 11; pickView.y -= 1; }
      renderDatePick();
    });
    head.appendChild(prev);
    head.appendChild(el('span', 'dp-title', MONTHS[pickView.m] + ' ' + pickView.y));
    var next = iconBtn('dp-nav', IC.chevR, 'Nächster Monat');
    next.addEventListener('click', function () {
      pickView.m += 1;
      if (pickView.m > 11) { pickView.m = 0; pickView.y += 1; }
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
        if (day === today.getDate() && pickView.m === today.getMonth() && pickView.y === today.getFullYear()) {
          b.classList.add('dp-today');
        }
        b.addEventListener('click', function () { pickDate(pickView.y, pickView.m, day); });
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
      persist(); renderPoster();
      closeDatePick();
    });
    foot.appendChild(btnClear);
    box.appendChild(foot);
  }

  /* ---------- Reiter in der Seitenleiste ---------- */

  function showTab(which) {
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

  function init() {
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
      document.fonts.ready.then(function () { renderPoster(); fitStage(); });
    }

    $('inGroup').addEventListener('input', function () {
      state.groupName = this.value;
      persist(); renderPoster();
    });
    $('inDate').addEventListener('input', function () {
      state.workshopDate = this.value;
      persist(); renderPoster();
    });
    $('btnDatePick').innerHTML = IC.cal;
    $('btnDatePick').addEventListener('click', function () {
      if ($('datePick').hidden) openDatePick(); else closeDatePick();
    });
    document.addEventListener('click', function (e) {
      var dp = $('datePick');
      if (!dp.hidden && !dp.contains(e.target) && e.target !== $('btnDatePick') && !$('btnDatePick').contains(e.target)) {
        closeDatePick();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!$('mlModal').hidden) { closeModal(false); return; }
      if (!$('datePick').hidden) { closeDatePick(); $('btnDatePick').focus(); }
    });
    $('tabInhalt').addEventListener('click', function () { showTab('inhalt'); });
    $('tabTexte').addEventListener('click', function () { showTab('texte'); });

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
      if (e.key === 'Enter') { e.preventDefault(); addAdmin(); }
    });

    $('btnAddGood').addEventListener('click', function () { addTo('good', 'listGood'); });
    $('btnAddBad').addEventListener('click', function () { addTo('bad', 'listBad'); });
    $('btnAddPen').addEventListener('click', function () { addTo('penalties', 'listPen'); });

    Object.keys(SEG_IDS).forEach(function (p) {
      $(SEG_IDS[p]).addEventListener('click', function () { setPlatform(p); });
    });

    $('btnSave').addEventListener('click', saveFile);
    $('btnLoad').addEventListener('click', function () { $('fileInput').click(); });
    $('fileInput').addEventListener('change', function () {
      if (this.files && this.files[0]) loadFile(this.files[0]);
      this.value = '';
    });

    $('btnReset').addEventListener('click', function () {
      showModal({
        title: 'Auf Vorlage zurücksetzen',
        message: 'Alle Eingaben werden verworfen und die Beispiel-Vorlage wird geladen. Das kann nicht rückgängig gemacht werden.',
        confirmLabel: 'Zurücksetzen',
        cancelLabel: 'Abbrechen',
        danger: true,
        onConfirm: function () {
          state = JSON.parse(JSON.stringify(DEFAULTS));
          persist();
          initInputs();
          renderAdminChips();
          renderAllLists();
          setPlatform(state.platform);
        }
      });
    });

    $('mlModalOk').addEventListener('click', function () { closeModal('confirm'); });
    $('mlModalAlt').addEventListener('click', function () { closeModal('alt'); });
    $('mlModalCancel').addEventListener('click', function () { closeModal(false); });
    $('mlModal').addEventListener('click', function (e) { if (e.target === $('mlModal')) closeModal(false); });
    /* Fokus-Falle: Tab kreist zwischen den sichtbaren Modal-Buttons */
    $('mlModal').addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var btns = [$('mlModalCancel'), $('mlModalAlt'), $('mlModalOk')].filter(function (b) { return !b.hidden; });
      if (!btns.length) return;
      var idx = btns.indexOf(document.activeElement);
      e.preventDefault();
      if (idx === -1) { btns[0].focus(); return; }
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
