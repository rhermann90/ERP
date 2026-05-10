import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ApiClient, LvVersionSnapshot, MeasurementListItem, MeasurementVersionDetail } from "../../lib/api-client.js";
import { ApiError } from "../../lib/api-error.js";
import { DocumentTextPanels } from "../DocumentTextPanels.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";
import {
  DOCUMENT_WORKSPACE_HASH,
  GESCHAEFSPROZESS_HASH,
  LV_AUFMASS_HUB_HASH,
  MEASUREMENT_PILOT_LIST_HASH,
  applyMeasurementPilotVersionToLocationHash,
  financePrepHashWithTab,
  readMeasurementPilotVersionIdFromHash,
  useHashRoute,
} from "../../lib/hash-route.js";
import { storageKeyForTenant } from "../../lib/tenant-session.js";

type Props = {
  api: ApiClient;
  tenantId: string;
  showIntegrationHints?: boolean;
};

const MEASUREMENT_STATUS_LABEL_DE: Record<string, string> = {
  ENTWURF: "Entwurf",
  GEPRUEFT: "Geprüft",
  FREIGEGEBEN: "Freigegeben",
  ABGERECHNET: "Abgerechnet",
  ARCHIVIERT: "Archiviert",
};

function measurementStatusLabel(status: string): string {
  return MEASUREMENT_STATUS_LABEL_DE[status] ?? status;
}

function formatIsoDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(d);
  } catch {
    return iso;
  }
}

function truncateText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

function lvPositionDisplayFromSnapshot(
  snapshot: LvVersionSnapshot | null,
  lvPositionId: string,
): { ordinal: string; shortText: string } {
  if (!snapshot) return { ordinal: "—", shortText: "—" };
  const pos = snapshot.positions.find((p) => p.id === lvPositionId);
  if (!pos) return { ordinal: "—", shortText: "—" };
  const textRaw = pos.editingText?.trim() || pos.systemText?.trim() || "";
  const shortText = textRaw ? truncateText(textRaw, 72) : "—";
  return { ordinal: pos.sortOrdinal ?? "—", shortText };
}

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

