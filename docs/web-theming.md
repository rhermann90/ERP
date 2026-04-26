# Web-PWA: Theming und Dark Mode

Produkt-Leitlinien: [`docs/ui-ux-style-guide.md`](./ui-ux-style-guide.md). **Alle Einstiegslinks:** [`docs/referenz-ui-ux.md`](./referenz-ui-ux.md).

## Modi

| Modus (UI) | `erp-theme` | `html`-Attribute | Verhalten |
|------------|-------------|------------------|-----------|
| **Hell** | `light` | `data-theme="light"` (kein `data-dark-palette`) | Immer helles warmes Paper. |
| **Dunkel (warm)** | `warm-dark` | `data-theme="dark"` `data-dark-palette="warm"` | Immer warmes Dunkel; setzt `erp-dark-palette-last` auf `warm`. |
| **Dunkel (neutral)** | `dark` | `data-theme="dark"` `data-dark-palette="cool"` | Immer neutrales Dunkel; setzt `erp-dark-palette-last` auf `cool`. |
| **System** (Standard) | `system` | per JS aus `prefers-color-scheme`: `data-theme="light"` oder `data-theme="dark"` + `data-dark-palette` aus `erp-dark-palette-last` (Standard `cool`) | Bei effektivem Dunkel die zuletzt explizit gewählte Dunkel-Stimmung. |

Die Auswahl steht in der App-Shell („Darstellung“). **`localStorage`:** `erp-theme` = `light` \| `warm-dark` \| `dark` \| `system`; **`erp-dark-palette-last`** = `warm` \| `cool`. **Kein** Auth-Token, kein Mandanten-Geheimnis (siehe [`apps/web/README.md`](../apps/web/README.md)).

## Technischer Vertrag

- **CSS-Variablen:** Alle sichtbaren Farben sollen über Tokens aus [`apps/web/src/index.css`](../apps/web/src/index.css) laufen (`--bg`, `--surface`, `--text`, `--border`, `--accent`, `--danger`, `--input-bg`, `--panel-2`, `--accent-muted`, Banner-Variablen, …). Neue Komponenten: **keine** festen `#hex`-Farben für Flächen, die mit dem Theme mitwechseln sollen.
- **Init / FOUC:** [`apps/web/index.html`](../apps/web/index.html) bindet synchron [`/theme-boot.js`](../apps/web/public/theme-boot.js) (aus `public/`, gleiche Logik wie [`applyThemePreference` in `theme.ts`](../apps/web/src/lib/theme.ts)); bei Änderungen **beide** Dateien anpassen. Danach: in [`apps/web/src/main.tsx`](../apps/web/src/main.tsx) nach `import "./index.css"` erneut `applyThemePreference(getStoredThemePreference())` (Meta-Tag, Listener).
- **Browser-Chrome:** `syncThemeColorMeta()` setzt `<meta name="theme-color">` auf den Wert von **`--theme-color`** (hell/dunkel passend). Bei Wechsel von `prefers-color-scheme` aktualisiert ein `matchMedia`-Listener bei gespeicherter Präferenz **System** erneut `applyThemePreference("system")` und damit das Meta-Tag.
- **PWA-Manifest:** `theme_color` / `background_color` in `vite.config.ts` bleiben **build-statisch** (heller Kompromiss für Installations-Splash). Das nutzerrelevante Tab-/Chrome-Farbband folgt dem **Meta-Tag** zur Laufzeit.

## Logik im Code

- [`apps/web/src/lib/theme.ts`](../apps/web/src/lib/theme.ts): `erp-theme` / `erp-dark-palette-last`, `applyThemePreference`, `syncThemeColorMeta`, `installThemeColorMediaListener`.
- [`apps/web/src/components/ThemePreferenceControl.tsx`](../apps/web/src/components/ThemePreferenceControl.tsx): Select in der Shell.

## Checkliste für neue UI

1. Flächen und Rahmen: `var(--surface)`, `var(--bg)`, `var(--border)`.
2. Text: `var(--text)` / `var(--text-secondary)`.
3. Formularfelder: `background: var(--input-bg)`; Fokus: bestehende `:focus-visible`-Regeln.
4. Fehler/Erfolg: Banner-Klassen (`.error-banner`, `.success-banner`) oder dieselben CSS-Variablen wie in `index.css`.
5. `color-mix`: nur mit Tokens (`var(--border)`), keine hellen Hex-Fallbacks.

## Kontrast und Barrierefreiheit

Akzentfarbe und Flächen wurden für helles Paper sowie **Dunkel (neutral)** und **Dunkel (warm)** auf lesbare Kombinationen ausgelegt; **Dunkel (warm)** Fließtext und Basisflächen wurden bei Einführung gegen WCAG 2.2 AA für Fließtext geprüft (kein Dauer-Ci-Gate). Bei größeren UI-Erweiterungen oder Token-Tuning Kontrast erneut prüfen.
