import { describe, expect, it, vi } from "vitest";
import {
  FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH,
  STAMMDATEN_HASH,
  applyStammdatenCustomerIdToLocationHash,
  financePrepHashWithTab,
  normalizeFinancePrepHashToCanon,
  readStammdatenCustomerIdFromHash,
  stammdatenHashWithCustomerId,
} from "./hash-route.js";

describe("financePrepHashWithTab", () => {
  it("nutzt dedizierten Pfad für Grundeinstellungen", () => {
    expect(financePrepHashWithTab("grundeinstellungen")).toBe(FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH);
  });

  it("nutzt vorbereitung-Query für andere Tabs", () => {
    expect(financePrepHashWithTab("rechnung")).toBe("#/finanz-vorbereitung?tab=rechnung");
  });
});

describe("normalizeFinancePrepHashToCanon", () => {
  it("vereinheitlicht ?tab=grundeinstellungen auf dedizierten Pfad", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/finanz-vorbereitung?tab=grundeinstellungen";
    normalizeFinancePrepHashToCanon();
    expect(window.location.hash).toBe(FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH);
  });

  it("lässt dedizierten Grundeinstellungen-Pfad unverändert", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH;
    normalizeFinancePrepHashToCanon();
    expect(window.location.hash).toBe(FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH);
  });

  it("greift nicht bei anderen Finanz-Vorbereitung-Pfaden ein", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/finanz-vorbereitung?tab=rechnung";
    const before = window.location.hash;
    normalizeFinancePrepHashToCanon();
    expect(window.location.hash).toBe(before);
  });
});

describe("stammdatenHashWithCustomerId / readStammdatenCustomerIdFromHash", () => {
  it("baut Deep-Link mit customerId", () => {
    const id = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    expect(stammdatenHashWithCustomerId(id)).toBe(`${STAMMDATEN_HASH}?customerId=${encodeURIComponent(id)}`);
  });

  it("liest customerId aus aktuellem Hash", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/stammdaten?customerId=bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
    expect(readStammdatenCustomerIdFromHash()).toBe("bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb");
  });

  it("applyStammdatenCustomerIdToLocationHash setzt Hash und löst hashchange aus", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/stammdaten";
    const listener = vi.fn();
    window.addEventListener("hashchange", listener);
    const id = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    applyStammdatenCustomerIdToLocationHash(id);
    expect(window.location.hash).toBe(`#/stammdaten?customerId=${id}`);
    expect(listener).toHaveBeenCalled();
    window.removeEventListener("hashchange", listener);
  });

  it("applyStammdatenCustomerIdToLocationHash(null) entfernt customerId-Query", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/stammdaten?customerId=cccccccc-cccc-4ccc-cccc-cccccccccccc";
    applyStammdatenCustomerIdToLocationHash(null);
    expect(window.location.hash).toBe("#/stammdaten");
  });
});
