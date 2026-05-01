import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "./api-client.js";
import { CANONICAL_EXPORT_INVOICE_ACTION_ID, executeActionWithSotGuard } from "./action-executor.js";

function makeClient(): ApiClient {
  return {
    requestJson: vi.fn().mockResolvedValue({ ok: true }),
    getAllowedActions: vi.fn(),
    getOfferVersion: vi.fn(),
    getLvVersionSnapshot: vi.fn(),
    getMeasurementVersion: vi.fn(),
    getSupplementVersion: vi.fn(),
    getPaymentTermsByProject: vi.fn(),
    createInvoiceDraft: vi.fn(),
    getInvoice: vi.fn(),
    listInvoicePaymentIntakes: vi.fn(),
    listInvoiceDunningReminders: vi.fn(),
    getDunningReminderConfig: vi.fn(),
    getDunningReminderTemplates: vi.fn(),
    getDunningEmailFooter: vi.fn(),
    patchDunningEmailFooter: vi.fn(),
    patchDunningReminderTemplateBody: vi.fn(),
    replaceDunningReminderConfig: vi.fn(),
    patchDunningReminderStage: vi.fn(),
    deleteDunningReminderStage: vi.fn(),
    recordPaymentIntake: vi.fn(),
    createInvoiceDunningReminder: vi.fn(),
    previewDunningReminderEmail: vi.fn(),
    sendDunningReminderEmailStub: vi.fn(),
    sendDunningReminderEmail: vi.fn(),
    getDunningReminderAutomation: vi.fn(),
    patchDunningReminderAutomation: vi.fn(),
    getDunningReminderCandidates: vi.fn(),
    postDunningReminderRunDryRun: vi.fn(),
    postDunningReminderRunExecute: vi.fn(),
    postDunningReminderBatchSendEmails: vi.fn(),
    getAuditEvents: vi.fn(),
  };
}

describe("executeActionWithSotGuard", () => {
  it("blocks action not listed in allowedActions", async () => {
    const client = makeClient();
    await expect(
      executeActionWithSotGuard(
        client,
        "OFFER_SET_VERSENDET",
        "OFFER_VERSION",
        "33333333-3333-4333-8333-333333333333",
        ["OFFER_SET_FREIGEGEBEN"],
        { reason: "Valid reason text" },
      ),
    ).rejects.toThrow("nicht freigegeben");
    expect(client.requestJson).not.toHaveBeenCalled();
  });

  it("executes action listed in allowedActions", async () => {
    const client = makeClient();
    await executeActionWithSotGuard(
      client,
      "OFFER_SET_VERSENDET",
      "OFFER_VERSION",
      "33333333-3333-4333-8333-333333333333",
      ["OFFER_SET_VERSENDET"],
      { reason: "Valid reason text" },
    );
    expect(client.requestJson).toHaveBeenCalledWith("POST", "/offers/status", {
      offerVersionId: "33333333-3333-4333-8333-333333333333",
      nextStatus: "VERSENDET",
      reason: "Valid reason text",
    });
  });

  it(`${CANONICAL_EXPORT_INVOICE_ACTION_ID} sendet immer XRECHNUNG (Contract/Backend formatPolicy)`, async () => {
    const client = makeClient();
    await executeActionWithSotGuard(
      client,
      CANONICAL_EXPORT_INVOICE_ACTION_ID,
      "INVOICE",
      "44444444-4444-4444-8444-444444444444",
      [CANONICAL_EXPORT_INVOICE_ACTION_ID],
      { reason: "Valid reason text", exportFormat: "GAEB" },
    );
    expect(client.requestJson).toHaveBeenCalledWith("POST", "/exports", {
      entityType: "INVOICE",
      entityId: "44444444-4444-4444-8444-444444444444",
      format: "XRECHNUNG",
    });
  });

  it("BOOK_INVOICE ruft POST /invoices/:id/book mit reason auf", async () => {
    const client = makeClient();
    await executeActionWithSotGuard(
      client,
      "BOOK_INVOICE",
      "INVOICE",
      "55555555-5555-4555-8555-555555555555",
      ["BOOK_INVOICE"],
      { reason: "Valid reason text" },
    );
    expect(client.requestJson).toHaveBeenCalledWith("POST", "/invoices/55555555-5555-4555-8555-555555555555/book", {
      reason: "Valid reason text",
    });
  });

  it("RECORD_DUNNING_REMINDER ruft POST /invoices/:id/dunning-reminders mit stageOrdinal auf", async () => {
    const client = makeClient();
    await executeActionWithSotGuard(
      client,
      "RECORD_DUNNING_REMINDER",
      "INVOICE",
      "44444444-4444-4444-8444-444444444444",
      ["RECORD_DUNNING_REMINDER"],
      { reason: "Valid reason text", dunningStageOrdinal: "3", dunningNote: "Demo" },
    );
    expect(client.requestJson).toHaveBeenCalledWith(
      "POST",
      "/invoices/44444444-4444-4444-8444-444444444444/dunning-reminders",
      { stageOrdinal: 3, reason: "Valid reason text", note: "Demo" },
    );
  });

  it("lehnt Legacy actionId EXPORT_INVOICE_XRECHNUNG ab", async () => {
    const client = makeClient();
    await expect(
      executeActionWithSotGuard(
        client,
        "EXPORT_INVOICE_XRECHNUNG",
        "INVOICE",
        "44444444-4444-4444-8444-444444444444",
        ["EXPORT_INVOICE_XRECHNUNG"],
        { reason: "Valid reason text" },
      ),
    ).rejects.toThrow(/EXPORT_INVOICE/);
    expect(client.requestJson).not.toHaveBeenCalled();
  });
});
