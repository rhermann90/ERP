export type ThemePreference = "light" | "dark" | "system";

/** Nur Theme-Präferenz — keine Auth-Tokens (siehe README). */
export const THEME_STORAGE_KEY = "erp-theme";

export function getStoredThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
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

/** Setzt `data-theme` auf `html` oder entfernt es bei „System“. */
export function applyThemePreference(p: ThemePreference): void {
  const root = document.documentElement;
  if (p === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", p);
  }
  syncThemeColorMeta();
}

/** Liest `--theme-color` aus den aktiven Tokens und schreibt das Meta-Tag. */
export function syncThemeColorMeta(): void {
  const run = (): void => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--theme-color").trim();
    const content = raw || "#f5f5f7";
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

/** Bei System-Schema-Wechsel Meta aktualisieren (CSS folgt automatisch ohne `data-theme`). */
export function installThemeColorMediaListener(): void {
  if (mediaListenerInstalled || typeof window === "undefined") return;
  mediaListenerInstalled = true;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => {
    if (!document.documentElement.hasAttribute("data-theme")) {
      syncThemeColorMeta();
    }
  });
}
