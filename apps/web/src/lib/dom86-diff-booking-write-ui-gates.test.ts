import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("dom86-diff-booking-write-ui-gates", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("isDom86Slice3MitigationGutschriftHintUiEnabled is false without VITE flag", async () => {
    vi.stubEnv("VITE_DOM86_SLICE3_MITIGATION_GUTSCHRIFT_HINT", "");
    const { isDom86Slice3MitigationGutschriftHintUiEnabled } = await import("./dom86-diff-booking-write-ui-gates.js");
    expect(isDom86Slice3MitigationGutschriftHintUiEnabled()).toBe(false);
  });

  it("isDom86Slice3MitigationGutschriftHintUiEnabled is true when set to 1", async () => {
    vi.stubEnv("VITE_DOM86_SLICE3_MITIGATION_GUTSCHRIFT_HINT", "1");
    const { isDom86Slice3MitigationGutschriftHintUiEnabled } = await import("./dom86-diff-booking-write-ui-gates.js");
    expect(isDom86Slice3MitigationGutschriftHintUiEnabled()).toBe(true);
  });
});
