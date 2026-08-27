/* Der Stand des Plakats: laden, pruefen, sichern.
   sanitize() behandelt jede geladene Datei als fremde Eingabe. */

import { DEFAULTS, PLATFORMS, STORAGE_KEY, TEXT_LIMITS } from './daten.js';

export let state = load();

/* Neu gesetzt wird der Stand nur hier: Ein aus einem anderen Modul
   importierter Name laesst sich nicht zuweisen, und ein stiller Fehlschlag
   waere schlimmer als ein Umweg ueber eine Funktion. */
export function setState(neu) {
  state = neu;
}

export function load() {
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

export function sanitize(data) {
  var s = JSON.parse(JSON.stringify(DEFAULTS));
  if (!data || typeof data !== 'object') return s;
  if (PLATFORMS[data.platform]) s.platform = data.platform;
  if (typeof data.groupName === 'string') s.groupName = data.groupName.slice(0, 40);
  if (typeof data.workshopDate === 'string') s.workshopDate = data.workshopDate.slice(0, 40);
  var limits = { admins: [8, 25], good: [20, 90], bad: [20, 90], penalties: [20, 90] };
  Object.keys(limits).forEach(function (k) {
    if (Array.isArray(data[k])) {
      s[k] = data[k]
        .filter(function (v) {
          return typeof v === 'string';
        })
        .map(function (v) {
          return v.slice(0, limits[k][1]);
        })
        .slice(0, limits[k][0]);
    }
  });
  var texts = data.texts && typeof data.texts === 'object' ? data.texts : {};
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
  if (typeof data.signTitle === 'string' && typeof texts.signTitle !== 'string')
    s.texts.signTitle = data.signTitle.slice(0, 40);
  if (typeof data.signText === 'string' && typeof texts.signText !== 'string')
    s.texts.signText = data.signText.slice(0, 220);
  return s;
}

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    /* voll/privat – ignorieren */
  }
}

/* ---------- DOM-Helfer ---------- */
