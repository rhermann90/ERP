import type { InvoiceTaxRegime } from "./invoice-tax-regime.js";

/**
 * §8.10 / FIN-5: feste Hinweiszeilen für Rechnungsdarstellung bei aktivem 8.16-Regime.
 * Keine Rechtsberatung — Mandant/StB verantwortlich für konkrete Ausformulierung im Betrieb.
 */
export function getMandatoryTaxNoticeLines(regime: InvoiceTaxRegime): string[] {
  switch (regime) {
    case "STANDARD_VAT_19":
      return [];
    case "SMALL_BUSINESS_19":
      return ["Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung)."];
    case "REVERSE_CHARGE":
      return [
        "Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge, z. B. § 13b UStG).",
        "Umsatzsteuer nicht ausgewiesen — Abrechnung durch den Leistungsempfänger.",
      ];
    case "CONSTRUCTION_13B":
      return [
        "Bauleistung im Sinne von § 13b UStG — Steuerschuldnerschaft des Leistungsempfängers.",
        "Umsatzsteuer nicht ausgewiesen — Abrechnung durch den Leistungsempfänger.",
      ];
    default: {
      const _x: never = regime;
      return _x;
    }
  }
}
