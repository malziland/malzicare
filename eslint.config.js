import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    // Fremdcode wird nicht geprueft, sondern unveraendert ausgeliefert.
    ignores: [
      'public/js/vendor/**',
      'node_modules/**',
      'dist/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    files: ['public/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      // Werden per script-Tag vor app.js geladen (public/index.html).
      globals: { ...globals.browser, htmlToImage: 'readonly', jspdf: 'readonly' },
    },
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      // Ein ungenutztes catch-Binding ist kein Fehler; die Faelle sind im
      // Code jeweils begruendet und behandelt.
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
    },
  },
  {
    files: ['tools/**/*.mjs', 'tests/**/*.mjs', 'tests/**/*.js', '*.config.js', '*.config.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      // Oberflaechentests fuehren Code im Browser aus (page.evaluate), deshalb
      // gelten hier beide Umgebungen.
      globals: { ...globals.node, ...globals.browser },
    },
    ...js.configs.recommended,
  },
];
