# Web-PWA: Theming und Dark Mode

## Modi

| Modus   | Verhalten |
|---------|-----------|
| **System** (Standard) | Folgt `prefers-color-scheme` des Betriebssystems/Browsers. Auf `html` liegt **kein** `data-theme`. |
| **Hell** | Erzwingt die helle Palette: `html` hat `data-theme="light"`. |
| **Dunkel** | Erzwingt die dunkle Palette: `html` hat `data-theme="dark"`. |

Die Auswahl steht in der App-Shell („Darstellung“) und wird in **`localStorage`** unter dem Key **`erp-theme`** gespeichert (`light` \| `dark` \| `system`). Das ist **kein** Auth-Token und kein Mandanten-Geheimnis; Bearer-Tokens werden weiterhin **nicht** in `localStorage` abgelegt (siehe [`apps/web/README.md`](../apps/web/README.md)).

## Technischer Vertrag

- **CSS-Variablen:** Alle sichtbaren Farben sollen über Tokens aus [`apps/web/src/index.css`](../apps/web/src/index.css) laufen (`--bg`, `--surface`, `--text`, `--border`, `--accent`, `--danger`, `--input-bg`, `--panel-2`, `--accent-muted`, Banner-Variablen, …). Neue Komponenten: **keine** festen `#hex`-Farben für Flächen, die mit dem Theme mitwechseln sollen.
- **Init:** In [`apps/web/src/main.tsx`](../apps/web/src/main.tsx) wird **nach** `import "./index.css"` sofort `applyThemePreference(getStoredThemePreference())` aufgerufen, damit beim ersten Paint möglichst wenig FOUC entsteht.
- **Browser-Chrome:** `syncThemeColorMeta()` setzt `<meta name="theme-color">` auf den Wert von **`--theme-color`** (hell/dunkel passend). Bei Wechsel des Systemschemas (nur Modus „System“) aktualisiert ein `matchMedia`-Listener das Meta-Tag.
- **PWA-Manifest:** `theme_color` / `background_color` in `vite.config.ts` bleiben **build-statisch** (heller Kompromiss für Installations-Splash). Das nutzerrelevante Tab-/Chrome-Farbband folgt dem **Meta-Tag** zur Laufzeit.

## Logik im Code

- [`apps/web/src/lib/theme.ts`](../apps/web/src/lib/theme.ts): lesen/schreiben der Präferenz, `applyThemePreference`, `syncThemeColorMeta`, `installThemeColorMediaListener`.
- [`apps/web/src/components/ThemePreferenceControl.tsx`](../apps/web/src/components/ThemePreferenceControl.tsx): Select in der Shell.

## Checkliste für neue UI

1. Flächen und Rahmen: `var(--surface)`, `var(--bg)`, `var(--border)`.
2. Text: `var(--text)` / `var(--text-secondary)`.
3. Formularfelder: `background: var(--input-bg)`; Fokus: bestehende `:focus-visible`-Regeln.
4. Fehler/Erfolg: Banner-Klassen (`.error-banner`, `.success-banner`) oder dieselben CSS-Variablen wie in `index.css`.
5. `color-mix`: nur mit Tokens (`var(--border)`), keine hellen Hex-Fallbacks.

## Kontrast und Barrierefreiheit

Akzentfarbe und Flächen wurden für helles und dunkles Schema auf lesbare Kombinationen ausgelegt; bei größeren UI-Erweiterungen Kontrast (WCAG 2.2 AA für Fließtext) erneut prüfen.
