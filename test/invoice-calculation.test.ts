import { describe, expect, it } from "vitest";
import {
  computeGrossFromLvNetEurMvp,
  computeInvoiceTotalsForTaxRegime,
  netCentsAfterStep84_6Mvp,
  skontoNetReductionCents84_2,
  sumLvNetCentsStep84_1,
} from "../src/domain/invoice-calculation.js";
import type { LvPosition } from "../src/domain/types.js";

describe("invoice-calculation 8.4", () => {
  it("sums NORMAL LV lines (8.4 Schritt 1)", () => {
    const positions: LvPosition[] = [
      {
        id: "a",
        tenantId: "t",
        lvVersionId: "lv",
        parentNodeId: "p",
        sortOrdinal: "1",
        quantity: 100,
        unit: "m2",
        unitPriceCents: 1250,
        kind: "NORMAL",
        systemText: "",
        editingText: "",
      },
      {
        id: "b",
        tenantId: "t",
        lvVersionId: "lv",
        parentNodeId: "p",
        sortOrdinal: "2",
        quantity: 1,
        unit: "st",
        unitPriceCents: 5000,
        kind: "ALTERNATIV",
        systemText: "",
        editingText: "",
      },
    ];
    expect(sumLvNetCentsStep84_1(positions)).toBe(125000);
  });

  it("applies 19 % USt and gross (8.4 Schritte 7–8, MVP)", () => {
    const r = computeGrossFromLvNetEurMvp(125000);
    expect(r.vatCents).toBe(23750);
    expect(r.totalGrossCents).toBe(148750);
  });

  it("netCentsAfterStep84_6Mvp lässt Netto nach Schritt 1 unverändert (B2-0: Schritte 2–6 noch kein Produktcode)", () => {
    expect(netCentsAfterStep84_6Mvp(125000)).toBe(125000);
    const chained = computeGrossFromLvNetEurMvp(netCentsAfterStep84_6Mvp(125000));
    expect(chained.totalGrossCents).toBe(148750);
  });

  it("B2-1a: Skonto 200 Bps (2 %) auf 125000 Cent Netto nach Schritt 1", () => {
    expect(skontoNetReductionCents84_2(125000, 200)).toBe(2500);
    expect(netCentsAfterStep84_6Mvp(125000, { skontoBps: 200 })).toBe(122500);
    const gross = computeGrossFromLvNetEurMvp(netCentsAfterStep84_6Mvp(125000, { skontoBps: 200 }));
    expect(gross.vatCents).toBe(23275);
    expect(gross.totalGrossCents).toBe(145775);
  });

  it("FIN-5: STANDARD_VAT_19 entspricht MVP-19 %-Pfad", () => {
    const r = computeInvoiceTotalsForTaxRegime(125000, "STANDARD_VAT_19");
    expect(r.vatRateBpsEffective).toBe(1900);
    expect(r.vatCents).toBe(23750);
    expect(r.totalGrossCents).toBe(148750);
    expect(r.invoiceTaxRegime).toBe("STANDARD_VAT_19");
  });

  it("FIN-5: Kleinunternehmer — keine USt-Zeile, Brutto = Netto", () => {
    const r = computeInvoiceTotalsForTaxRegime(125000, "SMALL_BUSINESS_19");
    expect(r.vatRateBpsEffective).toBe(0);
    expect(r.vatCents).toBe(0);
    expect(r.totalGrossCents).toBe(125000);
  });

  it("FIN-5: Reverse Charge / §13b Bau — ausgewiesen 0 %, Brutto = Netto", () => {
    for (const regime of ["REVERSE_CHARGE", "CONSTRUCTION_13B"] as const) {
      const r = computeInvoiceTotalsForTaxRegime(99_00, regime);
      expect(r.vatCents).toBe(0);
      expect(r.totalGrossCents).toBe(99_00);
      expect(r.invoiceTaxRegime).toBe(regime);
    }
  });
});
