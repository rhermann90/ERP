import type { Invoice } from "../domain/types.js";
import {
  getXrechnungInvoiceTaxSemantics,
  parseFin5InvoiceTaxRegimeOrUndefined,
} from "../domain/xrechnung-invoice-tax-mapping.js";

const NS_INVOICE = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
const NS_CAC = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2";
const NS_CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";

/** XRechnung 3.0 / EN 16931 CIUS customization identifier (KoSIT). */
const UBL_CUSTOMIZATION_ID = "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0";
const UBL_PROFILE_ID = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";

function escapeXmlText(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function eurFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Minimal UBL 2.1 Invoice-XML fuer XRechnung-Pfad (FIN-5 Paket C).
 * Kein vollstaendiger Validator-Ersatz; Snapshot- und Substring-Tests im Repo.
 */
export function buildXrechnungInvoiceXml(invoice: Invoice): string {
  const regime = parseFin5InvoiceTaxRegimeOrUndefined(invoice.invoiceTaxRegime);
  if (!regime) {
    throw new Error("buildXrechnungInvoiceXml: regime not mapped");
  }
  const tax = getXrechnungInvoiceTaxSemantics(regime, invoice.vatRateBpsEffective);
  const net = invoice.lvNetCents ?? 0;
  const vat = invoice.vatCents ?? 0;
  const gross = invoice.totalGrossCents ?? 0;
  const issueDate = invoice.issueDate ?? "1970-01-01";
  const invNo = invoice.invoiceNumber ?? invoice.id;

  const notes = tax.mandatoryNoticeLines.map((line) => `<cbc:Note>${escapeXmlText(line)}</cbc:Note>`).join("");

  const exemptionBlock =
    tax.uncl5305 === "S"
      ? ""
      : `<cbc:TaxExemptionReason>${escapeXmlText(tax.mandatoryNoticeLines.join(" "))}</cbc:TaxExemptionReason>`;

  const percent = `<cbc:Percent>${tax.vatPercentForUbl.toFixed(2)}</cbc:Percent>`;

  const taxSubtotal = `<cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">${eurFromCents(net)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">${eurFromCents(vat)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeID="UNCL5305">${tax.uncl5305}</cbc:ID>
        ${percent}
        ${exemptionBlock}
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`;

  const lineExemption =
    tax.uncl5305 === "S"
      ? ""
      : `<cbc:TaxExemptionReason>${escapeXmlText(tax.mandatoryNoticeLines.join(" "))}</cbc:TaxExemptionReason>`;
  const lineTaxCategory = `<cac:ClassifiedTaxCategory>
        <cbc:ID schemeID="UNCL5305">${tax.uncl5305}</cbc:ID>
        ${percent}
        ${lineExemption}
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="${NS_INVOICE}" xmlns:cac="${NS_CAC}" xmlns:cbc="${NS_CBC}">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>${UBL_CUSTOMIZATION_ID}</cbc:CustomizationID>
  <cbc:ProfileID>${UBL_PROFILE_ID}</cbc:ProfileID>
  <cbc:ID>${escapeXmlText(invNo)}</cbc:ID>
  <cbc:IssueDate>${escapeXmlText(issueDate)}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  ${notes}
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Seed-Unternehmen (Demo)</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Seed-Strasse 1</cbc:StreetName>
        <cbc:CityName>Berlin</cbc:CityName>
        <cbc:PostalZone>10115</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID>${escapeXmlText(invoice.customerId)}</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>Seed-Kunde (Demo)</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${eurFromCents(vat)}</cbc:TaxAmount>
    ${taxSubtotal}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${eurFromCents(net)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${eurFromCents(net)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${eurFromCents(gross)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${eurFromCents(gross)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${eurFromCents(net)}</cbc:LineExtensionAmount>
    <cac:Item><cbc:Name>Rechnungssumme (aggregiert)</cbc:Name></cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">${eurFromCents(net)}</cbc:PriceAmount>
    </cac:Price>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="EUR">${eurFromCents(vat)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="EUR">${eurFromCents(net)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="EUR">${eurFromCents(vat)}</cbc:TaxAmount>
        ${lineTaxCategory}
      </cac:TaxSubtotal>
    </cac:TaxTotal>
  </cac:InvoiceLine>
</Invoice>`;
}
