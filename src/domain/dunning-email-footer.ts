import { DomainError } from "../errors/domain-error.js";

export type DunningEmailFooterSource = "NOT_CONFIGURED" | "TENANT_DATABASE";

export type DunningEmailFooterFields = {
  companyLegalName: string;
  streetLine: string;
  postalCode: string;
  city: string;
  countryCode: string;
  publicEmail: string;
  publicPhone: string;
  legalRepresentative: string;
  registerCourt: string;
  registerNumber: string;
  vatId: string;
  signatureLine: string;
};

/** Heuristisches Signal — kein Ersatz für rechtsform-spezifische Impressum-Prüfung (siehe ADR-0009). */
export type ImpressumComplianceTier = "MINIMAL" | "EXTENDED";

/** Stabile Codes in `impressumGaps` (keine Lokalisierung). */
export const IMPRESSUM_GAP_REGISTER_PAIR_INCOMPLETE = "REGISTER_PAIR_INCOMPLETE";
export const IMPRESSUM_GAP_LEGAL_REPRESENTATIVE_MISSING = "LEGAL_REPRESENTATIVE_MISSING";
export const IMPRESSUM_GAP_VAT_ID_MISSING = "VAT_ID_MISSING";
export const IMPRESSUM_GAP_VAT_ID_FORMAT_INVALID = "VAT_ID_FORMAT_INVALID";

export type DunningEmailFooterReadData = {
  footerSource: DunningEmailFooterSource;
  tenantId: string;
} & DunningEmailFooterFields & {
  readyForEmailFooter: boolean;
  missingMandatoryFields: string[];
  impressumComplianceTier: ImpressumComplianceTier;
  impressumGaps: string[];
};

const MANDATORY_KEYS: (keyof DunningEmailFooterFields)[] = [
  "companyLegalName",
  "streetLine",
  "postalCode",
  "city",
  "publicEmail",
  "publicPhone",
];

export function emptyDunningEmailFooterFields(): DunningEmailFooterFields {
  return {
    companyLegalName: "",
    streetLine: "",
    postalCode: "",
    city: "",
    countryCode: "DE",
    publicEmail: "",
    publicPhone: "",
    legalRepresentative: "",
    registerCourt: "",
    registerNumber: "",
    vatId: "",
    signatureLine: "",
  };
}

function assertPlainTextNoAngleBrackets(value: string, fieldLabel: string): void {
  if (value.includes("<") || value.includes(">")) {
    throw new DomainError(
      "DUNNING_EMAIL_FOOTER_VALIDATION",
      `${fieldLabel}: keine HTML-Klammern erlaubt`,
      400,
    );
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDunningEmailFooterFields(fields: DunningEmailFooterFields): void {
  const check = (label: string, v: string, max: number) => {
    if (v.length > max) {
      throw new DomainError("DUNNING_EMAIL_FOOTER_VALIDATION", `${label}: max. ${max} Zeichen`, 400);
    }
    assertPlainTextNoAngleBrackets(v, label);
  };

  check("Firmenname (rechtlich)", fields.companyLegalName, 300);
  check("Straße", fields.streetLine, 300);
  check("PLZ", fields.postalCode, 20);
  check("Ort", fields.city, 120);
  const cc = fields.countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) {
    throw new DomainError("DUNNING_EMAIL_FOOTER_VALIDATION", "countryCode: genau 2 Großbuchstaben (ISO-3166 Alpha-2)", 400);
  }
  check("E-Mail (Impressum)", fields.publicEmail, 320);
  if (fields.publicEmail.trim().length > 0 && !EMAIL_RE.test(fields.publicEmail.trim())) {
    throw new DomainError("DUNNING_EMAIL_FOOTER_VALIDATION", "publicEmail: ungültiges E-Mail-Format", 400);
  }
  check("Telefon (Impressum)", fields.publicPhone, 80);
  check("Vertretungsberechtigte/r", fields.legalRepresentative, 300);
  check("Registergericht", fields.registerCourt, 200);
  check("Registernummer", fields.registerNumber, 120);
  check("USt-IdNr.", fields.vatId, 32);
  check("Signaturzeile", fields.signatureLine, 200);
}

export function mergeDunningEmailFooterFields(
  base: DunningEmailFooterFields,
  patch: Partial<DunningEmailFooterFields>,
): DunningEmailFooterFields {
  const out = { ...base };
  (Object.keys(patch) as (keyof DunningEmailFooterFields)[]).forEach((k) => {
    const v = patch[k];
    if (v !== undefined) {
      out[k] = k === "countryCode" ? v.trim().toUpperCase() : v;
    }
  });
  out.countryCode = out.countryCode.trim().toUpperCase() || "DE";
  return out;
}

export function computeDunningEmailFooterReadiness(fields: DunningEmailFooterFields): {
  readyForEmailFooter: boolean;
  missingMandatoryFields: string[];
} {
  const missing: string[] = [];
  for (const key of MANDATORY_KEYS) {
    if (fields[key].trim().length === 0) {
      missing.push(key);
    }
  }
  return {
    readyForEmailFooter: missing.length === 0,
    missingMandatoryFields: missing,
  };
}

const DE_UST_ID_RE = /^DE\d{9}$/iu;

/**
 * Zusätzliche Transparenz zu `readyForEmailFooter`: konservative Heuristiken (z. B. DE-USt-Id grob),
 * keine harten Validierungsfehler und kein Rechtsrat.
 */
export function computeImpressumComplianceSignals(fields: DunningEmailFooterFields): {
  impressumComplianceTier: ImpressumComplianceTier;
  impressumGaps: string[];
} {
  const gaps: string[] = [];
  const court = fields.registerCourt.trim();
  const num = fields.registerNumber.trim();
  const hasCourt = court.length > 0;
  const hasNum = num.length > 0;
  if (hasCourt !== hasNum) {
    gaps.push(IMPRESSUM_GAP_REGISTER_PAIR_INCOMPLETE);
  }
  if (fields.legalRepresentative.trim().length === 0) {
    gaps.push(IMPRESSUM_GAP_LEGAL_REPRESENTATIVE_MISSING);
  }
  if (fields.countryCode.trim().toUpperCase() === "DE") {
    const vNorm = fields.vatId.trim().replace(/\s+/g, "");
    if (vNorm.length === 0) {
      gaps.push(IMPRESSUM_GAP_VAT_ID_MISSING);
    } else if (!DE_UST_ID_RE.test(vNorm)) {
      gaps.push(IMPRESSUM_GAP_VAT_ID_FORMAT_INVALID);
    }
  }
  gaps.sort();
  const { readyForEmailFooter } = computeDunningEmailFooterReadiness(fields);
  const impressumComplianceTier: ImpressumComplianceTier =
    readyForEmailFooter && gaps.length === 0 ? "EXTENDED" : "MINIMAL";
  return { impressumComplianceTier, impressumGaps: gaps };
}

export function toReadModel(
  tenantId: string,
  footerSource: DunningEmailFooterSource,
  fields: DunningEmailFooterFields,
): DunningEmailFooterReadData {
  const { readyForEmailFooter, missingMandatoryFields } = computeDunningEmailFooterReadiness(fields);
  const { impressumComplianceTier, impressumGaps } = computeImpressumComplianceSignals(fields);
  return {
    footerSource,
    tenantId,
    ...fields,
    readyForEmailFooter,
    missingMandatoryFields,
    impressumComplianceTier,
    impressumGaps,
  };
}
