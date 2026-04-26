import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DARK_PALETTE_LAST_STORAGE_KEY,
  THEME_STORAGE_KEY,
  applyThemePreference,
  getStoredDarkPaletteLast,
  getStoredThemePreference,
  setStoredThemePreference,
} from "./theme.js";

function mockMatchMediaDark(matches: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: query === "(prefers-color-scheme: dark)" ? matches : false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList,
  );
}

describe("theme preference", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-dark-palette");
    mockMatchMediaDark(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-dark-palette");
  });

  it("defaults to system when unset", () => {
    expect(getStoredThemePreference()).toBe("system");
  });

  it("round-trips light", () => {
    setStoredThemePreference("light");
    expect(getStoredThemePreference()).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("ignores invalid stored values", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "nope");
    expect(getStoredThemePreference()).toBe("system");
  });

  it("applyThemePreference sets dark + cool palette for dark", () => {
    applyThemePreference("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-dark-palette")).toBe("cool");
    expect(getStoredDarkPaletteLast()).toBe("cool");
  });

  it("applyThemePreference sets dark + warm palette for warm-dark", () => {
    applyThemePreference("warm-dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-dark-palette")).toBe("warm");
    expect(getStoredDarkPaletteLast()).toBe("warm");
  });

  it("applyThemePreference sets light for system when OS light", () => {
    mockMatchMediaDark(false);
    applyThemePreference("system");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.hasAttribute("data-dark-palette")).toBe(false);
  });

  it("applyThemePreference uses stored palette for system when OS dark", () => {
    mockMatchMediaDark(true);
    localStorage.setItem(DARK_PALETTE_LAST_STORAGE_KEY, "warm");
    applyThemePreference("system");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-dark-palette")).toBe("warm");
  });

  it("applyThemePreference uses cool for system+dark when palette unset", () => {
    mockMatchMediaDark(true);
    applyThemePreference("system");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-dark-palette")).toBe("cool");
  });

  it("persists erp-dark-palette-last when theme dark and key was missing", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(localStorage.getItem(DARK_PALETTE_LAST_STORAGE_KEY)).toBeNull();
    applyThemePreference("dark");
    expect(localStorage.getItem(DARK_PALETTE_LAST_STORAGE_KEY)).toBe("cool");
  });

  it("persists erp-dark-palette-last when system+dark and key was missing", () => {
    mockMatchMediaDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, "system");
    expect(localStorage.getItem(DARK_PALETTE_LAST_STORAGE_KEY)).toBeNull();
    applyThemePreference("system");
    expect(localStorage.getItem(DARK_PALETTE_LAST_STORAGE_KEY)).toBe("cool");
  });
});
