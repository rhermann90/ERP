import { describe, expect, it } from "vitest";
import { redactedExternalReferenceFromPaymentIntakeBody } from "../src/api/finance-payment-intake-log-helpers.js";

describe("redactedExternalReferenceFromPaymentIntakeBody (FIN-6 intake logs)", () => {
  it("returns undefined for non-objects or missing string field", () => {
    expect(redactedExternalReferenceFromPaymentIntakeBody(undefined)).toBeUndefined();
    expect(redactedExternalReferenceFromPaymentIntakeBody(null)).toBeUndefined();
    expect(redactedExternalReferenceFromPaymentIntakeBody("x")).toBeUndefined();
    expect(redactedExternalReferenceFromPaymentIntakeBody({})).toBeUndefined();
    expect(redactedExternalReferenceFromPaymentIntakeBody({ externalReference: 1 })).toBeUndefined();
  });

  it("passes through short references unchanged", () => {
    expect(redactedExternalReferenceFromPaymentIntakeBody({ externalReference: "ABC" })).toBe("ABC");
  });

  it("redacts long externalReference (never emits full raw string)", () => {
    const raw = "X".repeat(80);
    const out = redactedExternalReferenceFromPaymentIntakeBody({ externalReference: raw });
    expect(out).toBeDefined();
    expect(out).not.toContain(raw);
    expect(out).toMatch(/\(80 Zeichen\)/);
  });
});
