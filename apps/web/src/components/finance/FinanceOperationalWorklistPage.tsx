import { useState } from "react";
import type { ApiClient } from "../../lib/api-client.js";
import { ApiError } from "../../lib/api-error.js";
import type { DunningReminderCandidateRow } from "../../lib/finance-dunning-api-types.js";
import { DOCUMENT_WORKSPACE_HASH, FINANCE_PREP_HASH, FINANCE_WORKLIST_HASH } from "../../lib/hash-route.js";

type Props = {
  api: ApiClient;
  showIntegrationHints?: boolean;
};

function centsEUR(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

/** Mahnkandidaten (FIN-4) als kompakte Arbeitsliste mit Deep-Link in den Dokument-Arbeitsbereich. */
export function FinanceOperationalWorklistPage({ api, showIntegrationHints = false }: Props) {
  const [stageOrdinal, setStageOrdinal] = useState(1);
  const [asOfDate, setAsOfDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<DunningReminderCandidateRow[]>([]);
  const [meta, setMeta] = useState<{ asOfDate?: string; daysAfterDue?: number } | null>(null);

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.getDunningReminderCandidates({
        stageOrdinal,
        asOfDate: asOfDate.trim() || undefined,
      });
      setRows(r.data.candidates ?? []);
      setMeta({
        asOfDate: r.data.asOfDate,
        daysAfterDue: r.data.daysAfterDueForStage,
      });
    } catch (e) {
      setRows([]);
      setMeta(null);
      setError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel domain-hub" data-testid="finance-worklist-page">
      <h2>Finanz — Mahn-Kandidaten (Arbeitsliste)</h2>
      <p className="shell-sub">
        Lesepfad zu <code>GET /finance/dunning-reminder-candidates</code>. Öffnen Sie eine Rechnung über den Link — die Shell
        übernimmt <code>documentId</code> und <code>entityType=INVOICE</code> aus der URL.
      </p>
      <div className="field-grid two">
        <label className="field">
          <span>Stufe (stageOrdinal)</span>
          <input
            type="number"
            min={1}
            max={9}
            value={stageOrdinal}
            onChange={(e) => setStageOrdinal(Number.parseInt(e.target.value, 10) || 1)}
            data-testid="fowl-stage"
          />
        </label>
        <label className="field">
          <span>Stichtag (optional, yyyy-mm-dd)</span>
          <input type="text" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} placeholder="leer = Server-Default" />
        </label>
      </div>
      <div className="actions-row">
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void load()} data-testid="fowl-load">
          Kandidaten laden
        </button>
        <a className="btn secondary" href={FINANCE_PREP_HASH}>
          Zur Finanz-Vorbereitung
        </a>
      </div>
      {error ? (
        <p className="error-banner" role="alert">
          {error}
        </p>
      ) : null}
      {meta ? (
        <p className="hint">
          asOfDate <code>{meta.asOfDate}</code> · Tage nach Fälligkeit für Stufe <code>{meta.daysAfterDue}</code>
        </p>
      ) : null}
      {rows.length > 0 ? (
        <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-color, #44444444)" }}>
                  Rechnung
                </th>
                <th style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-color, #44444444)" }}>
                  Fälligkeit
                </th>
                <th style={{ textAlign: "right", padding: "0.35rem", borderBottom: "1px solid var(--border-color, #44444444)" }}>
                  Offen
                </th>
                <th style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-color, #44444444)" }}>
                  Aktion
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.invoiceId}>
                  <td style={{ padding: "0.35rem" }}>
                    <code>{r.invoiceId}</code>
                  </td>
                  <td style={{ padding: "0.35rem" }}>{r.dueDate}</td>
                  <td style={{ padding: "0.35rem", textAlign: "right" }}>{centsEUR(r.openAmountCents)}</td>
                  <td style={{ padding: "0.35rem" }}>
                    <a
                      href={`${DOCUMENT_WORKSPACE_HASH}?documentId=${encodeURIComponent(r.invoiceId)}&entityType=INVOICE`}
                      data-testid={`fowl-open-${r.invoiceId.slice(0, 8)}`}
                    >
                      In Dokument öffnen
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !busy && meta ? (
        <p className="hint">Keine Kandidaten für diese Stufe/Stichtag.</p>
      ) : null}
      {showIntegrationHints ? (
        <p className="shell-sub" style={{ marginTop: "1rem" }}>
          Route: <code>{FINANCE_WORKLIST_HASH}</code>
        </p>
      ) : null}
    </section>
  );
}
