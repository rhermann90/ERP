import { describe, expect, it } from "vitest";
import { redactExternalReferenceForLog } from "../src/domain/privacy-log-redaction.js";

describe("privacy-log-redaction (FIN-6 / 8.14)", () => {
  it("lässt kurze Verwendungszwecke unverändert", () => {
    expect(redactExternalReferenceForLog("RE 123")).toBe("RE 123");
  });

  it("kürzt lange externalReference für Logs", () => {
    const long = "X".repeat(80);
    const r = redactExternalReferenceForLog(long);
    expect(r).toContain("…(80 Zeichen)…");
    expect(r.length).toBeLessThan(long.length);
  });
});
