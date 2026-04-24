import { describe, expect, it } from "vitest";
import {
  aggregateTemplateRowsToStages,
  assertMandatoryDunningTemplatePlaceholders,
  buildMvpStaticDunningReminderTemplates,
  isCompleteTenantStageTemplates,
  mvpTemplateTypeForStageOrdinal,
} from "../src/domain/dunning-reminder-template-defaults.js";
import { DomainError } from "../src/errors/domain-error.js";

describe("dunning-reminder-template-defaults", () => {
  it("mvpTemplateTypeForStageOrdinal maps ordinals to REMINDER / DEMAND_NOTE / DUNNING", () => {
    expect(mvpTemplateTypeForStageOrdinal(1)).toBe("REMINDER");
    expect(mvpTemplateTypeForStageOrdinal(3)).toBe("REMINDER");
    expect(mvpTemplateTypeForStageOrdinal(4)).toBe("DEMAND_NOTE");
    expect(mvpTemplateTypeForStageOrdinal(6)).toBe("DEMAND_NOTE");
    expect(mvpTemplateTypeForStageOrdinal(9)).toBe("DUNNING");
  });

  it("assertMandatoryDunningTemplatePlaceholders rejects missing fee placeholder for DUNNING", () => {
    expect(() => assertMandatoryDunningTemplatePlaceholders("ohne platzhalter", "DUNNING")).toThrow(DomainError);
  });

  it("assertMandatoryDunningTemplatePlaceholders accepts DUNNING with Mahngebuehr only", () => {
    expect(() =>
      assertMandatoryDunningTemplatePlaceholders("Text {{MahngebuehrEUR}} Ende", "DUNNING"),
    ).not.toThrow();
  });

  it("assertMandatoryDunningTemplatePlaceholders requires skonto placeholders for REMINDER", () => {
    expect(() => assertMandatoryDunningTemplatePlaceholders("nur {{MahngebuehrEUR}}", "REMINDER")).toThrow(DomainError);
    expect(() =>
      assertMandatoryDunningTemplatePlaceholders(
        "{{MahngebuehrEUR}} {{SkontoBetragEUR}} {{SkontofristDatum}}",
        "REMINDER",
      ),
    ).not.toThrow();
  });

  it("buildMvpStaticDunningReminderTemplates returns 9 stages with EMAIL and PRINT each", () => {
    const tid = "11111111-1111-4111-8111-111111111111";
    const data = buildMvpStaticDunningReminderTemplates(tid);
    expect(data.templateSource).toBe("MVP_STATIC_DEFAULTS");
    expect(data.tenantId).toBe(tid);
    expect(data.stages).toHaveLength(9);
    for (const s of data.stages) {
      expect(s.channels).toHaveLength(2);
      expect(s.channels.map((c) => c.channel).sort()).toEqual(["EMAIL", "PRINT"]);
      expect(s.channels[0].body).toContain("{{MahngebuehrEUR}}");
    }
  });

  it("isCompleteTenantStageTemplates requires 18 distinct stage+channel rows", () => {
    expect(isCompleteTenantStageTemplates([])).toBe(false);
    const partial = [{ stageOrdinal: 1, channel: "EMAIL" as const, templateType: "REMINDER" as const, body: "x" }];
    expect(isCompleteTenantStageTemplates(partial)).toBe(false);
  });

  it("aggregateTemplateRowsToStages groups by ordinal", () => {
    const rows = [
      { stageOrdinal: 2, channel: "PRINT" as const, templateType: "REMINDER" as const, body: "p" },
      { stageOrdinal: 2, channel: "EMAIL" as const, templateType: "REMINDER" as const, body: "e" },
    ];
    const stages = aggregateTemplateRowsToStages(rows);
    expect(stages).toHaveLength(1);
    expect(stages[0].stageOrdinal).toBe(2);
    expect(stages[0].channels.map((c) => c.channel)).toEqual(["EMAIL", "PRINT"]);
  });
});
