import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyFinancePrepTabToLocationHash,
  financePrepHashWithTab,
  FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH,
  FINANCE_PREP_HASH,
  type FinancePrepMainTab,
} from "../lib/hash-route.js";
import { DEMO_SEED_IDS } from "../lib/demo-seed-ids.js";
import { repoDocHref } from "../lib/repo-doc-links.js";
import type {
  ApiClient,
  DunningReminderReadRow,
  DunningStageConfigReadRow,
  InvoiceOverview,
  PaymentIntakeReadRow,
} from "../lib/api-client.js";
import { ApiError } from "../lib/api-error.js";
import {
  BOOK_INVOICE_ACTION_ID,
  RECORD_DUNNING_REMINDER_ACTION_ID,
  RECORD_PAYMENT_INTAKE_ACTION_ID,
} from "../lib/finance-sot.js";
import { FinanceFeatureMatrix } from "./finance/FinanceFeatureMatrix.js";
import { FinanceDunningGrundeinstellungenPanel } from "./finance/FinanceDunningGrundeinstellungenPanel.js";
import { FinancePreparationDunningPanel } from "./finance/FinancePreparationDunningPanel.js";
import { FinancePreparationPaymentPanel } from "./finance/FinancePreparationPaymentPanel.js";
import { FinanceStructuredApiError } from "./finance/FinanceStructuredApiError.js";
import type { FinNotice } from "./finance/finance-prep-types.js";
import {
  DEMO_CUSTOMER_ID,
  DEMO_INVOICE_ID,
  DEMO_PROJECT_ID,
  DOC_LINKS,
  formatEurFromCents,
  openAmountCents,
  type SotEntityType,
} from "./finance/finance-preparation-meta.js";
import { FinancePrepStepAudit } from "./finance/preparation/FinancePrepStepAudit.js";
import { FinancePrepStepDraft } from "./finance/preparation/FinancePrepStepDraft.js";
import { FinancePrepStepInvoice } from "./finance/preparation/FinancePrepStepInvoice.js";
import { FinancePrepStepSot } from "./finance/preparation/FinancePrepStepSot.js";
import { FinancePrepStepTerms } from "./finance/preparation/FinancePrepStepTerms.js";
import { formatSkontoDisplay, isUuidShape } from "./finance/finance-prep-helpers.js";

