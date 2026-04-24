import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  THEME_STORAGE_KEY,
  applyThemePreference,
  getStoredThemePreference,
  setStoredThemePreference,
} from "./theme.js";

describe("theme preference", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
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

  it("applyThemePreference sets data-theme for dark", () => {
    applyThemePreference("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("applyThemePreference removes data-theme for system", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    applyThemePreference("system");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});
