# UI/UX Style Guide — ERP Web (PWA)

Verbindliche Produkt- und Oberflächenrichtlinien für [`apps/web/`](../apps/web/). Technische Token- und Laufzeitdetails: [`docs/web-theming.md`](./web-theming.md).

**Link-Sammlung (eine Seite):** [`docs/referenz-ui-ux.md`](./referenz-ui-ux.md).

## Ziele und Prinzipien

- **Einfach, praxisnah, übersichtlich** — Kernprozesse ohne visuelle Ablenkung.
- **Comfort-Dichte** — ausreichend Weißraum, lesbare Abstände; primär **Monitor**; **Tablet im Querformat** als Zielrichtung für Feldarbeit.
- **Erste Nutzung** — gängige SaaS-/OS-Muster (klare Hierarchie, erwartbare Position von Navigation, Aktionen, Status).
- **Kein verspielter oder übermäßig bunter Look** — Akzent sparsam; semantische Farben (Fehler/Erfolg) unverändert nutzbar.

## Visuelle Sprache

- **Hell:** warmes „Paper“ (leicht warmes Off-White als Seitengrund, klare helle Flächen für Karten).
- **Vorschau-Grafik (schematisch):** Hell vs. warm-dark als SVG — [`docs/design/erp-theme-hell-vs-warm-dark-preview.svg`](./design/erp-theme-hell-vs-warm-dark-preview.svg).
- **Akzent:** neutral bis eine **Markenfarbe** festliegt; dann nur gezielt (Links, Primäraktion, Fokus). Keine parallelen Regenbogen-Akzente.
- **Typografie:** System-UI-Stack (siehe `--font` in `apps/web/src/index.css`).
- **Form:** mittel — einheitlicher Radius (aktuell `--radius`), keine wild gemischten Stile.
- **Kontrast:** Fließtext und Pflicht-UI **WCAG 2.2 AA** im Blick; bei größeren Erweiterungen erneut prüfen.

## Moodboard und Referenzscreens

- **Kanonische visuelle Referenz** für spätere Moodboards und Design-Iterationen: **Screenshots der echten App-Shell** (Komponente [`AppShell.tsx`](../apps/web/src/components/AppShell.tsx)), nicht nur das schematische SVG.
- **Schematisches SVG** ([`docs/design/erp-theme-hell-vs-warm-dark-preview.svg`](./design/erp-theme-hell-vs-warm-dark-preview.svg)) bleibt ergänzend für Farbwelt Hell vs. warm-dark.
- **Ablage:** unter [`docs/design/`](./design/) mit sprechendem Dateinamen (z. B. `appshell-hell-2026-04-26.png`, bei Bedarf je Darstellung ein Shot); keine produktiven Mandantendaten in Screenshots.

## Icons

- **Ein** Outline-Icon-Set von **einem** Anbieter; **tree-shakeable** Einzelimports.
- Bibliothek ist **Team-Wahl** — sobald festgelegt, hier den **Namen** ergänzen: *(noch nicht festgelegt)*.

## Layout und Tablet

- **Landscape-tendiert:** persistente Navigation oder schmale Rail, wo sinnvoll **Master–Detail**.
- **Touch:** großzügige Klick-/Touch-Ziele (Richtwert **mindestens 44 px** Höhe/Breite für primäre Aktionen und wichtige Listenzeilen).
- **Keine** allein auf **Hover** angewiesenen kritischen Informationen.

## Darstellung (vier Optionen)

Die Auswahl in der App-Shell („Darstellung“) bietet **genau vier** gleichwertige Modi:

| Anzeige (UI)           | Interner Wert (`erp-theme`) | Bedeutung |
|------------------------|-----------------------------|-----------|
| **Hell**               | `light`                     | Immer helles warmes Paper. |
| **Dunkel (warm)**      | `warm-dark`                 | Immer warmes Dunkel. |
| **Dunkel (neutral)**   | `dark`                      | Immer neutrales/kühles Dunkel. |
| **System**             | `system`                    | Hell/Dunkel folgt `prefers-color-scheme`. **Ist das Ergebnis dunkel**, gilt die zuletzt bei **Dunkel (warm)** oder **Dunkel (neutral)** gewählte Stimmung (`erp-dark-palette-last`). |

Kurzhilfe für Nutzer: Bei **System** entspricht die Dunkel-Erscheinung der **zuletzt explizit gewählten** warmen oder neutralen Dunkel-Variante.

## Persistenz (localStorage)

| Key | Werte | Zweck |
|-----|-------|--------|
| `erp-theme` | `light` \| `warm-dark` \| `dark` \| `system` | Gewählte Darstellung. **Kein** Bearer-Token. |
| `erp-dark-palette-last` | `warm` \| `cool` | Letzte explizite Dunkel-Wahl für **System** bei effektivem Dunkel. Wird bei Wahl von **Dunkel (warm)** auf `warm`, bei **Dunkel (neutral)** auf `cool` gesetzt. **Standard** `cool`, wenn noch nie eine Dunkel-Option gewählt wurde. |

## HTML-Attribute (technisch)

- Hell: `data-theme="light"`, kein `data-dark-palette`.
- Dunkel (beide): `data-theme="dark"` und `data-dark-palette="warm"` bzw. `"cool"`.
- **System:** Laufzeit setzt `data-theme` und bei Dunkel `data-dark-palette` entsprechend der Regeln oben (kein „leeres“ `data-theme` mehr für System).
- **Robustheit:** Fehlt bei `data-theme="dark"` einmalig `data-dark-palette`, gelten in CSS dieselben Tokens wie **Dunkel (neutral)** (siehe `index.css`).

## No-gos

- Keine festen `#hex`-Farben für thembare Flächen — nur **CSS-Variablen** aus `index.css` (siehe Web-Theming-Checkliste).
- Keine Auth-Tokens in `localStorage` (nur Darstellungspräferenzen wie oben).

## Verwandte Verträge

- SoT / Aktionen / Fehler-Envelope: [`apps/web/README.md`](../apps/web/README.md), [`docs/contracts/decision-log-phase1-frontend.md`](./contracts/decision-log-phase1-frontend.md).
