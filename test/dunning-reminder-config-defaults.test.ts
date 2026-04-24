import { describe, expect, it } from "vitest";
import {
  buildMvpStaticDunningReminderConfig,
  isCompleteTenantStageConfig,
} from "../src/domain/dunning-reminder-config-defaults.js";

describe("dunning-reminder-config-defaults", () => {
  it("buildMvpStatic liefert neun Stufen und MVP_STATIC_DEFAULTS", () => {
    const t = "11111111-1111-4111-8111-111111111111";
    const cfg = buildMvpStaticDunningReminderConfig(t);
    expect(cfg.configSource).toBe("MVP_STATIC_DEFAULTS");
    expect(cfg.tenantId).toBe(t);
    expect(cfg.stages).toHaveLength(9);
    expect(isCompleteTenantStageConfig(cfg.stages)).toBe(true);
  });

  it("isCompleteTenantStageConfig lehnt unvollständige oder doppelte Ordinals ab", () => {
    expect(isCompleteTenantStageConfig([])).toBe(false);
    const eight = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
      stageOrdinal: n,
      daysAfterDue: n,
      feeCents: 0,
      label: String(n),
    }));
    expect(isCompleteTenantStageConfig(eight)).toBe(false);
    const dup = [1, 1, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
      stageOrdinal: n,
      daysAfterDue: n,
      feeCents: 0,
      label: String(n),
    }));
    expect(isCompleteTenantStageConfig(dup)).toBe(false);
  });
});
