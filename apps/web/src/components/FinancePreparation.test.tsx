import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ApiClient, DunningStageConfigReadRow } from "../lib/api-client.js";
import { ApiError } from "../lib/api-error.js";
import {
  financePrepHashWithTab,
  isFinancePrepHashPath,
  resolveFinancePrepInitialMainTab,
} from "../lib/hash-route.js";
import { FinanceStructuredApiError } from "./finance/FinanceStructuredApiError.js";
import { FinancePreparation } from "./FinancePreparation.js";

const draftResponse = {
  invoiceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  lvNetCents: 98_000,
  vatRateBps: 1900,
  vatCents: 18_620,
  totalGrossCents: 116_620,
  skontoBps: 200,
  invoiceTaxRegime: "STANDARD_VAT_19" as const,
  mandatoryTaxNoticeLines: [] as string[],
};

const noopApi = {
  requestJson: async () => ({}),
  getAllowedActions: async (_documentId: string, entityType: string) => ({
    documentId: "",
    entityType: entityType ?? "INVOICE",
    allowedActions:
      entityType === "INVOICE"
        ? [
            "BOOK_INVOICE",
            "RECORD_PAYMENT_INTAKE",
            "RECORD_DUNNING_REMINDER",
            "EXPORT_INVOICE",
            "MANAGE_INVOICE_TAX_SETTINGS",
          ]
        : [],
  }),
  getMeasurementVersion: async () => ({}),
  getSupplementVersion: async () => ({}),
  getPaymentTermsByProject: async () => ({}),
  createInvoiceDraft: async () => ({
    invoiceId: "",
    lvNetCents: 0,
    vatRateBps: 1900,
    vatCents: 0,
    totalGrossCents: 0,
    skontoBps: 0,
    invoiceTaxRegime: "STANDARD_VAT_19",
    mandatoryTaxNoticeLines: [],
  }),
  listInvoicePaymentIntakes: async () => ({ data: [] }),
  listInvoiceDunningReminders: async () => ({ data: [] }),
  getDunningReminderConfig: async () => ({
    data: {
      configSource: "MVP_STATIC_DEFAULTS" as const,
      tenantId: "00000000-0000-4000-8000-000000000001",
      stages: [{ stageOrdinal: 1, daysAfterDue: 14, feeCents: 0, label: "M1" }],
    },
  }),
  getDunningReminderTemplates: async () => ({
    data: {
      templateSource: "MVP_STATIC_DEFAULTS" as const,
      tenantId: "00000000-0000-4000-8000-000000000001",
      stages: [
        {
          stageOrdinal: 1,
          channels: [
            { channel: "EMAIL" as const, templateType: "REMINDER" as const, body: "E {{MahngebuehrEUR}}" },
            { channel: "PRINT" as const, templateType: "REMINDER" as const, body: "P {{MahngebuehrEUR}}" },
          ],
        },
      ],
    },
  }),
  getDunningEmailFooter: async () => ({
    data: {
      footerSource: "NOT_CONFIGURED" as const,
      tenantId: "00000000-0000-4000-8000-000000000001",
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
      readyForEmailFooter: false,
      missingMandatoryFields: ["companyLegalName"],
      impressumComplianceTier: "MINIMAL",
      impressumGaps: ["LEGAL_REPRESENTATIVE_MISSING", "VAT_ID_MISSING"],
    },
  }),
  patchDunningEmailFooter: async () => ({
    data: {
      footerSource: "TENANT_DATABASE" as const,
      tenantId: "00000000-0000-4000-8000-000000000001",
      companyLegalName: "Stub GmbH",
      streetLine: "Weg 1",
      postalCode: "10115",
      city: "Berlin",
      countryCode: "DE",
      publicEmail: "info@example.com",
      publicPhone: "+49 30 1",
      legalRepresentative: "",
      registerCourt: "",
      registerNumber: "",
      vatId: "",
      signatureLine: "",
      readyForEmailFooter: true,
      missingMandatoryFields: [],
      impressumComplianceTier: "MINIMAL",
      impressumGaps: ["LEGAL_REPRESENTATIVE_MISSING", "VAT_ID_MISSING"],
    },
  }),
  patchDunningReminderTemplateBody: async () => ({
    data: {
      templateSource: "MVP_STATIC_DEFAULTS" as const,
      tenantId: "00000000-0000-4000-8000-000000000001",
      stages: [],
    },
  }),
  replaceDunningReminderConfig: async (body: { stages: DunningStageConfigReadRow[]; reason: string }) => ({
    data: {
      configSource: "TENANT_DATABASE" as const,
      tenantId: "00000000-0000-4000-8000-000000000001",
      stages: body.stages,
    },
  }),
  patchDunningReminderStage: async (_ordinal: number, body: { label?: string; reason: string }) => ({
    data: {
      configSource: "TENANT_DATABASE" as const,
      tenantId: "00000000-0000-4000-8000-000000000001",
      stages: [{ stageOrdinal: 1, daysAfterDue: 14, feeCents: 0, label: body.label ?? "patched" }],
    },
  }),
  deleteDunningReminderStage: async () => ({
    data: {
      configSource: "MVP_STATIC_DEFAULTS" as const,
      tenantId: "00000000-0000-4000-8000-000000000001",
      stages: [{ stageOrdinal: 1, daysAfterDue: 14, feeCents: 0, label: "M1" }],
    },
  }),
  getInvoice: async () => ({
    invoiceId: "",
    projectId: "",
    customerId: "",
    measurementId: "",
    lvVersionId: "",
    offerId: "",
    status: "ENTWURF",
    skontoBps: 0,
    invoiceTaxRegime: "STANDARD_VAT_19",
  }),
  recordPaymentIntake: async () => ({
    paymentIntakeId: "00000000-0000-4000-8000-000000000099",
    invoiceId: "",
    amountCents: 1,
    totalPaidCentsAfter: 0,
    invoiceOpenCentsAfter: 0,
    invoiceStatus: "GEBUCHT_VERSENDET",
  }),
  createInvoiceDunningReminder: async () => ({
    dunningReminderId: "00000000-0000-4000-8000-000000000088",
    stageOrdinal: 1,
    createdAt: new Date().toISOString(),
  }),
  previewDunningReminderEmail: async () => ({
    data: {
      stageOrdinal: 1,
      templateBodyRaw: "stub",
      templateBodyWithPlaceholders: "stub",
      footerPlainText: "footer",
      fullPlainText: "full",
      readyForEmailFooter: true,
      missingMandatoryFields: [],
      impressumComplianceTier: "MINIMAL",
      impressumGaps: [],
      warnings: [],
    },
  }),
  sendDunningReminderEmailStub: async () => ({
    data: {
      outcome: "NOT_SENT_NO_SMTP" as const,
      stageOrdinal: 1,
      auditEventId: "00000000-0000-4000-8000-000000000077",
      message: "stub",
    },
  }),
  sendDunningReminderEmail: async () => ({
    data: {
      outcome: "SENT" as const,
      stageOrdinal: 1,
      auditEventId: "00000000-0000-4000-8000-000000000066",
      smtpMessageId: "stub-msg",
      recipientEmail: "demo-recipient@example.com",
      message: "ok",
    },
  }),
  getAuditEvents: async () => ({ data: [], page: 1, pageSize: 15, total: 0 }),
  getDunningReminderAutomation: async () => ({
    data: {
      automationSource: "NOT_CONFIGURED" as const,
      tenantId: "00000000-0000-4000-8000-000000000001",
      runMode: "SEMI" as const,
      jobHourUtc: null,
      ianaTimezone: "Europe/Berlin",
      federalStateCode: null,
      paymentTermDayKind: "CALENDAR" as const,
      preferredDunningChannel: "EMAIL" as const,
    },
  }),
  patchDunningReminderAutomation: async () => ({
    data: {
      automationSource: "TENANT_DATABASE" as const,
      tenantId: "00000000-0000-4000-8000-000000000001",
      runMode: "SEMI" as const,
      jobHourUtc: null,
      ianaTimezone: "Europe/Berlin",
      federalStateCode: null,
      paymentTermDayKind: "CALENDAR" as const,
      preferredDunningChannel: "EMAIL" as const,
    },
  }),
  getDunningReminderCandidates: async () => ({
    data: {
      configSource: "MVP_STATIC_DEFAULTS" as const,
      asOfDate: "2026-04-28",
      stageOrdinal: 1,
      daysAfterDueForStage: 14,
      eligibilityContext: {
        ianaTimezone: "Europe/Berlin",
        federalStateCode: null,
        paymentTermDayKind: "CALENDAR" as const,
        preferredDunningChannel: "EMAIL" as const,
      },
      candidates: [],
    },
  }),
  postDunningReminderRunDryRun: async () => ({
    data: {
      mode: "DRY_RUN",
      outcome: "PREVIEW",
      stageOrdinal: 1,
      asOfDate: "2026-04-28",
      configSource: "MVP_STATIC_DEFAULTS",
      planned: [],
    },
  }),
  postDunningReminderRunExecute: async () => ({
    data: {
      mode: "EXECUTE",
      outcome: "COMPLETED",
      stageOrdinal: 1,
      asOfDate: "2026-04-28",
      configSource: "MVP_STATIC_DEFAULTS",
      executed: [],
    },
  }),
  postDunningReminderBatchSendEmails: async () => ({
    data: {
      mode: "DRY_RUN",
      stageOrdinal: 1,
      asOfDate: "2026-04-28",
      results: [],
    },
  }),
  getTenantInvoiceTaxProfile: async () => ({
    tenantId: "00000000-0000-4000-8000-000000000001",
    defaultInvoiceTaxRegime: "STANDARD_VAT_19" as const,
  }),
  getProjectInvoiceTaxOverride: async () => ({
    projectId: "10101010-1010-4010-8010-101010101010",
    invoiceTaxRegime: null as null,
  }),
  patchTenantInvoiceTaxProfile: async (body: { defaultInvoiceTaxRegime: string; reason: string }) => ({
    tenantId: "00000000-0000-4000-8000-000000000001",
    defaultInvoiceTaxRegime: body.defaultInvoiceTaxRegime as "STANDARD_VAT_19",
  }),
  putProjectInvoiceTaxOverride: async (
    _projectId: string,
    body: { invoiceTaxRegime: string; taxReasonCode?: string; reason: string },
  ) => ({
    projectId: "10101010-1010-4010-8010-101010101010",
    invoiceTaxRegime: body.invoiceTaxRegime as "REVERSE_CHARGE",
  }),
  deleteProjectInvoiceTaxOverride: async () => undefined,
} as unknown as ApiClient;

