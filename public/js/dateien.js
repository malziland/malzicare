/* Entwurf speichern und oeffnen. Jeder Download bekommt einen neutralen
   Binaertyp - iPhone-Safari zeigt bekannte Typen an, statt sie zu laden. */

import { showModal } from './dialog.js';
import { initInputs } from './eingaben.js';
import { renderAdminChips, renderAllLists } from './listen.js';
import { setPlatform } from './plakat.js';
import { persist, sanitize, setState, state } from './zustand.js';

export function slug(s) {
  return (
    (s || 'klasse')
      .toLowerCase()
      .replace(/[äöüß]/g, function (c) {
        return { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c];
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'klasse'
  );
}

export function saveFile() {
  var data = Object.assign({ app: 'klassenchat-plakat-v1' }, state);
  /* Neutraler Binärtyp wie beim PDF: iPhone-Safari lädt Typen, die es
     nicht anzeigen kann, direkt herunter — bei application/json käme
     stattdessen der „Anzeigen | Laden"-Frage-Dialog. */
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/octet-stream' });
  downloadBlob(blob, 'klassenchat-' + slug(state.groupName) + '.json');
}

export function loadFile(file) {
  var reader = new FileReader();
  reader.onload = function () {
    var data;
    try {
      data = JSON.parse(reader.result);
    } catch (e) {
      showModal({
        title: 'Datei konnte nicht gelesen werden',
        message:
          'Bitte eine mit „Entwurf speichern" erstellte Datei wählen. Der aktuelle Stand bleibt unverändert.',
      });
      return;
    }
    var plausibel =
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      (data.app === 'klassenchat-plakat-v1' ||
        Array.isArray(data.good) ||
        Array.isArray(data.bad) ||
        typeof data.groupName === 'string');
    if (!plausibel) {
      showModal({
        title: 'Keine Plakat-Datei',
        message: 'Diese Datei stammt nicht aus malziCARE. Der aktuelle Stand bleibt unverändert.',
      });
      return;
    }
    setState(sanitize(data));
    persist();
    initInputs();
    renderAdminChips();
    renderAllLists();
    setPlatform(state.platform);
  };
  reader.onerror = function () {
    showModal({
      title: 'Datei konnte nicht gelesen werden',
      message: 'Der aktuelle Stand bleibt unverändert.',
    });
  };
  reader.readAsText(file);
}

/* ---------- Init ---------- */

export let letzteBlobUrl = null;

export function downloadBlob(blob, dateiname) {
  if (letzteBlobUrl) {
    URL.revokeObjectURL(letzteBlobUrl);
  }
  var url = URL.createObjectURL(blob);
  letzteBlobUrl = url;
  var a = document.createElement('a');
  a.href = url;
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    a.remove();
  }, 1000);
}

/* Ein Klick → direkter Download, auf allen Geräten gleich */
