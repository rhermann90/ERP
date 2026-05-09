import { describe, expect, it } from "vitest";
import { isPrimaryNavLinkVisible } from "./pwa-primary-nav-visibility.js";

describe("isPrimaryNavLinkVisible", () => {
  it("Blendet operative Links ohne Session aus", () => {
    expect(isPrimaryNavLinkVisible("stammdaten", { hasSession: false, role: null })).toBe(false);
    expect(isPrimaryNavLinkVisible("document", { hasSession: false, role: null })).toBe(false);
    expect(isPrimaryNavLinkVisible("start", { hasSession: false, role: null })).toBe(true);
    expect(isPrimaryNavLinkVisible("hilfe", { hasSession: false, role: null })).toBe(true);
  });

  it("Zeigt Stammdaten mit gültiger Session (alle Rollen mit Datenzugang)", () => {
    expect(isPrimaryNavLinkVisible("stammdaten", { hasSession: true, role: "VIEWER" })).toBe(true);
    expect(isPrimaryNavLinkVisible("stammdaten", { hasSession: true, role: "VERTRIEB_BAULEITUNG" })).toBe(true);
  });

  it("Zeigt Einstellungen nur für ADMIN, GF und Buchhaltung", () => {
    expect(isPrimaryNavLinkVisible("settings", { hasSession: true, role: "ADMIN" })).toBe(true);
    expect(isPrimaryNavLinkVisible("settings", { hasSession: true, role: "BUCHHALTUNG" })).toBe(true);
    expect(isPrimaryNavLinkVisible("settings", { hasSession: true, role: "GESCHAEFTSFUEHRUNG" })).toBe(true);
    expect(isPrimaryNavLinkVisible("settings", { hasSession: true, role: "VIEWER" })).toBe(false);
    expect(isPrimaryNavLinkVisible("settings", { hasSession: true, role: "VERTRIEB_BAULEITUNG" })).toBe(false);
  });
});
