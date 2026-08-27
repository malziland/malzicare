/* Alles, was das Plakat zeichnet - Chatverlauf, angepinnter Bereich,
   Kopfzeile, Groessenanpassung und der Wechsel der App-Optik. */

import { CHAT_STEPS, PEN_ANCHORS, PLATFORMS, SEG_IDS } from './daten.js';
import { $, IC, el, setTextOrHide } from './dom.js';
import { persist, state } from './zustand.js';

export function penRgb(i, n) {
  var t = n > 1 ? i / (n - 1) : 0.5;
  var pos = t * (PEN_ANCHORS.length - 1);
  var k = Math.min(Math.floor(pos), PEN_ANCHORS.length - 2);
  var f = pos - k;
  var a = PEN_ANCHORS[k],
    b = PEN_ANCHORS[k + 1];
  return [0, 1, 2].map(function (j) {
    return Math.round(a[j] + (b[j] - a[j]) * f);
  });
}

export function penColor(i, n, alpha) {
  var rgb = penRgb(i, n);
  return alpha ? 'rgba(' + rgb.join(',') + ',' + alpha + ')' : 'rgb(' + rgb.join(',') + ')';
}

/* Dunkle Ziffer auf hellen (gelben) Punkten, weiße auf dunklen (roten) */

export function penTextColor(i, n) {
  var rgb = penRgb(i, n);
  var lum = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114;
  return lum > 150 ? '#403c1e' : '#ffffff';
}

/* ---------- Plakat ---------- */

export function platformName() {
  return PLATFORMS[state.platform].name;
}

export function adminsLine() {
  var names = state.admins
    .map(function (a) {
      return a.trim();
    })
    .filter(Boolean);
  if (!names.length) return 'alle aus der Klasse';
  return names.join(', ') + ' und alle aus der Klasse';
}

export function fmtTime(mins) {
  var h = Math.floor(mins / 60) % 24;
  var m = mins % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

export function bubble(text, kind, time) {
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

export function sectionChip(text, kind) {
  var c = el('div', 'chat-chip ' + (kind === 'good' ? 'chip-good' : 'chip-bad'));
  var ic = el('span', 'b-ic ' + (kind === 'good' ? 'ic-good' : 'ic-bad'));
  ic.innerHTML = kind === 'good' ? IC.check : IC.x;
  c.appendChild(ic);
  c.appendChild(el('span', 'chat-chip-text', text));
  return c;
}

export function renderChat() {
  var chat = $('chat');
  chat.textContent = '';
  if (state.texts.day.trim()) chat.appendChild(el('div', 'chat-day', state.texts.day));

  var good = state.good
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
  var bad = state.bad
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
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

export function renderPinned() {
  var adminsWrap = $('posterAdmins');
  adminsWrap.textContent = '';
  var names = state.admins
    .map(function (a) {
      return a.trim();
    })
    .filter(Boolean);
  if (names.length) {
    names.forEach(function (name) {
      adminsWrap.appendChild(el('span', 'admin-chip', name));
    });
  } else {
    adminsWrap.appendChild(el('span', 'pen-text', 'Alle gemeinsam'));
  }

  var pens = state.penalties
    .map(function (p) {
      return p.trim();
    })
    .filter(Boolean);
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
    var strong = el('strong', null, i + 1 + '. Verstoß: ');
    txt.appendChild(strong);
    txt.appendChild(document.createTextNode(p));
    item.appendChild(txt);
    list.appendChild(item);
  });
}

export function renderStaticIcons() {
  $('phStIcons').innerHTML = IC.signal + IC.wifi + IC.batt;
  $('phBack').innerHTML = IC.back;
  $('phHIcons').innerHTML =
    '<span class="ph-hic ph-video">' +
    IC.video +
    '</span>' +
    '<span class="ph-hic ph-phone">' +
    IC.phone +
    '</span>' +
    '<span class="ph-hic ph-menu">' +
    IC.dots +
    '</span>';
  $('pinIc').innerHTML = IC.pin;
  $('signCheck').innerHTML = IC.check;
  $('signMark').innerHTML = IC.people;
  $('btnAddAdmin').innerHTML = IC.plus;
}

/* Eingabezeile je App nachgebaut: Icon-Anordnung wie im jeweiligen Original */

export function renderInputBar() {
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

export function groupInitials() {
  var name = state.groupName.trim() || 'Unser Klassenchat';
  var words = name.split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return Array.from(words[0]).slice(0, 2).join('').toUpperCase();
  return words
    .slice(0, 2)
    .map(function (w) {
      return Array.from(w)[0];
    })
    .join('')
    .toUpperCase();
}

export function renderAvatar() {
  var av = $('phAvatar');
  if (state.platform === 'snapchat' || state.platform === 'tiktok') {
    av.innerHTML = '';
    av.appendChild(el('span', 'ph-initials', groupInitials()));
  } else {
    av.innerHTML = IC.people;
  }
}

/* {App} wird überall im Plakat-Kopf durch den Plattform-Namen ersetzt */

export function appText(s) {
  return s.split('{App}').join(platformName());
}

export function renderPoster() {
  var poster = $('poster');
  var skin = { whatsapp: 'skin-wa', snapchat: 'skin-sc', tiktok: 'skin-tt', signal: 'skin-si' }[
    state.platform
  ];
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
    state.texts.signTitle.trim() || state.workshopDate.trim() ? '' : 'none';
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

export function fitHeaderSub() {
  var sub = $('phSub');
  var sizes = [13.5, 12.5, 11.5, 10.5];
  for (var i = 0; i < sizes.length; i++) {
    sub.style.fontSize = sizes[i] + 'px';
    if (sub.scrollWidth <= sub.clientWidth + 1) return;
  }
}

/* ---------- Platz-Automatik + Ampel ---------- */

export function autofit() {
  var chat = $('chat');
  var fitted = null;
  for (var i = 0; i < CHAT_STEPS.length; i++) {
    chat.style.setProperty('--cs', CHAT_STEPS[i]);
    if (chat.scrollHeight <= chat.clientHeight + 1) {
      fitted = CHAT_STEPS[i];
      break;
    }
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
    freiChat =
      (chatRect.bottom - padB - chat.lastElementChild.getBoundingClientRect().bottom) /
      (scale || 1);
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

export function fitStage() {
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

export function setPlatform(p, skipPersist) {
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
