# UI/UX — Referenz (Einstieg und Links)

Eine Seite für **Orientierung**: wohin mit Fragen zu PWA-Oberfläche, Theming und Agenten-Regeln. Die **fachliche Norm** bleibt im [UI/UX Style Guide](./ui-ux-style-guide.md); die **technische Norm** in [Web-Theming](./web-theming.md).

## Dokumentation

| Thema | Datei |
|--------|--------|
| Produkt-UI (Prinzipien, Modi, Tablet, Icons, No-gos) | [`docs/ui-ux-style-guide.md`](./ui-ux-style-guide.md) |
| Stilistisches Konzept Hell vs. warm-dark (SVG) | [`docs/design/erp-theme-hell-vs-warm-dark-preview.svg`](./design/erp-theme-hell-vs-warm-dark-preview.svg) |
| Moodboard: echte App-Shell (Screens) | Abschnitt **Moodboard und Referenzscreens** im [UI/UX Style Guide](./ui-ux-style-guide.md); Ablage [`docs/design/`](./design/) |
| Tokens, `localStorage`, `data-theme`, FOUC, Checkliste neue UI | [`docs/web-theming.md`](./web-theming.md) |
| PWA-Betrieb, SoT, API-Oberfläche | [`apps/web/README.md`](../apps/web/README.md) |
| Agenten-Lesepfad | [`AGENTS.md`](../AGENTS.md) (Punkt 5 PWA / UI-UX) |
| Code-Landkarte `apps/web` | [`docs/CODEMAPS/overview.md`](./CODEMAPS/overview.md) (Abschnitt PWA) |

## Cursor / KI

| Thema | Datei |
|--------|--------|
| Regel nur für `apps/web/**` | [`.cursor/rules/erp-web-ui.mdc`](../.cursor/rules/erp-web-ui.mdc) |
| Repo-weite Agenten-Regeln | [`.cursor/rules/erp-multi-agent.mdc`](../.cursor/rules/erp-multi-agent.mdc) |

## Code (Theming)

| Thema | Pfad |
|--------|------|
| Präferenz lesen/schreiben, `applyThemePreference` | [`apps/web/src/lib/theme.ts`](../apps/web/src/lib/theme.ts) |
| Auswahl „Darstellung“ in der Shell | [`apps/web/src/components/ThemePreferenceControl.tsx`](../apps/web/src/components/ThemePreferenceControl.tsx) |
| CSS-Variablen (Hell / Dunkel warm / Dunkel neutral) | [`apps/web/src/index.css`](../apps/web/src/index.css) |
| Init nach CSS-Import | [`apps/web/src/main.tsx`](../apps/web/src/main.tsx) |
| Manifest `theme_color` (statisch) | [`apps/web/vite.config.ts`](../apps/web/vite.config.ts) |
| HTML `theme-color` + FOUC (`/theme-boot.js`) | [`apps/web/index.html`](../apps/web/index.html), [`apps/web/public/theme-boot.js`](../apps/web/public/theme-boot.js) |

## Persistenz (Darstellung)

| Key | Werte |
|-----|--------|
| `erp-theme` | `light` \| `warm-dark` \| `dark` \| `system` |
| `erp-dark-palette-last` | `warm` \| `cool` |

Details und Semantik: Abschnitt **Persistenz (localStorage)** im [UI/UX Style Guide](./ui-ux-style-guide.md).

## Tests

| Thema | Pfad |
|--------|------|
| Theme-Logik (Vitest) | [`apps/web/src/lib/theme.test.ts`](../apps/web/src/lib/theme.test.ts) |

Befehl: `npm run test -w apps/web`
