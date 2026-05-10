import { useCallback, useEffect, useState } from "react";
import type {
  ApiClient,
  DifferenceBookingProjectSummaryResponse,
  DifferenceBookingReadRow,
  InvoiceOverview,
} from "../../lib/api-client.js";
import { ApiError } from "../../lib/api-error.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";
import {
  DOCUMENT_WORKSPACE_HASH,
  financePrepHashWithTab,
  GESCHAEFSPROZESS_HASH,
  LV_AUFMASS_HUB_HASH,
  LV_BEARBEITEN_HASH,
  MEASUREMENT_PILOT_LIST_HASH,
} from "../../lib/hash-route.js";
import { DifferenceBookingReadTable } from "../shared/DifferenceBookingReadTable.js";
import {
  BOOKED_INVOICE_STATUSES_PT_DIFF,
  PaymentTermsDifferenceBookingPanel,
} from "../finance/PaymentTermsDifferenceBookingPanel.js";
import { InvoiceDraftDifferenceAllocatePanel } from "../finance/InvoiceDraftDifferenceAllocatePanel.js";

type Props = {
  api: ApiClient | null;
  hasSession: boolean;
  tenantId: string;
  showIntegrationHints?: boolean;
};

function formatEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export function LvAufmassHubPage({
  api,
  hasSession,
  tenantId,
  showIntegrationHints = false,
}: Props) {
  const [projectId, setProjectId] = useState<string>(SEED.projectId);
  const [diffRows, setDiffRows] = useState<DifferenceBookingReadRow[] | null>(null);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [diffBusy, setDiffBusy] = useState(false);
  const [diffSummary, setDiffSummary] = useState<DifferenceBookingProjectSummaryResponse | null>(null);
  const [diffSummaryBusy, setDiffSummaryBusy] = useState(false);
  const [diffSummaryErr, setDiffSummaryErr] = useState<string | null>(null);

  const [hubInvoiceId, setHubInvoiceId] = useState<string>(SEED.invoiceId);
  const [hubInvoiceOverview, setHubInvoiceOverview] = useState<InvoiceOverview | null>(null);
  const [hubInvoiceLoadErr, setHubInvoiceLoadErr] = useState<string | null>(null);
  const [hubInvoiceLoadBusy, setHubInvoiceLoadBusy] = useState(false);

  const [diffByRefRows, setDiffByRefRows] = useState<DifferenceBookingReadRow[] | null>(null);
  const [diffByRefErr, setDiffByRefErr] = useState<string | null>(null);
  const [diffByRefBusy, setDiffByRefBusy] = useState(false);

  useEffect(() => {
    setHubInvoiceOverview(null);
    setHubInvoiceLoadErr(null);
    setDiffSummary(null);
    setDiffSummaryErr(null);
  }, [projectId]);

  useEffect(() => {
    setDiffByRefRows(null);
    setDiffByRefErr(null);
  }, [hubInvoiceId]);

  const loadDifferenceBookings = useCallback(async () => {
    if (!api) return;
    const pid = projectId.trim();
    if (!pid) return;
    setDiffBusy(true);
    setDiffError(null);
    try {
      const r = await api.listProjectDifferenceBookings(pid);
      setDiffRows(r.data);
    } catch (e) {
      setDiffRows(null);
      setDiffError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setDiffBusy(false);
    }
  }, [api, projectId]);

  const loadDifferenceBookingsSummary = useCallback(async () => {
    if (!api) return;
    const pid = projectId.trim();
    if (!pid) return;
    setDiffSummaryBusy(true);
    setDiffSummaryErr(null);
    try {
      const r = await api.getProjectDifferenceBookingsSummary(pid);
      setDiffSummary(r);
    } catch (e) {
      setDiffSummary(null);
      setDiffSummaryErr(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setDiffSummaryBusy(false);
    }
  }, [api, projectId]);

  const loadHubInvoiceOverview = useCallback(async () => {
    if (!api) return;
    const pid = projectId.trim();
    const invId = hubInvoiceId.trim();
    if (!pid || !invId) return;
    setHubInvoiceLoadBusy(true);
    setHubInvoiceLoadErr(null);
    try {
      const inv = await api.getInvoice(invId);
      if (inv.projectId.trim() !== pid) {
        setHubInvoiceOverview(null);
        setHubInvoiceLoadErr(
          `projectId der Rechnung (${inv.projectId}) stimmt nicht mit Hub-Projekt (${pid}) überein — IDs anpassen oder anderen Beleg wählen.`,
        );
        return;
      }
      setHubInvoiceOverview(inv);
    } catch (e) {
      setHubInvoiceOverview(null);
      setHubInvoiceLoadErr(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setHubInvoiceLoadBusy(false);
    }
  }, [api, projectId, hubInvoiceId]);

  const loadDiffBookingsByInvoiceRef = useCallback(async () => {
    if (!api) return;
    const invId = hubInvoiceId.trim();
    if (!invId) return;
    setDiffByRefBusy(true);
    setDiffByRefErr(null);
    try {
      const r = await api.listInvoiceDifferenceBookingsByReference(invId);
      setDiffByRefRows(r.data);
    } catch (e) {
      setDiffByRefRows(null);
      setDiffByRefErr(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setDiffByRefBusy(false);
    }
  }, [api, hubInvoiceId]);

  const refreshAfterInvoiceMutation = useCallback(async () => {
    if (!api) return;
    const invId = hubInvoiceId.trim();
    const pid = projectId.trim();
    if (invId && pid) {
      try {
        const inv = await api.getInvoice(invId);
        setHubInvoiceOverview(inv.projectId.trim() === pid ? inv : null);
      } catch {
        /* Liste aktualisieren reicht */
      }
    }
    if (!pid) return;
    try {
      const r = await api.listProjectDifferenceBookings(pid);
      setDiffRows(r.data);
      setDiffError(null);
    } catch (e) {
      setDiffError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    }
    if (hubInvoiceId.trim()) {
      try {
        const r2 = await api.listInvoiceDifferenceBookingsByReference(hubInvoiceId.trim());
        setDiffByRefRows(r2.data);
        setDiffByRefErr(null);
      } catch {
        /* optional */
      }
    }
  }, [api, projectId, hubInvoiceId]);

  const allocatedRows = hubInvoiceOverview?.allocatedDifferenceBookings ?? [];
  const parentBusyHub = hubInvoiceLoadBusy || diffBusy || diffByRefBusy || diffSummaryBusy;

  return (
    <section className="panel domain-hub" aria-labelledby="lv-aufmass-hub-heading" data-testid="hub-lv-aufmass">
      <h2 id="lv-aufmass-hub-heading">LV &amp; Aufmaß</h2>
      <p className="shell-sub">
        Lesepfad LV §9, Pilot-Wizard und Shell für Messungen — Schreibaktionen über Backend-<code>allowedActions</code> oder die
        hier dokumentierten expliziten Finanz-Endpunkte (Konditions-Differenz, Entwurf allocate/deallocate). Differenzbuchungen zum
        Projekt und zur Bezugsrechnung wie in der Rechnungs-Shell; keine Neuberechnung im Client (ADR-0020).
      </p>
      <div className="quick-role-grid home-dashboard-tile-grid">
        <a className="quick-role-tile" href={LV_BEARBEITEN_HASH} data-testid="hub-lv-link-lv">
          <span className="quick-role-tile-title">LV lesen</span>
          <span className="quick-role-tile-sub">Pilot: LV §9 und Sprung zu Aktionen</span>
        </a>
        <a className="quick-role-tile" href={MEASUREMENT_PILOT_LIST_HASH} data-testid="hub-lv-link-measurements">
          <span className="quick-role-tile-title">Messungen (Pilot)</span>
          <span className="quick-role-tile-sub">Liste und Detail neben Wizard und Shell</span>
        </a>
        <a className="quick-role-tile" href={GESCHAEFSPROZESS_HASH} data-testid="hub-lv-link-gp">
          <span className="quick-role-tile-title">Geschäftsprozess</span>
          <span className="quick-role-tile-sub">Pilot: LV bis Rechnungsentwurf</span>
        </a>
        <a className="quick-role-tile" href={DOCUMENT_WORKSPACE_HASH} data-testid="hub-lv-link-document">
          <span className="quick-role-tile-title">Dokument und Details</span>
          <span className="quick-role-tile-sub">Messungs-Snapshot und SoT-Aktionen</span>
        </a>
      </div>

      <section className="panel" style={{ marginTop: "1rem" }} aria-labelledby="hub-lv-diff-heading">
        <h3 id="hub-lv-diff-heading" style={{ fontSize: "1rem" }}>
          Differenzbuchungen (Projekt, read-only)
        </h3>
        <p className="shell-sub" style={{ marginTop: 0 }}>
          Mandant aus Session: <code>{tenantId}</code>. Standard <code>projectId</code> ist Demo-Seed — anpassen für andere
          Projekte. Keine Neuberechnung im Client (ADR-0020).
        </p>
        {!hasSession || !api ? (
          <p className="hint" data-testid="hub-lv-diff-login-hint">
            Bitte anmelden, um Differenzbuchungen zu laden.
          </p>
        ) : (
          <>
            <label className="field">
              <span>projectId (UUID)</span>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                data-testid="hub-lv-diff-project-id"
              />
            </label>
            <div className="actions-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn-primary"
                disabled={diffBusy || !projectId.trim()}
                onClick={() => void loadDifferenceBookings()}
                data-testid="hub-lv-diff-load"
              >
                Differenzbuchungen laden
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={diffSummaryBusy || !projectId.trim()}
                onClick={() => void loadDifferenceBookingsSummary()}
                data-testid="hub-lv-diff-summary-load"
              >
                Gebündelte Summary (GET …/summary)
              </button>
            </div>
            {diffError ? (
              <p className="error-banner" role="alert" data-testid="hub-lv-diff-error">
                {diffError}
              </p>
            ) : null}
            {diffSummaryErr ? (
              <p className="error-banner" role="alert" data-testid="hub-lv-diff-summary-error">
                {diffSummaryErr}
              </p>
            ) : null}
            {diffSummary ? (
              <div style={{ marginTop: "0.75rem" }} data-testid="hub-lv-diff-summary-block">
                <h4 style={{ fontSize: "0.95rem", margin: "0 0 0.35rem" }}>OPEN (Summary)</h4>
                {diffSummary.open.length === 0 ? (
                  <p data-testid="hub-lv-diff-summary-open-empty">Keine OPEN-Zeilen.</p>
                ) : (
                  <DifferenceBookingReadTable
                    rows={diffSummary.open}
                    formatEur={formatEur}
                    wrapTestId="hub-lv-diff-summary-open-wrap"
                    tableTestId="hub-lv-diff-summary-open-table"
                  />
                )}
                <h4 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>Zu Entwürfen zugeordnet</h4>
                {diffSummary.allocatedByDraft.length === 0 ? (
                  <p data-testid="hub-lv-diff-summary-allocated-empty">Keine Zuordnungen zu Entwürfen.</p>
                ) : (
                  diffSummary.allocatedByDraft.map((g) => (
                    <div key={g.draftInvoiceId} style={{ marginBottom: "0.65rem" }}>
                      <p style={{ fontSize: "0.8rem", margin: "0 0 0.35rem", color: "var(--text-secondary)" }}>
                        Entwurf <code>{g.draftInvoiceId}</code> — Status <code>{g.invoiceStatus}</code>
                      </p>
                      <DifferenceBookingReadTable
                        rows={g.rows}
                        formatEur={formatEur}
                        showAllocationTimestamps
                        wrapTestId={`hub-lv-diff-summary-alloc-${g.draftInvoiceId}-wrap`}
                        tableTestId={`hub-lv-diff-summary-alloc-${g.draftInvoiceId}-table`}
                      />
                    </div>
                  ))
                )}
              </div>
            ) : null}
            {diffRows !== null ? (
              diffRows.length === 0 ? (
                <p data-testid="hub-lv-diff-empty">Keine Einträge für dieses Projekt.</p>
              ) : (
                <DifferenceBookingReadTable
                  rows={diffRows}
                  formatEur={formatEur}
                  wrapTestId="hub-lv-diff-table-wrap"
                  tableTestId="hub-lv-diff-table"
                />
              )
            ) : null}
          </>
        )}
      </section>

      <section className="panel" style={{ marginTop: "1rem" }} aria-labelledby="hub-lv-invoice-diff-heading">
        <h3 id="hub-lv-invoice-diff-heading" style={{ fontSize: "1rem" }}>
          Rechnung &amp; Differenzbuchungen (Shell-Parität)
        </h3>
        <p className="shell-sub" style={{ marginTop: 0 }}>
          Gleiche Lesepfade wie Rechnungs-Shell: <code>GET /invoices/:id</code>,{" "}
          <code>GET /invoices/:id/difference-bookings</code> (Bezug). <code>projectId</code> des Belegs muss zum Hub-Projekt
          passen. Schreibpfade: Konditions-Differenz nach Buchung; Zuordnung zum <strong>Entwurf</strong> per allocate/deallocate.
        </p>
        <p className="shell-sub" style={{ marginTop: "0.35rem", fontSize: "0.78rem" }} data-testid="hub-lv-dom86-cross-links">
          Parität zu <a href={financePrepHashWithTab("rechnung")}>Finanz-Vorbereitung Schritt 3</a> und{" "}
          <a href={DOCUMENT_WORKSPACE_HASH}>Dokument-Arbeitsbereich (INVOICE)</a>.
        </p>
        {!hasSession || !api ? (
          <p className="hint" data-testid="hub-lv-pt-diff-login-hint">
            Bitte anmelden, um Belegpfade zu nutzen.
          </p>
        ) : (
          <>
            <label className="field">
              <span>Rechnungs-ID (UUID)</span>
              <input
                type="text"
                value={hubInvoiceId}
                onChange={(e) => {
                  setHubInvoiceId(e.target.value);
                  setHubInvoiceOverview(null);
                  setHubInvoiceLoadErr(null);
                }}
                data-testid="hub-lv-pt-diff-ref-invoice-id"
              />
            </label>
            <div className="actions-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn-primary"
                disabled={hubInvoiceLoadBusy || !projectId.trim() || !hubInvoiceId.trim()}
                onClick={() => void loadHubInvoiceOverview()}
                data-testid="hub-lv-hub-invoice-load"
              >
                Beleg laden (GET)
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={diffByRefBusy || !hubInvoiceId.trim()}
                onClick={() => void loadDiffBookingsByInvoiceRef()}
                data-testid="hub-lv-diff-by-ref-load"
              >
                Bezugsrechnung-Differenzen (GET)
              </button>
            </div>
            {hubInvoiceLoadErr ? (
              <p className="error-banner" role="alert" data-testid="hub-lv-pt-diff-load-error">
                {hubInvoiceLoadErr}
              </p>
            ) : null}
            {hubInvoiceOverview ? (
              <>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0.5rem 0 0.35rem" }}>
                  Status <code>{hubInvoiceOverview.status}</code>
                  {!BOOKED_INVOICE_STATUSES_PT_DIFF.has(hubInvoiceOverview.status) ? (
                    <> — Konditions-Differenz erst nach Buchung.</>
                  ) : null}
                </p>
                <div style={{ marginTop: "0.5rem" }} data-testid="hub-lv-invoice-allocated-block">
                  <h4 style={{ fontSize: "0.95rem", margin: "0 0 0.35rem" }}>Zugeordnete Differenzbuchungen (GET-Rechnung)</h4>
                  <p className="shell-sub" style={{ marginTop: 0, fontSize: "0.78rem" }}>
                    Feld <code>allocatedDifferenceBookings</code> — wie Shell / Finanz-Vorbereitung.
                  </p>
                  <DifferenceBookingReadTable
                    rows={allocatedRows}
                    formatEur={formatEur}
                    showAllocationTimestamps
                    wrapTestId="hub-lv-invoice-allocated-wrap"
                    tableTestId="hub-lv-invoice-allocated-table"
                  />
                  {allocatedRows.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.35rem 0 0" }}>
                      Keine Differenzzeilen diesem Beleg zugeordnet.
                    </p>
                  ) : null}
                </div>
                <PaymentTermsDifferenceBookingPanel
                  api={api}
                  invoiceOverview={hubInvoiceOverview}
                  parentBusy={parentBusyHub}
                  onSuccess={refreshAfterInvoiceMutation}
                  testIdNs="hub"
                />
                {hubInvoiceOverview.status === "ENTWURF" ? (
                  <InvoiceDraftDifferenceAllocatePanel
                    api={api}
                    invoiceId={hubInvoiceOverview.invoiceId}
                    parentBusy={parentBusyHub}
                    onSuccess={refreshAfterInvoiceMutation}
                    testIdNs="hub"
                  />
                ) : null}
              </>
            ) : null}
            {diffByRefErr ? (
              <p className="error-banner" role="alert" data-testid="hub-lv-diff-by-ref-error">
                {diffByRefErr}
              </p>
            ) : null}
            {diffByRefRows !== null ? (
              <div style={{ marginTop: "0.75rem" }} data-testid="hub-lv-diff-by-ref-block">
                <h4 style={{ fontSize: "0.95rem", margin: "0 0 0.35rem" }}>Differenzbuchungen Bezugsrechnung (GET)</h4>
                {diffByRefRows.length === 0 ? (
                  <p data-testid="hub-lv-diff-by-ref-empty">Keine Zeilen mit Bezug zu dieser Rechnungs-ID.</p>
                ) : (
                  <DifferenceBookingReadTable
                    rows={diffByRefRows}
                    formatEur={formatEur}
                    wrapTestId="hub-lv-diff-by-ref-wrap"
                    tableTestId="hub-lv-diff-by-ref-table"
                  />
                )}
              </div>
            ) : null}
          </>
        )}
      </section>

      {showIntegrationHints ? (
        <p className="shell-sub" style={{ marginTop: "1rem" }}>
          Route: <code>{LV_AUFMASS_HUB_HASH}</code>
        </p>
      ) : null}
    </section>
  );
}
