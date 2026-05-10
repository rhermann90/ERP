import { useCallback, useMemo, useState, type ReactElement } from "react";
import type { ApiClient } from "../../lib/api-client.js";
import { ApiError } from "../../lib/api-error.js";
import {
  type ActionFormFields,
  executeActionWithSotGuard,
} from "../../lib/action-executor.js";

/** Nur Aktionen, die bei entityType LV_VERSION und documentId = lvVersionId über den Executor laufen. */
const LV_VERSION_DOCUMENT_ACTIONS = new Set([
  "LV_SET_FREIGEGEBEN",
  "LV_SET_ARCHIVIERT",
  "LV_CREATE_NEXT_VERSION",
  "LV_ADD_STRUCTURE_NODE",
  "LV_ADD_POSITION",
]);

function renderFieldsForAction(
  actionId: string,
  form: ActionFormFields,
  setForm: React.Dispatch<React.SetStateAction<ActionFormFields>>,
): ReactElement[] {
  const rows: ReactElement[] = [];
  const add = (key: keyof ActionFormFields, label: string, hint?: string, type: "text" | "textarea" = "text") => {
    const v = form[key];
    const onChange = (x: string) => setForm((f) => ({ ...f, [key]: x }));
    rows.push(
      <label key={String(key)} className="field">
        <span>
          {label} {hint ? <span className="hint">{hint}</span> : null}
        </span>
        {type === "textarea" ? (
          <textarea value={String(v ?? "")} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input type="text" value={String(v ?? "")} onChange={(e) => onChange(e.target.value)} />
        )}
      </label>,
    );
  };

  if (actionId === "LV_CREATE_NEXT_VERSION") add("lvCatalogId", "lvCatalogId");
  if (actionId === "LV_ADD_STRUCTURE_NODE") {
    add("parentNodeId", "parentNodeId", "leer → null");
    add("kind", "kind (BEREICH|TITEL|UNTERTITEL)");
    add("sortOrdinal", "sortOrdinal");
    add("systemText", "systemText (Systemtext)", undefined, "textarea");
    add("editingText", "editingText", undefined, "textarea");
  }
  if (actionId === "LV_ADD_POSITION") {
    add("parentNodeId", "parentNodeId");
    add("sortOrdinal", "sortOrdinal");
    add("quantity", "quantity");
    add("unit", "unit");
    add("unitPriceCents", "unitPriceCents");
    add("positionKind", "kind (NORMAL|ALTERNATIV|EVENTUAL)");
    add("systemText", "systemText", undefined, "textarea");
    add("editingText", "editingText", undefined, "textarea");
  }

  rows.unshift(
    <label key="reason" className="field">
      <span>Grund (reason, min. 5 Zeichen)</span>
      <textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
    </label>,
  );
  return rows;
}

