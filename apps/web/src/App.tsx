import { useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { AppShell } from "./components/AppShell.js";
import { AppPrimaryNav } from "./components/AppPrimaryNav.js";
import { HomeDashboard } from "./components/HomeDashboard.js";
import { StammdatenHubPage } from "./components/hubs/StammdatenHubPage.js";
import { LvAufmassHubPage } from "./components/hubs/LvAufmassHubPage.js";
import { AngeboteNachtraegeHubPage } from "./components/hubs/AngeboteNachtraegeHubPage.js";
import { EinstellungenHubPage } from "./components/hubs/EinstellungenHubPage.js";
import { HilfeHubPage } from "./components/hubs/HilfeHubPage.js";
import { DocumentTextPanels } from "./components/DocumentTextPanels.js";
import { AdminUsersPage } from "./components/admin/AdminUsersPage.js";
import { FinancePreparation } from "./components/FinancePreparation.js";
import { FinanceOperationalWorklistPage } from "./components/finance/FinanceOperationalWorklistPage.js";
import { GeschaeftsprozessWizard } from "./components/geschaeftsprozess/GeschaeftsprozessWizard.js";
import { LvBearbeitenPage } from "./components/lv-workbench/LvBearbeitenPage.js";
import { MeasurementPilotListPage } from "./components/measurements/MeasurementPilotListPage.js";
import { OfferSupplementWorkspacePage } from "./components/offers/OfferSupplementWorkspacePage.js";
import { LoginPage } from "./components/LoginPage.js";
import { PasswordResetPage } from "./components/PasswordResetPage.js";
import { RoleQuickNav } from "./components/RoleQuickNav.js";
import { DEMO_SEED_IDS as SEED } from "./lib/demo-seed-ids.js";
import {
  DOCUMENT_WORKSPACE_HASH,
  FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH,
  FINANCE_PREP_HASH,
  isFinancePrepHashPath,
  normalizeFinancePrepHashToCanon,
  readHashQuery,
  resolveFinancePrepInitialMainTab,
  useHashRoute,
} from "./lib/hash-route.js";
import {
  CANONICAL_EXPORT_INVOICE_ACTION_ID,
  ENTITY_TYPES,
  type ActionFormFields,
  type EntityType,
  executeActionWithSotGuard,
} from "./lib/action-executor.js";
import type { QuickPreset } from "./lib/role-quick-actions.js";
import { decodeTokenPayload, roleForQuickNav } from "./lib/token-payload.js";
import { ApiError, type ApiErrorEnvelope } from "./lib/api-error.js";
import { FinanceStructuredApiError } from "./components/finance/FinanceStructuredApiError.js";
import { createApiClient, resolveApiBaseUrl, type InvoiceOverview, type LvVersionSnapshot } from "./lib/api-client.js";
import { formatSkontoDisplay } from "./components/finance/finance-prep-helpers.js";
import {
  clearDocumentScopedKeys,
  clearPersistedSession,
  loadPersistedSession,
  persistSession,
  storageKeyForTenant,
  type SessionStorageMode,
} from "./lib/tenant-session.js";

function loadDocPrefs(tenantId: string): { documentId: string; entityType: EntityType } {
  if (!tenantId) return { documentId: SEED.offerVersionId, entityType: "OFFER_VERSION" };
  try {
    const raw = localStorage.getItem(storageKeyForTenant(tenantId, "docprefs"));
    if (!raw) return { documentId: SEED.offerVersionId, entityType: "OFFER_VERSION" };
    const j = JSON.parse(raw) as { documentId?: string; entityType?: EntityType };
    const entityType = j.entityType && ENTITY_TYPES.includes(j.entityType) ? j.entityType : "OFFER_VERSION";
    return { documentId: j.documentId ?? SEED.offerVersionId, entityType };
  } catch {
    return { documentId: SEED.offerVersionId, entityType: "OFFER_VERSION" };
  }
}

function saveDocPrefs(tenantId: string, documentId: string, entityType: EntityType): void {
  if (!tenantId) return;
  localStorage.setItem(storageKeyForTenant(tenantId, "docprefs"), JSON.stringify({ documentId, entityType }));
}

type AppBanner =
  | { kind: "ok"; text: string }
  | {
      kind: "error";
      text: string;
      code?: string;
      correlationId?: string;
      structured?: { envelope: ApiErrorEnvelope; status: number };
    };

/** Haupt-Shell-Roh-JSON: in Produktion ohne Expertenmodus hinter Summary (E2E nutzt Vite-Dev → immer aufgeklappt). */
function ShellExpertDiagnosticsJson(props: { showOpen: boolean; testId?: string; children: ReactNode }) {
  const pre = (
    <pre
      className="system-block"
      style={{ margin: 0 }}
      {...(props.testId ? ({ "data-testid": props.testId } as const) : {})}
    >
      {props.children}
    </pre>
  );
  if (props.showOpen) return pre;
  return (
    <details style={{ marginTop: "0.25rem" }}>
      <summary style={{ cursor: "pointer", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        Rohdaten anzeigen (Expertenmodus aus — Mandanten-Schalter unter „Sitzung &amp; API“,{" "}
        <code>VITE_PWA_EXPERT_UI=1</code> oder Vite-Dev)
      </summary>
      {pre}
    </details>
  );
}

export default function App() {
  const [browserOnline, setBrowserOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine !== false,
  );

  useEffect(() => {
    const on = () => setBrowserOnline(true);
    const off = () => setBrowserOnline(false);
    globalThis.addEventListener?.("online", on);
    globalThis.addEventListener?.("offline", off);
    return () => {
      globalThis.removeEventListener?.("online", on);
      globalThis.removeEventListener?.("offline", off);
    };
  }, []);

  const viteDefaultTenant =
    typeof import.meta.env.VITE_DEFAULT_TENANT_ID === "string" && import.meta.env.VITE_DEFAULT_TENANT_ID.trim()
      ? (import.meta.env.VITE_DEFAULT_TENANT_ID as string).trim()
      : undefined;
  const defaultApi = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined);
  const [apiBase, setApiBase] = useState(defaultApi);
  const persisted = loadPersistedSession();
  const [token, setToken] = useState(persisted.token);
  const [tenantId, setTenantId] = useState(persisted.tenantId || SEED.tenantId);
  const [sessionMode, setSessionMode] = useState<SessionStorageMode>(persisted.mode);
  const [prevTenant, setPrevTenant] = useState(tenantId);

  const initialPrefs = loadDocPrefs(tenantId || SEED.tenantId);
  const [documentId, setDocumentId] = useState(initialPrefs.documentId);
  const [entityType, setEntityType] = useState<EntityType>(initialPrefs.entityType);

  const [allowedActions, setAllowedActions] = useState<string[] | null>(null);
  const [allowedMeta, setAllowedMeta] = useState<{ documentId: string; entityType: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<AppBanner | null>(null);

  const [measurementDetail, setMeasurementDetail] = useState<{
    measurementId: string;
    version: { status?: string; systemText?: string; editingText?: string };
  } | null>(null);
  const [supplementDetail, setSupplementDetail] = useState<unknown>(null);
  const [offerVersionDetail, setOfferVersionDetail] = useState<unknown>(null);
  const [invoiceShellDetail, setInvoiceShellDetail] = useState<InvoiceOverview | null>(null);
  const [lvShellDetail, setLvShellDetail] = useState<LvVersionSnapshot | null>(null);
  /** LV-Shell: read-only `GET /lv/versions/{id}/structure` (OpenAPI §9-Projektion). */
  const [lvShellStructureJson, setLvShellStructureJson] = useState("");
  /** Read-only Lesepfade zur Rechnung (Haupt-Shell); zurückgesetzt bei jedem „Detail laden“. */
  const [invoicePaymentIntakesJson, setInvoicePaymentIntakesJson] = useState("");
  const [invoiceDunningRemindersJson, setInvoiceDunningRemindersJson] = useState("");
  const [invoicePaymentTermsJson, setInvoicePaymentTermsJson] = useState("");
  const [invoiceAllowedActionsShellJson, setInvoiceAllowedActionsShellJson] = useState("");
  /** INVOICE-Shell: read-only GET allowed-actions für SoT OFFER_VERSION (`invoice.offerVersionId`). */
  const [invoiceOfferVersionAllowedActionsJson, setInvoiceOfferVersionAllowedActionsJson] = useState("");
  /** INVOICE-Shell: read-only GET /finance/e-invoice-parties/* (XRechnung Seller/Buyer). */
  const [invoiceEInvoiceTenantJson, setInvoiceEInvoiceTenantJson] = useState("");
  const [invoiceEInvoiceCustomersListJson, setInvoiceEInvoiceCustomersListJson] = useState("");
  const [invoiceEInvoiceBuyerJson, setInvoiceEInvoiceBuyerJson] = useState("");
  /** INVOICE-Shell: read-only GET /finance/invoice-tax-profile (+ Projekt-Override, FIN-5). */
  const [invoiceTenantTaxProfileJson, setInvoiceTenantTaxProfileJson] = useState("");
  const [invoiceProjectTaxOverrideJson, setInvoiceProjectTaxOverrideJson] = useState("");
  /** INVOICE-Shell: read-only GET /lv/versions/{lvVersionId} (Traceability §9 aus Rechnung). */
  const [invoiceShellLvSnapshotJson, setInvoiceShellLvSnapshotJson] = useState("");
  /** INVOICE-Shell: read-only GET /audit-events (mandantenweit, erste Seite). */
  const [invoiceAuditEventsJson, setInvoiceAuditEventsJson] = useState("");
  /** Haupt-Shell: read-only GET /finance/dunning-reminder-config (FIN-4). */
  const [shellDunningConfigJson, setShellDunningConfigJson] = useState("");
  /** Haupt-Shell: weitere FIN-4-Lesepfade ohne Dokument-Kontext (Spur E). */
  const [shellDunningTemplatesJson, setShellDunningTemplatesJson] = useState("");
  const [shellDunningFooterJson, setShellDunningFooterJson] = useState("");
  const [shellDunningAutomationJson, setShellDunningAutomationJson] = useState("");
  const [shellDunningCandidatesJson, setShellDunningCandidatesJson] = useState("");
  /** Stufe für `GET /finance/dunning-reminder-candidates?stageOrdinal=…` (Shell, FIN-4 Slice 5b-0). */
  const [shellDunningCandidatesStageOrdinal, setShellDunningCandidatesStageOrdinal] = useState("1");
  /** Shell read-only GET /tenant/pwa-display-settings (Integrations-/Experten-Sicht). */
  const [shellTenantPwaDisplayJson, setShellTenantPwaDisplayJson] = useState("");
  /** Mandantenweit (Server); siehe GET/PATCH `/tenant/pwa-display-settings`. */
  const [tenantPwaExpertModeEnabled, setTenantPwaExpertModeEnabled] = useState(false);
  const [tenantPwaExpertModeBusy, setTenantPwaExpertModeBusy] = useState(false);

  const [modalAction, setModalAction] = useState<string | null>(null);
  const [form, setForm] = useState<ActionFormFields>({
    reason: "UI-Aktion laut erlaubter Backend-Aktion",
    offerId: SEED.offerId,
    lvVersionId: SEED.lvVersionId,
    measurementId: "",
    editingText: "Bearbeitungstext (Beispiel)",
    invoiceId: SEED.invoiceId,
    projectId: "",
    customerId: "",
    positionsJson: '[{"lvPositionId":"dddddddd-dddd-4ddd-8ddd-dddddddd0001","quantity":10,"unit":"m2"}]',
    exportFormat: "XRECHNUNG",
    lvCatalogId: SEED.lvCatalogId,
    name: "Neues LV",
    headerSystemText: "Systemkopf",
    headerEditingText: "Bearbeitungskopf",
    parentNodeId: "",
    kind: "BEREICH",
    sortOrdinal: "2",
    systemText: "Systemtext neu",
    quantity: "10",
    unit: "m2",
    unitPriceCents: "1000",
    positionKind: "NORMAL",
    nodeEditingText: "Geänderter Bearbeitungstext",
    positionPatchJson: "",
    dunningStageOrdinal: "1",
    dunningNote: "",
  });

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: resolveApiBaseUrl(apiBase),
        getToken: () => token,
        getTenantId: () => tenantId,
      }),
    [apiBase, token, tenantId],
  );

  const formatShellEur = (cents: number | undefined) =>
    cents == null ? "—" : (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

  const tokenTenant = token ? decodeTokenPayload(token).tenantId : null;
  const tokenRole = token ? decodeTokenPayload(token).role : null;
  const quickNavRole = roleForQuickNav(tokenRole);
  const tenantMismatch = tokenTenant && tenantId && tokenTenant !== tenantId;

  const vitePwaExpertUi =
    typeof import.meta.env.VITE_PWA_EXPERT_UI === "string" && import.meta.env.VITE_PWA_EXPERT_UI.trim() === "1";
  const showExpertUi =
    (typeof import.meta !== "undefined" && Boolean(import.meta.env.DEV)) ||
    vitePwaExpertUi ||
    tenantPwaExpertModeEnabled;
  const canManageTenantPwaExpertMode =
    tokenRole === "ADMIN" || tokenRole === "GESCHAEFTSFUEHRUNG" || tokenRole === "BUCHHALTUNG";

  const hashPath = useHashRoute();
  const hashQuery = readHashQuery();
  /** Deep-Link z. B. `#/dokument?documentId=…&entityType=INVOICE` (Arbeitslisten). */
  useEffect(() => {
    if (hashPath !== "/dokument") return;
    const q = readHashQuery();
    const did = q.get("documentId")?.trim();
    const etRaw = q.get("entityType")?.trim();
    if (!did || !etRaw) return;
    if (!(ENTITY_TYPES as readonly string[]).includes(etRaw)) return;
    setDocumentId(did);
    setEntityType(etRaw as EntityType);
  }, [hashPath]);
  const showFinancePrep = isFinancePrepHashPath(hashPath);
  const financePrepInitialMainTab = resolveFinancePrepInitialMainTab(hashPath, hashQuery);
  /** Stable across Tab-/Hash-Wechsel innerhalb Finanz-Vorbereitung — sonst Remount und Verlust von z. B. invoiceAllowedActions (FIN-5 SoT). */
  const financePrepMountKey = `finance-prep:${tenantId || "no-tenant"}`;
  const showLogin = hashPath === "/login";
  const showPasswordReset = hashPath === "/password-reset";
  const showGeschaeftsprozess = hashPath === "/geschaeftsprozess";
  const showLvBearbeiten = hashPath === "/lv-bearbeiten";
  const showMeasurementPilot = hashPath === "/aufmass-messungen";
  const showOfferWorkspace = hashPath === "/angebote-arbeitsflaeche";
  const showFinanceWorklist = hashPath === "/finanz-arbeitsliste";
  const showAdminUsers = hashPath === "/admin/users";
  const showStammdatenHub = hashPath === "/stammdaten";
  const showLvAufmassHub = hashPath === "/lv-aufmass";
  const showAngeboteHub = hashPath === "/angebote-nachtraege";
  const showEinstellungenHub = hashPath === "/einstellungen";
  const showHilfeHub = hashPath === "/hilfe";
  const showDomainHubChrome =
    showStammdatenHub || showLvAufmassHub || showAngeboteHub || showEinstellungenHub || showHilfeHub;
  const showMainWorkspaceChrome =
    !showFinancePrep &&
    !showLogin &&
    !showPasswordReset &&
    !showGeschaeftsprozess &&
    !showLvBearbeiten &&
    !showMeasurementPilot &&
    !showOfferWorkspace &&
    !showFinanceWorklist &&
    !showAdminUsers &&
    !showDomainHubChrome;
  const showDocumentWorkspace = hashPath === "/dokument";
  const showHomeDashboard = showMainWorkspaceChrome && hashPath === "/";

  useEffect(() => {
    if (!showFinancePrep) return;
    normalizeFinancePrepHashToCanon();
  }, [showFinancePrep, hashPath]);

  useEffect(() => {
    if (!token?.trim() || !tenantId?.trim() || tenantMismatch) {
      setTenantPwaExpertModeEnabled(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const r = await client.getTenantPwaDisplaySettings();
        if (!cancelled) setTenantPwaExpertModeEnabled(Boolean(r.data?.pwaExpertModeEnabled));
      } catch {
        if (!cancelled) setTenantPwaExpertModeEnabled(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tenantId, tenantMismatch, client]);

  useEffect(() => {
    if (tenantId !== prevTenant) {
      clearDocumentScopedKeys(prevTenant);
      clearPersistedSession();
      setSessionMode("memory");
      setToken("");
      setPrevTenant(tenantId);
      setAllowedActions(null);
      setAllowedMeta(null);
      setMeasurementDetail(null);
      setSupplementDetail(null);
      setOfferVersionDetail(null);
      setInvoiceShellDetail(null);
      setLvShellDetail(null);
      setLvShellStructureJson("");
      setShellDunningConfigJson("");
      setShellDunningTemplatesJson("");
      setShellDunningFooterJson("");
      setShellDunningAutomationJson("");
      setShellDunningCandidatesJson("");
      setShellTenantPwaDisplayJson("");
      setBanner(null);
      const p = loadDocPrefs(tenantId);
      setDocumentId(p.documentId);
      setEntityType(p.entityType);
    }
  }, [tenantId, prevTenant]);

  useEffect(() => {
    saveDocPrefs(tenantId, documentId, entityType);
  }, [tenantId, documentId, entityType]);

  const persist = () => {
    persistSession(token, tenantId, sessionMode);
    setBanner({
      kind: "ok",
      text:
        sessionMode === "session"
          ? "Session-Storage aktiv: Token nur für aktuelle Browser-Session gespeichert."
          : "Memory-Only aktiv: Token wird nicht persistent gespeichert.",
    });
  };

  const fetchAllowedFor = useCallback(
    async (docId: string, ent: EntityType) => {
      setBusy(true);
      setBanner(null);
      try {
        const res = await client.getAllowedActions(docId.trim(), ent);
        setDocumentId(docId.trim());
        setEntityType(ent);
        setAllowedActions(res.allowedActions);
        setAllowedMeta({ documentId: res.documentId, entityType: res.entityType });
      } catch (e) {
        setAllowedActions(null);
        setAllowedMeta(null);
        if (e instanceof ApiError) {
          setBanner({
            kind: "error",
            text: e.envelope.message,
            code: e.envelope.code,
            correlationId: e.envelope.correlationId,
          });
        } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
      } finally {
        setBusy(false);
      }
    },
    [client],
  );

  const fetchAllowed = useCallback(() => fetchAllowedFor(documentId.trim(), entityType), [documentId, entityType, fetchAllowedFor]);

  const runQuickPreset = useCallback(
    async (p: QuickPreset) => {
      if (p.kind === "finance") {
        window.location.hash =
          p.id === "finance-grundeinstellungen" ? FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH : FINANCE_PREP_HASH;
        return;
      }
      window.location.hash = DOCUMENT_WORKSPACE_HASH;
      await fetchAllowedFor(p.documentId, p.entityType);
    },
    [fetchAllowedFor],
  );

  const fetchDetail = async () => {
    setBusy(true);
    setBanner(null);
    setInvoicePaymentIntakesJson("");
    setInvoiceDunningRemindersJson("");
    setInvoicePaymentTermsJson("");
    setInvoiceAllowedActionsShellJson("");
    setInvoiceOfferVersionAllowedActionsJson("");
    setInvoiceEInvoiceTenantJson("");
    setInvoiceEInvoiceCustomersListJson("");
    setInvoiceEInvoiceBuyerJson("");
    setInvoiceTenantTaxProfileJson("");
    setInvoiceProjectTaxOverrideJson("");
    setInvoiceShellLvSnapshotJson("");
    setInvoiceAuditEventsJson("");
    setLvShellStructureJson("");
    try {
      if (entityType === "MEASUREMENT_VERSION") {
        const raw = (await client.getMeasurementVersion(documentId.trim())) as {
          measurementId: string;
          version: { status: string; systemText: string; editingText: string };
        };
        setMeasurementDetail({ measurementId: raw.measurementId, version: raw.version });
        setForm((f) => ({ ...f, measurementId: raw.measurementId }));
        setSupplementDetail(null);
        setOfferVersionDetail(null);
        setInvoiceShellDetail(null);
        setLvShellDetail(null);
      } else if (entityType === "SUPPLEMENT_VERSION") {
        const raw = await client.getSupplementVersion(documentId.trim());
        setSupplementDetail(raw);
        setMeasurementDetail(null);
        setOfferVersionDetail(null);
        setInvoiceShellDetail(null);
        setLvShellDetail(null);
        setForm((f) => ({
          ...f,
          offerId: SEED.offerId,
        }));
      } else if (entityType === "OFFER_VERSION") {
        const raw = await client.getOfferVersion(documentId.trim());
        setOfferVersionDetail(raw);
        setMeasurementDetail(null);
        setSupplementDetail(null);
        setInvoiceShellDetail(null);
        setLvShellDetail(null);
        setForm((f) => ({
          ...f,
          offerId: (raw as { offerId: string }).offerId,
          lvVersionId: (raw as { lvVersionId: string }).lvVersionId,
        }));
      } else if (entityType === "INVOICE") {
        const raw = await client.getInvoice(documentId.trim());
        setInvoiceShellDetail(raw);
        setMeasurementDetail(null);
        setSupplementDetail(null);
        setOfferVersionDetail(null);
        setLvShellDetail(null);
      } else if (entityType === "LV_VERSION") {
        const raw = await client.getLvVersionSnapshot(documentId.trim());
        setLvShellDetail(raw);
        setMeasurementDetail(null);
        setSupplementDetail(null);
        setOfferVersionDetail(null);
        setInvoiceShellDetail(null);
      } else {
        setMeasurementDetail(null);
        setSupplementDetail(null);
        setOfferVersionDetail(null);
        setInvoiceShellDetail(null);
        setLvShellDetail(null);
        setBanner({
          kind: "ok",
          text: "Für diesen entityType liefert das Backend kein GET-Detail mit Textfeldern; Kontext (offerId, lvVersionId) manuell setzen.",
        });
      }
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const loadInvoicePaymentIntakesRead = useCallback(async () => {
    if (!invoiceShellDetail) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.listInvoicePaymentIntakes(invoiceShellDetail.invoiceId);
      setInvoicePaymentIntakesJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, invoiceShellDetail]);

  const loadInvoiceDunningRemindersRead = useCallback(async () => {
    if (!invoiceShellDetail) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.listInvoiceDunningReminders(invoiceShellDetail.invoiceId);
      setInvoiceDunningRemindersJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, invoiceShellDetail]);

  const loadInvoicePaymentTermsForShell = useCallback(async () => {
    if (!invoiceShellDetail) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getPaymentTermsByProject(invoiceShellDetail.projectId);
      setInvoicePaymentTermsJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, invoiceShellDetail]);

  const loadInvoiceAllowedActionsForShell = useCallback(async () => {
    if (!invoiceShellDetail) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getAllowedActions(invoiceShellDetail.invoiceId, "INVOICE");
      setInvoiceAllowedActionsShellJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, invoiceShellDetail]);

  const loadInvoiceShellOfferVersionAllowedActions = useCallback(async () => {
    if (!invoiceShellDetail?.offerVersionId) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getAllowedActions(invoiceShellDetail.offerVersionId, "OFFER_VERSION");
      setInvoiceOfferVersionAllowedActionsJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, invoiceShellDetail]);

  const loadInvoiceShellTenantEInvoiceParty = useCallback(async () => {
    if (!invoiceShellDetail) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getTenantEInvoiceParty();
      setInvoiceEInvoiceTenantJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, invoiceShellDetail]);

  const loadInvoiceShellCustomerEInvoicePartiesList = useCallback(async () => {
    if (!invoiceShellDetail) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.listCustomerEInvoiceParties();
      setInvoiceEInvoiceCustomersListJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, invoiceShellDetail]);

  const loadInvoiceShellBuyerEInvoiceParty = useCallback(async () => {
    if (!invoiceShellDetail) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getCustomerEInvoiceParty(invoiceShellDetail.customerId);
      setInvoiceEInvoiceBuyerJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, invoiceShellDetail]);

  const loadInvoiceShellTenantTaxProfile = useCallback(async () => {
    if (!invoiceShellDetail) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getTenantInvoiceTaxProfile();
      setInvoiceTenantTaxProfileJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, invoiceShellDetail]);

  const loadInvoiceShellProjectTaxOverride = useCallback(async () => {
    if (!invoiceShellDetail) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getProjectInvoiceTaxOverride(invoiceShellDetail.projectId);
      setInvoiceProjectTaxOverrideJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, invoiceShellDetail]);

  const loadInvoiceShellAuditEventsPage = useCallback(async () => {
    if (!invoiceShellDetail) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getAuditEvents(1, 15);
      setInvoiceAuditEventsJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, invoiceShellDetail]);

  const loadInvoiceShellLvVersionSnapshot = useCallback(async () => {
    if (!invoiceShellDetail) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getLvVersionSnapshot(invoiceShellDetail.lvVersionId);
      setInvoiceShellLvSnapshotJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, invoiceShellDetail]);

  const loadLvShellStructureProjection = useCallback(async () => {
    if (!lvShellDetail) return;
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getLvVersionStructure(lvShellDetail.version.id);
      setLvShellStructureJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, lvShellDetail]);

  const loadShellDunningReminderConfig = useCallback(async () => {
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getDunningReminderConfig();
      setShellDunningConfigJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client]);

  const loadShellDunningReminderTemplates = useCallback(async () => {
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getDunningReminderTemplates();
      setShellDunningTemplatesJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client]);

  const loadShellDunningEmailFooter = useCallback(async () => {
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getDunningEmailFooter();
      setShellDunningFooterJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client]);

  const loadShellDunningReminderAutomation = useCallback(async () => {
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getDunningReminderAutomation();
      setShellDunningAutomationJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client]);

  const loadShellDunningReminderCandidates = useCallback(async () => {
    const raw = shellDunningCandidatesStageOrdinal.trim();
    const stage = Number.parseInt(raw, 10);
    if (!Number.isFinite(stage) || stage < 1 || stage > 9) {
      setBanner({ kind: "error", text: "Mahn-Stufe für Kandidaten: ganze Zahl 1–9." });
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getDunningReminderCandidates({ stageOrdinal: stage });
      setShellDunningCandidatesJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client, shellDunningCandidatesStageOrdinal]);

  const loadShellTenantPwaDisplaySettings = useCallback(async () => {
    setBusy(true);
    setBanner(null);
    try {
      const r = await client.getTenantPwaDisplaySettings();
      setShellTenantPwaDisplayJson(JSON.stringify(r, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }, [client]);

  const openAction = (actionId: string) => {
    if (!allowedActions?.includes(actionId)) return;
    setModalAction(actionId);
    setBanner(null);
  };

  const runAction = async () => {
    if (!modalAction || !allowedActions?.includes(modalAction)) return;
    setBusy(true);
    setBanner(null);
    try {
      const mctx = measurementDetail ? { measurementId: measurementDetail.measurementId } : undefined;
      const result = await executeActionWithSotGuard(
        client,
        modalAction,
        entityType,
        documentId.trim(),
        allowedActions,
        form,
        mctx,
      );
      setModalAction(null);
      // Nach Statuswechsel (z. B. BOOK_INVOICE) zuerst allowedActions neu laden — fetchAllowedFor setzt zunächst banner=null; Erfolgsmeldung danach.
      await fetchAllowed();
      setBanner({ kind: "ok", text: JSON.stringify(result, null, 2) });
    } catch (e) {
      if (e instanceof ApiError) {
        setBanner({
          kind: "error",
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else setBanner({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const renderModalFields = useCallback(() => {
    if (!modalAction) return null;
    const a = modalAction;
    const rows: ReactElement[] = [];

    const add = (key: keyof ActionFormFields, label: string, hint?: string, type: "text" | "textarea" | "select" = "text") => {
      const v = form[key];
      const onChange = (x: string) => setForm((f) => ({ ...f, [key]: x }));
      rows.push(
        <label key={String(key)} className="field">
          <span>
            {label} {hint ? <span className="hint">{hint}</span> : null}
          </span>
          {type === "textarea" ? (
            <textarea value={String(v ?? "")} onChange={(e) => onChange(e.target.value)} />
          ) : type === "select" && key === "exportFormat" ? (
            <select
              value={String(form.exportFormat ?? "XRECHNUNG")}
              onChange={(e) => onChange(e.target.value as "XRECHNUNG" | "GAEB")}
            >
              <option value="XRECHNUNG">XRECHNUNG</option>
              <option value="GAEB">GAEB</option>
            </select>
          ) : (
            <input type="text" value={String(v ?? "")} onChange={(e) => onChange(e.target.value)} />
          )}
        </label>,
      );
    };

    if (a.startsWith("EXPORT_") && a !== CANONICAL_EXPORT_INVOICE_ACTION_ID) {
      add("exportFormat", "Format");
    }
    if (a === CANONICAL_EXPORT_INVOICE_ACTION_ID) {
      rows.push(
        <p key="export-invoice-format" className="hint" style={{ margin: "0 0 0.5rem" }}>
          Rechnungsexport: kanonische actionId <code>{CANONICAL_EXPORT_INVOICE_ACTION_ID}</code> — Format im Request fixiert{" "}
          <code>XRECHNUNG</code> (Contract/Backend).
        </p>,
      );
    }
    if (a === "BOOK_INVOICE") {
      rows.push(
        <p key="book-invoice-hint" className="hint" style={{ margin: "0 0 0.5rem" }}>
          Rechnung buchen: <code>POST /invoices/:invoiceId/book</code> — optional <code>issueDate</code> (ISO{" "}
          <code>yyyy-mm-dd</code>).
        </p>,
      );
      add("issueDate", "issueDate (optional, yyyy-mm-dd)");
    }
    if (a === "RECORD_DUNNING_REMINDER") {
      rows.push(
        <p key="dunning-hint" className="hint" style={{ margin: "0 0 0.5rem" }}>
          Mahn-Ereignis: <code>POST /invoices/:invoiceId/dunning-reminders</code> — nur gebuchte/teilbezahlte Rechnung (SoT).
        </p>,
      );
      add("dunningStageOrdinal", "Mahn-Stufe (1–9)");
      add("dunningNote", "Notiz (optional)", "max. 500 Zeichen", "textarea");
    }
    if (a === "OFFER_CREATE_VERSION" || a === "OFFER_CREATE_SUPPLEMENT") {
      add("offerId", "offerId", "Pfad /offers/{offerId}/…");
      add("lvVersionId", "lvVersionId");
      add("editingText", "Bearbeitungstext", undefined, "textarea");
    }
    if (a === "SUPPLEMENT_APPLY_BILLING_IMPACT") add("invoiceId", "invoiceId");
    if (a === "MEASUREMENT_CREATE") {
      add("projectId", "projectId");
      add("customerId", "customerId");
      add("lvVersionId", "lvVersionId");
      add("positionsJson", "positions (JSON-Array)", undefined, "textarea");
    }
    if (a === "MEASUREMENT_UPDATE_POSITIONS") {
      add("positionsJson", "positions (JSON-Array)", undefined, "textarea");
    }
    if (a === "MEASUREMENT_CREATE_VERSION" && !measurementDetail) {
      add("measurementId", "measurementId");
    }
    if (a === "LV_CATALOG_CREATE") {
      add("name", "name");
      add("headerSystemText", "headerSystemText (Systemtext)", "exportrelevant, nicht mit Bearbeitungstext verwechseln");
      add("headerEditingText", "headerEditingText", undefined, "textarea");
      add("projectId", "projectId (optional)");
    }
    if (a === "LV_CREATE_NEXT_VERSION") add("lvCatalogId", "lvCatalogId");
    if (a === "LV_ADD_STRUCTURE_NODE") {
      add("parentNodeId", "parentNodeId", "leer → null");
      add("kind", "kind (BEREICH|TITEL|UNTERTITEL)");
      add("sortOrdinal", "sortOrdinal");
      add("systemText", "systemText (Systemtext)", undefined, "textarea");
      add("editingText", "editingText", undefined, "textarea");
    }
    if (a === "LV_ADD_POSITION") {
      add("parentNodeId", "parentNodeId");
      add("sortOrdinal", "sortOrdinal");
      add("quantity", "quantity");
      add("unit", "unit");
      add("unitPriceCents", "unitPriceCents");
      add("positionKind", "kind (NORMAL|ALTERNATIV|EVENTUAL)");
      add("systemText", "systemText", undefined, "textarea");
      add("editingText", "editingText", undefined, "textarea");
    }
    if (a === "LV_UPDATE_NODE_EDITING_TEXT") {
      add("nodeEditingText", "Bearbeitungstext (nur editing, kein Systemtext)", undefined, "textarea");
    }
    if (a === "LV_UPDATE_POSITION") {
      add("positionPatchJson", "JSON-Patch (optional)", "oder editingText-Feld unten im Formular");
      add("editingText", "editingText (falls kein JSON)", undefined, "textarea");
    }

    rows.unshift(
      <label key="reason" className="field">
        <span>Grund (reason, min. 5 Zeichen)</span>
        <textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
      </label>,
    );

    return <div className="field-grid">{rows}</div>;
  }, [modalAction, form, measurementDetail]);

  return (
    <AppShell
      integrationChrome={showExpertUi}
      offlineNote={
        browserOnline
          ? undefined
          : "Offline (Browser): nur App-Shell und statische Assets (Workbox). API und Schreibaktionen (Buchung, Mahnung, Zahlung, …) erfordern Netz und Backend — keine Offline-Schreibsimulation."
      }
      nav={
        <AppPrimaryNav
          currentPath={hashPath}
          hasSession={Boolean(token?.trim())}
          role={tokenRole}
        />
      }
    >
      {banner?.kind === "error" ? (
        banner.structured ? (
          <FinanceStructuredApiError envelope={banner.structured.envelope} status={banner.structured.status} />
        ) : (
          <div className="error-banner" role="alert">
            <strong>{banner.code ? `${banner.code}: ` : ""}</strong>
            {banner.text}
            {banner.correlationId ? (
              <>
                {" "}
                <code>correlationId={banner.correlationId}</code>
              </>
            ) : null}
          </div>
        )
      ) : null}
      {banner?.kind === "ok" ? (
        <div className="success-banner">
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{banner.text}</pre>
        </div>
      ) : null}

      {tenantMismatch ? (
        <div className="error-banner">
          <strong>Tenant-Warnung:</strong> X-Tenant-Id ({tenantId}) weicht von tenantId im Token ({tokenTenant}) ab — Backend
          antwortet mit TENANT_SCOPE_VIOLATION.
        </div>
      ) : null}

      {showFinancePrep ? (
        <FinancePreparation
          key={financePrepMountKey}
          api={client}
          initialMainTab={financePrepInitialMainTab}
          showExpertIntegratorNav={showExpertUi}
          showFortgeschrittenTab={showExpertUi}
        />
      ) : null}

      {showLogin ? (
        <LoginPage
          apiBase={apiBase}
          defaultTenantId={viteDefaultTenant}
          onSuccess={(r) => {
            setToken(r.accessToken);
            // Align prevTenant before tenantId so the tenant-change effect does not treat
            // login as an external tenant switch and clear token/banner (same batch).
            setPrevTenant(r.tenantId);
            setTenantId(r.tenantId);
            setSessionMode("session");
            persistSession(r.accessToken, r.tenantId, "session");
            setBanner({ kind: "ok", text: `Angemeldet — Rolle ${r.role}. Token in sessionStorage (Tab).` });
            window.location.hash = "#/";
          }}
          onNavigateHome={() => {
            window.location.hash = "#/";
          }}
        />
      ) : null}

      {showPasswordReset ? <PasswordResetPage apiBase={apiBase} defaultTenantId={viteDefaultTenant} /> : null}

      {showGeschaeftsprozess ? <GeschaeftsprozessWizard api={client} showIntegrationHints={showExpertUi} /> : null}

      {showLvBearbeiten ? (
        <LvBearbeitenPage
          api={client}
          showIntegrationHints={showExpertUi}
          onOpenShellForLvActions={async (lvId) => {
            window.location.hash = DOCUMENT_WORKSPACE_HASH;
            await fetchAllowedFor(lvId, "LV_VERSION");
          }}
        />
      ) : null}

      {showStammdatenHub ? (
        <StammdatenHubPage
          api={token?.trim() ? client : null}
          hasSession={Boolean(token?.trim())}
          showIntegrationHints={showExpertUi}
          canWriteCrmStammdaten={canManageTenantPwaExpertMode}
        />
      ) : null}
      {showLvAufmassHub ? <LvAufmassHubPage showIntegrationHints={showExpertUi} /> : null}
      {showAngeboteHub ? <AngeboteNachtraegeHubPage showIntegrationHints={showExpertUi} /> : null}
      {showEinstellungenHub ? (
        <EinstellungenHubPage showIntegrationHints={showExpertUi} tokenRole={tokenRole} />
      ) : null}
      {showHilfeHub ? <HilfeHubPage showIntegrationHints={showExpertUi} /> : null}

      {showMeasurementPilot ? (
        token?.trim() ? (
          <MeasurementPilotListPage
            api={client}
            tenantId={tenantId.trim() || SEED.tenantId}
            showIntegrationHints={showExpertUi}
          />
        ) : (
          <section className="panel">
            <p className="hint">Bitte anmelden, um Messungsversionen zu laden.</p>
          </section>
        )
      ) : null}
      {showOfferWorkspace ? (
        token?.trim() ? (
          <OfferSupplementWorkspacePage api={client} showIntegrationHints={showExpertUi} />
        ) : (
          <section className="panel">
            <p className="hint">Bitte anmelden.</p>
          </section>
        )
      ) : null}
      {showFinanceWorklist ? (
        token?.trim() ? (
          <FinanceOperationalWorklistPage api={client} showIntegrationHints={showExpertUi} />
        ) : (
          <section className="panel">
            <p className="hint">Bitte anmelden.</p>
          </section>
        )
      ) : null}
      {showAdminUsers ? (
        token?.trim() ? (
          <AdminUsersPage api={client} showIntegrationHints={showExpertUi} />
        ) : (
          <section className="panel">
            <p className="hint">Bitte anmelden.</p>
          </section>
        )
      ) : null}

      {showMainWorkspaceChrome ? (
        <>
          {showHomeDashboard ? <HomeDashboard showIntegrationHints={showExpertUi} /> : null}
          <RoleQuickNav
            effectiveRole={quickNavRole}
            hasSession={Boolean(token?.trim())}
            busy={busy}
            onSelect={runQuickPreset}
            showIntegrationHints={showExpertUi}
          />
      <section className="panel" id="session-api-panel">
        <h2>Sitzung &amp; API</h2>
        <div className="field-grid two">
          <label className="field">
            <span>API_BASE_URL (VITE_API_BASE_URL)</span>
            <input type="text" value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
          </label>
          <label className="field">
            <span>X-Tenant-Id</span>
            <input type="text" value={tenantId} onChange={(e) => setTenantId(e.target.value)} aria-label="X-Tenant-Id" />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span>Bearer Token (dev: npm run dev:token im Repo-Root)</span>
            <textarea value={token} onChange={(e) => setToken(e.target.value)} rows={2} />
          </label>
        </div>
        <div className="actions-row">
          <label className="field" style={{ minWidth: "280px" }}>
            <span>Token-Persistenz</span>
            <select
              aria-label="Token-Persistenz"
              value={sessionMode}
              onChange={(e) => setSessionMode(e.target.value as SessionStorageMode)}
            >
              <option value="memory">Memory-only (Default, sicherer)</option>
              <option value="session">SessionStorage Opt-in (Tab-Lebensdauer)</option>
            </select>
          </label>
          <button type="button" className="btn secondary" onClick={persist}>
            Session anwenden
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              clearPersistedSession();
              setSessionMode("memory");
              setBanner({ kind: "ok", text: "Persistierte Session entfernt (sessionStorage geleert)." });
            }}
          >
            Persistenz löschen
          </button>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", alignSelf: "center" }}>
            Backend: <code>CORS_ORIGINS=http://localhost:5173</code>, Port 3000
          </span>
        </div>
        {sessionMode === "session" ? (
          <p style={{ fontSize: "0.78rem", color: "var(--danger)", marginBottom: 0 }}>
            Warnung: SessionStorage ist weniger sicher als Memory-only und nur für explizite Dev-Zwecke gedacht.
          </p>
        ) : null}
        {token?.trim() && !tenantMismatch && canManageTenantPwaExpertMode ? (
          <div
            className="field"
            style={{ marginTop: "0.75rem" }}
            data-testid="tenant-pwa-expert-mode-toggle"
            aria-busy={tenantPwaExpertModeBusy}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                minHeight: "44px",
                cursor: tenantPwaExpertModeBusy ? "wait" : "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={tenantPwaExpertModeEnabled}
                disabled={tenantPwaExpertModeBusy}
                aria-describedby="tenant-pwa-expert-mode-hint"
                onChange={async (e) => {
                  const next = e.target.checked;
                  setTenantPwaExpertModeBusy(true);
                  setBanner(null);
                  try {
                    await client.patchTenantPwaDisplaySettings({
                      pwaExpertModeEnabled: next,
                      reason: next
                        ? "Mandanten-Expertenmodus aktivieren (Hash-Hilfen Finanz-Vorbereitung)"
                        : "Mandanten-Expertenmodus deaktivieren",
                    });
                    setTenantPwaExpertModeEnabled(next);
                    setBanner({
                      kind: "ok",
                      text: next
                        ? "Mandanten-Expertenmodus aktiv — Finanz-Vorbereitung zeigt Integrations-Hilfen."
                        : "Mandanten-Expertenmodus aus.",
                    });
                  } catch (err) {
                    if (err instanceof ApiError) {
                      setBanner({
                        kind: "error",
                        text: err.envelope.message,
                        code: err.envelope.code,
                        correlationId: err.envelope.correlationId,
                        structured: { envelope: err.envelope, status: err.status },
                      });
                    } else {
                      setBanner({
                        kind: "error",
                        text: err instanceof Error ? err.message : String(err),
                      });
                    }
                  } finally {
                    setTenantPwaExpertModeBusy(false);
                  }
                }}
              />
              <span>Mandanten-Expertenmodus (Finanz-Vorbereitung: Hash-/Tab-Hilfen für alle Nutzer dieses Mandanten)</span>
            </label>
            <p id="tenant-pwa-expert-mode-hint" style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "0.35rem 0 0" }}>
              Zusätzlich: Vite-Dev oder <code>VITE_PWA_EXPERT_UI=1</code> blendet dieselben Hilfen ohne Server-Flag ein.
            </p>
          </div>
        ) : null}
      </section>

      {showDocumentWorkspace ? (
        <>
      <section className="panel" data-testid="shell-document-panel">
        <h2>Dokument (allowed-actions)</h2>
        <div className="field-grid two">
          <label className="field">
            <span>entityType</span>
            <select
              data-testid="shell-document-entity-type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as EntityType)}
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Dokument-ID (UUID)</span>
            <input
              data-testid="shell-document-id"
              type="text"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
            />
          </label>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.5rem 0 0" }}>
          Seed-Beispiele: Angebotsversion <code>{SEED.offerVersionId}</code>, LV-Version <code>{SEED.lvVersionId}</code>, Aufmass-Version{" "}
          <code>{SEED.measurementVersionId}</code>, Rechnung <code>{SEED.invoiceId}</code> (entityType <code>INVOICE</code>)
        </p>
        <div className="actions-row">
          <button type="button" className="btn" disabled={busy} onClick={() => void fetchAllowed()}>
            Allowed Actions laden
          </button>
          <button
            type="button"
            className="btn secondary"
            data-testid="shell-document-detail-get"
            disabled={busy}
            onClick={() => void fetchDetail()}
          >
            Detail (GET, falls vorhanden)
          </button>
        </div>
        {allowedMeta ? (
          <p style={{ fontSize: "0.85rem", marginTop: "0.75rem" }}>
            <code>
              {allowedMeta.entityType} / {allowedMeta.documentId}
            </code>
          </p>
        ) : null}
        {allowedActions ? (
          <div className="actions-row" style={{ marginTop: "0.5rem" }}>
            {allowedActions.length === 0 ? (
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Keine Aktionen (Backend leer).</span>
            ) : (
              allowedActions.map((a) => (
                <button key={a} type="button" className="action-chip" disabled={busy} onClick={() => openAction(a)}>
                  {a}
                </button>
              ))
            )}
          </div>
        ) : null}
      </section>

      <section className="panel" data-testid="shell-dunning-config-panel">
        <h2>Mahnstufen-Konfiguration (Shell, read-only)</h2>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 0 }}>
          <code>GET /finance/dunning-reminder-config</code> — FIN-4; keine Schreibaktionen in diesem Panel.
        </p>
        <div className="actions-row">
          <button
            type="button"
            className="btn secondary"
            data-testid="shell-dunning-config-fetch"
            disabled={busy}
            aria-label="Mahnstufen-Konfiguration laden (GET)"
            onClick={() => void loadShellDunningReminderConfig()}
          >
            Mahnstufen-Konfiguration (GET)
          </button>
        </div>
        {shellDunningConfigJson ? (
          <>
            <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
              Antwort GET /finance/dunning-reminder-config
            </h3>
            <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-dunning-config-json">
              {shellDunningConfigJson}
            </ShellExpertDiagnosticsJson>
          </>
        ) : null}
      </section>

      <section className="panel" data-testid="shell-fin4-extra-readonly-panel">
        <h2>FIN-4 — weitere Lesepfade (Shell, read-only)</h2>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 0 }}>
          <code>GET /finance/dunning-reminder-templates</code>, <code>GET /finance/dunning-email-footer</code>,{" "}
          <code>GET /finance/dunning-reminder-automation</code>, <code>GET /finance/dunning-reminder-candidates</code>{" "}
          — keine Schreibaktionen.
        </p>
        <div className="actions-row" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn secondary"
            data-testid="shell-dunning-templates-fetch"
            disabled={busy}
            aria-label="Mahn-Vorlagen laden (GET)"
            onClick={() => void loadShellDunningReminderTemplates()}
          >
            Vorlagen (GET)
          </button>
          <button
            type="button"
            className="btn secondary"
            data-testid="shell-dunning-footer-fetch"
            disabled={busy}
            aria-label="E-Mail-Footer Stammdaten laden (GET)"
            onClick={() => void loadShellDunningEmailFooter()}
          >
            E-Mail-Footer (GET)
          </button>
          <button
            type="button"
            className="btn secondary"
            data-testid="shell-dunning-automation-fetch"
            disabled={busy}
            aria-label="Mandanten-Automation Mahnlauf laden (GET)"
            onClick={() => void loadShellDunningReminderAutomation()}
          >
            Automation Mahnlauf (GET)
          </button>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>Stufe</span>
            <input
              type="number"
              min={1}
              max={9}
              inputMode="numeric"
              value={shellDunningCandidatesStageOrdinal}
              onChange={(ev) => setShellDunningCandidatesStageOrdinal(ev.target.value)}
              disabled={busy}
              aria-label="Mahn-Stufe für Kandidaten-GET"
              style={{ width: "3.25rem" }}
            />
          </label>
          <button
            type="button"
            className="btn secondary"
            data-testid="shell-dunning-candidates-fetch"
            disabled={busy}
            aria-label="Mahn-Kandidaten laden (GET)"
            onClick={() => void loadShellDunningReminderCandidates()}
          >
            Kandidaten (GET)
          </button>
        </div>
        {shellDunningTemplatesJson ? (
          <>
            <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
              Antwort GET /finance/dunning-reminder-templates
            </h3>
            <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-dunning-templates-json">
              {shellDunningTemplatesJson}
            </ShellExpertDiagnosticsJson>
          </>
        ) : null}
        {shellDunningFooterJson ? (
          <>
            <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
              Antwort GET /finance/dunning-email-footer
            </h3>
            <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-dunning-footer-json">
              {shellDunningFooterJson}
            </ShellExpertDiagnosticsJson>
          </>
        ) : null}
        {shellDunningAutomationJson ? (
          <>
            <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
              Antwort GET /finance/dunning-reminder-automation
            </h3>
            <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-dunning-automation-json">
              {shellDunningAutomationJson}
            </ShellExpertDiagnosticsJson>
          </>
        ) : null}
        {shellDunningCandidatesJson ? (
          <>
            <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
              Antwort GET /finance/dunning-reminder-candidates
            </h3>
            <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-dunning-candidates-json">
              {shellDunningCandidatesJson}
            </ShellExpertDiagnosticsJson>
          </>
        ) : null}
      </section>

      <section className="panel" data-testid="shell-tenant-pwa-display-panel">
        <h2>Mandanten-PWA-Anzeige (Shell, read-only)</h2>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 0 }}>
          <code>GET /tenant/pwa-display-settings</code> — Expertenmodus-Flag mandantenweit; gleicher Contract-Header wie FIN-4-Leitpfade.
        </p>
        <div className="actions-row">
          <button
            type="button"
            className="btn secondary"
            data-testid="shell-tenant-pwa-display-fetch"
            disabled={busy}
            aria-label="Mandanten-PWA-Anzeige laden (GET)"
            onClick={() => void loadShellTenantPwaDisplaySettings()}
          >
            PWA-Anzeige Mandant (GET)
          </button>
        </div>
        {shellTenantPwaDisplayJson ? (
          <>
            <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>Antwort GET /tenant/pwa-display-settings</h3>
            <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-tenant-pwa-display-json">
              {shellTenantPwaDisplayJson}
            </ShellExpertDiagnosticsJson>
          </>
        ) : null}
      </section>

      {measurementDetail ? (
        <DocumentTextPanels
          status={measurementDetail.version.status}
          measurementId={measurementDetail.measurementId}
          systemText={measurementDetail.version.systemText}
          editingText={measurementDetail.version.editingText}
        />
      ) : null}

      {supplementDetail ? (
        <section className="panel" data-testid="supplement-shell-detail">
          <h2>Nachtrag (GET-Detail)</h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 0 }}>
            <code>GET /supplements/:supplementVersionId</code> — aktuell Metadaten (Status, Bezüge); System-/Bearbeitungstexte können später ergänzt werden.
          </p>
          <pre className="system-block" style={{ margin: 0 }}>
            {JSON.stringify(supplementDetail, null, 2)}
          </pre>
        </section>
      ) : null}

      {offerVersionDetail ? (
        <section className="panel" data-testid="offer-shell-detail">
          <h2>Angebotsversion (GET-Detail)</h2>
          <p style={{ fontSize: "0.85rem", marginTop: 0 }}>
            Status: <code>{(offerVersionDetail as { status: string }).status}</code> · offerId:{" "}
            <code>{(offerVersionDetail as { offerId: string }).offerId}</code> · lvVersionId:{" "}
            <code>{(offerVersionDetail as { lvVersionId: string }).lvVersionId}</code>
          </p>
          <div className="field-grid two">
            <div className="system-block" data-testid="offer-version-system-text">
              <div className="label">Systemtext</div>
              {(offerVersionDetail as { systemText: string }).systemText}
            </div>
            <div className="editing-block" data-testid="offer-version-editing-text">
              <div className="label">Bearbeitungstext</div>
              {(offerVersionDetail as { editingText: string }).editingText}
            </div>
          </div>
        </section>
      ) : null}

      {lvShellDetail ? (
        <section className="panel" data-testid="lv-shell-detail">
          <h2>LV-Version (GET-Detail, read-only)</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
            <code>GET /lv/versions/{lvShellDetail.version.id}</code> — LV-Hierarchie und Positionen (Systembeschreibung Abschnitt 9); nur Anzeige.
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.35rem", marginBottom: "0.35rem" }}>
            Zusätzlicher Lesepfad:{" "}
            <code>{`GET /lv/versions/${lvShellDetail.version.id}/structure`}</code> — Projektion ohne Katalog/Versionskopf (OpenAPI{" "}
            <code>LvHierarchySnapshot</code>).
          </p>
          <div style={{ marginBottom: "0.5rem" }}>
            <button
              type="button"
              disabled={busy}
              data-testid="shell-lv-structure-fetch"
              onClick={() => void loadLvShellStructureProjection()}
            >
              LV-Strukturprojektion (GET)
            </button>
          </div>
          <pre className="system-block" style={{ margin: 0 }}>
            {JSON.stringify(lvShellDetail, null, 2)}
          </pre>
          {lvShellStructureJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
                Antwort GET /lv/versions/{lvShellDetail.version.id}/structure
              </h3>
              <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-lv-structure-json">
                {lvShellStructureJson}
              </ShellExpertDiagnosticsJson>
            </>
          ) : null}
        </section>
      ) : null}

      {invoiceShellDetail ? (
        <section className="panel" data-testid="invoice-shell-detail">
          <h2>Rechnung (GET-Detail, read-only)</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
            <code>GET /invoices/{invoiceShellDetail.invoiceId}</code> — nur Anzeige; Schreibpfade bleiben über SoT/Aktionen.
          </p>
          <dl className="field-grid two" style={{ margin: 0 }}>
            <dt className="label">Status</dt>
            <dd style={{ margin: 0 }}>
              <code>{invoiceShellDetail.status}</code>
            </dd>
            <dt className="label">Rechnungsnr.</dt>
            <dd style={{ margin: 0 }}>{invoiceShellDetail.invoiceNumber ?? "—"}</dd>
            <dt className="label">Skonto (B2-1a)</dt>
            <dd style={{ margin: 0 }}>{formatSkontoDisplay(invoiceShellDetail.skontoBps)}</dd>
            <dt className="label">LV-Netto (nach 8.4)</dt>
            <dd style={{ margin: 0 }}>{formatShellEur(invoiceShellDetail.lvNetCents)}</dd>
            <dt className="label">USt / Brutto</dt>
            <dd style={{ margin: 0 }}>
              {formatShellEur(invoiceShellDetail.vatCents)} / {formatShellEur(invoiceShellDetail.totalGrossCents)}
            </dd>
            <dt className="label">Bezahlt</dt>
            <dd style={{ margin: 0 }}>{formatShellEur(invoiceShellDetail.totalPaidCents)}</dd>
            <dt className="label">LV-Version (Trace)</dt>
            <dd style={{ margin: 0 }} data-testid="shell-invoice-trace-lv">
              <code>{invoiceShellDetail.lvVersionId}</code>
            </dd>
            <dt className="label">Aufmass-ID</dt>
            <dd style={{ margin: 0 }} data-testid="shell-invoice-trace-measurement">
              <code>{invoiceShellDetail.measurementId}</code>
            </dd>
            <dt className="label">Angebotsversion</dt>
            <dd style={{ margin: 0 }} data-testid="shell-invoice-trace-offer-version">
              {invoiceShellDetail.offerVersionId ? (
                <code>{invoiceShellDetail.offerVersionId}</code>
              ) : (
                <span>—</span>
              )}
            </dd>
          </dl>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.65rem", marginBottom: "0.35rem" }}>
            Weitere Lesepfade (keine Schreibaktionen):{" "}
            <code>
              GET /invoices/{invoiceShellDetail.invoiceId}/payment-intakes
            </code>
            ,{" "}
            <code>
              GET /invoices/{invoiceShellDetail.invoiceId}/dunning-reminders
            </code>
            , <code>GET /finance/payment-terms</code> (<code>projectId</code> aus dieser Rechnung:{" "}
            <code>{invoiceShellDetail.projectId}</code>),{" "}
            <code>GET /documents/…/allowed-actions</code> (<code>INVOICE</code>
            {invoiceShellDetail.offerVersionId ? (
              <>
                ; bei gesetzter Angebotsversion zusätzlich <code>OFFER_VERSION</code> mit{" "}
                <code>{invoiceShellDetail.offerVersionId}</code>
              </>
            ) : null}
            ),{" "}
            <code>GET /finance/e-invoice-parties/tenant</code>, <code>GET …/customers</code>,{" "}
            <code>{`GET …/customers/{customerId}`}</code> (aus dieser Rechnung:{" "}
            <code>{invoiceShellDetail.customerId}</code>), <code>GET /finance/invoice-tax-profile</code>,{" "}
            <code>{`GET /finance/invoice-tax-profile/projects/{projectId}`}</code> (
            <code>{invoiceShellDetail.projectId}</code>),{" "}
            <code>{`GET /lv/versions/${invoiceShellDetail.lvVersionId}`}</code> (LV-Traceability aus Rechnung),{" "}
            <code>GET /audit-events</code> (mandantenweit, Seite 1; Rollen mit Audit-Leserecht).
          </p>
          <div data-testid="shell-invoice-readonly-subreads" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button type="button" disabled={busy} onClick={() => void loadInvoicePaymentIntakesRead()}>
              Zahlungseingänge (GET)
            </button>
            <button type="button" disabled={busy} onClick={() => void loadInvoiceDunningRemindersRead()}>
              Mahn-Ereignisse (GET)
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label="Zahlungsbedingungen zum Projekt der Rechnung laden (GET)"
              onClick={() => void loadInvoicePaymentTermsForShell()}
            >
              Zahlungsbedingungen Projekt (GET)
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label="Erlaubte Aktionen für diese Rechnung laden (GET)"
              onClick={() => void loadInvoiceAllowedActionsForShell()}
            >
              Erlaubte Aktionen Rechnung (GET)
            </button>
            <button
              type="button"
              disabled={busy || !invoiceShellDetail.offerVersionId}
              aria-label="Erlaubte Aktionen für die Angebotsversion dieser Rechnung laden (GET)"
              data-testid="shell-invoice-offer-version-allowed-actions-fetch"
              onClick={() => void loadInvoiceShellOfferVersionAllowedActions()}
            >
              Erlaubte Aktionen Angebotsversion (GET)
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label="E-Rechnung Seller-Stammdaten Mandant laden (GET)"
              data-testid="shell-invoice-e-invoice-tenant-fetch"
              onClick={() => void loadInvoiceShellTenantEInvoiceParty()}
            >
              E-Rechnung Seller (GET)
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label="E-Rechnung Buyer-Stammdaten Liste laden (GET)"
              data-testid="shell-invoice-e-invoice-customers-fetch"
              onClick={() => void loadInvoiceShellCustomerEInvoicePartiesList()}
            >
              E-Rechnung Buyer-Liste (GET)
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label="E-Rechnung Buyer-Stammdaten für Kunden-ID der Rechnung laden (GET)"
              data-testid="shell-invoice-e-invoice-buyer-fetch"
              onClick={() => void loadInvoiceShellBuyerEInvoiceParty()}
            >
              E-Rechnung Buyer Rechnung (GET)
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label="Mandanten-Steuerprofil Rechnung laden (GET)"
              data-testid="shell-invoice-invoice-tax-profile-fetch"
              onClick={() => void loadInvoiceShellTenantTaxProfile()}
            >
              Steuerprofil Mandant (GET)
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label="Projekt-Steueroverride zur Rechnung laden (GET)"
              data-testid="shell-invoice-project-tax-override-fetch"
              onClick={() => void loadInvoiceShellProjectTaxOverride()}
            >
              Steueroverride Projekt (GET)
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label="LV-Version zur Traceability dieser Rechnung laden (GET)"
              data-testid="shell-invoice-lv-version-fetch"
              onClick={() => void loadInvoiceShellLvVersionSnapshot()}
            >
              LV-Version Traceability (GET)
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label="Audit-Ereignisse Mandant Seite 1 laden (GET)"
              data-testid="shell-invoice-audit-events-fetch"
              onClick={() => void loadInvoiceShellAuditEventsPage()}
            >
              Audit-Ereignisse (GET)
            </button>
          </div>
          {invoicePaymentIntakesJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>Antwort payment-intakes</h3>
              <pre className="system-block" style={{ margin: 0 }}>
                {invoicePaymentIntakesJson}
              </pre>
            </>
          ) : null}
          {invoiceDunningRemindersJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>Antwort dunning-reminders</h3>
              <pre className="system-block" style={{ margin: 0 }}>
                {invoiceDunningRemindersJson}
              </pre>
            </>
          ) : null}
          {invoicePaymentTermsJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
                Antwort GET /finance/payment-terms (Projekt)
              </h3>
              <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-invoice-payment-terms-json">
                {invoicePaymentTermsJson}
              </ShellExpertDiagnosticsJson>
            </>
          ) : null}
          {invoiceAllowedActionsShellJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
                Antwort allowed-actions (INVOICE)
              </h3>
              <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-invoice-allowed-actions-json">
                {invoiceAllowedActionsShellJson}
              </ShellExpertDiagnosticsJson>
            </>
          ) : null}
          {invoiceOfferVersionAllowedActionsJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
                Antwort allowed-actions (OFFER_VERSION)
              </h3>
              <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-invoice-offer-version-allowed-actions-json">
                {invoiceOfferVersionAllowedActionsJson}
              </ShellExpertDiagnosticsJson>
            </>
          ) : null}
          {invoiceEInvoiceTenantJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
                Antwort GET /finance/e-invoice-parties/tenant
              </h3>
              <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-invoice-e-invoice-tenant-json">
                {invoiceEInvoiceTenantJson}
              </ShellExpertDiagnosticsJson>
            </>
          ) : null}
          {invoiceEInvoiceCustomersListJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
                Antwort GET /finance/e-invoice-parties/customers
              </h3>
              <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-invoice-e-invoice-customers-json">
                {invoiceEInvoiceCustomersListJson}
              </ShellExpertDiagnosticsJson>
            </>
          ) : null}
          {invoiceEInvoiceBuyerJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
                {`Antwort GET /finance/e-invoice-parties/customers/{customerId}`}
              </h3>
              <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-invoice-e-invoice-buyer-json">
                {invoiceEInvoiceBuyerJson}
              </ShellExpertDiagnosticsJson>
            </>
          ) : null}
          {invoiceTenantTaxProfileJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
                Antwort GET /finance/invoice-tax-profile (Mandant)
              </h3>
              <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-invoice-invoice-tax-profile-json">
                {invoiceTenantTaxProfileJson}
              </ShellExpertDiagnosticsJson>
            </>
          ) : null}
          {invoiceProjectTaxOverrideJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
                {`Antwort GET /finance/invoice-tax-profile/projects/${invoiceShellDetail.projectId}`}
              </h3>
              <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-invoice-project-tax-override-json">
                {invoiceProjectTaxOverrideJson}
              </ShellExpertDiagnosticsJson>
            </>
          ) : null}
          {invoiceShellLvSnapshotJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
                {`Antwort GET /lv/versions/${invoiceShellDetail.lvVersionId}`}
              </h3>
              <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-invoice-lv-version-json">
                {invoiceShellLvSnapshotJson}
              </ShellExpertDiagnosticsJson>
            </>
          ) : null}
          {invoiceAuditEventsJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
                Antwort GET /audit-events (Seite 1)
              </h3>
              <ShellExpertDiagnosticsJson showOpen={showExpertUi} testId="shell-invoice-audit-events-json">
                {invoiceAuditEventsJson}
              </ShellExpertDiagnosticsJson>
            </>
          ) : null}
        </section>
      ) : null}
        </>
      ) : null}

      {modalAction ? (
        <div className="modal-backdrop" role="presentation" onClick={() => !busy && setModalAction(null)}>
          <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{modalAction}</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 0 }}>
              Wird nur ausgeführt, wenn die Aktion in der zuletzt geladenen <code>allowedActions</code>-Liste enthalten ist.
            </p>
            {renderModalFields()}
            <div className="footer">
              <button type="button" className="btn secondary" disabled={busy} onClick={() => setModalAction(null)}>
                Abbrechen
              </button>
              <button type="button" className="btn" disabled={busy} onClick={() => void runAction()}>
                Ausführen
              </button>
            </div>
          </div>
        </div>
      ) : null}
        </>
      ) : null}
    </AppShell>
  );
}
