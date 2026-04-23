import { describe, expect, it } from "vitest";
import {
  findEmailTemplateBodyForStage,
  formatEmailFooterBlockPlainText,
  substituteDunningEmailPlaceholders,
} from "../src/domain/dunning-email-compose.js";
import { buildMvpStaticDunningReminderTemplates } from "../src/domain/dunning-reminder-template-defaults.js";
import { emptyDunningEmailFooterFields } from "../src/domain/dunning-email-footer.js";

describe("dunning-email-compose", () => {
  it("substituteDunningEmailPlaceholders replaces §8.10 tokens", () => {
    const raw = "Gebühr {{MahngebuehrEUR}} Skonto {{SkontoBetragEUR}} bis {{SkontofristDatum}}";
    const out = substituteDunningEmailPlaceholders(raw, {
      mahngebuehrEur: "5,00 EUR",
      skontoBetragEur: "1,00 EUR",
      skontofristDatum: "2026-05-01",
    });
    expect(out).toContain("5,00 EUR");
    expect(out).toContain("1,00 EUR");
    expect(out).toContain("2026-05-01");
    expect(out).not.toContain("{{");
  });

  it("findEmailTemplateBodyForStage returns EMAIL body", () => {
    const tpl = buildMvpStaticDunningReminderTemplates("00000000-0000-4000-8000-000000000001");
    const body = findEmailTemplateBodyForStage(tpl.stages, 1);
    expect(body).toBeTruthy();
    expect(body!).toContain("E-Mail");
  });

  it("formatEmailFooterBlockPlainText builds multiline block", () => {
    const f = emptyDunningEmailFooterFields();
    f.companyLegalName = "ACME";
    f.streetLine = "Str 1";
    f.postalCode = "1";
    f.city = "Ort";
    f.countryCode = "DE";
    f.publicEmail = "a@b.co";
    f.publicPhone = "123";
    expect(formatEmailFooterBlockPlainText(f)).toContain("ACME");
    expect(formatEmailFooterBlockPlainText(f)).toContain("Str 1");
  });
});
