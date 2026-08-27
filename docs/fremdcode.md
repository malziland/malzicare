# Fremdcode in diesem Verzeichnis

Beide Bibliotheken liegen unverändert hier, wie sie vom Hersteller kommen –
kein Bündler, keine eigenen Änderungen (bis auf den nachgetragenen
Lizenzhinweis bei `html-to-image`, siehe unten).

| Datei              | Paket           | Version | Lizenz                            | Herkunft                                  |
| ------------------ | --------------- | ------- | --------------------------------- | ----------------------------------------- |
| `html-to-image.js` | `html-to-image` | 1.11.13 | MIT, © 2017–2025 W.Y.             | <https://github.com/bubkoo/html-to-image> |
| `jspdf.umd.min.js` | `jspdf`         | 4.2.1   | MIT, © 2010–2025 James Hall u. a. | <https://github.com/parallax/jsPDF>       |

**Belegt, nicht behauptet:** Die Datei `html-to-image.js` ist byte-identisch mit
`dist/html-to-image.js` aus `npm pack html-to-image@1.11.13`
(SHA-256 beginnt mit `a90b4290`). Die Version von jsPDF steht in seinem eigenen
Kopf.

## Was die MIT-Lizenz verlangt

Sie erlaubt fast alles – verwenden, ändern, verkaufen –, verlangt aber **eine**
Sache: Copyright-Hinweis und Lizenztext müssen in jeder Kopie mitwandern.

`jspdf.umd.min.js` bringt sie selbst mit (16 Lizenzblöcke, auch für den
mitgelieferten Fremdcode von Adobe und anderen). Bei `html-to-image.js`
**fehlten sie** – die ausgelieferte Datei war eine Kopie ohne Hinweis. Der Kopf
wurde deshalb am 27.08.2026 nachgetragen; am Code selbst ändert das nichts.

## Aktualisieren

```bash
npm pack html-to-image@<version>          # oder jspdf@<version>
tar -xzf html-to-image-<version>.tgz
cp package/dist/html-to-image.js public/js/vendor/
# Lizenzkopf wieder voranstellen, falls er im Paket weiterhin fehlt
node tools/fremdcode.mjs                  # prüft Version, Lizenz und Prüfsumme
node tools/cache-buster.mjs --erhoehen
npm run vor-dem-push
```

**Warum von Hand und nicht über npm:** Die Dateien werden direkt an den Browser
ausgeliefert, nicht gebündelt. Stünden sie in `package.json`, läge das
ausgelieferte Ergebnis nicht mehr im Repository – genau das soll es aber
(ADR-0004).

**Was das kostet:** Dependabot sieht diese Dateien nicht. Deshalb prüft
`tools/fremdcode.mjs` bei jedem Lauf, ob eine neuere Fassung vorliegt, und
meldet sie.
