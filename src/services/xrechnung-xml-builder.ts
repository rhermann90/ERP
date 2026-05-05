import type { EInvoicePartySnapshot, Invoice, XrechnungInvoiceXmlContext } from "../domain/types.js";
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

function renderPartyTaxScheme(vatId: string | undefined): string {
  if (!vatId) return "";
  return `<cac:PartyTaxScheme>
      <cbc:CompanyID schemeID="VA">${escapeXmlText(vatId)}</cbc:CompanyID>
      <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
    </cac:PartyTaxScheme>`;
}

function renderPartyLegalEntity(p: EInvoicePartySnapshot): string {
  if (!p.companyId) return "";
  const scheme = p.companyIdSchemeId ? ` schemeID="${escapeXmlText(p.companyIdSchemeId)}"` : "";
  return `<cac:PartyLegalEntity>
      <cbc:RegistrationName>${escapeXmlText(p.legalName)}</cbc:RegistrationName>
      <cbc:CompanyID${scheme}>${escapeXmlText(p.companyId)}</cbc:CompanyID>
    </cac:PartyLegalEntity>`;
}

function renderContact(email: string | undefined): string {
  if (!email) return "";
  return `<cac:Contact>
      <cbc:ElectronicMail>${escapeXmlText(email)}</cbc:ElectronicMail>
    </cac:Contact>`;
}

function renderAccountingSupplierParty(p: EInvoicePartySnapshot): string {
  const tax = renderPartyTaxScheme(p.vatId);
  const legal = renderPartyLegalEntity(p);
  const contact = renderContact(p.email);
  const legalOrName =
    legal ||
    `<cac:PartyLegalEntity>
      <cbc:RegistrationName>${escapeXmlText(p.legalName)}</cbc:RegistrationName>
    </cac:PartyLegalEntity>`;
  return `<cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${escapeXmlText(p.legalName)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXmlText(p.streetName)}</cbc:StreetName>
        <cbc:CityName>${escapeXmlText(p.cityName)}</cbc:CityName>
        <cbc:PostalZone>${escapeXmlText(p.postalZone)}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>${escapeXmlText(p.countryCode)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      ${tax}
      ${legalOrName}
      ${contact}
    </cac:Party>
  </cac:AccountingSupplierParty>`;
}

function renderAccountingCustomerParty(p: EInvoicePartySnapshot, buyerEndpointId: string): string {
  const tax = renderPartyTaxScheme(p.vatId);
  const legal = renderPartyLegalEntity(p);
  const contact = renderContact(p.email);
  const legalOrName =
    legal ||
    `<cac:PartyLegalEntity>
      <cbc:RegistrationName>${escapeXmlText(p.legalName)}</cbc:RegistrationName>
    </cac:PartyLegalEntity>`;
  return `<cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID>${escapeXmlText(buyerEndpointId)}</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${escapeXmlText(p.legalName)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXmlText(p.streetName)}</cbc:StreetName>
        <cbc:CityName>${escapeXmlText(p.cityName)}</cbc:CityName>
        <cbc:PostalZone>${escapeXmlText(p.postalZone)}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>${escapeXmlText(p.countryCode)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      ${tax}
      ${legalOrName}
      ${contact}
    </cac:Party>
  </cac:AccountingCustomerParty>`;
}

/** FIN-1 `terms_label` als freien Zahlungsbedingungstext (ohne dediziertes Bankkonto im Datenmodell). */
function renderPaymentTermsNote(note: string | undefined): string {
  if (!note) return "";
  return `<cac:PaymentTerms>
    <cbc:Note>${escapeXmlText(note)}</cbc:Note>
  </cac:PaymentTerms>`;
}

/**
 * UBL 2.1 Invoice-XML für XRechnung-Pfad (FIN-5 Paket C).
 * Stammdaten aus `context`; keine vollständige Validator-Ersatzfunktion.
 */
export function buildXrechnungInvoiceXml(invoice: Invoice, context: XrechnungInvoiceXmlContext): string {
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

  const supplierXml = renderAccountingSupplierParty(context.seller);
  const customerXml = renderAccountingCustomerParty(context.buyer, invoice.customerId);
  const paymentBlock = renderPaymentTermsNote(context.paymentTermsNote);

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
  ${supplierXml}
  ${customerXml}
  ${paymentBlock}
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