export function FinancePreparation({ api, initialMainTab }: { api: ApiClient; initialMainTab?: FinancePrepMainTab }) {
  const [projectId, setProjectId] = useState(DEMO_PROJECT_ID);
  const [termsLabel, setTermsLabel] = useState("14 Tage netto");
  const [listJson, setListJson] = useState<string>("");
  const [draftJson, setDraftJson] = useState<string>("");
  const [draftSkontoBps, setDraftSkontoBps] = useState("0");
  const [draftSummary, setDraftSummary] = useState<string | null>(null);
  const [invoiceIdRead, setInvoiceIdRead] = useState(DEMO_INVOICE_ID);
  const [invoiceOverview, setInvoiceOverview] = useState<InvoiceOverview | null>(null);
  const [intakeAmountCents, setIntakeAmountCents] = useState("100");
  const [intakeExternalRef, setIntakeExternalRef] = useState("PWA-DEMO-INTAKE-1");
  const [intakeResultJson, setIntakeResultJson] = useState<string>("");
  const [dunningStageOrdinal, setDunningStageOrdinal] = useState("1");
  const [dunningNote, setDunningNote] = useState("");
  const [dunningResultJson, setDunningResultJson] = useState<string>("");
  const [dunningReminderConfigJson, setDunningReminderConfigJson] = useState<string>("");
  const [dunningTemplatesJson, setDunningTemplatesJson] = useState<string>("");
  const [dunningEmailFooterJson, setDunningEmailFooterJson] = useState<string>("");
  const [dunningAutomationJson, setDunningAutomationJson] = useState<string>("");
  const [dunningAutomationRunMode, setDunningAutomationRunMode] = useState<"OFF" | "SEMI">("SEMI");
  /** Servertreu nach GET/PATCH Automation (nur OFF/SEMI). */
  const [dunningAutomationServerRunMode, setDunningAutomationServerRunMode] = useState<"OFF" | "SEMI" | null>(null);
  const [financePrepMainTab, setFinancePrepMainTab] = useState<FinancePrepMainTab>(() => initialMainTab ?? "rechnung");

  const selectFinancePrepMainTab = useCallback((t: FinancePrepMainTab) => {
    setFinancePrepMainTab(t);
    applyFinancePrepTabToLocationHash(t);
  }, []);
  const [dunningAutomationIanaTimezone, setDunningAutomationIanaTimezone] = useState("Europe/Berlin");
  const [dunningAutomationFederalState, setDunningAutomationFederalState] = useState("");
  const [dunningAutomationPaymentTermDayKind, setDunningAutomationPaymentTermDayKind] = useState<"CALENDAR" | "BUSINESS">(
    "CALENDAR",
  );
  const [dunningAutomationPreferredChannel, setDunningAutomationPreferredChannel] = useState<"EMAIL" | "PRINT">("EMAIL");
  const [dunningAutomationPatchReason, setDunningAutomationPatchReason] = useState(
    "Finanz-Vorbereitung PATCH Mandanten-Automation (Mahnmodus)",
  );
  const [dunningBatchAsOfDate, setDunningBatchAsOfDate] = useState("");
  const [dunningBatchRunJson, setDunningBatchRunJson] = useState("");
  const [dunningCandidatesJson, setDunningCandidatesJson] = useState("");
  const [dunningBatchEmailItemsJson, setDunningBatchEmailItemsJson] = useState("[]");
  const [dunningBatchEmailResultJson, setDunningBatchEmailResultJson] = useState("");
  const [dunningEmailPreviewJson, setDunningEmailPreviewJson] = useState<string>("");
  const [dunningEmailSendStubJson, setDunningEmailSendStubJson] = useState<string>("");
  const [dunningEmailSendJson, setDunningEmailSendJson] = useState<string>("");
  const [dunningEmailRecipient, setDunningEmailRecipient] = useState("demo-recipient@example.com");
  const [footerPatchReason, setFooterPatchReason] = useState("Finanz-Vorbereitung PATCH E-Mail-Footer");
  const [footerCompanyLegalName, setFooterCompanyLegalName] = useState("");
  const [footerStreetLine, setFooterStreetLine] = useState("");
  const [footerPostalCode, setFooterPostalCode] = useState("");
  const [footerCity, setFooterCity] = useState("");
  const [footerCountryCode, setFooterCountryCode] = useState("");
  const [footerPublicEmail, setFooterPublicEmail] = useState("");
  const [footerPublicPhone, setFooterPublicPhone] = useState("");
  const [footerLegalRepresentative, setFooterLegalRepresentative] = useState("");
  const [footerRegisterCourt, setFooterRegisterCourt] = useState("");
  const [footerRegisterNumber, setFooterRegisterNumber] = useState("");
  const [footerVatId, setFooterVatId] = useState("");
  const [footerSignatureLine, setFooterSignatureLine] = useState("");
  const [configPutJson, setConfigPutJson] = useState<string>("");
  const [configPutReason, setConfigPutReason] = useState<string>("Finanz-Vorbereitung PUT Mahnstufen");
  const [configPatchOrdinal, setConfigPatchOrdinal] = useState<string>("1");
  const [configPatchDays, setConfigPatchDays] = useState<string>("");
  const [configPatchFee, setConfigPatchFee] = useState<string>("");
  const [configPatchLabel, setConfigPatchLabel] = useState<string>("");
  const [configPatchReason, setConfigPatchReason] = useState<string>("Finanz-Vorbereitung PATCH Mahnstufe");
  const [configDeleteOrdinal, setConfigDeleteOrdinal] = useState<string>("1");
  const [configDeleteReason, setConfigDeleteReason] = useState<string>("Finanz-Vorbereitung Soft-Delete Mahnstufe");
  const [auditJson, setAuditJson] = useState<string>("");
  const [sotEntityType, setSotEntityType] = useState<SotEntityType>("OFFER_VERSION");
  const [sotDocumentId, setSotDocumentId] = useState<string>(DEMO_SEED_IDS.offerVersionId);
  const [sotJson, setSotJson] = useState<string>("");
  const [invoiceAllowedActions, setInvoiceAllowedActions] = useState<string[] | null>(null);
  const [paymentIntakes, setPaymentIntakes] = useState<PaymentIntakeReadRow[] | null>(null);
  const [dunningReminders, setDunningReminders] = useState<DunningReminderReadRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<FinNotice | null>(null);
  const [issueDateBook, setIssueDateBook] = useState("");
  const [paymentPanelError, setPaymentPanelError] = useState<FinNotice | null>(null);
  const [dunningPanelError, setDunningPanelError] = useState<FinNotice | null>(null);
  const [bookPanelError, setBookPanelError] = useState<FinNotice | null>(null);

  const canRecordPaymentIntake = invoiceAllowedActions?.includes(RECORD_PAYMENT_INTAKE_ACTION_ID) === true;
  const canRecordDunningReminder = invoiceAllowedActions?.includes(RECORD_DUNNING_REMINDER_ACTION_ID) === true;
  const canBookInvoice = invoiceAllowedActions?.includes(BOOK_INVOICE_ACTION_ID) === true;
  const invoiceIdLooksValid = isUuidShape(invoiceIdRead);
  const hasLoadedInvoice = invoiceOverview != null;

  const dunningFooterReadyForEmail = useMemo(() => {
    try {
      const d = JSON.parse(dunningEmailFooterJson) as { data?: { readyForEmailFooter?: boolean } };
      return d?.data?.readyForEmailFooter === true;
    } catch {
      return false;
    }
  }, [dunningEmailFooterJson]);

  const canSendDunningReminderEmail =
    canRecordDunningReminder && hasLoadedInvoice && dunningFooterReadyForEmail;

  const loadDunningReads = useCallback(async () => {
    try {
      const [cfg, tpl, footer, dunningAutomationRead] = await Promise.all([
        api.getDunningReminderConfig(),
        api.getDunningReminderTemplates(),
        api.getDunningEmailFooter(),
        api.getDunningReminderAutomation(),
      ]);
      setDunningReminderConfigJson(JSON.stringify(cfg, null, 2));
      setDunningTemplatesJson(JSON.stringify(tpl, null, 2));
      setDunningEmailFooterJson(JSON.stringify(footer, null, 2));
      setDunningAutomationJson(JSON.stringify(dunningAutomationRead, null, 2));
      const srvRm = dunningAutomationRead.data.runMode;
      setDunningAutomationServerRunMode(srvRm);
      setDunningAutomationRunMode(srvRm);
      setDunningAutomationIanaTimezone(dunningAutomationRead.data.ianaTimezone?.trim() || "Europe/Berlin");
      setDunningAutomationFederalState(dunningAutomationRead.data.federalStateCode ?? "");
      setDunningAutomationPaymentTermDayKind(dunningAutomationRead.data.paymentTermDayKind ?? "CALENDAR");
      setDunningAutomationPreferredChannel(dunningAutomationRead.data.preferredDunningChannel ?? "EMAIL");
      setDunningPanelError(null);
    } catch (e) {
      setDunningReminderConfigJson("");
      setDunningTemplatesJson("");
      setDunningEmailFooterJson("");
      setDunningAutomationJson("");
      setDunningAutomationServerRunMode(null);
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    }
  }, [api]);

  useEffect(() => {
    void loadDunningReads();
  }, [loadDunningReads]);

  const loadPaymentTerms = useCallback(async () => {
    setNotice(null);
    setBusy(true);
    try {
      const data = await api.getPaymentTermsByProject(projectId.trim());
      setListJson(JSON.stringify(data, null, 2));
    } catch (e) {
      setListJson("");
      setNotice(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, projectId]);

  const createPaymentTermsVersion = useCallback(async () => {
    setNotice(null);
    setBusy(true);
    try {
      await api.requestJson("POST", "/finance/payment-terms/versions", {
        projectId: projectId.trim(),
        customerId: DEMO_CUSTOMER_ID,
        termsLabel: termsLabel.trim() || "Kondition",
        reason: "Demo aus Finanz-Vorbereitung (FIN-1)",
      });
      await loadPaymentTerms();
    } catch (e) {
      setNotice(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, projectId, termsLabel, loadPaymentTerms]);

  const createInvoiceDraft = useCallback(async () => {
    setNotice(null);
    const bps = Number.parseInt(draftSkontoBps.trim(), 10);
    if (!Number.isFinite(bps) || bps < 0 || bps > 10_000) {
      setNotice({ kind: "text", text: "Skonto (Basispunkte): ganze Zahl von 0 bis 10_000 (z. B. 200 = 2 %)." });
      return;
    }
    setBusy(true);
    try {
      const data = await api.createInvoiceDraft({
        lvVersionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001",
        offerVersionId: "33333333-3333-4333-8333-333333333333",
        invoiceCurrencyCode: "EUR",
        skontoBps: bps,
        reason: "Demo-Rechnungsentwurf aus Finanz-Vorbereitung (FIN-2)",
      });
      setDraftJson(JSON.stringify(data, null, 2));
      setDraftSummary(
        `Skonto ${formatSkontoDisplay(data.skontoBps)} — Netto (nach 8.4) ${formatEurFromCents(data.lvNetCents)} · USt ${formatEurFromCents(data.vatCents)} · Brutto ${formatEurFromCents(data.totalGrossCents)}`,
      );
      setInvoiceIdRead(data.invoiceId);
      setInvoiceAllowedActions(null);
      setPaymentIntakes(null);
      setDunningReminders(null);
    } catch (e) {
      setDraftJson("");
      setDraftSummary(null);
      setNotice(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, draftSkontoBps]);

  const loadInvoice = useCallback(async (overrideInvoiceId?: string) => {
    setNotice(null);
    setPaymentPanelError(null);
    setDunningPanelError(null);
    setBookPanelError(null);
    setBusy(true);
    try {
      const id = (overrideInvoiceId ?? invoiceIdRead).trim();
      const data = await api.getInvoice(id);
      setInvoiceOverview(data);
      const [sot, payList, dunList] = await Promise.all([
        api.getAllowedActions(id, "INVOICE"),
        api.listInvoicePaymentIntakes(id),
        api.listInvoiceDunningReminders(id),
      ]);
      setInvoiceAllowedActions(sot.allowedActions);
      setPaymentIntakes(payList.data);
      setDunningReminders(dunList.data);
    } catch (e) {
      setInvoiceOverview(null);
      setInvoiceAllowedActions(null);
      setPaymentIntakes(null);
      setDunningReminders(null);
      setNotice(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, invoiceIdRead]);

  useEffect(() => {
    if (invoiceOverview) {
      setDraftSkontoBps(String(invoiceOverview.skontoBps));
    }
  }, [invoiceOverview]);

  const submitEntwurfSkontoRecalc = useCallback(async () => {
    setNotice(null);
    if (!invoiceOverview || invoiceOverview.status !== "ENTWURF") {
      setNotice({ kind: "text", text: "Nur für Rechnungen im Status ENTWURF." });
      return;
    }
    if (!invoiceOverview.offerVersionId) {
      setNotice({ kind: "text", text: "Rechnung ohne offerVersionId — Traceability unvollständig." });
      return;
    }
    const bps = Number.parseInt(draftSkontoBps.trim(), 10);
    if (!Number.isFinite(bps) || bps < 0 || bps > 10_000) {
      setNotice({ kind: "text", text: "Skonto (Basispunkte): ganze Zahl von 0 bis 10_000." });
      return;
    }
    setBusy(true);
    try {
      const data = await api.createInvoiceDraft({
        lvVersionId: invoiceOverview.lvVersionId,
        offerVersionId: invoiceOverview.offerVersionId,
        invoiceCurrencyCode: "EUR",
        skontoBps: bps,
        reason: "Finanz-Vorbereitung: Skonto auf Entwurf anwenden (POST /invoices)",
      });
      setInvoiceIdRead(data.invoiceId);
      setDraftJson(JSON.stringify(data, null, 2));
      setDraftSummary(
        `Skonto ${formatSkontoDisplay(data.skontoBps)} — Netto (nach 8.4) ${formatEurFromCents(data.lvNetCents)} · USt ${formatEurFromCents(data.vatCents)} · Brutto ${formatEurFromCents(data.totalGrossCents)}`,
      );
      await loadInvoice(data.invoiceId);
    } catch (e) {
      setNotice(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, draftSkontoBps, invoiceOverview, loadInvoice]);

  const bookInvoice = useCallback(async () => {
    setBookPanelError(null);
    setNotice(null);
    if (!invoiceIdLooksValid) {
      setBookPanelError({ kind: "text", text: "Rechnungs-ID muss eine gültige UUID sein (Format prüfen)." });
      return;
    }
    if (!canBookInvoice) {
      setBookPanelError({
        kind: "text",
        text: `Buchung nur mit SoT-Aktion ${BOOK_INVOICE_ACTION_ID}: zuerst „GET Rechnung laden“ (Status ENTWURF; Rolle ADMIN/BUCHHALTUNG/GESCHAEFTSFUEHRUNG).`,
      });
      return;
    }
    const d = issueDateBook.trim();
    if (d && !/^\d{4}-\d{2}-\d{2}$/u.test(d)) {
      setBookPanelError({ kind: "text", text: "Optionales Buchungsdatum als ISO yyyy-mm-dd (UTC-Logik serverseitig)." });
      return;
    }
    setBusy(true);
    try {
      await api.requestJson("POST", `/invoices/${encodeURIComponent(invoiceIdRead.trim())}/book`, {
        reason: "Rechnungsbuchung aus Finanz-Vorbereitung (FIN-2 Demo)",
        ...(d ? { issueDate: d } : {}),
      });
      await loadInvoice();
    } catch (e) {
      setBookPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, canBookInvoice, invoiceIdLooksValid, invoiceIdRead, issueDateBook, loadInvoice]);

  const loadSotAllowedActions = useCallback(async () => {
    setNotice(null);
    setBusy(true);
    try {
      const res = await api.getAllowedActions(sotDocumentId.trim(), sotEntityType);
      setSotJson(JSON.stringify(res, null, 2));
    } catch (e) {
      setSotJson("");
      setNotice(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, sotDocumentId, sotEntityType]);

  const applyOpenBalanceToIntake = useCallback(() => {
    const open = openAmountCents(invoiceOverview);
    if (open != null && open > 0) setIntakeAmountCents(String(open));
  }, [invoiceOverview]);

  const submitPaymentIntake = useCallback(async () => {
    setNotice(null);
    setPaymentPanelError(null);
    setBusy(true);
    setIntakeResultJson("");
    try {
      if (!canRecordPaymentIntake) {
        setPaymentPanelError({
          kind: "text",
          text: `Zahlungseingang nur mit SoT-Aktion ${RECORD_PAYMENT_INTAKE_ACTION_ID}: zuerst „GET Rechnung laden“ (gebuchte oder teilbezahlte Rechnung; Rolle ADMIN/BUCHHALTUNG/GESCHAEFTSFUEHRUNG).`,
        });
        return;
      }
      const amount = Number.parseInt(intakeAmountCents.trim(), 10);
      if (!Number.isFinite(amount) || amount < 1) {
        setPaymentPanelError({ kind: "text", text: "Zahlungsbetrag (Cent) muss eine ganze Zahl ≥ 1 sein." });
        return;
      }
      const idem = crypto.randomUUID();
      const out = await api.recordPaymentIntake(
        {
          invoiceId: invoiceIdRead.trim(),
          amountCents: amount,
          externalReference: intakeExternalRef.trim() || "PWA-INTAKE",
          reason: "Zahlungseingang aus Finanz-Vorbereitung (FIN-3 Demo)",
        },
        idem,
      );
      setIntakeResultJson(JSON.stringify(out, null, 2));
      await loadInvoice();
    } catch (e) {
      setIntakeResultJson("");
      setPaymentPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, canRecordPaymentIntake, intakeAmountCents, intakeExternalRef, invoiceIdRead, loadInvoice]);

  const submitDunningReminder = useCallback(async () => {
    setNotice(null);
    setDunningPanelError(null);
    setBusy(true);
    setDunningResultJson("");
    try {
      if (!canRecordDunningReminder) {
        setDunningPanelError({
          kind: "text",
          text: `Mahn-Ereignis nur mit SoT-Aktion ${RECORD_DUNNING_REMINDER_ACTION_ID}: zuerst „GET Rechnung laden“ (gebuchte oder teilbezahlte Rechnung).`,
        });
        return;
      }
      const stage = Number.parseInt(dunningStageOrdinal.trim(), 10);
      if (!Number.isFinite(stage) || stage < 1 || stage > 9) {
        setDunningPanelError({ kind: "text", text: "Mahn-Stufe muss eine ganze Zahl von 1 bis 9 sein." });
        return;
      }
      const body: { stageOrdinal: number; reason: string; note?: string } = {
        stageOrdinal: stage,
        reason: "Mahn-Ereignis aus Finanz-Vorbereitung (FIN-4 Demo)",
      };
      const n = dunningNote.trim();
      if (n) body.note = n;
      const out = await api.createInvoiceDunningReminder(invoiceIdRead.trim(), body);
      setDunningResultJson(JSON.stringify(out, null, 2));
      await loadInvoice();
    } catch (e) {
      setDunningResultJson("");
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, canRecordDunningReminder, dunningNote, dunningStageOrdinal, invoiceIdRead, loadInvoice]);

  const submitDunningTenantAutomationPatch = useCallback(async () => {
    setDunningPanelError(null);
    setNotice(null);
    setBusy(true);
    try {
      const r = dunningAutomationPatchReason.trim();
      if (r.length < 5) {
        setDunningPanelError({ kind: "text", text: "Grund für Automation-PATCH mindestens 5 Zeichen." });
        return;
      }
      const tz = dunningAutomationIanaTimezone.trim();
      if (!tz || tz.length > 64) {
        setDunningPanelError({ kind: "text", text: "IANA-Zeitzone 1–64 Zeichen (z. B. Europe/Berlin)." });
        return;
      }
      const fs = dunningAutomationFederalState.trim().toUpperCase();
      if (fs.length === 1) {
        setDunningPanelError({
          kind: "text",
          text: "Bundesland leer oder 2–4 Zeichen (z. B. BY, BW) oder Feld leer lassen.",
        });
        return;
      }
      if (fs.length > 4) {
        setDunningPanelError({ kind: "text", text: "Bundesland höchstens 4 Zeichen." });
        return;
      }
      const out = await api.patchDunningReminderAutomation({
        reason: r,
        runMode: dunningAutomationRunMode,
        ianaTimezone: tz,
        federalStateCode: fs.length === 0 ? null : fs,
        paymentTermDayKind: dunningAutomationPaymentTermDayKind,
        preferredDunningChannel: dunningAutomationPreferredChannel,
      });
      setDunningAutomationJson(JSON.stringify(out, null, 2));
      const outRm = out.data.runMode;
      setDunningAutomationServerRunMode(outRm);
      setDunningAutomationRunMode(outRm);
      setDunningAutomationIanaTimezone(out.data.ianaTimezone);
      setDunningAutomationFederalState(out.data.federalStateCode ?? "");
      setDunningAutomationPaymentTermDayKind(out.data.paymentTermDayKind);
      setDunningAutomationPreferredChannel(out.data.preferredDunningChannel);
    } catch (e) {
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [
    api,
    dunningAutomationFederalState,
    dunningAutomationIanaTimezone,
    dunningAutomationPatchReason,
    dunningAutomationPaymentTermDayKind,
    dunningAutomationPreferredChannel,
    dunningAutomationRunMode,
  ]);

  const submitDunningBatchDryRun = useCallback(async () => {
    setDunningPanelError(null);
    setBusy(true);
    setDunningBatchRunJson("");
    try {
      const stage = Number.parseInt(dunningStageOrdinal.trim(), 10);
      if (!Number.isFinite(stage) || stage < 1 || stage > 9) {
        setDunningPanelError({ kind: "text", text: "Mahn-Stufe (Batch) 1–9." });
        return;
      }
      const asOf = dunningBatchAsOfDate.trim();
      const out = await api.postDunningReminderRunDryRun({
        stageOrdinal: stage,
        reason: "Finanz-Vorbereitung Mahnlauf DRY_RUN (M4 5b-1)",
        ...(asOf ? { asOfDate: asOf } : {}),
      });
      setDunningBatchRunJson(JSON.stringify(out, null, 2));
    } catch (e) {
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, dunningBatchAsOfDate, dunningStageOrdinal]);

  const submitDunningBatchExecute = useCallback(async () => {
    setDunningPanelError(null);
    if (!canRecordDunningReminder) {
      setDunningPanelError({
        kind: "text",
        text: `Batch-Ausführung nur mit SoT ${RECORD_DUNNING_REMINDER_ACTION_ID} — Rechnung laden (gebucht/teilbezahlt).`,
      });
      return;
    }
    if (!globalThis.confirm("Mahnlauf EXECUTE für alle Kandidaten dieser Stufe buchen? (neuer Idempotency-Key pro Klick)")) {
      return;
    }
    setBusy(true);
    setDunningBatchRunJson("");
    try {
      const stage = Number.parseInt(dunningStageOrdinal.trim(), 10);
      if (!Number.isFinite(stage) || stage < 1 || stage > 9) {
        setDunningPanelError({ kind: "text", text: "Mahn-Stufe (Batch) 1–9." });
        return;
      }
      const asOf = dunningBatchAsOfDate.trim();
      const idem = crypto.randomUUID();
      const out = await api.postDunningReminderRunExecute(
        {
          stageOrdinal: stage,
          reason: "Finanz-Vorbereitung Mahnlauf EXECUTE (M4 5b-1)",
          ...(asOf ? { asOfDate: asOf } : {}),
        },
        idem,
      );
      setDunningBatchRunJson(JSON.stringify(out, null, 2));
      await loadInvoice();
      await loadDunningReads();
    } catch (e) {
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, canRecordDunningReminder, dunningBatchAsOfDate, dunningStageOrdinal, loadInvoice, loadDunningReads]);

  const submitLoadDunningCandidates = useCallback(async () => {
    setDunningPanelError(null);
    setBusy(true);
    setDunningCandidatesJson("");
    try {
      const stage = Number.parseInt(dunningStageOrdinal.trim(), 10);
      if (!Number.isFinite(stage) || stage < 1 || stage > 9) {
        setDunningPanelError({ kind: "text", text: "Mahn-Stufe für Kandidaten 1–9 (gleiches Feld wie Einzel-Mahnung im Tab Mahnwesen)." });
        return;
      }
      const asOf = dunningBatchAsOfDate.trim();
      const out = await api.getDunningReminderCandidates({
        stageOrdinal: stage,
        ...(asOf ? { asOfDate: asOf } : {}),
      });
      setDunningCandidatesJson(JSON.stringify(out, null, 2));
    } catch (e) {
      setDunningCandidatesJson("");
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, dunningBatchAsOfDate, dunningStageOrdinal]);

  const prefillBatchEmailItemsFromCandidates = useCallback(() => {
    setDunningPanelError(null);
    try {
      const raw = dunningCandidatesJson.trim();
      if (!raw) {
        setDunningPanelError({ kind: "text", text: "Zuerst Kandidaten laden." });
        return;
      }
      const o = JSON.parse(raw) as { data?: { candidates?: Array<{ invoiceId: string }> } };
      const list = o?.data?.candidates;
      if (!Array.isArray(list) || list.length === 0) {
        setDunningPanelError({ kind: "text", text: "Keine Kandidaten im JSON." });
        return;
      }
      const items = list.map((c) => ({
        invoiceId: c.invoiceId,
        toEmail: "bitte-ersetzen@example.com",
      }));
      setDunningBatchEmailItemsJson(JSON.stringify(items, null, 2));
    } catch {
      setDunningPanelError({ kind: "text", text: "Kandidaten-JSON ungültig." });
    }
  }, [dunningCandidatesJson]);

  const submitDunningBatchEmailDryRun = useCallback(async () => {
    setDunningPanelError(null);
    setBusy(true);
    setDunningBatchEmailResultJson("");
    try {
      const stage = Number.parseInt(dunningStageOrdinal.trim(), 10);
      if (!Number.isFinite(stage) || stage < 1 || stage > 9) {
        setDunningPanelError({ kind: "text", text: "Mahn-Stufe 1–9." });
        return;
      }
      const asOf = dunningBatchAsOfDate.trim();
      let items: unknown;
      try {
        items = JSON.parse(dunningBatchEmailItemsJson.trim());
      } catch {
        setDunningPanelError({ kind: "text", text: "items-JSON ungültig." });
        return;
      }
      if (!Array.isArray(items) || items.length === 0) {
        setDunningPanelError({ kind: "text", text: "items muss ein nicht-leeres Array sein." });
        return;
      }
      const out = await api.postDunningReminderBatchSendEmails({
        stageOrdinal: stage,
        reason: "Finanz-Vorbereitung Batch-E-Mail DRY_RUN (M4 5c)",
        mode: "DRY_RUN",
        ...(asOf ? { asOfDate: asOf } : {}),
        items: items as Array<{ invoiceId: string; toEmail: string; idempotencyKey?: string }>,
      });
      setDunningBatchEmailResultJson(JSON.stringify(out, null, 2));
    } catch (e) {
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, dunningBatchAsOfDate, dunningBatchEmailItemsJson, dunningStageOrdinal]);

  const submitDunningBatchEmailExecute = useCallback(async () => {
    setDunningPanelError(null);
    if (!canRecordDunningReminder) {
      setDunningPanelError({
        kind: "text",
        text: `Batch-E-Mail EXECUTE nur mit SoT ${RECORD_DUNNING_REMINDER_ACTION_ID} — gebuchte/teilbezahlte Rechnung laden.`,
      });
      return;
    }
    setBusy(true);
    setDunningBatchEmailResultJson("");
    try {
      const stage = Number.parseInt(dunningStageOrdinal.trim(), 10);
      if (!Number.isFinite(stage) || stage < 1 || stage > 9) {
        setDunningPanelError({ kind: "text", text: "Mahn-Stufe 1–9." });
        return;
      }
      const asOf = dunningBatchAsOfDate.trim();
      let items: Array<{ invoiceId: string; toEmail: string; idempotencyKey?: string }>;
      try {
        items = JSON.parse(dunningBatchEmailItemsJson.trim()) as Array<{
          invoiceId: string;
          toEmail: string;
          idempotencyKey?: string;
        }>;
      } catch {
        setDunningPanelError({ kind: "text", text: "items-JSON ungültig." });
        return;
      }
      if (!Array.isArray(items) || items.length === 0) {
        setDunningPanelError({ kind: "text", text: "items muss ein nicht-leeres Array sein." });
        return;
      }
      const augmented = items.map((row) => ({
        ...row,
        idempotencyKey: row.idempotencyKey?.trim() ? row.idempotencyKey.trim() : crypto.randomUUID(),
      }));
      if (
        !globalThis.confirm(
          `Massen-E-Mail EXECUTE: ${String(augmented.length)} Zeile(n). SMTP wird pro Zeile wie 5a ausgeführt. Fortfahren?`,
        )
      ) {
        return;
      }
      if (!globalThis.confirm("Zweite Bestätigung: confirmBatchSend=true — kein stiller Massenversand.")) {
        return;
      }
      const out = await api.postDunningReminderBatchSendEmails({
        stageOrdinal: stage,
        reason: "Finanz-Vorbereitung Batch-E-Mail EXECUTE (M4 5c)",
        mode: "EXECUTE",
        confirmBatchSend: true,
        ...(asOf ? { asOfDate: asOf } : {}),
        items: augmented,
      });
      setDunningBatchEmailResultJson(JSON.stringify(out, null, 2));
      await loadDunningReads();
    } catch (e) {
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, canRecordDunningReminder, dunningBatchAsOfDate, dunningBatchEmailItemsJson, dunningStageOrdinal, loadDunningReads]);

  const prefillConfigPutFromGet = useCallback(() => {
    setDunningPanelError(null);
    try {
      const cfg = JSON.parse(dunningReminderConfigJson) as { data?: { stages: DunningStageConfigReadRow[] } };
      if (!cfg.data?.stages || cfg.data.stages.length !== 9) {
        setDunningPanelError({ kind: "text", text: "Zuerst gültiges GET-Konfig-JSON mit 9 Stufen laden." });
        return;
      }
      setConfigPutJson(JSON.stringify({ stages: cfg.data.stages, reason: configPutReason.trim() }, null, 2));
    } catch {
      setDunningPanelError({ kind: "text", text: "Konfig-JSON konnte nicht geparst werden." });
    }
  }, [configPutReason, dunningReminderConfigJson]);

  const submitDunningConfigPut = useCallback(async () => {
    setDunningPanelError(null);
    setNotice(null);
    setBusy(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(configPutJson.trim()) as { stages?: unknown; reason?: string };
      } catch {
        setDunningPanelError({ kind: "text", text: "PUT-JSON ungültig — gültiges JSON mit stages und reason." });
        return;
      }
      if (!parsed || typeof parsed !== "object") {
        setDunningPanelError({ kind: "text", text: "PUT-JSON: Objekt mit stages und reason erwartet." });
        return;
      }
      const obj = parsed as { stages?: DunningStageConfigReadRow[]; reason?: string };
      if (!Array.isArray(obj.stages) || obj.stages.length !== 9 || typeof obj.reason !== "string" || obj.reason.trim().length < 5) {
        setDunningPanelError({ kind: "text", text: "PUT: genau 9 stages und reason (min. 5 Zeichen) erforderlich." });
        return;
      }
      await api.replaceDunningReminderConfig({ stages: obj.stages, reason: obj.reason.trim() });
      await loadDunningReads();
    } catch (e) {
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, configPutJson, loadDunningReads]);

  const submitDunningConfigPatch = useCallback(async () => {
    setDunningPanelError(null);
    setNotice(null);
    setBusy(true);
    try {
      const ord = Number.parseInt(configPatchOrdinal.trim(), 10);
      if (!Number.isFinite(ord) || ord < 1 || ord > 9) {
        setDunningPanelError({ kind: "text", text: "PATCH: Stufe 1–9." });
        return;
      }
      if (configPatchReason.trim().length < 5) {
        setDunningPanelError({ kind: "text", text: "PATCH: reason mindestens 5 Zeichen." });
        return;
      }
      const body: { daysAfterDue?: number; feeCents?: number; label?: string; reason: string } = {
        reason: configPatchReason.trim(),
      };
      if (configPatchDays.trim() !== "") {
        const d = Number.parseInt(configPatchDays.trim(), 10);
        if (!Number.isFinite(d) || d < 0) {
          setDunningPanelError({ kind: "text", text: "PATCH: daysAfterDue nicht negativ / Zahl." });
          return;
        }
        body.daysAfterDue = d;
      }
      if (configPatchFee.trim() !== "") {
        const f = Number.parseInt(configPatchFee.trim(), 10);
        if (!Number.isFinite(f) || f < 0) {
          setDunningPanelError({ kind: "text", text: "PATCH: feeCents nicht negativ / Zahl." });
          return;
        }
        body.feeCents = f;
      }
      if (configPatchLabel.trim() !== "") {
        body.label = configPatchLabel.trim();
      }
      if (body.daysAfterDue === undefined && body.feeCents === undefined && body.label === undefined) {
        setDunningPanelError({ kind: "text", text: "PATCH: mindestens eines von daysAfterDue, feeCents, label setzen." });
        return;
      }
      await api.patchDunningReminderStage(ord, body);
      await loadDunningReads();
    } catch (e) {
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [
    api,
    configPatchDays,
    configPatchFee,
    configPatchLabel,
    configPatchOrdinal,
    configPatchReason,
    loadDunningReads,
  ]);

  const submitDunningConfigDelete = useCallback(async () => {
    setDunningPanelError(null);
    setNotice(null);
    setBusy(true);
    try {
      const ord = Number.parseInt(configDeleteOrdinal.trim(), 10);
      if (!Number.isFinite(ord) || ord < 1 || ord > 9) {
        setDunningPanelError({ kind: "text", text: "DELETE: Stufe 1–9." });
        return;
      }
      if (configDeleteReason.trim().length < 5) {
        setDunningPanelError({ kind: "text", text: "DELETE: reason mindestens 5 Zeichen." });
        return;
      }
      await api.deleteDunningReminderStage(ord, { reason: configDeleteReason.trim() });
      await loadDunningReads();
    } catch (e) {
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, configDeleteOrdinal, configDeleteReason, loadDunningReads]);

  const prefillFooterPatchFromGet = useCallback(() => {
    setDunningPanelError(null);
    try {
      const parsed = JSON.parse(dunningEmailFooterJson) as { data?: Record<string, string> };
      const d = parsed.data;
      if (!d) {
        setDunningPanelError({ kind: "text", text: "Zuerst gültiges GET-Footer-JSON laden." });
        return;
      }
      setFooterCompanyLegalName(String(d.companyLegalName ?? ""));
      setFooterStreetLine(String(d.streetLine ?? ""));
      setFooterPostalCode(String(d.postalCode ?? ""));
      setFooterCity(String(d.city ?? ""));
      setFooterCountryCode(String(d.countryCode ?? ""));
      setFooterPublicEmail(String(d.publicEmail ?? ""));
      setFooterPublicPhone(String(d.publicPhone ?? ""));
      setFooterLegalRepresentative(String(d.legalRepresentative ?? ""));
      setFooterRegisterCourt(String(d.registerCourt ?? ""));
      setFooterRegisterNumber(String(d.registerNumber ?? ""));
      setFooterVatId(String(d.vatId ?? ""));
      setFooterSignatureLine(String(d.signatureLine ?? ""));
    } catch {
      setDunningPanelError({ kind: "text", text: "Footer-JSON konnte nicht geparst werden." });
    }
  }, [dunningEmailFooterJson]);

  const submitFooterPatch = useCallback(async () => {
    setDunningPanelError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (footerPatchReason.trim().length < 5) {
        setDunningPanelError({ kind: "text", text: "PATCH Footer: reason mindestens 5 Zeichen." });
        return;
      }
      const body: Record<string, unknown> & { reason: string } = { reason: footerPatchReason.trim() };
      const put = (k: string, v: string) => {
        const t = v.trim();
        if (t.length > 0) body[k] = t;
      };
      put("companyLegalName", footerCompanyLegalName);
      put("streetLine", footerStreetLine);
      put("postalCode", footerPostalCode);
      put("city", footerCity);
      put("countryCode", footerCountryCode);
      put("publicEmail", footerPublicEmail);
      put("publicPhone", footerPublicPhone);
      put("legalRepresentative", footerLegalRepresentative);
      put("registerCourt", footerRegisterCourt);
      put("registerNumber", footerRegisterNumber);
      put("vatId", footerVatId);
      put("signatureLine", footerSignatureLine);
      const keys = Object.keys(body).filter((k) => k !== "reason");
      if (keys.length === 0) {
        setDunningPanelError({ kind: "text", text: "PATCH Footer: mindestens ein Stammdaten-Feld ausfüllen." });
        return;
      }
      const out = await api.patchDunningEmailFooter(body);
      setDunningEmailFooterJson(JSON.stringify(out, null, 2));
    } catch (e) {
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [
    api,
    footerCity,
    footerCompanyLegalName,
    footerCountryCode,
    footerLegalRepresentative,
    footerPatchReason,
    footerPostalCode,
    footerPublicEmail,
    footerPublicPhone,
    footerRegisterCourt,
    footerRegisterNumber,
    footerSignatureLine,
    footerStreetLine,
    footerVatId,
  ]);

  const submitEmailPreview = useCallback(async () => {
    setDunningPanelError(null);
    setNotice(null);
    setBusy(true);
    setDunningEmailPreviewJson("");
    try {
      if (!hasLoadedInvoice) {
        setDunningPanelError({ kind: "text", text: "Zuerst „GET Rechnung laden“ (Schritt 3)." });
        return;
      }
      const stage = Number.parseInt(dunningStageOrdinal.trim(), 10);
      if (!Number.isFinite(stage) || stage < 1 || stage > 9) {
        setDunningPanelError({ kind: "text", text: "E-Mail-Vorschau: Stufe 1–9." });
        return;
      }
      const out = await api.previewDunningReminderEmail(invoiceIdRead.trim(), {
        stageOrdinal: stage,
        reason: "E-Mail-Vorschau aus Finanz-Vorbereitung (M4 Slice 4)",
      });
      setDunningEmailPreviewJson(JSON.stringify(out, null, 2));
    } catch (e) {
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, dunningStageOrdinal, hasLoadedInvoice, invoiceIdRead]);

  const submitEmailSend = useCallback(async () => {
    setDunningPanelError(null);
    setNotice(null);
    setBusy(true);
    setDunningEmailSendJson("");
    try {
      if (!canSendDunningReminderEmail) {
        setDunningPanelError({
          kind: "text",
          text: `E-Mail-Versand (SMTP) nur mit SoT ${RECORD_DUNNING_REMINDER_ACTION_ID}, geladener Rechnung und technisch vollständigem Footer (readyForEmailFooter).`,
        });
        return;
      }
      const stage = Number.parseInt(dunningStageOrdinal.trim(), 10);
      if (!Number.isFinite(stage) || stage < 1 || stage > 9) {
        setDunningPanelError({ kind: "text", text: "E-Mail-Versand: Stufe 1–9." });
        return;
      }
      const to = dunningEmailRecipient.trim();
      if (!to.includes("@")) {
        setDunningPanelError({ kind: "text", text: "Empfänger: gültige E-Mail-Adresse eintragen." });
        return;
      }
      if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") {
        setDunningPanelError({ kind: "text", text: "crypto.randomUUID nicht verfügbar (Browser zu alt)." });
        return;
      }
      const idem = crypto.randomUUID();
      const out = await api.sendDunningReminderEmail(invoiceIdRead.trim(), idem, {
        stageOrdinal: stage,
        reason: "E-Mail-Versand (SMTP) aus Finanz-Vorbereitung (M4 Slice 5a)",
        toEmail: to,
      });
      setDunningEmailSendJson(JSON.stringify(out, null, 2));
    } catch (e) {
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [
    api,
    canSendDunningReminderEmail,
    dunningEmailRecipient,
    dunningStageOrdinal,
    invoiceIdRead,
  ]);

  const submitEmailSendStub = useCallback(async () => {
    setDunningPanelError(null);
    setNotice(null);
    setBusy(true);
    setDunningEmailSendStubJson("");
    try {
      if (!canRecordDunningReminder) {
        setDunningPanelError({
          kind: "text",
          text: `Versand-Stub nur mit SoT-Aktion ${RECORD_DUNNING_REMINDER_ACTION_ID}: gebuchte/teilbezahlte Rechnung und passende Rolle.`,
        });
        return;
      }
      const stage = Number.parseInt(dunningStageOrdinal.trim(), 10);
      if (!Number.isFinite(stage) || stage < 1 || stage > 9) {
        setDunningPanelError({ kind: "text", text: "Versand-Stub: Stufe 1–9." });
        return;
      }
      const out = await api.sendDunningReminderEmailStub(invoiceIdRead.trim(), {
        stageOrdinal: stage,
        reason: "E-Mail-Versand-Stub aus Finanz-Vorbereitung (M4 Slice 4)",
      });
      setDunningEmailSendStubJson(JSON.stringify(out, null, 2));
    } catch (e) {
      setDunningPanelError(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api, canRecordDunningReminder, dunningStageOrdinal, invoiceIdRead]);

  const loadAuditEvents = useCallback(async () => {
    setNotice(null);
    setBusy(true);
    try {
      const data = await api.getAuditEvents(1, 15);
      setAuditJson(JSON.stringify(data, null, 2));
    } catch (e) {
      setAuditJson("");
      setNotice(e instanceof ApiError ? { kind: "api", error: e } : { kind: "text", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [api]);

  const openCents = openAmountCents(invoiceOverview);

  const financePrepPageTitle =
    financePrepMainTab === "grundeinstellungen"
      ? "Finanz (Vorbereitung) — Mahn-Grundeinstellungen"
      : "Finanz (Vorbereitung)";

  const userFlowHint = invoiceOverview
    ? invoiceOverview.status === "ENTWURF"
      ? "Rechnung geladen (Entwurf). Buchung nur wenn die Schaltfläche „Rechnung buchen“ aktiv ist (SoT BOOK_INVOICE)."
      : invoiceOverview.status === "GEBUCHT_VERSENDET" || invoiceOverview.status === "TEILBEZAHLT"
        ? "Gebuchte oder teilbezahlte Rechnung: Zahlungseingang und Mahnung nur mit passender SoT-Aktion."
        : `Rechnung geladen — Status ${invoiceOverview.status}.`
    : draftJson
      ? "Entwurf in dieser Session erzeugt — „Rechnung laden“ ausführen (Schritt 3)."
      : "Noch kein Entwurf in dieser Session — Schritt 2 nutzen oder Demo-Rechnungs-ID eintragen.";

  return (
    <section className="panel finance-prep" aria-labelledby="finance-prep-heading" aria-busy={busy}>
      <h2 id="finance-prep-heading">{financePrepPageTitle}</h2>
      <p
        id="finance-prep-intro"
        style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: 0 }}
      >
        <strong>FIN-1</strong> Zahlungsbedingungen, <strong>FIN-2</strong> Rechnung (Entwurf + Lesen mit 8.4-Beträgen), <strong>FIN-3</strong>{" "}
        Zahlungseingang — nur mit gültiger Anmeldung; Demo nutzt feste Seed-UUIDs aus dem Backend. <strong>FIN-3 Schreiben:</strong> nur wenn{" "}
        <code>GET /documents/…/allowed-actions?entityType=INVOICE</code> die Aktion <code>{RECORD_PAYMENT_INTAKE_ACTION_ID}</code> liefert (wird
        automatisch mit „GET Rechnung laden“ geholt). Nach Buchungen hilft <strong>Audit</strong> (<code>GET /audit-events</code>) zur
        Nachvollziehbarkeit im Mandanten. Tab <strong>Grundeinstellungen Mahnlauf</strong>: Mandanten-Automation <strong>OFF</strong> oder <strong>SEMI</strong>, Kandidaten-GET mit <code>eligibilityContext</code> und <code>stageDeadlineIso</code> (ADR-0011). Tab <strong>Mahnwesen</strong>: Konfiguration, E-Mail, Einzel-Mahnung — kein Hintergrund-Cron; keine juristische Mahnung — Massen-E-Mail nur nach PL/Compliance (Einzelversand Slice 5a).
      </p>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        <a href="#/">Zurück zur Shell (Start)</a>
        {" · "}
        <span style={{ color: "var(--text-secondary)" }}>Basis-URL: </span>
        <code>{FINANCE_PREP_HASH}</code>
        {" · "}
        <span style={{ color: "var(--text-secondary)" }}>Tab per Query: </span>
        <code>{financePrepHashWithTab("grundeinstellungen")}</code>
        {" · "}
        <span style={{ color: "var(--text-secondary)" }}>Alias Grundeinstellungen: </span>
        <code>{FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH}</code>
      </p>

      <FinanceFeatureMatrix />
      <p
        style={{
          fontSize: "0.82rem",
          marginTop: "0.5rem",
          padding: "0.4rem 0.55rem",
          borderRadius: "6px",
          border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
          background: "color-mix(in srgb, var(--accent-muted) 40%, transparent)",
        }}
      >
        <strong>Nächster sinnvoller Schritt:</strong> {userFlowHint}
      </p>

      <div
        className="finance-prep-tools"
        style={{ marginTop: "1rem", width: "100%", maxWidth: "min(42rem, 100%)", boxSizing: "border-box" }}
      >
        <div
          role="tablist"
          aria-label="Bereiche Finanz-Vorbereitung"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.35rem",
            marginBottom: "0.75rem",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "0.35rem",
          }}
        >
          <button
            type="button"
            role="tab"
            id="finance-prep-tab-rechnung"
            aria-selected={financePrepMainTab === "rechnung"}
            aria-controls="finance-prep-panel-rechnung"
            onClick={() => selectFinancePrepMainTab("rechnung")}
            style={{
              fontWeight: financePrepMainTab === "rechnung" ? 700 : 400,
              borderBottom: financePrepMainTab === "rechnung" ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: "-1px",
              padding: "0.35rem 0.6rem",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {"Rechnung & Zahlung"}
          </button>
          <button
            type="button"
            role="tab"
            id="finance-prep-tab-grundeinstellungen"
            aria-selected={financePrepMainTab === "grundeinstellungen"}
            aria-controls="finance-prep-panel-grundeinstellungen"
            onClick={() => selectFinancePrepMainTab("grundeinstellungen")}
            style={{
              fontWeight: financePrepMainTab === "grundeinstellungen" ? 700 : 400,
              borderBottom: financePrepMainTab === "grundeinstellungen" ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: "-1px",
              padding: "0.35rem 0.6rem",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Grundeinstellungen Mahnlauf
          </button>
          <button
            type="button"
            role="tab"
            id="finance-prep-tab-mahnwesen"
            aria-selected={financePrepMainTab === "mahnwesen"}
            aria-controls="finance-prep-panel-mahnwesen"
            onClick={() => selectFinancePrepMainTab("mahnwesen")}
            style={{
              fontWeight: financePrepMainTab === "mahnwesen" ? 700 : 400,
              borderBottom: financePrepMainTab === "mahnwesen" ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: "-1px",
              padding: "0.35rem 0.6rem",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Mahnwesen
          </button>
          <button
            type="button"
            role="tab"
            id="finance-prep-tab-fortgeschritten"
            aria-selected={financePrepMainTab === "fortgeschritten"}
            aria-controls="finance-prep-panel-fortgeschritten"
            onClick={() => selectFinancePrepMainTab("fortgeschritten")}
            style={{
              fontWeight: financePrepMainTab === "fortgeschritten" ? 700 : 400,
              borderBottom: financePrepMainTab === "fortgeschritten" ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: "-1px",
              padding: "0.35rem 0.6rem",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Fortgeschritten
          </button>
        </div>

        {dunningPanelError?.kind === "api" ? (
          <FinanceStructuredApiError envelope={dunningPanelError.error.envelope} status={dunningPanelError.error.status} />
        ) : null}
        {dunningPanelError?.kind === "text" ? (
          <p role="alert" style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "0.65rem" }}>
            {dunningPanelError.text}
          </p>
        ) : null}

        <div
          id="finance-prep-panel-rechnung"
          role="tabpanel"
          aria-labelledby="finance-prep-tab-rechnung"
          hidden={financePrepMainTab !== "rechnung"}
        >
        <FinancePrepStepTerms
          busy={busy}
          projectId={projectId}
          setProjectId={setProjectId}
          termsLabel={termsLabel}
          setTermsLabel={setTermsLabel}
          listJson={listJson}
          onLoadPaymentTerms={loadPaymentTerms}
          onCreatePaymentTermsVersion={createPaymentTermsVersion}
        />

        <FinancePrepStepDraft
          busy={busy}
          draftSkontoBps={draftSkontoBps}
          setDraftSkontoBps={setDraftSkontoBps}
          draftSummary={draftSummary}
          draftJson={draftJson}
          onCreateInvoiceDraft={createInvoiceDraft}
        />

        <FinancePrepStepInvoice
          busy={busy}
          invoiceIdRead={invoiceIdRead}
          onInvoiceIdInputChange={(value: string) => {
            setInvoiceIdRead(value);
            setInvoiceAllowedActions(null);
            setPaymentIntakes(null);
            setDunningReminders(null);
          }}
          invoiceIdLooksValid={invoiceIdLooksValid}
          onLoadInvoice={loadInvoice}
          invoiceOverview={invoiceOverview}
          openCents={openCents}
          invoiceAllowedActions={invoiceAllowedActions}
          canRecordPaymentIntake={canRecordPaymentIntake}
          canRecordDunningReminder={canRecordDunningReminder}
          canBookInvoice={canBookInvoice}
          paymentIntakes={paymentIntakes}
          dunningReminders={dunningReminders}
          issueDateBook={issueDateBook}
          setIssueDateBook={setIssueDateBook}
          bookPanelError={bookPanelError}
          onBookInvoice={bookInvoice}
          onSubmitEntwurfSkontoRecalc={submitEntwurfSkontoRecalc}
        />

        <FinancePreparationPaymentPanel
          busy={busy}
          openCents={openCents}
          intakeAmountCents={intakeAmountCents}
          setIntakeAmountCents={setIntakeAmountCents}
          intakeExternalRef={intakeExternalRef}
          setIntakeExternalRef={setIntakeExternalRef}
          canRecordPaymentIntake={canRecordPaymentIntake}
          invoiceIdLooksValid={invoiceIdLooksValid}
          paymentPanelError={paymentPanelError}
          intakeResultJson={intakeResultJson}
          onApplyOpenBalance={applyOpenBalanceToIntake}
          onSubmitPaymentIntake={submitPaymentIntake}
        />
        </div>

        <div
          id="finance-prep-panel-grundeinstellungen"
          role="tabpanel"
          aria-labelledby="finance-prep-tab-grundeinstellungen"
          hidden={financePrepMainTab !== "grundeinstellungen"}
        >
          <FinanceDunningGrundeinstellungenPanel
            busy={busy}
            serverAutomationRunMode={dunningAutomationServerRunMode}
            dunningAutomationJson={dunningAutomationJson}
            dunningAutomationRunMode={dunningAutomationRunMode}
            setDunningAutomationRunMode={setDunningAutomationRunMode}
            dunningAutomationIanaTimezone={dunningAutomationIanaTimezone}
            setDunningAutomationIanaTimezone={setDunningAutomationIanaTimezone}
            dunningAutomationFederalState={dunningAutomationFederalState}
            setDunningAutomationFederalState={setDunningAutomationFederalState}
            dunningAutomationPaymentTermDayKind={dunningAutomationPaymentTermDayKind}
            setDunningAutomationPaymentTermDayKind={setDunningAutomationPaymentTermDayKind}
            dunningAutomationPreferredChannel={dunningAutomationPreferredChannel}
            setDunningAutomationPreferredChannel={setDunningAutomationPreferredChannel}
            dunningAutomationPatchReason={dunningAutomationPatchReason}
            setDunningAutomationPatchReason={setDunningAutomationPatchReason}
            onSubmitDunningTenantAutomationPatch={() => void submitDunningTenantAutomationPatch()}
            dunningStageOrdinal={dunningStageOrdinal}
            setDunningStageOrdinal={setDunningStageOrdinal}
            dunningBatchAsOfDate={dunningBatchAsOfDate}
            setDunningBatchAsOfDate={setDunningBatchAsOfDate}
            dunningBatchRunJson={dunningBatchRunJson}
            onDunningBatchDryRun={() => void submitDunningBatchDryRun()}
            onDunningBatchExecute={() => void submitDunningBatchExecute()}
            canRecordDunningReminder={canRecordDunningReminder}
            dunningCandidatesJson={dunningCandidatesJson}
            onLoadDunningCandidates={() => void submitLoadDunningCandidates()}
            dunningBatchEmailItemsJson={dunningBatchEmailItemsJson}
            setDunningBatchEmailItemsJson={setDunningBatchEmailItemsJson}
            dunningBatchEmailResultJson={dunningBatchEmailResultJson}
            onPrefillBatchEmailItemsFromCandidates={() => void prefillBatchEmailItemsFromCandidates()}
            onDunningBatchEmailDryRun={() => void submitDunningBatchEmailDryRun()}
            onDunningBatchEmailExecute={() => void submitDunningBatchEmailExecute()}
          />
        </div>

        <div
          id="finance-prep-panel-mahnwesen"
          role="tabpanel"
          aria-labelledby="finance-prep-tab-mahnwesen"
          hidden={financePrepMainTab !== "mahnwesen"}
        >
        <FinancePreparationDunningPanel
          busy={busy}
          dunningReminderConfigJson={dunningReminderConfigJson}
          dunningTemplatesJson={dunningTemplatesJson}
          dunningEmailFooterJson={dunningEmailFooterJson}
          dunningStageOrdinal={dunningStageOrdinal}
          setDunningStageOrdinal={setDunningStageOrdinal}
          dunningNote={dunningNote}
          setDunningNote={setDunningNote}
          canRecordDunningReminder={canRecordDunningReminder}
          invoiceIdLooksValid={invoiceIdLooksValid}
          dunningPanelError={dunningPanelError}
          dunningResultJson={dunningResultJson}
          onSubmitDunningReminder={submitDunningReminder}
          configPutJson={configPutJson}
          setConfigPutJson={setConfigPutJson}
          configPutReason={configPutReason}
          setConfigPutReason={setConfigPutReason}
          onPrefillConfigPutFromGet={prefillConfigPutFromGet}
          onSubmitDunningConfigPut={submitDunningConfigPut}
          configPatchOrdinal={configPatchOrdinal}
          setConfigPatchOrdinal={setConfigPatchOrdinal}
          configPatchDays={configPatchDays}
          setConfigPatchDays={setConfigPatchDays}
          configPatchFee={configPatchFee}
          setConfigPatchFee={setConfigPatchFee}
          configPatchLabel={configPatchLabel}
          setConfigPatchLabel={setConfigPatchLabel}
          configPatchReason={configPatchReason}
          setConfigPatchReason={setConfigPatchReason}
          onSubmitDunningConfigPatch={submitDunningConfigPatch}
          configDeleteOrdinal={configDeleteOrdinal}
          setConfigDeleteOrdinal={setConfigDeleteOrdinal}
          configDeleteReason={configDeleteReason}
          setConfigDeleteReason={setConfigDeleteReason}
          onSubmitDunningConfigDelete={submitDunningConfigDelete}
          onReloadDunningReads={() => void loadDunningReads()}
          hasLoadedInvoice={hasLoadedInvoice}
          dunningEmailPreviewJson={dunningEmailPreviewJson}
          dunningEmailSendStubJson={dunningEmailSendStubJson}
          dunningEmailRecipient={dunningEmailRecipient}
          setDunningEmailRecipient={setDunningEmailRecipient}
          dunningEmailSendJson={dunningEmailSendJson}
          canSendDunningReminderEmail={canSendDunningReminderEmail}
          footerPatchReason={footerPatchReason}
          setFooterPatchReason={setFooterPatchReason}
          footerCompanyLegalName={footerCompanyLegalName}
          setFooterCompanyLegalName={setFooterCompanyLegalName}
          footerStreetLine={footerStreetLine}
          setFooterStreetLine={setFooterStreetLine}
          footerPostalCode={footerPostalCode}
          setFooterPostalCode={setFooterPostalCode}
          footerCity={footerCity}
          setFooterCity={setFooterCity}
          footerCountryCode={footerCountryCode}
          setFooterCountryCode={setFooterCountryCode}
          footerPublicEmail={footerPublicEmail}
          setFooterPublicEmail={setFooterPublicEmail}
          footerPublicPhone={footerPublicPhone}
          setFooterPublicPhone={setFooterPublicPhone}
          footerLegalRepresentative={footerLegalRepresentative}
          setFooterLegalRepresentative={setFooterLegalRepresentative}
          footerRegisterCourt={footerRegisterCourt}
          setFooterRegisterCourt={setFooterRegisterCourt}
          footerRegisterNumber={footerRegisterNumber}
          setFooterRegisterNumber={setFooterRegisterNumber}
          footerVatId={footerVatId}
          setFooterVatId={setFooterVatId}
          footerSignatureLine={footerSignatureLine}
          setFooterSignatureLine={setFooterSignatureLine}
          onPrefillFooterPatchFromGet={prefillFooterPatchFromGet}
          onSubmitFooterPatch={() => void submitFooterPatch()}
          onSubmitEmailPreview={() => void submitEmailPreview()}
          onSubmitEmailSendStub={() => void submitEmailSendStub()}
          onSubmitEmailSend={() => void submitEmailSend()}
        />
        </div>

        <div
          id="finance-prep-panel-fortgeschritten"
          role="tabpanel"
          aria-labelledby="finance-prep-tab-fortgeschritten"
          hidden={financePrepMainTab !== "fortgeschritten"}
        >
        <FinancePrepStepSot
          busy={busy}
          invoiceIdRead={invoiceIdRead}
          sotEntityType={sotEntityType}
          setSotEntityType={setSotEntityType}
          sotDocumentId={sotDocumentId}
          setSotDocumentId={setSotDocumentId}
          sotJson={sotJson}
          onLoadSotAllowedActions={loadSotAllowedActions}
        />

        <FinancePrepStepAudit busy={busy} auditJson={auditJson} onLoadAuditEvents={loadAuditEvents} />

        </div>

        {notice?.kind === "api" ? (
          <FinanceStructuredApiError envelope={notice.error.envelope} status={notice.error.status} />
        ) : null}
        {notice?.kind === "text" ? (
          <p role="alert" style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            {notice.text}
          </p>
        ) : null}
      </div>

      <h3 className="visually-hidden">Referenzdokumente im Repository</h3>
      <nav aria-label="FIN-0 Referenzdokumente im Repository">
        <ul className="finance-prep-links" aria-describedby="finance-prep-intro">
          {DOC_LINKS.map(({ label, repoPath }) => {
            const href = repoDocHref(repoPath);
            return (
              <li key={repoPath}>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                  </a>
                ) : (
                  <span>
                    <strong>{label}</strong> — <code>{repoPath}</code>{" "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      (lokal im Repo öffnen oder <code>VITE_REPO_DOCS_BASE</code> in <code>.env</code> setzen)
                    </span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}
