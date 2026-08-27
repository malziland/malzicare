/* Kleine Helfer fuer das Dokument und die eingebetteten Symbole.
   Die Symbole liegen als Text im Code, damit sie offline und im Druck da sind. */

export function svg(inner, vb, attrs) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' +
    (vb || '0 0 24 24') +
    '" ' +
    (attrs ||
      'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"') +
    '>' +
    inner +
    '</svg>'
  );
}

export const IC = {
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  trash: svg(
    '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>'
  ),
  grip: svg(
    '<circle cx="9" cy="5" r="1.4"/><circle cx="15" cy="5" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="19" r="1.4"/><circle cx="15" cy="19" r="1.4"/>',
    '0 0 24 24',
    'fill="currentColor"'
  ),
  check: svg(
    '<path d="M20 6 9 17l-5-5"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"'
  ),
  ticks: svg(
    '<path d="M2 11l5 5L17 6"/><path d="M11 11l5 5L26 6"/>',
    '0 0 28 22',
    'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"'
  ),
  pin: svg(
    '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"'
  ),
  back: svg(
    '<path d="m15 18-6-6 6-6"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"'
  ),
  video: svg(
    '<path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 11"/><rect x="2" y="6" width="14" height="12" rx="3"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"'
  ),
  phone: svg(
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"'
  ),
  camera: svg(
    '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.2"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"'
  ),
  mic: svg(
    '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
  ),
  send: svg(
    '<path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a1 1 0 0 0-1.39.91l-.01 4.61c0 .5.37.93.87.99L14 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/>',
    '0 0 24 24',
    'fill="currentColor"'
  ),
  smile: svg(
    '<circle cx="12" cy="12" r="9.2"/><path d="M8.6 14a4.6 4.6 0 0 0 6.8 0"/><circle cx="9.2" cy="9.6" r="0.7" fill="currentColor" stroke="none"/><circle cx="14.8" cy="9.6" r="0.7" fill="currentColor" stroke="none"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"'
  ),
  clip: svg(
    '<path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"'
  ),
  dots: svg(
    '<circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/>',
    '0 0 24 24',
    'fill="currentColor"'
  ),
  cal: svg(
    '<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"'
  ),
  resize: svg(
    '<path d="M20 12 12 20M20 17 17 20"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"'
  ),
  chevL: svg(
    '<path d="m14.5 17-5-5 5-5"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"'
  ),
  chevR: svg(
    '<path d="m9.5 7 5 5-5 5"/>',
    '0 0 24 24',
    'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"'
  ),
  people: svg(
    '<circle cx="9" cy="7.5" r="3.5"/><path d="M2 19.5c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5v.5H2z"/><circle cx="17.5" cy="8.5" r="2.8"/><path d="M18.5 14.2c2.1.7 3.5 2.3 3.5 4.3v1.5h-4"/>',
    '0 0 24 24',
    'fill="currentColor" stroke="none"'
  ),
  signal: svg(
    '<rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6" width="3" height="8" rx="1"/><rect x="10" y="3" width="3" height="11" rx="1"/><rect x="15" y="0" width="3" height="14" rx="1"/>',
    '0 0 18 14',
    'fill="currentColor"'
  ),
  wifi: svg(
    '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="19.6" r="1.4" fill="currentColor" stroke="none"/>',
    '0 2 24 20',
    'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"'
  ),
  batt: svg(
    '<rect x="1" y="1" width="21" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3.4" y="3.4" width="13" height="7.2" rx="1.6"/><path d="M24.6 4.5v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    '0 0 27 14',
    'fill="currentColor"'
  ),
};

/* ---------- State ---------- */

export function $(id) {
  return document.getElementById(id);
}

export function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

export function iconBtn(cls, icon, label) {
  var b = el('button', cls);
  b.type = 'button';
  b.innerHTML = icon;
  b.title = label;
  b.setAttribute('aria-label', label);
  return b;
}

export function setTextOrHide(id, text) {
  var n = $(id);
  n.textContent = text;
  n.style.display = text.trim() ? '' : 'none';
}

/* ---------- Sidebar ---------- */
