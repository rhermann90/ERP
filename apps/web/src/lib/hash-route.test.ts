import { describe, expect, it } from "vitest";
import { financePrepHashWithTab, normalizeFinancePrepHashToCanon } from "./hash-route.js";

describe("normalizeFinancePrepHashToCanon", () => {
  it("ersetzt Alias #/finanz-grundeinstellungen durch kanonischen Tab-Hash", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/finanz-grundeinstellungen";
    normalizeFinancePrepHashToCanon();
    expect(window.location.hash).toBe(financePrepHashWithTab("grundeinstellungen"));
  });

  it("lässt bereits kanonischen Grundeinstellungen-Hash unverändert", () => {
    window.history.replaceState(null, "", "/");
    const canon = financePrepHashWithTab("grundeinstellungen");
    window.location.hash = canon;
    normalizeFinancePrepHashToCanon();
    expect(window.location.hash).toBe(canon);
  });

  it("greift nicht bei anderen Finanz-Vorbereitung-Pfaden ein", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/finanz-vorbereitung?tab=rechnung";
    const before = window.location.hash;
    normalizeFinancePrepHashToCanon();
    expect(window.location.hash).toBe(before);
  });
});
