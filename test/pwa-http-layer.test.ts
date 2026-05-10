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

  it("entfernt Query unter …/difference-bookings inkl. allocate/deallocate", () => {
    expect(sanitizeFinanceRequestUrlForLogs("/invoices/x/difference-bookings?cursor=1")).toBe(
      "/invoices/x/difference-bookings",
    );
    expect(sanitizeFinanceRequestUrlForLogs("/invoices/x/difference-bookings/allocate?foo=1")).toBe(
      "/invoices/x/difference-bookings/allocate",
    );
  });

  it("entfernt Query unter /invoices/*/payment-intakes und …/dunning-reminders (§8.14)", () => {
    expect(
      sanitizeFinanceRequestUrlForLogs("/invoices/x/payment-intakes?cursor=1"),
    ).toBe("/invoices/x/payment-intakes");
    expect(
      sanitizeFinanceRequestUrlForLogs("/invoices/x/dunning-reminders?foo=bar"),
    ).toBe("/invoices/x/dunning-reminders");
  });
});