describe("FinancePreparation", () => {
  it("renders heading, tablist, tab panels and doc paths", async () => {
    await act(async () => {
      render(<FinancePreparation api={noopApi} />);
      await Promise.resolve();
    });
    expect(screen.getByRole("heading", { name: /Finanz \(Vorbereitung\)/i })).not.toBeNull();
    expect(screen.getByRole("tablist", { name: /Bereiche Finanz-Vorbereitung/i })).not.toBeNull();
    expect(screen.getByRole("tab", { name: /Rechnung & Zahlung/i })).not.toBeNull();
    expect(screen.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i })).not.toBeNull();
    expect(screen.getByRole("heading", { name: /Zahlungsbedingungen \(FIN-1\)/i })).not.toBeNull();
    expect(screen.getByRole("heading", { name: /Zahlungseingang \(FIN-3\)/i })).not.toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }));
    expect(screen.getByRole("heading", { name: /Grundeinstellungen Mahnlauf \(SEMI, ADR-0011\)/i })).not.toBeNull();
    expect(screen.getByRole("heading", { name: /Steuerprofil Rechnung \(FIN-5\)/i })).not.toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /^Mahnwesen$/i }));
    expect(screen.getByRole("heading", { name: /Mahn-Ereignis \(FIN-4\)/i })).not.toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /^Fortgeschritten$/i }));
    expect(screen.getByRole("heading", { name: /SoT — erlaubte Aktionen \(Fortgeschritten\)/i })).not.toBeNull();
    expect(screen.getByRole("heading", { name: /Audit — Nachvollziehbarkeit/i })).not.toBeNull();
    expect(screen.getByText(/docs\/adr\/0007-finance-persistence-and-invoice-boundaries\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/adr\/0008-payment-terms-fin1\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/adr\/0009-fin4-mahnwesen-slice\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/adr\/0010-fin4-m4-dunning-email-and-templates\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/adr\/0011-fin4-semi-dunning-context\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/tickets\/M4-MINI-SLICE-1-VORLAGEN-READ-2026-04-23\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/tickets\/M4-MINI-SLICE-4-EMAIL-PREVIEW-SEND-STUB-2026-04-24\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/tickets\/M4-MINI-SLICE-5-REAL-SMTP-2026-04-24\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/tickets\/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/tickets\/FIN-2-START-GATE\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/contracts\/finance-fin0-openapi-mapping\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/contracts\/qa-fin-0-stub-test-matrix\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/tickets\/PL-SYSTEM-ZUERST-2026-04-14\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/contracts\/ui-role-mapping-v1-3\.md/)).not.toBeNull();
    expect(screen.getByRole("heading", { name: /Was ist hier angebunden/i })).not.toBeNull();
    expect(screen.getByText(/FIN-4 Mahn-Kandidaten \/ Automation \(SEMI\)/)).not.toBeNull();
  });

  it("offers Mahnlauf batch dry-run after dunning reads load", async () => {
    const postDunningReminderRunDryRun = vi.fn().mockResolvedValue({
      data: {
        mode: "DRY_RUN",
        outcome: "PREVIEW",
        stageOrdinal: 1,
        asOfDate: "2026-04-28",
        configSource: "MVP_STATIC_DEFAULTS",
        planned: [],
      },
    });
    const api = { ...noopApi, postDunningReminderRunDryRun } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
    });
    fireEvent.click(screen.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Vorschau \(Dry-Run\)/i })).not.toBeNull();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Vorschau \(Dry-Run\)/i }));
    });
    await waitFor(() => {
      expect(postDunningReminderRunDryRun).toHaveBeenCalled();
    });
  });

  it("shows impressum compliance summary after dunning reads load (E-Mail-Footer GET)", async () => {
    await act(async () => {
      render(<FinancePreparation api={noopApi} />);
    });
    fireEvent.click(screen.getByRole("tab", { name: /^Mahnwesen$/i }));
    await waitFor(() => {
      expect(screen.getByRole("region", { name: /Impressum-Compliance, heuristisch/i })).not.toBeNull();
    });
    expect(screen.getByText(/Impressum-Heuristik: Mindeststufe/)).not.toBeNull();
    expect(screen.getByText(/Vertretungsberechtigte\/r:/)).not.toBeNull();
    expect(screen.getByText("LEGAL_REPRESENTATIVE_MISSING")).not.toBeNull();
    expect(screen.getByText("VAT_ID_MISSING")).not.toBeNull();
  });

  it("sends skontoBps in createInvoiceDraft when Skonto field is set", async () => {
    const createInvoiceDraft = vi.fn().mockResolvedValue(draftResponse);
    const api = { ...noopApi, createInvoiceDraft } as unknown as ApiClient;
    render(<FinancePreparation api={api} />);

    fireEvent.change(screen.getByLabelText(/Skonto in Basispunkten für neuen Rechnungsentwurf/i), {
      target: { value: "200" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Rechnungsentwurf anlegen/i }));

    await waitFor(() => expect(createInvoiceDraft).toHaveBeenCalled());
    expect(createInvoiceDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        skontoBps: 200,
        invoiceCurrencyCode: "EUR",
      }),
    );
  });

  it("recalculates ENTWURF skonto via POST /invoices after GET invoice with traceability", async () => {
    const invoiceId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const entwurfOverview = {
      invoiceId,
      projectId: "10101010-1010-4010-8010-101010101010",
      customerId: "20202020-2020-4020-8020-202020202020",
      measurementId: "m0000000-0000-4000-8000-000000000001",
      lvVersionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001",
      offerId: "o0000000-0000-4000-8000-000000000002",
      offerVersionId: "33333333-3333-4333-8333-333333333333",
      status: "ENTWURF" as const,
      skontoBps: 0,
      lvNetCents: 100_000,
      vatRateBps: 1900,
      vatCents: 19_000,
      totalGrossCents: 119_000,
      totalPaidCents: 0,
      invoiceTaxRegime: "STANDARD_VAT_19" as const,
    };
    const createInvoiceDraft = vi.fn().mockResolvedValue({
      ...draftResponse,
      invoiceId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      skontoBps: 150,
    });
    const getInvoice = vi.fn().mockResolvedValue(entwurfOverview);
    const api = { ...noopApi, getInvoice, createInvoiceDraft } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
    });
    fireEvent.change(screen.getByLabelText(/Rechnungs-ID für GET/i), { target: { value: invoiceId } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Rechnung laden$/i }));
    });
    await waitFor(() => expect(getInvoice).toHaveBeenCalledWith(invoiceId));
    fireEvent.change(screen.getByLabelText(/Skonto in Basispunkten für neuen Rechnungsentwurf/i), {
      target: { value: "150" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Skonto mit POST \/invoices neu berechnen/i }));
    });
    await waitFor(() => expect(createInvoiceDraft).toHaveBeenCalled());
    expect(createInvoiceDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        lvVersionId: entwurfOverview.lvVersionId,
        offerVersionId: entwurfOverview.offerVersionId,
        invoiceCurrencyCode: "EUR",
        skontoBps: 150,
        reason: expect.stringContaining("Skonto"),
      }),
    );
    const newInvoiceId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    await waitFor(() => expect(getInvoice).toHaveBeenCalledWith(newInvoiceId));
  });

  it("409 INVOICE_TAX_REGIME_CHANGED_RECREATE_DRAFT beim Buchen: Hinweis, CTA und neuen Entwurf laden", async () => {
    const oldInvoiceId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const newInvoiceId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    const lvVersionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001";
    const offerVersionId = "33333333-3333-4333-8333-333333333333";
    const entwurfOverviewOld = {
      invoiceId: oldInvoiceId,
      projectId: "10101010-1010-4010-8010-101010101010",
      customerId: "20202020-2020-4020-8020-202020202020",
      measurementId: "m0000000-0000-4000-8000-000000000001",
      lvVersionId,
      offerId: "o0000000-0000-4000-8000-000000000002",
      offerVersionId,
      status: "ENTWURF" as const,
      skontoBps: 200,
      lvNetCents: 100_000,
      vatRateBps: 1900,
      vatCents: 19_000,
      totalGrossCents: 119_000,
      totalPaidCents: 0,
      invoiceTaxRegime: "STANDARD_VAT_19" as const,
    };
    const entwurfOverviewNew = {
      ...entwurfOverviewOld,
      invoiceId: newInvoiceId,
      invoiceTaxRegime: "SMALL_BUSINESS_19" as const,
    };
    const getInvoice = vi.fn(async (id: string) => {
      if (id === newInvoiceId) return entwurfOverviewNew;
      return entwurfOverviewOld;
    });
    const requestJson = vi.fn(async (method: string, path: string) => {
      if (method === "POST" && /\/invoices\/.+\/book$/u.test(path)) {
        throw new ApiError(409, {
          code: "INVOICE_TAX_REGIME_CHANGED_RECREATE_DRAFT",
          message: "Steuerregime seit Entwurf geaendert — Entwurf verwerfen und neu anlegen",
          correlationId: "00000000-0000-4000-8000-0000000000dr",
          retryable: false,
          blocking: true,
        });
      }
      return {};
    });
    const createInvoiceDraft = vi.fn().mockResolvedValue({
      ...draftResponse,
      invoiceId: newInvoiceId,
      invoiceTaxRegime: "SMALL_BUSINESS_19",
      mandatoryTaxNoticeLines: ["Kleinunternehmer §19 UStG"],
    });
    const api = { ...noopApi, getInvoice, requestJson, createInvoiceDraft } as unknown as ApiClient;

    await act(async () => {
      render(<FinancePreparation api={api} />);
    });
    fireEvent.change(screen.getByLabelText(/Rechnungs-ID für GET/i), { target: { value: oldInvoiceId } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Rechnung laden$/i }));
    });
    await waitFor(() => expect(getInvoice).toHaveBeenCalledWith(oldInvoiceId));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Rechnung buchen$/i }));
    });
    await waitFor(() => expect(requestJson).toHaveBeenCalled());

    expect(screen.getByTestId("finance-invoice-recreate-draft-cta")).not.toBeNull();
    expect(screen.getByText(/Steuerregime hat sich seit dem Entwurf geändert \(FIN-5 §8\.16\)/i)).not.toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByTestId("finance-invoice-recreate-draft-cta"));
    });
    await waitFor(() => expect(createInvoiceDraft).toHaveBeenCalled());
    expect(createInvoiceDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        lvVersionId,
        offerVersionId,
        invoiceCurrencyCode: "EUR",
        skontoBps: 200,
        reason: expect.stringContaining("Regime-Drift"),
      }),
    );
    await waitFor(() => {
      expect((screen.getByLabelText(/Rechnungs-ID für GET/i) as HTMLInputElement).value).toBe(newInvoiceId);
    });
    await waitFor(() => expect(screen.getByText("SMALL_BUSINESS_19")).not.toBeNull());
    expect(screen.queryByTestId("finance-prep-notice")).toBeNull();
  });

  it("disables Rechnung laden until invoice id looks like a UUID", async () => {
    await act(async () => {
      render(<FinancePreparation api={noopApi} />);
      await Promise.resolve();
    });
    const loadBtn = screen.getByRole("button", { name: /^Rechnung laden$/i });
    const invoiceField = screen.getByLabelText(/Rechnungs-ID für GET/i);

    fireEvent.change(invoiceField, { target: { value: "" } });
    expect((loadBtn as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(invoiceField, { target: { value: "not-a-uuid" } });
    expect((loadBtn as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(invoiceField, { target: { value: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" } });
    expect((loadBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it("loads dunning config, templates, and email footer on mount", async () => {
    const getDunningReminderConfig = vi.fn().mockImplementation(() => noopApi.getDunningReminderConfig());
    const getDunningReminderTemplates = vi.fn().mockImplementation(() => noopApi.getDunningReminderTemplates());
    const getDunningEmailFooter = vi.fn().mockImplementation(() => noopApi.getDunningEmailFooter());
    const api = { ...noopApi, getDunningReminderConfig, getDunningReminderTemplates, getDunningEmailFooter } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
      await Promise.resolve();
    });
    await waitFor(() => expect(getDunningReminderConfig).toHaveBeenCalled());
    await waitFor(() => expect(getDunningReminderTemplates).toHaveBeenCalled());
    await waitFor(() => expect(getDunningEmailFooter).toHaveBeenCalled());
  });

  it("shows API error when Mahn-Lesepfad GET fehlschlägt und „Erneut laden“ beseitigt die Meldung", async () => {
    const tplOk = noopApi.getDunningReminderTemplates();
    const getDunningReminderTemplates = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError(503, {
          code: "DUNNING_TEMPLATE_NOT_PERSISTABLE",
          message: "Nur mit Postgres",
          correlationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          retryable: false,
          blocking: true,
        }),
      )
      .mockImplementationOnce(() => tplOk);
    const getDunningReminderConfig = vi.fn().mockImplementation(() => noopApi.getDunningReminderConfig());
    const api = { ...noopApi, getDunningReminderConfig, getDunningReminderTemplates } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
      await Promise.resolve();
    });
    await waitFor(() => expect(getDunningReminderTemplates).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("tab", { name: /^Mahnwesen$/i }));
    const dunningLive = document.getElementById("finance-prep-dunning-notice");
    expect(dunningLive).toBeTruthy();
    const statusAnnouncement = within(dunningLive as HTMLElement).getByRole("status");
    expect(statusAnnouncement.textContent).toContain("DUNNING_TEMPLATE_NOT_PERSISTABLE");
    expect(statusAnnouncement.textContent).toContain("Nur mit Postgres");
    fireEvent.click(screen.getByRole("button", { name: /Mahn-Lesepfade.*erneut laden/i }));
    await waitFor(() => expect(getDunningReminderTemplates).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(screen.queryByText("Nur mit Postgres")).toBeNull();
    });
  });

  it("shows structured API error when PUT Mahnstufen fails", async () => {
    const nineStages = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
      stageOrdinal: n,
      daysAfterDue: 10 + n,
      feeCents: 0,
      label: `Stufe ${n}`,
    }));
    const getDunningReminderConfig = vi.fn().mockResolvedValue({
      data: {
        configSource: "MVP_STATIC_DEFAULTS" as const,
        tenantId: "00000000-0000-4000-8000-000000000001",
        stages: nineStages,
      },
    });
    const replaceDunningReminderConfig = vi.fn().mockRejectedValue(
      new ApiError(503, {
        code: "DUNNING_STAGE_CONFIG_NOT_PERSISTABLE",
        message: "Kein DB-Schreibmodus",
        correlationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        retryable: false,
        blocking: true,
      }),
    );
    const api = { ...noopApi, getDunningReminderConfig, replaceDunningReminderConfig } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
      await Promise.resolve();
    });
    await waitFor(() => expect(getDunningReminderConfig).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("tab", { name: /^Mahnwesen$/i }));
    fireEvent.click(screen.getByRole("button", { name: /PUT-JSON aus GET vorbefüllen/i }));
    fireEvent.click(screen.getByRole("button", { name: /PUT \/finance\/dunning-reminder-config/i }));
    await waitFor(() => expect(replaceDunningReminderConfig).toHaveBeenCalled());
    const dunningLive = document.getElementById("finance-prep-dunning-notice");
    expect(dunningLive).toBeTruthy();
    expect(within(dunningLive as HTMLElement).getByRole("status")).toBeTruthy();
  });

  it("calls patchDunningReminderStage when PATCH Stufe is submitted with label", async () => {
    const patchDunningReminderStage = vi.fn().mockImplementation((ord: number, body: { label?: string; reason: string }) =>
      noopApi.patchDunningReminderStage(ord, body),
    );
    const api = { ...noopApi, patchDunningReminderStage } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("tab", { name: /^Mahnwesen$/i }));
    const labelInput = screen.getByLabelText(/label \(optional\)/i);
    fireEvent.change(labelInput, { target: { value: "M1-gepatcht" } });
    fireEvent.click(screen.getByRole("button", { name: /PATCH Stufe/i }));
    await waitFor(() =>
      expect(patchDunningReminderStage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ label: "M1-gepatcht", reason: "Finanz-Vorbereitung PATCH Mahnstufe" }),
      ),
    );
  });

  it("Mandanten-Mahnlauf-Modus: nur OFF und SEMI im Select", async () => {
    await act(async () => {
      render(<FinancePreparation api={noopApi} />);
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Mandanten-Mahnlauf-Modus/i)).not.toBeNull();
    });
    const sel = screen.getByLabelText(/Mandanten-Mahnlauf-Modus/i) as HTMLSelectElement;
    expect([...sel.options].map((o) => o.value)).toEqual(["OFF", "SEMI"]);
  });

  it("zeigt Servertreu-Hinweis wenn gespeicherter Modus vom Formular abweicht", async () => {
    const getDunningReminderAutomation = vi.fn().mockResolvedValue({
      data: {
        automationSource: "TENANT_DATABASE" as const,
        tenantId: "00000000-0000-4000-8000-000000000001",
        runMode: "OFF" as const,
        jobHourUtc: null,
        ianaTimezone: "Europe/Berlin",
        federalStateCode: null,
        paymentTermDayKind: "CALENDAR" as const,
        preferredDunningChannel: "EMAIL" as const,
      },
    });
    const api = { ...noopApi, getDunningReminderAutomation } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Mandanten-Mahnlauf-Modus/i)).not.toBeNull();
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Mandanten-Mahnlauf-Modus/i), { target: { value: "SEMI" } });
    });
    await waitFor(() => {
      expect(screen.getByText(/Servertreu: OFF/i)).not.toBeNull();
    });
  });

  it("calls patchDunningReminderAutomation with full SEMI context body on Automation speichern", async () => {
    const patchDunningReminderAutomation = vi.fn().mockResolvedValue({
      data: {
        automationSource: "TENANT_DATABASE" as const,
        tenantId: "00000000-0000-4000-8000-000000000001",
        runMode: "OFF" as const,
        jobHourUtc: null,
        ianaTimezone: "Europe/Vienna",
        federalStateCode: "BY",
        paymentTermDayKind: "BUSINESS" as const,
        preferredDunningChannel: "PRINT" as const,
      },
    });
    const api = { ...noopApi, patchDunningReminderAutomation } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect((screen.getByLabelText(/IANA-Zeitzone fuer Mahn-Faelligkeit/i) as HTMLInputElement).value).toBe("Europe/Berlin");
    });
    fireEvent.click(screen.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }));
    fireEvent.change(screen.getByLabelText(/Mandanten-Mahnlauf-Modus/i), { target: { value: "OFF" } });
    fireEvent.change(screen.getByLabelText(/IANA-Zeitzone fuer Mahn-Faelligkeit/i), { target: { value: "Europe/Vienna" } });
    fireEvent.change(screen.getByLabelText(/DE-Bundeslandcode fuer Feiertage/i), { target: { value: "by" } });
    fireEvent.change(screen.getByLabelText(/Kalender- oder Werktage fuer daysAfterDue/i), { target: { value: "BUSINESS" } });
    fireEvent.change(screen.getByLabelText(/Bevorzugter Mahnkanal/i), { target: { value: "PRINT" } });
    fireEvent.change(screen.getByLabelText(/Grund \(PATCH\)/i), { target: { value: "Tests Grund Automation-PATCH" } });
    fireEvent.click(screen.getByRole("button", { name: /^Automation speichern$/i }));
    await waitFor(() => expect(patchDunningReminderAutomation).toHaveBeenCalledTimes(1));
    expect(patchDunningReminderAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "Tests Grund Automation-PATCH",
        runMode: "OFF",
        ianaTimezone: "Europe/Vienna",
        federalStateCode: "BY",
        paymentTermDayKind: "BUSINESS",
        preferredDunningChannel: "PRINT",
      }),
    );
  });

  it("blocks Automation-PATCH locally when reason is shorter than 5 characters", async () => {
    const patchDunningReminderAutomation = vi.fn();
    const api = { ...noopApi, patchDunningReminderAutomation } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect((screen.getByLabelText(/IANA-Zeitzone fuer Mahn-Faelligkeit/i) as HTMLInputElement).value).toBe("Europe/Berlin");
    });
    fireEvent.click(screen.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }));
    fireEvent.change(screen.getByLabelText(/Grund \(PATCH\)/i), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /^Automation speichern$/i }));
    expect(patchDunningReminderAutomation).not.toHaveBeenCalled();
    expect(screen.getByText(/Grund für Automation-PATCH mindestens 5 Zeichen/i)).not.toBeNull();
  });

  it("blocks Automation-PATCH locally when DE-Bundesland has a single character", async () => {
    const patchDunningReminderAutomation = vi.fn();
    const api = { ...noopApi, patchDunningReminderAutomation } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect((screen.getByLabelText(/IANA-Zeitzone fuer Mahn-Faelligkeit/i) as HTMLInputElement).value).toBe("Europe/Berlin");
    });
    fireEvent.click(screen.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }));
    fireEvent.change(screen.getByLabelText(/DE-Bundeslandcode fuer Feiertage/i), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: /^Automation speichern$/i }));
    expect(patchDunningReminderAutomation).not.toHaveBeenCalled();
    expect(screen.getByText(/Bundesland leer oder 2–4 Zeichen/i)).not.toBeNull();
  });

  it("loads dunning candidates GET and shows eligibility context summary", async () => {
    const getDunningReminderCandidates = vi.fn().mockResolvedValue({
      data: {
        configSource: "MVP_STATIC_DEFAULTS" as const,
        asOfDate: "2026-04-28",
        stageOrdinal: 1,
        daysAfterDueForStage: 14,
        eligibilityContext: {
          ianaTimezone: "Europe/Berlin",
          federalStateCode: "BY",
          paymentTermDayKind: "BUSINESS" as const,
          preferredDunningChannel: "EMAIL" as const,
        },
        candidates: [
          {
            invoiceId: "44444444-4444-4444-8444-444444444444",
            dueDate: "2026-04-01",
            stageDeadlineIso: "2026-04-15T22:00:00.000Z",
            openAmountCents: 116620,
          },
        ],
      },
    });
    const api = { ...noopApi, getDunningReminderCandidates } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
    });
    fireEvent.click(screen.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Kandidaten laden \(GET\)/i })).not.toBeNull());
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Kandidaten laden \(GET\)/i }));
    });
    await waitFor(() => expect(getDunningReminderCandidates).toHaveBeenCalledWith({ stageOrdinal: 1 }));
    const candidatesRegion = screen.getByTestId("finance-dunning-candidates-region");
    expect(candidatesRegion).not.toBeNull();
    const cell = within(candidatesRegion).getByTestId("finance-dunning-candidate-invoice-0");
    expect(cell).not.toBeNull();
    expect(screen.getByText("BUSINESS")).not.toBeNull();
    const tr = cell.closest("tr");
    expect(tr?.getAttribute("title")).toContain("Stufenfrist (Engine)");
    expect(tr?.getAttribute("title")).toContain("Europe/Berlin");
  });

  it("öffnet Tab Mahnwesen direkt über initialMainTab", async () => {
    await act(async () => {
      render(<FinancePreparation api={noopApi} initialMainTab="mahnwesen" />);
      await Promise.resolve();
    });
    expect(screen.getByRole("tab", { name: /^Mahnwesen$/i }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("heading", { name: /Mahn-Ereignis \(FIN-4\)/i })).not.toBeNull();
  });

  it("deaktiviert Dry-Run/EXECUTE bei Server runMode OFF (Variante 1a)", async () => {
    const getDunningReminderAutomation = vi.fn().mockResolvedValue({
      data: {
        automationSource: "TENANT_DATABASE" as const,
        tenantId: "00000000-0000-4000-8000-000000000001",
        runMode: "OFF" as const,
        jobHourUtc: null,
        ianaTimezone: "Europe/Berlin",
        federalStateCode: null,
        paymentTermDayKind: "CALENDAR" as const,
        preferredDunningChannel: "EMAIL" as const,
      },
    });
    const postDunningReminderRunDryRun = vi.fn();
    const api = { ...noopApi, getDunningReminderAutomation, postDunningReminderRunDryRun } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} initialMainTab="grundeinstellungen" />);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByText(/Mandant OFF:/i)).not.toBeNull();
    });
    const dry = screen.getByRole("button", { name: /Vorschau \(Dry-Run\)/i }) as HTMLButtonElement;
    const exec = screen.getByRole("button", { name: /Ausführen \(EXECUTE\)/i }) as HTMLButtonElement;
    const batchDry = screen.getByTestId("finance-dunning-batch-email-dry-run") as HTMLButtonElement;
    const batchExec = screen.getByTestId("finance-dunning-batch-email-execute") as HTMLButtonElement;
    expect(dry.disabled).toBe(true);
    expect(exec.disabled).toBe(true);
    expect(batchDry.disabled).toBe(true);
    expect(batchExec.disabled).toBe(true);
    await act(async () => {
      fireEvent.click(dry);
    });
    expect(postDunningReminderRunDryRun).not.toHaveBeenCalled();
  });

  it("offers Batch-E-Mail dry-run control in Grundeinstellungen tab", async () => {
    const postDunningReminderBatchSendEmails = vi.fn().mockResolvedValue({
      data: { mode: "DRY_RUN", stageOrdinal: 1, asOfDate: "2026-04-28", results: [] },
    });
    const api = { ...noopApi, postDunningReminderBatchSendEmails } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
    });
    fireEvent.click(screen.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }));
    await waitFor(() => {
      expect(screen.getByTestId("finance-dunning-batch-email-dry-run")).not.toBeNull();
    });
    fireEvent.change(screen.getByTestId("finance-dunning-batch-email-items-json"), {
      target: {
        value: '[{"invoiceId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","toEmail":"kunde@example.com"}]',
      },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("finance-dunning-batch-email-dry-run"));
    });
    await waitFor(() => {
      expect(postDunningReminderBatchSendEmails).toHaveBeenCalled();
    });
  });

  it("Schritt 3 zeigt strukturierten API-Fehler mit Detail-Liste nach fehlgeschlagenem Rechnungsladen", async () => {
    const getInvoice = vi.fn().mockRejectedValue(
      new ApiError(403, {
        code: "TENANT_SCOPE_VIOLATION",
        message: "Tenant-Scope passt nicht zum Auth-Token",
        correlationId: "c1",
        retryable: false,
        blocking: true,
        details: { errors: [{ message: "Scope-Zeile A" }, { message: "Scope-Zeile B" }] },
      }),
    );
    const api = { ...noopApi, getInvoice } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Rechnung laden$/i }));
    });
    await waitFor(() => {
      expect(screen.queryByTestId("finance-structured-api-error-detail-list")).not.toBeNull();
    });
    expect(screen.getByText("Scope-Zeile A")).not.toBeNull();
    expect(screen.getByText(/TENANT_SCOPE_VIOLATION/)).not.toBeNull();
  });

  it("Schritt 2 zeigt zentralen Skonto-Hinweistext bei ungültigen Basispunkten", async () => {
    await act(async () => {
      render(<FinancePreparation api={noopApi} />);
    });
    fireEvent.change(screen.getByLabelText(/Skonto in Basispunkten für neuen Rechnungsentwurf/i), {
      target: { value: "99999" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Rechnungsentwurf anlegen/i }));
    await waitFor(() => {
      expect(screen.queryByTestId("finance-prep-notice")).not.toBeNull();
    });
    expect(screen.getByText(/ganze Zahl von 0 bis 10_000/i)).not.toBeNull();
  });

  it("aria-live Schritt 3 endet wieder bei bereit nach erfolgreichem Rechnungsladen", async () => {
    const demoInvoiceId = "44444444-4444-4444-8444-444444444444";
    const getInvoice = vi.fn().mockResolvedValue({
      invoiceId: demoInvoiceId,
      projectId: "10101010-1010-4010-8010-101010101010",
      customerId: "20202020-2020-4020-8020-202020202020",
      measurementId: "m",
      lvVersionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001",
      offerId: "o",
      offerVersionId: "33333333-3333-4333-8333-333333333333",
      status: "GEBUCHT_VERSENDET",
      skontoBps: 0,
      lvNetCents: 100_000,
      vatRateBps: 1900,
      vatCents: 19_000,
      totalGrossCents: 119_000,
      totalPaidCents: 0,
      invoiceTaxRegime: "STANDARD_VAT_19" as const,
    });
    const api = { ...noopApi, getInvoice } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
    });
    const live = screen.getByTestId("finance-prep-step-status-3");
    expect(live.textContent).toContain("bereit");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Rechnung laden$/i }));
    });
    await waitFor(() => expect(getInvoice).toHaveBeenCalled());
    await waitFor(() => expect(live.textContent).toContain("bereit"));
  });

  it("Schritt 3 zeigt Pflicht-Hinweise wenn GET Rechnung mandatoryTaxNoticeLines liefert (FIN-5)", async () => {
    const invoiceId = "57575757-5757-4575-8575-575757575757";
    const line = "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).";
    const getInvoice = vi.fn().mockResolvedValue({
      invoiceId,
      projectId: "10101010-1010-4010-8010-101010101010",
      customerId: "20202020-2020-4020-8020-202020202020",
      measurementId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001",
      lvVersionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001",
      offerId: "22222222-2222-4222-8222-222222222222",
      offerVersionId: "33333333-3333-4333-8333-333333333333",
      status: "ENTWURF",
      skontoBps: 0,
      lvNetCents: 8000,
      vatRateBps: 0,
      vatCents: 0,
      totalGrossCents: 8000,
      invoiceTaxRegime: "SMALL_BUSINESS_19" as const,
      mandatoryTaxNoticeLines: [line],
    });
    const api = { ...noopApi, getInvoice } as unknown as ApiClient;
    await act(async () => {
      render(<FinancePreparation api={api} />);
    });
    fireEvent.change(screen.getByLabelText(/Rechnungs-ID für GET/i), { target: { value: invoiceId } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Rechnung laden$/i }));
    });
    await waitFor(() => expect(getInvoice).toHaveBeenCalledWith(invoiceId));
    await screen.findByTestId("finance-invoice-mandatory-tax-notices");
    expect(screen.getByText(line)).not.toBeNull();
  });


});

