import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiClient, LvVersionSnapshot } from "../../lib/api-client.js";
import { repoDocHref } from "../../lib/repo-doc-links.js";

function nodeDepth(
  nodeId: string,
  nodes: LvVersionSnapshot["structureNodes"],
  guard = new Set<string>(),
): number {
  if (guard.has(nodeId)) return 0;
  guard.add(nodeId);
  const n = nodes.find((x) => x.id === nodeId);
  if (!n?.parentNodeId) return 0;
  return 1 + nodeDepth(n.parentNodeId, nodes, guard);
}

/** Produkt-UI (Pilot): LV Abschnitt 9 Lesepfad — Schreiben nur über Dokument-Arbeitsbereich/SoT, keine parallele AuthZ. */
export function LvWorkbench(props: {
  api: ApiClient;
  lvVersionId: string;
  showIntegrationHints?: boolean;
}) {
  const { showIntegrationHints = false } = props;
  const [data, setData] = useState<LvVersionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adr13Href = repoDocHref("docs/adr/0013-lv-section9-hierarchy-and-text-separation.md");

  const load = useCallback(async () => {
    setError(null);
    const id = props.lvVersionId.trim();
    if (!id) {
      setData(null);
      return;
    }
    try {
      const snap = await props.api.getLvVersionSnapshot(id);
      setData(snap);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [props.api, props.lvVersionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedNodes = useMemo(() => {
    if (!data) return [];
    return [...data.structureNodes].sort((a, b) =>
      a.sortOrdinal.localeCompare(b.sortOrdinal, undefined, { numeric: true }),
    );
  }, [data]);

  const positionsByParent = useMemo(() => {
    const map = new Map<string, LvVersionSnapshot["positions"]>();
    if (!data) return map;
    for (const p of data.positions) {
      const list = map.get(p.parentNodeId) ?? [];
      list.push(p);
      map.set(p.parentNodeId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sortOrdinal.localeCompare(b.sortOrdinal, undefined, { numeric: true }));
    }
    return map;
  }, [data]);

  return (
    <section className="panel lv-workbench" data-testid="lv-workbench">
      <h3 className="lv-workbench-heading">LV — Leistungsverzeichnis</h3>
      {showIntegrationHints ? (
        <p className="hint">
          Systemtext und Bearbeitungstext getrennt (exportrelevant vs. Angebot); siehe{" "}
          {adr13Href ? (
            <a href={adr13Href} target="_blank" rel="noopener noreferrer">
              ADR-0013
            </a>
          ) : (
            <span>ADR-0013</span>
          )}
          .
        </p>
      ) : (
        <p className="hint">
          Katalogtext und bearbeitbarer Text sind getrennt ausgewiesen — für Angebote und Export unterschiedlich verwendet.
        </p>
      )}
      {error ? (
        <p className="error-banner" role="alert">
          {error}
        </p>
      ) : null}
      {!data ? (
        <p>{props.lvVersionId.trim() ? "Lade LV-Snapshot …" : "LV-Version eingeben."}</p>
      ) : (
        <>
          <p className="lv-workbench-meta">
            <strong>Status:</strong> <code>{data.version.status}</code> · <strong>Katalog:</strong>{" "}
            {data.catalog?.name ?? "—"}
          </p>
          <div className="system-block lv-workbench-tree">
            {sortedNodes.map((n) => {
              const depth = nodeDepth(n.id, data.structureNodes);
              const pad = `${1 + depth * 0.75}rem`;
              const posList = positionsByParent.get(n.id) ?? [];
              return (
                <div key={n.id} className="lv-workbench-node" style={{ paddingLeft: pad }}>
                  <div>
                    <code>{n.kind}</code> <span style={{ color: "var(--text-secondary)" }}>{n.sortOrdinal}</span>
                  </div>
                  <div className="lv-workbench-line">
                    <strong>Systemtext:</strong> {n.systemText}
                  </div>
                  <div className="lv-workbench-line">
                    <strong>Bearbeitungstext:</strong> {n.editingText}
                  </div>
                  {posList.length > 0 ? (
                    <ul className="lv-workbench-pos-list">
                      {posList.map((p) => (
                        <li key={p.id} className="lv-workbench-pos-item">
                          <code>{p.id.slice(0, 8)}…</code> · {p.quantity} {p.unit} ·{" "}
                          {(p.unitPriceCents / 100).toLocaleString("de-DE", {
                            style: "currency",
                            currency: "EUR",
                          })}{" "}
                          · <strong>Systemtext:</strong> {p.systemText}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
