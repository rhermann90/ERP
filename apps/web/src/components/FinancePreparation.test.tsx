import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ApiClient } from "../lib/api-client.js";
import { FinancePreparation } from "./FinancePreparation.js";

const noopApi = {
  requestJson: async () => ({}),
  getAllowedActions: async () => ({ documentId: "", entityType: "", allowedActions: [] }),
  getMeasurementVersion: async () => ({}),
  getSupplementVersion: async () => ({}),
  getPaymentTermsByProject: async () => ({}),
  createInvoiceDraft: async () => ({
    invoiceId: "",
    lvNetCents: 0,
    vatRateBps: 1900,
    vatCents: 0,
    totalGrossCents: 0,
  }),
  getInvoice: async () => ({
    invoiceId: "",
    projectId: "",
    customerId: "",
    measurementId: "",
    lvVersionId: "",
    offerId: "",
    status: "ENTWURF",
  }),
} as unknown as ApiClient;

describe("FinancePreparation", () => {
  it("renders heading and doc paths", () => {
    render(<FinancePreparation api={noopApi} />);
    expect(screen.getByRole("heading", { name: /Finanz \(Vorbereitung\)/i })).not.toBeNull();
    expect(screen.getByText(/docs\/adr\/0007-finance-persistence-and-invoice-boundaries\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/adr\/0008-payment-terms-fin1\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/tickets\/FIN-2-START-GATE\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/contracts\/finance-fin0-openapi-mapping\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/contracts\/qa-fin-0-stub-test-matrix\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/ENTWICKLUNGSPHASEN-MVP-V1\.3\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/tickets\/PL-SYSTEM-ZUERST-2026-04-14\.md/)).not.toBeNull();
    expect(screen.getByRole("heading", { name: /Rechnung lesen \(GET\)/i })).not.toBeNull();
  });
});
