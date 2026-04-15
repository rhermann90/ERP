import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { AppShell } from "./components/AppShell.js";
import { DocumentTextPanels } from "./components/DocumentTextPanels.js";
import {
  CANONICAL_EXPORT_INVOICE_ACTION_ID,
  ENTITY_TYPES,
  type ActionFormFields,
  type EntityType,
  executeActionWithSotGuard,
} from "./lib/action-executor.js";
import { ApiError } from "./lib/api-error.js";
import { createApiClient } from "./lib/api-client.js";
import {
  clearDocumentScopedKeys,
  clearPersistedSession,
  loadPersistedSession,
  persistSession,
  storageKeyForTenant,
  type SessionStorageMode,
} from "./lib/tenant-session.js";

const SEED = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  offerId: "22222222-2222-4222-8222-222222222222",
  offerVersionId: "33333333-3333-4333-8333-333333333333",
  lvVersionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001",
  measurementVersionId: "cccccccc-cccc-4ccc-8ccc-cccccccc0001",
  invoiceId: "44444444-4444-4444-8444-444444444444",
  lvCatalogId: "fafa0000-0000-4000-8000-000000000001",
} as const;

function decodeTokenTenantId(token: string): string | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  try {
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const json = JSON.parse(atob(b64)) as { tenantId?: string };
    return typeof json.tenantId === "string" ? json.tenantId : null;
  } catch {
    return null;
  }
}

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
  const defaultApi = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
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
  });

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBase,
        getToken: () => token,
        getTenantId: () => tenantId,
      }),
    [apiBase, token, tenantId],
  );

  const tokenTenant = token ? decodeTokenTenantId(token) : null;
  const tenantMismatch = tokenTenant && tenantId && tokenTenant !== tenantId;

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

  const fetchAllowed = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const res = await client.getAllowedActions(documentId.trim(), entityType);
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
  };

  const fetchDetail = async () => {
    setBusy(true);
    setBanner(null);
    try {
      if (entityType === "MEASUREMENT_VERSION") {
        const raw = (await client.getMeasurementVersion(documentId.trim())) as {
          measurementId: string;
          version: { status: string; systemText: string; editingText: string };
        };
        setMeasurementDetail({ measurementId: raw.measurementId, version: raw.version });
        setForm((f) => ({ ...f, measurementId: raw.measurementId }));
        setSupplementDetail(null);
      } else if (entityType === "SUPPLEMENT_VERSION") {
        const raw = await client.getSupplementVersion(documentId.trim());
        setSupplementDetail(raw);
        setMeasurementDetail(null);
        setForm((f) => ({
          ...f,
          offerId: SEED.offerId,
        }));
      } else {
        setMeasurementDetail(null);
        setSupplementDetail(null);
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
      setBanner({ kind: "ok", text: JSON.stringify(result, null, 2) });
      await fetchAllowed();
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
    <AppShell offlineNote="Offline: nur App-Shell/Assets (Workbox). Keine Buchung ohne Backend.">
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

      <section className="panel">
        <h2>Dokument (allowed-actions)</h2>
        <div className="field-grid two">
          <label className="field">
            <span>entityType</span>
            <select value={entityType} onChange={(e) => setEntityType(e.target.value as EntityType)}>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Dokument-ID (UUID)</span>
            <input type="text" value={documentId} onChange={(e) => setDocumentId(e.target.value)} />
          </label>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.5rem 0 0" }}>
          Seed-Beispiele: Angebotsversion <code>{SEED.offerVersionId}</code>, LV-Version <code>{SEED.lvVersionId}</code>, Aufmass-Version{" "}
          <code>{SEED.measurementVersionId}</code>
        </p>
        <div className="actions-row">
          <button type="button" className="btn" disabled={busy} onClick={() => void fetchAllowed()}>
            Allowed Actions laden
          </button>
          <button type="button" className="btn secondary" disabled={busy} onClick={() => void fetchDetail()}>
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

      {measurementDetail ? (
        <DocumentTextPanels
          status={measurementDetail.version.status}
          measurementId={measurementDetail.measurementId}
          systemText={measurementDetail.version.systemText}
          editingText={measurementDetail.version.editingText}
        />
      ) : null}

      {supplementDetail ? (
        <section className="panel">
          <h2>Nachtrag (GET-Detail)</h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 0 }}>
            Backend liefert hier keinen System-/Bearbeitungstext; nur Metadaten. Texteerscheinen, sobald GET erweitert wird.
          </p>
          <pre className="system-block" style={{ margin: 0 }}>
            {JSON.stringify(supplementDetail, null, 2)}
          </pre>
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
    </AppShell>
  );
}
