import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { AppShell } from "./components/AppShell.js";
import { DocumentTextPanels } from "./components/DocumentTextPanels.js";
import { FinancePreparation } from "./components/FinancePreparation.js";
import { LoginPage } from "./components/LoginPage.js";
import { PasswordResetPage } from "./components/PasswordResetPage.js";
import { RoleQuickNav } from "./components/RoleQuickNav.js";
import { DEMO_SEED_IDS as SEED } from "./lib/demo-seed-ids.js";
import {
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
import { ApiError } from "./lib/api-error.js";
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
  const [banner, setBanner] = useState<{ kind: "error" | "ok"; text: string; code?: string; correlationId?: string } | null>(
    null,
  );

  const [measurementDetail, setMeasurementDetail] = useState<{
    measurementId: string;
    version: { status?: string; systemText?: string; editingText?: string };
  } | null>(null);
  const [supplementDetail, setSupplementDetail] = useState<unknown>(null);
  const [offerVersionDetail, setOfferVersionDetail] = useState<unknown>(null);
  const [invoiceShellDetail, setInvoiceShellDetail] = useState<InvoiceOverview | null>(null);
  const [lvShellDetail, setLvShellDetail] = useState<LvVersionSnapshot | null>(null);
  /** Read-only Lesepfade zur Rechnung (Haupt-Shell); zurückgesetzt bei jedem „Detail laden“. */
  const [invoicePaymentIntakesJson, setInvoicePaymentIntakesJson] = useState("");
  const [invoiceDunningRemindersJson, setInvoiceDunningRemindersJson] = useState("");
  const [invoicePaymentTermsJson, setInvoicePaymentTermsJson] = useState("");
  const [invoiceAllowedActionsShellJson, setInvoiceAllowedActionsShellJson] = useState("");
  /** Haupt-Shell: read-only GET /finance/dunning-reminder-config (FIN-4). */
  const [shellDunningConfigJson, setShellDunningConfigJson] = useState("");

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

  const hashPath = useHashRoute();
  const hashQuery = readHashQuery();
  const showFinancePrep = isFinancePrepHashPath(hashPath);
  const financePrepInitialMainTab = resolveFinancePrepInitialMainTab(hashPath, hashQuery);
  const financePrepRouteKey = `${hashPath}:${hashQuery.get("tab") ?? ""}`;
  const showLogin = hashPath === "/login";
  const showPasswordReset = hashPath === "/password-reset";

  useEffect(() => {
    if (!showFinancePrep) return;
    normalizeFinancePrepHashToCanon();
  }, [showFinancePrep, hashPath]);

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
      setShellDunningConfigJson("");
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
      window.location.hash = "#/";
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
      offlineNote={
        browserOnline
          ? undefined
          : "Offline (Browser): nur App-Shell und statische Assets (Workbox). API und Schreibaktionen (Buchung, Mahnung, Zahlung, …) erfordern Netz und Backend — keine Offline-Schreibsimulation."
      }
      nav={
        <nav className="shell-nav" aria-label="Hauptnavigation">
          <a href="#/">Shell / Dokument</a>
          <a href={FINANCE_PREP_HASH}>Finanz (Vorbereitung)</a>
          <a href={FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH}>Finanz (Grundeinstellungen Mahnlauf)</a>
          <a href="#/login">Anmeldung</a>
          <a href="#/password-reset">Passwort vergessen</a>
        </nav>
      }
    >
      {!showFinancePrep && !showLogin && !showPasswordReset ? (
        <RoleQuickNav
          effectiveRole={quickNavRole}
          hasSession={Boolean(token?.trim())}
          busy={busy}
          onSelect={runQuickPreset}
        />
      ) : null}
      {banner?.kind === "error" ? (
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
        <FinancePreparation key={financePrepRouteKey} api={client} initialMainTab={financePrepInitialMainTab} />
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

      {!showFinancePrep && !showLogin && !showPasswordReset ? (
        <>
      <section className="panel">
        <h2>Sitzung &amp; API</h2>
        <div className="field-grid two">
          <label className="field">
            <span>API_BASE_URL (VITE_API_BASE_URL)</span>
            <input type="text" value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
          </label>
          <label className="field">
            <span>X-Tenant-Id</span>
            <input type="text" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
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
      </section>

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
            <pre className="system-block" style={{ margin: 0 }} data-testid="shell-dunning-config-json">
              {shellDunningConfigJson}
            </pre>
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
          <pre className="system-block" style={{ margin: 0 }}>
            {JSON.stringify(lvShellDetail, null, 2)}
          </pre>
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
            <code>GET /documents/…/allowed-actions</code> (<code>INVOICE</code>).
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
              <pre className="system-block" style={{ margin: 0 }} data-testid="shell-invoice-payment-terms-json">
                {invoicePaymentTermsJson}
              </pre>
            </>
          ) : null}
          {invoiceAllowedActionsShellJson ? (
            <>
              <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
                Antwort allowed-actions (INVOICE)
              </h3>
              <pre className="system-block" style={{ margin: 0 }} data-testid="shell-invoice-allowed-actions-json">
                {invoiceAllowedActionsShellJson}
              </pre>
            </>
          ) : null}
        </section>
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
