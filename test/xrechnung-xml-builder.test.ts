import { describe, expect, it } from "vitest";
import type { InvoiceTaxRegime } from "../src/domain/invoice-tax-regime.js";
import type { Invoice } from "../src/domain/types.js";
import { buildXrechnungInvoiceXml } from "../src/services/xrechnung-xml-builder.js";

function testInvoice(regime: InvoiceTaxRegime, amounts: { net: number; vat: number; gross: number; vatBps: number }): Invoice {
  return {
    id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee0001",
    tenantId: "11111111-1111-4111-8111-111111111111",
    projectId: "10101010-1010-4010-8010-101010101010",
    customerId: "20202020-2020-4020-8020-202020202020",
    measurementId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001",
    lvId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001",
    offerId: "22222222-2222-4222-8222-222222222222",
    offerVersionId: "33333333-3333-4333-8333-333333333333",
    status: "GEBUCHT_VERSENDET",
    immutableFromStatus: "GEBUCHT_VERSENDET",
    invoiceNumber: "RE-SNAPSHOT-1",
    issueDate: "2026-05-05",
    lvNetCents: amounts.net,
    vatCents: amounts.vat,
    totalGrossCents: amounts.gross,
    skontoBps: 0,
    invoiceTaxRegime: regime,
    vatRateBpsEffective: amounts.vatBps,
  };
}

describe("buildXrechnungInvoiceXml (FIN-5 Paket C)", () => {
  it("STANDARD_VAT_19", () => {
    expect(
      buildXrechnungInvoiceXml(
        testInvoice("STANDARD_VAT_19", { net: 10_000, vat: 1900, gross: 11_900, vatBps: 1900 }),
      ),
    ).toMatchSnapshot();
  });

  it("SMALL_BUSINESS_19", () => {
    expect(
      buildXrechnungInvoiceXml(
        testInvoice("SMALL_BUSINESS_19", { net: 10_000, vat: 0, gross: 10_000, vatBps: 0 }),
      ),
    ).toMatchSnapshot();
  });

  it("REVERSE_CHARGE", () => {
    expect(
      buildXrechnungInvoiceXml(
        testInvoice("REVERSE_CHARGE", { net: 10_000, vat: 0, gross: 10_000, vatBps: 0 }),
      ),
    ).toMatchSnapshot();
  });

  it("CONSTRUCTION_13B", () => {
    expect(
      buildXrechnungInvoiceXml(
        testInvoice("CONSTRUCTION_13B", { net: 10_000, vat: 0, gross: 10_000, vatBps: 0 }),
      ),
    ).toMatchSnapshot();
  });
});
