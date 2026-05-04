/** FIN-5 / §8.16: abgeschlossenes Steuerregime-Set (OpenAPI-synchron). */
export const INVOICE_TAX_REGIMES = [
  "STANDARD_VAT_19",
  "REVERSE_CHARGE",
  "SMALL_BUSINESS_19",
  "CONSTRUCTION_13B",
] as const;

export type InvoiceTaxRegime = (typeof INVOICE_TAX_REGIMES)[number];

export function parseInvoiceTaxRegime(raw: string): InvoiceTaxRegime | undefined {
  return (INVOICE_TAX_REGIMES as readonly string[]).includes(raw) ? (raw as InvoiceTaxRegime) : undefined;
}
