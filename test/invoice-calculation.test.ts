import { describe, expect, it } from "vitest";
import {
  computeGrossFromLvNetEurMvp,
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
});
