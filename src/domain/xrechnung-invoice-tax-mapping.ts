import { INVOICE_TAX_REGIMES, type InvoiceTaxRegime } from "./invoice-tax-regime.js";
import { getMandatoryTaxNoticeLines } from "./invoice-tax-mandatory-notices.js";

/** UNCL 5305 Applicable Tax Category (EN 16931 / UBL). */
export type XrechnungUncl5305Category = "S" | "E" | "AE";

export interface XrechnungInvoiceTaxSemantics {
  uncl5305: XrechnungUncl5305Category;
  /** UBL `cbc:Percent` — two decimals where emitted. */
  vatPercentForUbl: number;
  /** §8.10 / FIN-5 Pflicht-Hinweise (gleiche Quelle wie API). */
  mandatoryNoticeLines: string[];
}

export function isFin5InvoiceTaxRegimeMappedForXrechnung(regime: string | undefined): boolean {
  const raw = regime ?? "STANDARD_VAT_19";
  return (INVOICE_TAX_REGIMES as readonly string[]).includes(raw);
}

export function parseFin5InvoiceTaxRegimeOrUndefined(regime: string | undefined): InvoiceTaxRegime | undefined {
  const raw = regime ?? "STANDARD_VAT_19";
  return (INVOICE_TAX_REGIMES as readonly string[]).includes(raw) ? (raw as InvoiceTaxRegime) : undefined;
}

export function getXrechnungInvoiceTaxSemantics(regime: InvoiceTaxRegime, vatRateBpsEffective: number | undefined): XrechnungInvoiceTaxSemantics {
  const notices = getMandatoryTaxNoticeLines(regime);
  switch (regime) {
    case "STANDARD_VAT_19": {
      const bps = vatRateBpsEffective ?? 1900;
      return { uncl5305: "S", vatPercentForUbl: bps / 100, mandatoryNoticeLines: notices };
    }
    case "SMALL_BUSINESS_19":
      return { uncl5305: "E", vatPercentForUbl: 0, mandatoryNoticeLines: notices };
    case "REVERSE_CHARGE":
    case "CONSTRUCTION_13B":
      return { uncl5305: "AE", vatPercentForUbl: 0, mandatoryNoticeLines: notices };
    default: {
      const _exhaustive: never = regime;
      return _exhaustive;
    }
  }
}
