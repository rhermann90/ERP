import { describe, expect, it } from "vitest";
import {
  computeDunningEmailFooterReadiness,
  computeImpressumComplianceSignals,
  emptyDunningEmailFooterFields,
  IMPRESSUM_GAP_LEGAL_REPRESENTATIVE_MISSING,
  IMPRESSUM_GAP_REGISTER_PAIR_INCOMPLETE,
  IMPRESSUM_GAP_VAT_ID_FORMAT_INVALID,
  IMPRESSUM_GAP_VAT_ID_MISSING,
  mergeDunningEmailFooterFields,
  toReadModel,
  validateDunningEmailFooterFields,
} from "../src/domain/dunning-email-footer.js";
import { DomainError } from "../src/errors/domain-error.js";

describe("dunning-email-footer domain", () => {
  it("computeDunningEmailFooterReadiness lists missing mandatory keys", () => {
    const f = emptyDunningEmailFooterFields();
    f.companyLegalName = "ACME";
    const { readyForEmailFooter, missingMandatoryFields } = computeDunningEmailFooterReadiness(f);
    expect(readyForEmailFooter).toBe(false);
    expect(missingMandatoryFields).toContain("streetLine");
    expect(missingMandatoryFields).not.toContain("companyLegalName");
  });

  it("validateDunningEmailFooterFields rejects angle brackets", () => {
    const f = emptyDunningEmailFooterFields();
    f.companyLegalName = "Bad <b>html</b>";
    expect(() => validateDunningEmailFooterFields(f)).toThrow(DomainError);
  });

  it("mergeDunningEmailFooterFields normalizes countryCode", () => {
    const base = emptyDunningEmailFooterFields();
    const merged = mergeDunningEmailFooterFields(base, { countryCode: "at" });
    expect(merged.countryCode).toBe("AT");
  });

  it("computeImpressumComplianceSignals: partial register pair is a gap", () => {
    const f = emptyDunningEmailFooterFields();
    f.companyLegalName = "X";
    f.streetLine = "S";
    f.postalCode = "1";
    f.city = "C";
    f.publicEmail = "a@b.co";
    f.publicPhone = "1";
    f.registerCourt = "Amtsgericht";
    f.registerNumber = "";
    f.legalRepresentative = "CEO";
    f.vatId = "DE123456789";
    const { impressumGaps, impressumComplianceTier } = computeImpressumComplianceSignals(f);
    expect(impressumGaps).toContain(IMPRESSUM_GAP_REGISTER_PAIR_INCOMPLETE);
    expect(impressumComplianceTier).toBe("MINIMAL");
  });

  it("computeImpressumComplianceSignals: EXTENDED when mandatory + extended heuristics satisfied (DE)", () => {
    const f = emptyDunningEmailFooterFields();
    f.companyLegalName = "X";
    f.streetLine = "S";
    f.postalCode = "1";
    f.city = "C";
    f.countryCode = "DE";
    f.publicEmail = "a@b.co";
    f.publicPhone = "1";
    f.legalRepresentative = "Max Mustermann";
    f.registerCourt = "";
    f.registerNumber = "";
    f.vatId = "DE123456789";
    const { impressumGaps, impressumComplianceTier } = computeImpressumComplianceSignals(f);
    expect(impressumGaps).toEqual([]);
    expect(impressumComplianceTier).toBe("EXTENDED");
  });

  it("computeImpressumComplianceSignals: DE missing VAT and legal rep", () => {
    const f = emptyDunningEmailFooterFields();
    f.companyLegalName = "X";
    f.streetLine = "S";
    f.postalCode = "1";
    f.city = "C";
    f.publicEmail = "a@b.co";
    f.publicPhone = "1";
    const { impressumGaps } = computeImpressumComplianceSignals(f);
    expect(impressumGaps).toEqual([
      IMPRESSUM_GAP_LEGAL_REPRESENTATIVE_MISSING,
      IMPRESSUM_GAP_VAT_ID_MISSING,
    ]);
  });

  it("computeImpressumComplianceSignals: invalid DE VAT format when non-empty", () => {
    const f = emptyDunningEmailFooterFields();
    f.companyLegalName = "X";
    f.streetLine = "S";
    f.postalCode = "1";
    f.city = "C";
    f.publicEmail = "a@b.co";
    f.publicPhone = "1";
    f.legalRepresentative = "CEO";
    f.vatId = "DE12";
    const { impressumGaps } = computeImpressumComplianceSignals(f);
    expect(impressumGaps).toContain(IMPRESSUM_GAP_VAT_ID_FORMAT_INVALID);
    expect(impressumGaps).not.toContain(IMPRESSUM_GAP_VAT_ID_MISSING);
  });

  it("toReadModel includes impressum fields", () => {
    const f = emptyDunningEmailFooterFields();
    const rm = toReadModel("00000000-0000-4000-8000-000000000001", "NOT_CONFIGURED", f);
    expect(rm.impressumComplianceTier).toBe("MINIMAL");
    expect(Array.isArray(rm.impressumGaps)).toBe(true);
  });
});
