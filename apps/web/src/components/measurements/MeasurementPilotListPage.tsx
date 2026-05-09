import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiClient } from "../../lib/api-client.js";
import { ApiError } from "../../lib/api-error.js";
import { DocumentTextPanels } from "../DocumentTextPanels.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";
import { DOCUMENT_WORKSPACE_HASH, MEASUREMENT_PILOT_LIST_HASH } from "../../lib/hash-route.js";
import { storageKeyForTenant } from "../../lib/tenant-session.js";

type Props = {
  api: ApiClient;
  tenantId: string;
  showIntegrationHints?: boolean;
};

function parseIdList(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
  } catch {
    return [];
  }
}

/** Pilot-Messungsliste: lokale ID-Sammlung + GET-Snapshot (Backend hat kein Listen-Endpunkt). */
export function MeasurementPilotListPage({ api, tenantId, showIntegrationHints = false }: Props) {
  const storageKey = useMemo(() => storageKeyForTenant(tenantId, "pilot-measurement-version-ids"), [tenantId]);
  const [ids, setIds] = useState<string[]>([]);
  const [newId, setNewId] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailPayload, setDetailPayload] = useState<{
    measurementId: string;
    status?: string;
    systemText?: string;
    editingText?: string;
  } | null>(null);

  const persistIds = useCallback(
    (next: string[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      setIds(next);
    },
    [storageKey],
  );

  useEffect(() => {
    const fromStore = parseIdList(localStorage.getItem(storageKey));
    const merged = Array.from(new Set([SEED.measurementVersionId, ...fromStore]));
    setIds(merged);
    setSelectedId((prev) => {
      if (prev && merged.includes(prev)) return prev;
      return merged[0] ?? "";
    });
  }, [storageKey]);

  const addId = () => {
    const t = newId.trim();
    if (!t) return;
    if (!ids.includes(t)) persistIds([...ids, t]);
    setSelectedId(t);
    setNewId("");
  };

  const removeSelected = () => {
    const t = selectedId.trim();
    if (!t) return;
    const next = ids.filter((x) => x !== t);
    persistIds(next);
    setDetailPayload(null);
    setSelectedId(next[0] ?? "");
  };

  const loadDetail = async () => {
    const id = selectedId.trim();
    if (!id) return;
    setDetailBusy(true);
    setDetailError(null);
    setDetailPayload(null);
    try {
      const raw = (await api.getMeasurementVersion(id)) as {
        version?: { status?: string; systemText?: string; editingText?: string };
        measurementId?: string;
      };
      const measurementId = typeof raw.measurementId === "string" ? raw.measurementId : "";
      setDetailPayload({
        measurementId,
        status: raw.version?.status,
        systemText: raw.version?.systemText,
        editingText: raw.version?.editingText,
      });
    } catch (e) {
      setDetailError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setDetailBusy(false);
    }
  };

  return (
    <section className="panel domain-hub" aria-labelledby="meas-pilot-heading" data-testid="measurement-pilot-page">
      <h2 id="meas-pilot-heading">Aufmaß — Messungsversionen (Pilot)</h2>
      <p className="shell-sub">
        Es gibt keinen Backend-Endpunkt für eine vollständige Messungsliste. Gespeicherte Version-IDs sind nur lokal im
        Browser (tenant-keyed). Seed-Eintrag ist vorausgefüllt.
      </p>
      <div className="field-grid two">
        <label className="field">
          <span>Messungsversions-ID hinzufügen</span>
          <input type="text" value={newId} onChange={(e) => setNewId(e.target.value)} data-testid="meas-pilot-new-id" />
        </label>
        <div className="actions-row" style={{ alignSelf: "end" }}>
          <button type="button" className="btn-primary" onClick={addId} data-testid="meas-pilot-add">
            Merken
          </button>
          <button type="button" className="btn secondary" onClick={removeSelected} disabled={!selectedId}>
            Auswahl entfernen
          </button>
        </div>
      </div>
      <label className="field">
        <span>Gespeicherte Versionen</span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          data-testid="meas-pilot-select"
          size={Math.min(8, Math.max(3, ids.length || 3))}
        >
          {ids.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </label>
      <div className="actions-row">
        <button type="button" className="btn-primary" disabled={detailBusy || !selectedId} onClick={() => void loadDetail()} data-testid="meas-pilot-load">
          Detail laden
        </button>
        <a
          className="btn secondary"
          href={`${DOCUMENT_WORKSPACE_HASH}?documentId=${encodeURIComponent(selectedId.trim())}&entityType=MEASUREMENT_VERSION`}
        >
          In Dokument-Arbeitsbereich öffnen
        </a>
      </div>
      {detailError ? (
        <p className="error-banner" role="alert">
          {detailError}
        </p>
      ) : null}
      {detailPayload ? (
        <DocumentTextPanels
          measurementId={detailPayload.measurementId || "—"}
          status={detailPayload.status}
          systemText={detailPayload.systemText}
          editingText={detailPayload.editingText}
        />
      ) : null}
      {showIntegrationHints ? (
        <p className="shell-sub" style={{ marginTop: "1rem" }}>
          Route: <code>{MEASUREMENT_PILOT_LIST_HASH}</code> · Storage: <code>{storageKey}</code>
        </p>
      ) : null}
    </section>
  );
}