export function LvVersionSotPanel(props: {
  api: ApiClient;
  lvVersionId: string;
  onAfterMutation?: () => void;
  /** Wenn false: Server-SoT lesen (Liste erlaubter Aktionen), keine Ausführung — für Standard-Pilot ohne Expertenmodus. */
  allowExecution?: boolean;
}) {
  const allowExecution = props.allowExecution !== false;
  const [allowedActions, setAllowedActions] = useState<string[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [form, setForm] = useState<ActionFormFields>({
    reason: "Pilot LV Workbench — SoT-Aktion",
  });
  const [busy, setBusy] = useState(false);
  const [execBanner, setExecBanner] = useState<{
    kind: "ok" | "err";
    summary: string;
    detailJson?: string;
  } | null>(null);

  const lvScoped = useMemo(
    () => (allowedActions ?? []).filter((a) => LV_VERSION_DOCUMENT_ACTIONS.has(a)),
    [allowedActions],
  );

  const loadSoT = useCallback(async () => {
    const id = props.lvVersionId.trim();
    setLoadError(null);
    setExecBanner(null);
    if (!id) {
      setAllowedActions(null);
      setLoadError("LV-Version-ID fehlt.");
      return;
    }
    setBusy(true);
    try {
      const r = await props.api.getAllowedActions(id, "LV_VERSION");
      setAllowedActions(r.allowedActions);
      setSelectedAction("");
    } catch (e) {
      setAllowedActions(null);
      setLoadError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
  }, [props.api, props.lvVersionId]);

  const runSelected = async () => {
    const id = props.lvVersionId.trim();
    const a = selectedAction.trim();
    if (!id || !a || !allowedActions?.includes(a)) return;
    setBusy(true);
    setExecBanner(null);
    try {
      const result = await executeActionWithSotGuard(
        props.api,
        a,
        "LV_VERSION",
        id,
        allowedActions,
        form,
      );
      setExecBanner({
        kind: "ok",
        summary: `Aktion „${a}“ wurde ausgeführt (Server-SoT).`,
        detailJson: JSON.stringify(result, null, 2),
      });
      props.onAfterMutation?.();
      await loadSoT();
    } catch (e) {
      setExecBanner({
        kind: "err",
        summary: e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" data-testid="lv-version-sot-panel">
      <h3 style={{ marginTop: 0 }}>SoT — LV_VERSION</h3>
      <p className="hint">
        Nur Aktionen aus <code>GET /documents/…/allowed-actions?entityType=LV_VERSION</code>
        {allowExecution ? (
          <>
            ; Ausführung über <code>executeActionWithSotGuard</code> (keine parallele Berechtigungslogik).
          </>
        ) : (
          <>
            . <strong>Ausführung</strong> nur im Expertenmodus oder über <strong>Dokument und Details</strong>.
          </>
        )}
      </p>
      <button type="button" className="btn-primary" disabled={busy} onClick={() => void loadSoT()} data-testid="lv-sot-load">
        Erlaubte Aktionen laden
      </button>
      {loadError ? (
        <p className="error-banner" role="alert">
          {loadError}
        </p>
      ) : null}
      {allowedActions ? (
        <div style={{ marginTop: "0.75rem" }} data-testid="lv-sot-allowed-wrap">
          <p className="hint" data-testid="lv-sot-allowed-summary">
            {allowedActions.length} erlaubte Aktion(en) vom Server (documentId = LV-Version).
          </p>
          <ul style={{ margin: "0.35rem 0", paddingLeft: "1.25rem" }} data-testid="lv-sot-allowed-list">
            {allowedActions.map((a) => (
              <li key={a}>
                <code>{a}</code>
              </li>
            ))}
          </ul>
          {allowExecution ? (
            <details style={{ marginTop: "0.35rem" }}>
              <summary style={{ cursor: "pointer", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Rohdaten (JSON)
              </summary>
              <pre
                className="system-block"
                style={{ marginTop: "0.35rem", maxHeight: "10rem", overflow: "auto" }}
                data-testid="lv-sot-allowed-json"
              >
                {JSON.stringify({ allowedActions }, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}

      {allowExecution && lvScoped.length > 0 ? (
        <>
          <label className="field" style={{ marginTop: "0.75rem" }}>
            <span>Aktion auswählen</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              aria-label="LV SoT Aktion"
              data-testid="lv-sot-action-select"
            >
              <option value="">—</option>
              {lvScoped.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          {selectedAction ? (
            <div className="field-grid" style={{ marginTop: "0.5rem" }}>
              {renderFieldsForAction(selectedAction, form, setForm)}
            </div>
          ) : null}
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: "0.75rem" }}
            disabled={busy || !selectedAction}
            onClick={() => void runSelected()}
            data-testid="lv-sot-run"
          >
            Aktion ausführen
          </button>
        </>
      ) : allowExecution && allowedActions && allowedActions.length > 0 ? (
        <p className="hint">Keine LV-Schreibaktionen auf dieser Version (Status nicht ENTWURF oder nicht aktuelle Katalogversion).</p>
      ) : null}

      {!allowExecution && allowedActions && allowedActions.length > 0 ? (
        lvScoped.length > 0 ? (
          <p className="hint" data-testid="lv-sot-readonly-hint-exec">
            {lvScoped.length} pilotierte LV-Aktion(en) vom Server — zur Ausführung Expertenmodus aktivieren oder{" "}
            <strong>Dokument und Details</strong> nutzen.
          </p>
        ) : (
          <p className="hint" data-testid="lv-sot-readonly-no-lv-actions">
            Keine pilotierten LV-Schreibaktionen in dieser Komponente — vollständige Ausführung über Shell/Expertenmodus.
          </p>
        )
      ) : null}

      {execBanner ? (
        <div
          className={execBanner.kind === "err" ? "error-banner" : "success-banner"}
          style={{ marginTop: "0.75rem" }}
          role="status"
          data-testid="lv-sot-exec-result"
        >
          <p style={{ margin: 0 }}>{execBanner.summary}</p>
          {execBanner.kind === "ok" && execBanner.detailJson ? (
            <details style={{ marginTop: "0.5rem" }}>
              <summary style={{ cursor: "pointer", fontSize: "0.85rem" }}>Serverantwort (JSON)</summary>
              <pre className="system-block" style={{ marginTop: "0.35rem", whiteSpace: "pre-wrap", maxHeight: "12rem", overflow: "auto" }}>
                {execBanner.detailJson}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
