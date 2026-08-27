/* Alle festen Werte an einer Stelle: Voreinstellungen, Grenzen, Namen.
   Dieses Modul kennt nichts ausser sich selbst. */

export const STORAGE_KEY = 'malziland-klassenchat-plakat-v1';

export const PLATFORMS = {
  whatsapp: { name: 'WhatsApp', placeholder: 'Nachricht' },
  snapchat: { name: 'Snapchat', placeholder: 'Chat senden' },
  tiktok: { name: 'TikTok', placeholder: 'Nachricht senden …' },
  signal: { name: 'Signal', placeholder: 'Signal-Nachricht' },
};

export const TEXT_LIMITS = {
  eyebrow: 60,
  title: 70,
  subtitle: 220,
  chipGood: 45,
  chipBad: 45,
  day: 25,
  pinned: 45,
  adminsLabel: 45,
  pensLabel: 45,
  signTitle: 40,
  signText: 220,
};

export const DEFAULTS = {
  platform: 'whatsapp',
  groupName: 'Klasse 1A',
  admins: ['Nicole', 'Emily'],
  good: [
    'Hausübungen',
    'Lernen',
    'Alle haben alle Infos gleichzeitig',
    'Zusammen etwas ausmachen',
    'Zusammenhalten',
    'Nett schreiben',
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
    'Andere Sprachen',
  ],
  penalties: ['Verwarnung', '3 Tage Ausschluss', '1 Woche Ausschluss'],
  workshopDate: '',
  texts: {
    eyebrow: 'Klassenvereinbarung · Unser Gruppenchat',
    title: 'Die Regeln für unseren Klassenchat',
    subtitle:
      'Das hat sich die Klasse gemeinsam für ihren {App}-Gruppenchat ausgemacht. Wer dabei ist, unterschreibt rechts.',
    chipGood: 'Das tut unserem Chat gut',
    chipBad: 'Das hat bei uns keinen Platz',
    day: 'Heute',
    pinned: 'Angepinnt in der Gruppe',
    adminsLabel: 'Admins',
    pensLabel: 'Wenn jemand nicht mitmacht',
    signTitle: 'Das sind wir',
    signText:
      'Alle unterschreiben hier – kreuz und quer. Jede Unterschrift zeigt: Ich bin dabei und halte mich an unsere Regeln.',
  },
};

/* ---------- Icons (inline für Offline- und Druckfähigkeit) ---------- */

export const PEN_ANCHORS = [
  [232, 180, 0],
  [239, 125, 0],
  [224, 43, 43],
  [142, 20, 20],
];

export const CHAT_STEPS = [1, 0.93, 0.86, 0.8, 0.74, 0.68, 0.62];

export const SEG_IDS = { whatsapp: 'segWa', snapchat: 'segSc', tiktok: 'segTt', signal: 'segSi' };

export const TEXT_FIELDS = {
  inTxtEyebrow: 'eyebrow',
  inTxtTitle: 'title',
  inTxtSubtitle: 'subtitle',
  inTxtChipGood: 'chipGood',
  inTxtChipBad: 'chipBad',
  inTxtDay: 'day',
  inTxtPinned: 'pinned',
  inTxtAdminsLabel: 'adminsLabel',
  inTxtPensLabel: 'pensLabel',
  inSignTitle: 'signTitle',
  inSignText: 'signText',
};

export const MONTHS = [
  'Jänner',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];
