import { describe, expect, it } from "vitest";
import {
  FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH,
  financePrepHashWithTab,
  normalizeFinancePrepHashToCanon,
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