describe("hash-route — Finanz-Vorbereitung (Deep-Link)", () => {
  it("isFinancePrepHashPath", () => {
    expect(isFinancePrepHashPath("/finanz-vorbereitung")).toBe(true);
    expect(isFinancePrepHashPath("/finanz-grundeinstellungen")).toBe(true);
    expect(isFinancePrepHashPath("/")).toBe(false);
  });

  it("resolveFinancePrepInitialMainTab", () => {
    expect(resolveFinancePrepInitialMainTab("/finanz-grundeinstellungen", new URLSearchParams())).toBe("grundeinstellungen");
    expect(resolveFinancePrepInitialMainTab("/finanz-vorbereitung", new URLSearchParams("tab=mahnwesen"))).toBe("mahnwesen");
    expect(resolveFinancePrepInitialMainTab("/finanz-vorbereitung", new URLSearchParams("tab=bad"))).toBe("rechnung");
  });

  it("financePrepHashWithTab", () => {
    expect(financePrepHashWithTab("grundeinstellungen")).toBe("#/finanz-grundeinstellungen");
    expect(financePrepHashWithTab("fortgeschritten")).toBe("#/finanz-vorbereitung?tab=fortgeschritten");
  });

  it("Seitentitel bei initialem Tab Grundeinstellungen (Alias-Pfad)", async () => {
    await act(async () => {
      render(<FinancePreparation api={noopApi as unknown as ApiClient} initialMainTab="grundeinstellungen" />);
    });
    expect(screen.getByRole("heading", { name: /Finanz \(Vorbereitung\) — Mahn-Grundeinstellungen/i })).not.toBeNull();
  });
});

