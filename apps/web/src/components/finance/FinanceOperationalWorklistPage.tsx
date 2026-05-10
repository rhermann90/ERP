import { useState } from "react";
import type { ApiClient } from "../../lib/api-client.js";
import { ApiError } from "../../lib/api-error.js";
import type { DunningReminderCandidateRow, OpenReceivableRow } from "../../lib/finance-dunning-api-types.js";
import { repoDocHref } from "../../lib/repo-doc-links.js";
import {
  applyFinanceWorklistPanelToLocationHash,
  DOCUMENT_WORKSPACE_HASH,
  FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH,
  FINANCE_PREP_HASH,
  FINANCE_WORKLIST_HASH,
  readFinanceWorklistPanelFromHash,
  readHashQuery,
  useHashRoute,
} from "../../lib/hash-route.js";

type Props = {
  api: ApiClient;
  showIntegrationHints?: boolean;
};

function centsEUR(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

/** Roadmap Bund 5: betriebliche Arbeitsliste — offene Forderungen und Mahn-Kandidaten (SoT-first). */
export function FinanceOperationalWorklistPage({ api, showIntegrationHints = false }: Props) {
  const wave3Href = repoDocHref("docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md");
  const hashPath = useHashRoute();
  const panel = readFinanceWorklistPanelFromHash(hashPath, readHashQuery());

  const [stageOrdinal, setStageOrdinal] = useState(1);
  const [asOfDate, setAsOfDate] = useState("");
  const [filterOpenProjectId, setFilterOpenProjectId] = useState("");
  const [filterOpenCustomerId, setFilterOpenCustomerId] = useState("");
  const [busyOpen, setBusyOpen] = useState(false);
  const [busyMahn, setBusyMahn] = useState(false);
  const [errorOpen, setErrorOpen] = useState<string | null>(null);
  const [errorMahn, setErrorMahn] = useState<string | null>(null);
  const [openRows, setOpenRows] = useState<OpenReceivableRow[]>([]);
  const [openLoaded, setOpenLoaded] = useState(false);
  const [dunningRows, setDunningRows] = useState<DunningReminderCandidateRow[]>([]);
  const [dunningMeta, setDunningMeta] = useState<{ asOfDate?: string; daysAfterDue?: number } | null>(null);

  const selectPanel = (next: "offen" | "mahn") => {
    applyFinanceWorklistPanelToLocationHash(next);
  };

  const loadOpen = async () => {
    setBusyOpen(true);
    setErrorOpen(null);
    try {
      const r = await api.getOpenReceivables({
        projectId: filterOpenProjectId.trim() || undefined,
        customerId: filterOpenCustomerId.trim() || undefined,
      });
      setOpenRows(r.data ?? []);
      setOpenLoaded(true);
    } catch (e) {
      setOpenRows([]);
      setOpenLoaded(false);
      setErrorOpen(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusyOpen(false);
    }
  };

  const loadDunning = async () => {
    setBusyMahn(true);
    setErrorMahn(null);
    try {
      const r = await api.getDunningReminderCandidates({
        stageOrdinal,
        asOfDate: asOfDate.trim() || undefined,
      });
      setDunningRows(r.data.candidates ?? []);
      setDunningMeta({
        asOfDate: r.data.asOfDate,
        daysAfterDue: r.data.daysAfterDueForStage,
      });
    } catch (e) {
      setDunningRows([]);
      setDunningMeta(null);
      setErrorMahn(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusyMahn(false);
    }
  };

  return (
    <section className="panel domain-hub" data-testid="finance-worklist-page">
      <h2>Finanz — Betrieb (Arbeitsliste)</h2>
      <p className="shell-sub">
        Offene Forderungen und Mahn-Kandidaten mandanten-isoliert laden; Rechnungen in der Shell öffnen (
        <code>documentId</code>, <code>entityType=INVOICE</code>).
      </p>
      <p className="shell-sub" data-testid="fowl-wave3-hint" style={{ marginTop: "0.35rem" }}>
        Hintergrund:{" "}
        {wave3Href ? (
          <a href={wave3Href} target="_blank" rel="noopener noreferrer">
            NEXT-INCREMENT-FINANCE-WAVE3
          </a>
        ) : (
          <code>docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md</code>
        )}
        ; <code>VITE_REPO_DOCS_BASE</code> für klickbare Repo-Links.
      </p>

      <div role="tablist" aria-label="Finanz-Arbeitsliste" className="actions-row" style={{ marginTop: "0.75rem", gap: "0.35rem" }}>
        <button
          type="button"
          role="tab"
          aria-selected={panel === "offen"}
          className={panel === "offen" ? "btn-primary" : "btn secondary"}
          data-testid="fowl-tab-offen"
          onClick={() => selectPanel("offen")}
        >
          Offene Posten
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={panel === "mahn"}
          className={panel === "mahn" ? "btn-primary" : "btn secondary"}
          data-testid="fowl-tab-mahn"
          onClick={() => selectPanel("mahn")}
        >
          Mahn-Kandidaten
        </button>
      </div>

      {panel === "offen" ? (
        <div role="tabpanel" aria-label="Offene Posten" style={{ marginTop: "0.75rem" }}>
          {showIntegrationHints ? (
            <p className="shell-sub">
              Lesepfad: <code>GET /finance/open-receivables</code> — gebuchte und teilbezahlte Rechnungen mit positivem Restsaldo.
            </p>
          ) : (
            <p className="shell-sub">Gebuchte und teilbezahlte Rechnungen mit offenem Betrag (ohne Mahnfilter).</p>
          )}
          <div className="actions-row" style={{ marginTop: "0.5rem", flexWrap: "wrap", gap: "0.35rem", alignItems: "flex-end" }}>
            <label className="shell-sub" style={{ display: "inline-flex", flexDirection: "column", gap: "0.2rem" }}>
              <span>Projekt-ID (optional)</span>
              <input
                type="text"
                value={filterOpenProjectId}
                onChange={(e) => setFilterOpenProjectId(e.target.value)}
                placeholder="UUID"
                autoComplete="off"
                spellCheck={false}
                data-testid="fowl-open-filter-project"
                style={{ minWidth: "14rem", padding: "0.25rem 0.35rem" }}
              />
            </label>
            <label className="shell-sub" style={{ display: "inline-flex", flexDirection: "column", gap: "0.2rem" }}>
              <span>Kunden-ID (optional)</span>
              <input
                type="text"
                value={filterOpenCustomerId}
                onChange={(e) => setFilterOpenCustomerId(e.target.value)}
                placeholder="UUID"
                autoComplete="off"
                spellCheck={false}
                data-testid="fowl-open-filter-customer"
                style={{ minWidth: "14rem", padding: "0.25rem 0.35rem" }}
              />
            </label>
          </div>
          <div className="actions-row" style={{ marginTop: "0.5rem", flexWrap: "wrap", gap: "0.35rem" }}>
            <button type="button" className="btn-primary" disabled={busyOpen} onClick={() => void loadOpen()} data-testid="fowl-open-load">
              Liste laden
            </button>
            <a className="btn secondary" href={FINANCE_PREP_HASH}>
              Zur Finanz-Vorbereitung
            </a>
          </div>
          {errorOpen ? (
            <p className="error-banner" role="alert">
              {errorOpen}
            </p>
          ) : null}
          {openRows.length > 0 ? (
            <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-color, #44444444)" }}>
                      Rechnung
                    </th>
                    <th style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-color, #44444444)" }}>
                      Datum
                    </th>
                    <th style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-color, #44444444)" }}>
                      Status
                    </th>
                    <th style={{ textAlign: "right", padding: "0.35rem", borderBottom: "1px solid var(--border-color, #44444444)" }}>
                      Brutto
                    </th>
                    <th style={{ textAlign: "right", padding: "0.35rem", borderBottom: "1px solid var(--border-color, #44444444)" }}>
                      Bezahlt
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
                  {openRows.map((r) => (
                    <tr key={r.invoiceId}>
                      <td style={{ padding: "0.35rem" }}>{r.invoiceNumber ? <span>{r.invoiceNumber}</span> : <code>{r.invoiceId}</code>}</td>
                      <td style={{ padding: "0.35rem" }}>{r.issueDate ?? "—"}</td>
                      <td style={{ padding: "0.35rem" }}>
                        <code>{r.status}</code>
                      </td>
                      <td style={{ padding: "0.35rem", textAlign: "right" }}>{centsEUR(r.totalGrossCents)}</td>
                      <td style={{ padding: "0.35rem", textAlign: "right" }}>{centsEUR(r.totalPaidCents)}</td>
                      <td style={{ padding: "0.35rem", textAlign: "right" }}>{centsEUR(r.openAmountCents)}</td>
                      <td style={{ padding: "0.35rem" }}>
                        <a
                          href={`${DOCUMENT_WORKSPACE_HASH}?documentId=${encodeURIComponent(r.invoiceId)}&entityType=INVOICE`}
                          data-testid={`fowl-open-doc-${r.invoiceId.slice(0, 8)}`}
                        >
                          In Dokument öffnen
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !busyOpen && openLoaded ? (
            <p className="hint" data-testid="fowl-open-empty">
              Keine offenen Forderungen für diesen Mandanten.
            </p>
          ) : null}
        </div>
      ) : (
        <div role="tabpanel" aria-label="Mahn-Kandidaten" style={{ marginTop: "0.75rem" }}>
          {showIntegrationHints ? (
            <p className="shell-sub">
              Lesepfad: <code>GET /finance/dunning-reminder-candidates</code>
            </p>
          ) : (
            <p className="shell-sub">Rechnungen, die für die gewählte Mahnstufe zum Stichtag fällig sind.</p>
          )}
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
          <div className="actions-row" style={{ marginTop: "0.5rem", flexWrap: "wrap", gap: "0.35rem" }}>
            <button type="button" className="btn-primary" disabled={busyMahn} onClick={() => void loadDunning()} data-testid="fowl-load">
              Kandidaten laden
            </button>
            <a className="btn secondary" href={FINANCE_PREP_HASH}>
              Zur Finanz-Vorbereitung
            </a>
            <a
              className="btn secondary"
              href={FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH}
              data-testid="fowl-link-finance-prep-dunning"
              title="Mahn-Konfiguration und Automation (FIN-4, Option A / Wave3)"
            >
              Mahn-Konfiguration (Grundeinstellungen)
            </a>
          </div>
          {errorMahn ? (
            <p className="error-banner" role="alert">
              {errorMahn}
            </p>
          ) : null}
          {dunningMeta ? (
            <p className="hint">
              asOfDate <code>{dunningMeta.asOfDate}</code> · Tage nach Fälligkeit für Stufe <code>{dunningMeta.daysAfterDue}</code>
            </p>
          ) : null}
          {dunningRows.length > 0 ? (
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
                  {dunningRows.map((r) => (
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
          ) : !busyMahn && dunningMeta ? (
            <p className="hint">Keine Kandidaten für diese Stufe/Stichtag.</p>
          ) : null}
        </div>
      )}

      {showIntegrationHints ? (
        <p className="shell-sub" style={{ marginTop: "1rem" }}>
          Route: <code>{FINANCE_WORKLIST_HASH}</code> · Deep-Link Mahn-Tab: <code>{FINANCE_WORKLIST_HASH}?tab=mahn</code>
        </p>
      ) : null}
    </section>
  );
}
