export type ThemePreference = "light" | "warm-dark" | "dark" | "system";

export type DarkPalette = "warm" | "cool";

/** Nur Darstellungspräferenz — keine Auth-Tokens (siehe README). */
export const THEME_STORAGE_KEY = "erp-theme";

/** Letzte explizite Dunkel-Variante für System bei effektivem Dunkel. */
export const DARK_PALETTE_LAST_STORAGE_KEY = "erp-dark-palette-last";

function prefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getStoredDarkPaletteLast(): DarkPalette {
  try {
    const v = localStorage.getItem(DARK_PALETTE_LAST_STORAGE_KEY);
    if (v === "warm" || v === "cool") return v;
  } catch {
    /* private mode / blocked storage */
  }
  return "cool";
}

export function setStoredDarkPaletteLast(p: DarkPalette): void {
  try {
    localStorage.setItem(DARK_PALETTE_LAST_STORAGE_KEY, p);
  } catch {
    /* ignore */
  }
}

export function getStoredThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "warm-dark" || v === "dark" || v === "system") return v;
  } catch {
    /* private mode / blocked storage */
  }
  return "system";
}

export function setStoredThemePreference(p: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, p);
  } catch {
    /* ignore */
  }
}

function applyLightTheme(): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", "light");
  root.removeAttribute("data-dark-palette");
}

function applyDarkTheme(palette: DarkPalette): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", "dark");
  root.setAttribute("data-dark-palette", palette);
}

function hadDarkPaletteStorageKey(): boolean {
  try {
    return localStorage.getItem(DARK_PALETTE_LAST_STORAGE_KEY) !== null;
  } catch {
    return true;
  }
}

/**
 * Keys und Auflösung müssen mit `public/theme-boot.js` (in `index.html` eingebunden) übereinstimmen.
 */
export function applyThemePreference(p: ThemePreference): void {
  if (p === "light") {
    applyLightTheme();
    syncThemeColorMeta();
    return;
  }
  if (p === "warm-dark") {
    setStoredDarkPaletteLast("warm");
    applyDarkTheme("warm");
    syncThemeColorMeta();
    return;
  }
  if (p === "dark") {
    setStoredDarkPaletteLast("cool");
    applyDarkTheme("cool");
    syncThemeColorMeta();
    return;
  }
  if (prefersDark()) {
    const palette = getStoredDarkPaletteLast();
    applyDarkTheme(palette);
    if (!hadDarkPaletteStorageKey()) setStoredDarkPaletteLast(palette);
  } else {
    applyLightTheme();
  }
  syncThemeColorMeta();
}

/** Liest `--theme-color` aus den aktiven Tokens und schreibt das Meta-Tag. */
export function syncThemeColorMeta(): void {
  const run = (): void => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--theme-color").trim();
    const content = raw || "#f7f5f2";
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.insertBefore(meta, document.head.firstChild);
    }
    meta.setAttribute("content", content);
  };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(run);
  } else {
    run();
  }
}

let mediaListenerInstalled = false;

/** Bei System-Schema-Wechsel: nur wenn Darstellung „System“, erneut auflösen. */
export function installThemeColorMediaListener(): void {
  if (mediaListenerInstalled || typeof window === "undefined") return;
  mediaListenerInstalled = true;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => {
    if (getStoredThemePreference() === "system") {
      applyThemePreference("system");
    }
  });
}