describe("FinanceStructuredApiError — Nutzerhinweise", () => {
  it("zeigt Zusatztext bei DOCUMENT_NOT_FOUND", () => {
    render(
      <FinanceStructuredApiError
        status={404}
        envelope={{
          code: "DOCUMENT_NOT_FOUND",
          message: "nicht da",
          correlationId: "c-doc",
          retryable: false,
          blocking: true,
        }}
      />,
    );
    expect(screen.getByText(/nicht gefunden oder gehört nicht zum aktuellen Mandanten/i)).not.toBeNull();
    expect(screen.getByText("c-doc")).not.toBeNull();
    expect(screen.getByTestId("finance-structured-api-error-disclaimer")).not.toBeNull();
  });

  it("zeigt OFF-Hinweis bei DUNNING_REMINDER_RUN_DISABLED ohne generischen DOCUMENT-Hinweis", () => {
    render(
      <FinanceStructuredApiError
        status={409}
        envelope={{
          code: "DUNNING_REMINDER_RUN_DISABLED",
          message: "off",
          correlationId: "c-off",
          retryable: false,
          blocking: true,
        }}
      />,
    );
    expect(screen.getByText(/Mandanten-Mahnlauf ist auf/i)).not.toBeNull();
    expect(screen.queryByText(/nicht gefunden oder gehört nicht/i)).toBeNull();
    expect(screen.getByTestId("finance-structured-api-error-disclaimer")).not.toBeNull();
  });
});