/** Pilot-Messungsliste: Serverliste je Projekt (`GET /projects/:id/measurements`) + lokale ID-Merkliste + Snapshot inkl. Positionen. */
export function MeasurementPilotListPage({ api, tenantId, showIntegrationHints = false }: Props) {
  const hashPath = useHashRoute();
  const storageKey = useMemo(() => storageKeyForTenant(tenantId, "pilot-measurement-version-ids"), [tenantId]);
  const projectStorageKey = useMemo(() => storageKeyForTenant(tenantId, "pilot-measurement-project-id"), [tenantId]);
  const [projectIdInput, setProjectIdInput] = useState<string>(SEED.projectId);
  const [ids, setIds] = useState<string[]>([]);
  const [newId, setNewId] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailPayload, setDetailPayload] = useState<MeasurementVersionDetail | null>(null);
  const [listRows, setListRows] = useState<MeasurementListItem[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listBusy, setListBusy] = useState(false);
  const [lvSnapshot, setLvSnapshot] = useState<LvVersionSnapshot | null>(null);
  const [lvSnapshotBusy, setLvSnapshotBusy] = useState(false);
  const [lvSnapshotError, setLvSnapshotError] = useState<string | null>(null);
  const projectHydratedRef = useRef(false);

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

  const mergeVersionIds = useCallback((base: string[], extra: string[]) => {
    return Array.from(new Set([...base, ...extra.filter(Boolean)]));
  }, []);

  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem(projectStorageKey)?.trim();
      if (saved) setProjectIdInput(saved);
    } catch {
      /* ignore */
    }
    projectHydratedRef.current = true;
  }, [projectStorageKey]);

  useEffect(() => {
    if (!projectHydratedRef.current) return;
    try {
      const pid = projectIdInput.trim();
      if (pid) localStorage.setItem(projectStorageKey, pid);
    } catch {
      /* ignore */
    }
  }, [projectIdInput, projectStorageKey]);

  useEffect(() => {
    const fromStore = parseIdList(localStorage.getItem(storageKey));
    const merged = mergeVersionIds([SEED.measurementVersionId], fromStore);
    setIds(merged);
    setSelectedId((prev) => {
      if (prev && merged.includes(prev)) return prev;
      return merged[0] ?? "";
    });
  }, [mergeVersionIds, storageKey]);

  const loadDetailByVersionId = useCallback(
    async (versionId: string) => {
      const id = versionId.trim();
      if (!id) return;
      setDetailBusy(true);
      setDetailError(null);
      setDetailPayload(null);
      try {
        const raw = await api.getMeasurementVersion(id);
        setDetailPayload(raw);
        applyMeasurementPilotVersionToLocationHash(id);
      } catch (e) {
        setDetailError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
      } finally {
        setDetailBusy(false);
      }
    },
    [api],
  );

  const loadProjectList = useCallback(async () => {
    const pid = projectIdInput.trim();
    if (!pid) return;
    setListBusy(true);
    setListError(null);
    setListRows(null);
    try {
      const res = await api.listProjectMeasurements(pid);
      setListRows(res.data);
      const vids = res.data.map((r) => r.currentMeasurementVersionId);
      setIds((prev) => {
        const next = mergeVersionIds(prev, vids);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* ignore quota */
        }
        return next;
      });
    } catch (e) {
      setListError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setListBusy(false);
    }
  }, [api, mergeVersionIds, projectIdInput, storageKey]);

  useEffect(() => {
    if (hashPath !== "/aufmass-messungen") return;
    const vid = readMeasurementPilotVersionIdFromHash();
    if (!vid) return;
    setIds((prev) => {
      if (prev.includes(vid)) return prev;
      const next = [...prev, vid];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setSelectedId(vid);
    void loadDetailByVersionId(vid);
  }, [hashPath, loadDetailByVersionId, storageKey]);

  useEffect(() => {
    const lvId = detailPayload?.lvVersionId?.trim();
    if (!lvId) {
      setLvSnapshot(null);
      setLvSnapshotError(null);
      setLvSnapshotBusy(false);
      return;
    }
    let cancelled = false;
    setLvSnapshotBusy(true);
    setLvSnapshotError(null);
    setLvSnapshot(null);
    void api.getLvVersionSnapshot(lvId).then(
      (snap) => {
        if (!cancelled) {
          setLvSnapshot(snap);
          setLvSnapshotBusy(false);
        }
      },
      (e: unknown) => {
        if (!cancelled) {
          setLvSnapshotError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
          setLvSnapshotBusy(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, detailPayload?.lvVersionId]);

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
    await loadDetailByVersionId(selectedId);
  };

  return (
    <section className="panel domain-hub" aria-labelledby="meas-pilot-heading" data-testid="measurement-pilot-page">
      <h2 id="meas-pilot-heading">Aufmaß — Messungsversionen (Pilot)</h2>
      <p className="shell-sub">
        Messungen je Projekt kommen aus <code>GET /projects/&#123;projectId&#125;/measurements</code> (gleiche Leserolle wie
        Rechnung). Zusätzlich können Sie Messungsversions-IDs lokal merken (tenant-keyed). Seed-Eintrag ist
        vorausgefüllt.
      </p>
      <p className="shell-sub" data-testid="meas-pilot-traceability-hint">
        Für den geführten Aufmass-Lebenszyklus (Pilot) nutzen Sie den{" "}
        <a href={GESCHAEFSPROZESS_HASH}>Geschäftsprozess-Wizard</a>. Deep-Link (Lesezeichen):{" "}
        <code>{MEASUREMENT_PILOT_LIST_HASH}?measurementVersionId=…</code> wählt die Version und lädt den Snapshot.
      </p>
      <p className="shell-sub" data-testid="meas-pilot-cross-links">
        Hub <a href={LV_AUFMASS_HUB_HASH}>LV &amp; Aufmaß</a> (Differenzbuchungen) ·{" "}
        <a href={financePrepHashWithTab("rechnung")}>Finanz-Vorbereitung (Rechnung)</a>.
      </p>
      <div className="field-grid two">
        <label className="field">
          <span>Projekt-ID (Liste vom Server)</span>
          <input
            type="text"
            value={projectIdInput}
            onChange={(e) => setProjectIdInput(e.target.value)}
            data-testid="meas-pilot-project-id"
            autoComplete="off"
          />
        </label>
        <div className="actions-row" style={{ alignSelf: "end" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void loadProjectList()}
            disabled={listBusy || !projectIdInput.trim()}
            data-testid="meas-pilot-load-project-list"
          >
            {listBusy ? "Liste lädt…" : "Projekt-Liste laden"}
          </button>
        </div>
      </div>
      {listError ? (
        <p className="error-banner" role="alert" data-testid="meas-pilot-list-error">
          {listError}
        </p>
      ) : null}
      {listRows ? (
        <div className="panel" style={{ marginTop: "0.75rem" }} data-testid="meas-pilot-server-table-wrap">
          <h3 className="shell-sub" style={{ marginTop: 0 }}>
            Messungen im Projekt (Server)
          </h3>
          {listRows.length === 0 ? (
            <p className="shell-sub">Keine Aufmassköpfe für dieses Projekt.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}
                data-testid="meas-pilot-server-table"
              >
                <thead>
                  <tr>
                    <th
                      scope="col"
                      style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      Aufmass-ID
                    </th>
                    <th
                      scope="col"
                      style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      Status (aktuell)
                    </th>
                    <th
                      scope="col"
                      style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      Messungsversion
                    </th>
                    <th
                      scope="col"
                      style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      Aktion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listRows.map((row) => (
                    <tr key={row.measurementId}>
                      <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <code>{row.measurementId}</code>
                      </td>
                      <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <span title={row.currentVersion.status}>{measurementStatusLabel(row.currentVersion.status)}</span>
                      </td>
                      <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <code>{row.currentMeasurementVersionId}</code>
                      </td>
                      <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <button
                          type="button"
                          className="btn secondary"
                          data-testid={`meas-pilot-select-row-${row.measurementId}`}
                          onClick={() => {
                            setSelectedId(row.currentMeasurementVersionId);
                            void loadDetailByVersionId(row.currentMeasurementVersionId);
                          }}
                        >
                          Anzeigen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
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
        <span>Gespeicherte / gemerkte Versionen</span>
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
        <button
          type="button"
          className="btn-primary"
          disabled={detailBusy || !selectedId}
          onClick={() => void loadDetail()}
          data-testid="meas-pilot-load"
        >
          {detailBusy ? "Detail lädt…" : "Detail laden"}
        </button>
        <a
          className="btn secondary"
          href={`${DOCUMENT_WORKSPACE_HASH}?documentId=${encodeURIComponent(selectedId.trim())}&entityType=MEASUREMENT_VERSION`}
          data-testid="meas-pilot-open-shell"
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
        <>
          <section className="panel" style={{ marginTop: "1rem" }} data-testid="meas-pilot-trace-card">
            <h3 className="shell-sub" style={{ marginTop: 0 }}>
              Nachvollziehbarkeit (Messung)
            </h3>
            <dl
              className="field-grid two"
              style={{ margin: 0, fontSize: "0.85rem", gap: "0.35rem 1rem" }}
              data-testid="meas-pilot-trace-dl"
            >
              <div>
                <dt className="shell-sub" style={{ margin: 0 }}>
                  Projekt
                </dt>
                <dd style={{ margin: "0.15rem 0 0" }}>
                  <code>{detailPayload.projectId}</code>
                </dd>
              </div>
              <div>
                <dt className="shell-sub" style={{ margin: 0 }}>
                  Kunde
                </dt>
                <dd style={{ margin: "0.15rem 0 0" }}>
                  <code>{detailPayload.customerId}</code>
                </dd>
              </div>
              <div>
                <dt className="shell-sub" style={{ margin: 0 }}>
                  LV-Version
                </dt>
                <dd style={{ margin: "0.15rem 0 0" }}>
                  <code>{detailPayload.lvVersionId}</code>
                </dd>
              </div>
              <div>
                <dt className="shell-sub" style={{ margin: 0 }}>
                  Aufmass
                </dt>
                <dd style={{ margin: "0.15rem 0 0" }}>
                  <code>{detailPayload.measurementId}</code>
                </dd>
              </div>
              <div>
                <dt className="shell-sub" style={{ margin: 0 }}>
                  Messungsversion / Status
                </dt>
                <dd style={{ margin: "0.15rem 0 0" }}>
                  <code>{detailPayload.version.id}</code>
                  {" · "}
                  <span title={detailPayload.version.status}>
                    {measurementStatusLabel(detailPayload.version.status)} (Nr. {detailPayload.version.versionNumber})
                  </span>
                </dd>
              </div>
              <div>
                <dt className="shell-sub" style={{ margin: 0 }}>
                  Aufmass angelegt
                </dt>
                <dd style={{ margin: "0.15rem 0 0" }} data-testid="meas-pilot-measurement-created-at">
                  {formatIsoDateTime(detailPayload.measurementCreatedAt)}
                </dd>
              </div>
            </dl>
          </section>
          <DocumentTextPanels
            measurementId={detailPayload.measurementId || "—"}
            status={detailPayload.version?.status}
            systemText={undefined}
            editingText={undefined}
          />
          {lvSnapshotBusy ? (
            <p className="shell-sub" style={{ marginTop: "0.75rem" }} data-testid="meas-pilot-lv-snapshot-busy">
              LV-Katalog wird geladen…
            </p>
          ) : null}
          {lvSnapshotError ? (
            <p className="shell-sub" role="status" data-testid="meas-pilot-lv-snapshot-error">
              LV-Snapshot nicht ladbar (Lesepfad Aufmass bleibt gültig): {lvSnapshotError}
            </p>
          ) : null}
          <section className="panel" style={{ marginTop: "1rem" }} data-testid="meas-pilot-positions">
            <h3 style={{ marginTop: 0 }}>Aufmasspositionen (aktueller Snapshot)</h3>
            {detailPayload.positions.length === 0 ? (
              <p className="shell-sub">Keine Positionen in dieser Version.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        Ordnungszahl (LV)
                      </th>
                      <th
                        scope="col"
                        style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        LV-Kurztext
                      </th>
                      <th
                        scope="col"
                        style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        LV-Positions-ID
                      </th>
                      <th
                        scope="col"
                        style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        Menge
                      </th>
                      <th
                        scope="col"
                        style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        Einheit
                      </th>
                      <th
                        scope="col"
                        style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        Notiz
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailPayload.positions.map((p) => {
                      const { ordinal, shortText } = lvPositionDisplayFromSnapshot(lvSnapshot, p.lvPositionId);
                      return (
                        <tr key={p.id}>
                          <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>{ordinal}</td>
                          <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>{shortText}</td>
                          <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                            <code>{p.lvPositionId}</code>
                          </td>
                          <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>{p.quantity}</td>
                          <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>{p.unit}</td>
                          <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                            {p.note ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
      {showIntegrationHints ? (
        <p className="shell-sub" style={{ marginTop: "1rem" }}>
          Route: <code>{MEASUREMENT_PILOT_LIST_HASH}</code> · Storage: <code>{storageKey}</code> · Projekt:{" "}
          <code>{projectStorageKey}</code>
        </p>
      ) : null}
    </section>
  );
}
