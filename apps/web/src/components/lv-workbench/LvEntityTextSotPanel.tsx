import { useCallback, useMemo, useState, type ReactElement } from "react";
import type { ApiClient } from "../../lib/api-client.js";
import { ApiError } from "../../lib/api-error.js";
import {
  type ActionFormFields,
  executeActionWithSotGuard,
  type EntityType,
} from "../../lib/action-executor.js";

const TEXT_ACTIONS = new Set(["LV_UPDATE_NODE_EDITING_TEXT", "LV_UPDATE_POSITION"]);

function fieldsForAction(
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

  if (actionId === "LV_UPDATE_NODE_EDITING_TEXT") {
    add("nodeEditingText", "Neuer Bearbeitungstext (Knoten)", undefined, "textarea");
  }
  if (actionId === "LV_UPDATE_POSITION") {
    add("editingText", "Neuer Bearbeitungstext (Position)", "Alternative zu JSON-Patch", "textarea");
    add("positionPatchJson", "JSON-Patch (optional)", "z. B. {\"quantity\":10,\"unit\":\"m2\"}");
  }

  rows.unshift(
    <label key="reason" className="field">
      <span>Grund (reason, min. 5 Zeichen)</span>
      <textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
    </label>,
  );
  return rows;
}

/**
 * SoT-gestützte Textmutation für LV-Knoten und -Positionen (keine Status-/Struktur-Aktionen).
 * documentId = Knoten- bzw. Positions-UUID; entityType = LV_STRUCTURE_NODE | LV_POSITION.
 */
export function LvEntityTextSotPanel(props: { api: ApiClient; showIntegrationHints?: boolean }) {
  const { api, showIntegrationHints = false } = props;
  const [entityType, setEntityType] = useState<EntityType>("LV_STRUCTURE_NODE");
  const [documentId, setDocumentId] = useState("");
  const [allowedActions, setAllowedActions] = useState<string[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState("");
  const [form, setForm] = useState<ActionFormFields>({
    reason: "LV Bearbeitungstext — PWA Workbench",
  });
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const scopedActions = useMemo(
    () => (allowedActions ?? []).filter((a) => TEXT_ACTIONS.has(a)),
    [allowedActions],
  );

  const loadSoT = useCallback(async () => {
    const id = documentId.trim();
    setLoadError(null);
    setBanner(null);
    if (!id) {
      setAllowedActions(null);
      setLoadError("Dokument-ID (Knoten oder Position) erforderlich.");
      return;
    }
    setBusy(true);
    try {
      const r = await api.getAllowedActions(id, entityType);
      setAllowedActions(r.allowedActions);
      setSelectedAction("");
    } catch (e) {
      setAllowedActions(null);
      setLoadError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
  }, [api, documentId, entityType]);

  const runSelected = async () => {
    const id = documentId.trim();
    const a = selectedAction.trim();
    if (!id || !a || !allowedActions?.includes(a)) return;
    setBusy(true);
    setBanner(null);
    try {
      const result = await executeActionWithSotGuard(api, a, entityType, id, allowedActions, form);
      setBanner({
        kind: "ok",
        text: showIntegrationHints ? JSON.stringify(result, null, 2) : "Aktion erfolgreich ausgeführt.",
      });
      await loadSoT();
    } catch (e) {
      setBanner({
        kind: "err",
        text: e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" data-testid="lv-entity-text-sot-panel">
      <h3 style={{ marginTop: 0 }}>Bearbeitungstext ändern (Knoten / Position)</h3>
      <p className="hint">
        Wählen Sie die UUID eines Strukturknotens oder einer Position aus dem LV-Baum. Nur Aktionen, die das Backend für
        diese Entität freigibt.
      </p>
      <div className="field-grid two">
        <label className="field">
          <span>Entitätstyp</span>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as EntityType)}
            aria-label="LV Entitätstyp für SoT"
            data-testid="lv-entity-type-select"
          >
            <option value="LV_STRUCTURE_NODE">LV_STRUCTURE_NODE</option>
            <option value="LV_POSITION">LV_POSITION</option>
          </select>
        </label>
        <label className="field">
          <span>Knoten- oder Positions-ID</span>
          <input
            type="text"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            data-testid="lv-entity-document-id"
          />
        </label>
      </div>
      <button type="button" className="btn-primary" disabled={busy} onClick={() => void loadSoT()} data-testid="lv-entity-sot-load">
        Erlaubte Aktionen laden
      </button>
      {loadError ? (
        <p className="error-banner" role="alert">
          {loadError}
        </p>
      ) : null}
      {scopedActions.length > 0 ? (
        <>
          <label className="field" style={{ marginTop: "0.75rem" }}>
            <span>Aktion</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              aria-label="LV Textaktion"
              data-testid="lv-entity-action-select"
            >
              <option value="">—</option>
              {scopedActions.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          {selectedAction ? (
            <div className="field-grid" style={{ marginTop: "0.5rem" }}>
              {fieldsForAction(selectedAction, form, setForm)}
            </div>
          ) : null}
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: "0.75rem" }}
            disabled={busy || !selectedAction}
            onClick={() => void runSelected()}
            data-testid="lv-entity-sot-run"
          >
            Ausführen
          </button>
        </>
      ) : allowedActions && allowedActions.length > 0 ? (
        <p className="hint">Keine Text-Bearbeitungsaktion für diese ID freigegeben.</p>
      ) : null}
      {banner ? (
        <pre
          className={banner.kind === "err" ? "error-banner" : "success-banner"}
          style={{ marginTop: "0.75rem", whiteSpace: "pre-wrap" }}
          data-testid="lv-entity-sot-result"
        >
          {banner.text}
        </pre>
      ) : null}
    </section>
  );
}
