import { describe, expect, it } from "vitest";
import { sanitizeFinanceRequestUrlForLogs } from "../src/http/pwa-http-layer.js";

describe("sanitizeFinanceRequestUrlForLogs (FIN-6 §8.14)", () => {
  it("behält normale URLs unverändert", () => {
    expect(sanitizeFinanceRequestUrlForLogs("/invoices")).toBe("/invoices");
    expect(sanitizeFinanceRequestUrlForLogs("/health?verbose=1")).toBe("/health?verbose=1");
  });

  it("entfernt Query nur unter /finance/payments*", () => {
    expect(sanitizeFinanceRequestUrlForLogs("/finance/payments/intake?ref=abc")).toBe("/finance/payments/intake");
    expect(sanitizeFinanceRequestUrlForLogs("/finance/payments/foo/bar")).toBe("/finance/payments/foo/bar");
  });
});
