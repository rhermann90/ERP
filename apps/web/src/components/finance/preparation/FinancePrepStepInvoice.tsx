import { memo, useEffect, useState } from "react";
import type {
  ApiClient,
  DifferenceBookingReadRow,
  DunningReminderReadRow,
  InvoiceBillingKindApi,
  InvoiceOverview,
  PaymentIntakeReadRow,
} from "../../../lib/api-client.js";
import { DifferenceBookingReadTable } from "../../shared/DifferenceBookingReadTable.js";
import { repoDocHref } from "../../../lib/repo-doc-links.js";
import {
  BOOK_INVOICE_ACTION_ID,
  RECORD_DUNNING_REMINDER_ACTION_ID,
  RECORD_PAYMENT_INTAKE_ACTION_ID,
} from "../../../lib/finance-sot.js";
import { FinanceCollapsibleJson } from "../FinanceCollapsibleJson.js";
import { FinancePrepPanel } from "../FinancePrepPanel.js";
import { FinancePrepNotice } from "../FinancePrepNotice.js";
import type { FinNotice } from "../finance-prep-types.js";
import { formatSkontoDisplay } from "../finance-prep-helpers.js";
import { DOCUMENT_WORKSPACE_HASH, LV_AUFMASS_HUB_HASH } from "../../../lib/hash-route.js";
import { DEMO_INVOICE_ID, FIN_PREP_A11Y, formatEurFromCents } from "../finance-preparation-meta.js";
import { PaymentTermsDifferenceBookingPanel } from "../PaymentTermsDifferenceBookingPanel.js";
import { InvoiceDraftDifferenceAllocatePanel } from "../InvoiceDraftDifferenceAllocatePanel.js";

function billingKindLabelDe(kind: InvoiceBillingKindApi): string {
  switch (kind) {
    case "REGULAR":
      return "Regulär";
    case "SCHLUSSRECHNUNG":
      return "Schlussrechnung";
    case "FOLGERECHNUNG":
      return "Folgerechnung";
    case "GUTSCHRIFT":
      return "Gutschrift";
    default:
      return kind;
  }
}

export type FinancePrepStepInvoiceProps = {
  busy: boolean;
  liveStatus: string;
  stepNotice: FinNotice | null;
  invoiceIdRead: string;
  onInvoiceIdInputChange: (value: string) => void;
  invoiceIdLooksValid: boolean;
  onLoadInvoice: () => void;
  invoiceOverview: InvoiceOverview | null;
  openCents: number | null;
  invoiceAllowedActions: string[] | null;
  canRecordPaymentIntake: boolean;
  canRecordDunningReminder: boolean;
  canBookInvoice: boolean;
  paymentIntakes: PaymentIntakeReadRow[] | null;
  dunningReminders: DunningReminderReadRow[] | null;
  issueDateBook: string;
  setIssueDateBook: (v: string) => void;
  bookPanelError: FinNotice | null;
  onBookInvoice: () => void;
  onSubmitEntwurfSkontoRecalc: () => void;
  canRecreateDraftAfterRegimeDrift: boolean;
  onRecreateInvoiceDraftFromRegimeDrift: () => void;
  showIntegrationHints?: boolean;
  api: ApiClient;
  onPaymentTermsDifferenceSuccess: () => void | Promise<void>;
};

function FinancePrepStepInvoiceInner({
  busy,
  liveStatus,
  stepNotice,
  invoiceIdRead,
  onInvoiceIdInputChange,
  invoiceIdLooksValid,
  onLoadInvoice,
  invoiceOverview,
  openCents,
  invoiceAllowedActions,
  canRecordPaymentIntake,
  canRecordDunningReminder,
  canBookInvoice,
  paymentIntakes,
  dunningReminders,
  issueDateBook,
  setIssueDateBook,
  bookPanelError,
  onBookInvoice,
  onSubmitEntwurfSkontoRecalc,
  canRecreateDraftAfterRegimeDrift,
  onRecreateInvoiceDraftFromRegimeDrift,
  showIntegrationHints = false,
  api,
  onPaymentTermsDifferenceSuccess,
}: FinancePrepStepInvoiceProps) {
  const [projectDiffRows, setProjectDiffRows] = useState<DifferenceBookingReadRow[]>([]);
  const [injectOpenDiffIds, setInjectOpenDiffIds] = useState<{ rev: number; text: string }>({ rev: 0, text: "" });

  useEffect(() => {
    const pid = invoiceOverview?.projectId?.trim();
    if (!pid) {
      setProjectDiffRows([]);
      return;
    }
    let cancelled = false;
    void api.listProjectDifferenceBookings(pid).then(
      (res) => {
        if (!cancelled) setProjectDiffRows(Array.isArray(res.data) ? res.data : []);
      },
      () => {
        if (!cancelled) setProjectDiffRows([]);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, invoiceOverview?.projectId, invoiceOverview?.invoiceId]);

  const openDiffsForMeasurement =
    invoiceOverview == null
      ? []
      : projectDiffRows.filter(
          (r) => r.measurementId === invoiceOverview.measurementId && r.status === "OPEN",
        );

  return (
    <FinancePrepPanel step={3} title="Rechnung laden, Beträge & Buchung" liveStatus={liveStatus}>
      <FinancePrepNotice notice={stepNotice} structuredAnnouncementRole="status" />
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
        Live-Prüfung <code>GET /invoices/:invoiceId</code> — Netto/USt/Brutto wie vom Server berechnet (Kernrechnung 8.4 MVP).
      </p>
      <p
        id={FIN_PREP_A11Y.invoiceUuidHint}
        data-testid={FIN_PREP_A11Y.invoiceUuidHint}
        style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.35rem 0 0.5rem" }}
      >
        Voreinstellung: gebuchte Demo-Rechnung{" "}
        <code>{DEMO_INVOICE_ID}</code> — andere IDs nach Schritt 2 (Entwurf) oder aus der API übernehmen.
      </p>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Rechnungs-ID (UUID)
        <input
          type="text"
          value={invoiceIdRead}
          onChange={(e) => {
            onInvoiceIdInputChange(e.target.value);
          }}
          aria-label="Rechnungs-ID für GET"
          aria-describedby={FIN_PREP_A11Y.invoiceUuidHint}
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem", marginTop: "0.25rem" }}
        />
      </label>
      <button
        type="button"
        onClick={() => void onLoadInvoice()}
        disabled={busy || !invoiceIdLooksValid}
        title={!invoiceIdLooksValid ? "Bitte eine gültige UUID in das Feld eintragen." : undefined}
      >
        Rechnung laden
      </button>
      {!invoiceOverview ? (
        <p id={FIN_PREP_A11Y.invoiceEmpty} role="status" style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.65rem", marginBottom: 0 }}>
          Noch keine Rechnung geladen — UUID prüfen und „Rechnung laden“ wählen.
        </p>
      ) : null}
      {invoiceOverview ? (
        <div style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
          <div
            className="finance-prep-metric-grid"
            role="group"
            aria-label="Kernzahlen Rechnung"
            data-testid="finance-invoice-kernzahlen"
          >
            <div className="metric-card">
              <p className="metric-card__label">Status</p>
              <p className="metric-card__value">{invoiceOverview.status}</p>
              <p className="metric-card__hint">
                {invoiceOverview.invoiceNumber ? `Nr. ${invoiceOverview.invoiceNumber}` : "—"}
              </p>
            </div>
            <div className="metric-card">
              <p className="metric-card__label">Brutto</p>
              <p className="metric-card__value">{formatEurFromCents(invoiceOverview.totalGrossCents)}</p>
              <p className="metric-card__hint">Server 8.4</p>
            </div>
            <div className="metric-card">
              <p className="metric-card__label">Offen</p>
              <p className="metric-card__value">{openCents != null ? formatEurFromCents(openCents) : "—"}</p>
              <p className="metric-card__hint">nach Zahlungseingängen</p>
            </div>
          </div>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "0.25rem 1rem",
              margin: 0,
              maxWidth: "28rem",
            }}
          >
            <dt style={{ color: "var(--text-secondary)" }}>Status</dt>
            <dd style={{ margin: 0 }}>{invoiceOverview.status}</dd>
            <dt style={{ color: "var(--text-secondary)" }}>Rechnungsnr.</dt>
            <dd style={{ margin: 0 }}>{invoiceOverview.invoiceNumber ?? "—"}</dd>
            <dt style={{ color: "var(--text-secondary)" }}>Rechnungsart (billingKind)</dt>
            <dd style={{ margin: 0 }} data-testid="finance-invoice-billing-kind">
              <code>{invoiceOverview.billingKind}</code>
              <span style={{ marginLeft: "0.35rem", color: "var(--text-secondary)" }}>
                ({billingKindLabelDe(invoiceOverview.billingKind)})
              </span>
            </dd>
            <dt style={{ color: "var(--text-secondary)" }}>LV-Netto (8.4/1)</dt>
            <dd style={{ margin: 0 }}>{formatEurFromCents(invoiceOverview.lvNetCents)}</dd>
            <dt style={{ color: "var(--text-secondary)" }}>Skonto (8.4/2, BP)</dt>
            <dd style={{ margin: 0 }}>{formatSkontoDisplay(invoiceOverview.skontoBps)}</dd>
            <dt style={{ color: "var(--text-secondary)" }}>USt</dt>
            <dd style={{ margin: 0 }}>
              {invoiceOverview.vatCents !== undefined && invoiceOverview.vatRateBps !== undefined
                ? `${formatEurFromCents(invoiceOverview.vatCents)} (${invoiceOverview.vatRateBps / 100} %)`
                : "—"}
            </dd>
            <dt style={{ color: "var(--text-secondary)" }}>Brutto</dt>
            <dd style={{ margin: 0 }}>{formatEurFromCents(invoiceOverview.totalGrossCents)}</dd>
            <dt style={{ color: "var(--text-secondary)" }}>Bereits gezahlt</dt>
            <dd style={{ margin: 0 }}>{formatEurFromCents(invoiceOverview.totalPaidCents)}</dd>
            {openCents != null ? (
              <>
                <dt style={{ color: "var(--text-secondary)" }}>Offen (Cent)</dt>
                <dd style={{ margin: 0 }}>{openCents}</dd>
              </>
            ) : null}
            <dt style={{ color: "var(--text-secondary)" }}>Skonto (Entwurf)</dt>
            <dd style={{ margin: 0 }}>
              {invoiceOverview.status === "ENTWURF" ? (
                <span>
                  Wert auch in Schritt 2;{" "}
                  <button
                    type="button"
                    data-testid="finance-prep-skonto-recalc-button"
                    disabled={busy}
                    onClick={() => void onSubmitEntwurfSkontoRecalc()}
                  >
                    Skonto mit POST /invoices neu berechnen
                  </button>
                </span>
              ) : (
                <span style={{ color: "var(--text-secondary)" }}>nur bei ENTWURF</span>
              )}
            </dd>
            <dt style={{ color: "var(--text-secondary)" }}>Steuerregime</dt>
            <dd style={{ margin: 0 }}>
              <code>{invoiceOverview.invoiceTaxRegime}</code>
              {invoiceOverview.taxReasonCode ? (
                <span style={{ marginLeft: "0.35rem", color: "var(--text-secondary)" }}>
                  ({invoiceOverview.taxReasonCode})
                </span>
              ) : null}
            </dd>
            {invoiceOverview.mandatoryTaxNoticeLines && invoiceOverview.mandatoryTaxNoticeLines.length > 0 ? (
              <>
                <dt style={{ color: "var(--text-secondary)", alignSelf: "start" }}>Pflicht-Hinweise</dt>
                <dd style={{ margin: 0 }}>
                  <ul
                    data-testid="finance-invoice-mandatory-tax-notices"
                    style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem" }}>
                    {invoiceOverview.mandatoryTaxNoticeLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </dd>
              </>
            ) : null}
            <dt style={{ color: "var(--text-secondary)" }}>SoT Zahlung</dt>
            <dd style={{ margin: 0 }}>
              {invoiceAllowedActions == null ? (
                <span style={{ color: "var(--text-secondary)" }}>— (nach „GET Rechnung laden“)</span>
              ) : canRecordPaymentIntake ? (
                <code>{RECORD_PAYMENT_INTAKE_ACTION_ID}</code>
              ) : (
                <span style={{ color: "var(--text-secondary)" }}>nicht erlaubt (Status/Rolle)</span>
              )}
            </dd>
            <dt style={{ color: "var(--text-secondary)" }}>SoT Mahnung</dt>
            <dd style={{ margin: 0 }}>
              {invoiceAllowedActions == null ? (
                <span style={{ color: "var(--text-secondary)" }}>— (nach „GET Rechnung laden“)</span>
              ) : canRecordDunningReminder ? (
                <code>{RECORD_DUNNING_REMINDER_ACTION_ID}</code>
              ) : (
                <span style={{ color: "var(--text-secondary)" }}>nicht erlaubt (Status/Rolle)</span>
              )}
            </dd>
            <dt style={{ color: "var(--text-secondary)" }}>SoT Buchung</dt>
            <dd style={{ margin: 0 }}>
              {invoiceAllowedActions == null ? (
                <span style={{ color: "var(--text-secondary)" }}>— (nach „Rechnung laden“)</span>
              ) : canBookInvoice ? (
                <code>{BOOK_INVOICE_ACTION_ID}</code>
              ) : (
                <span style={{ color: "var(--text-secondary)" }}>nicht erlaubt (nicht ENTWURF oder Rolle)</span>
              )}
            </dd>
          </dl>
          <div style={{ marginTop: "0.75rem" }} data-testid="finance-invoice-allocated-difference-bookings-block">
            <h4 style={{ fontSize: "0.9rem", margin: "0 0 0.35rem" }}>Zugeordnete Differenzbuchungen</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 0.35rem" }}>
              Feld <code>allocatedDifferenceBookings</code> aus <code>GET /invoices/:invoiceId</code> — Ausgleich je §8.6 Slice 2 (ohne Client-Delta).
            </p>
            <p
              style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: "0 0 0.35rem" }}
              data-testid="finance-invoice-dom86-cross-links"
            >
              Kurzeingänge mit gleicher API: <a href={DOCUMENT_WORKSPACE_HASH}>Dokument (INVOICE)</a>,{" "}
              <a href={LV_AUFMASS_HUB_HASH}>LV &amp; Aufmaß-Hub</a>.
            </p>
            <DifferenceBookingReadTable
              rows={invoiceOverview.allocatedDifferenceBookings}
              formatEur={formatEurFromCents}
              showAllocationTimestamps
              wrapTestId="finance-invoice-allocated-difference-bookings-wrap"
              tableTestId="finance-invoice-allocated-difference-bookings-table"
            />
            {invoiceOverview.allocatedDifferenceBookings.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.35rem 0 0" }}>
                Keine Differenzzeilen diesem Beleg zugeordnet.
              </p>
            ) : null}
          </div>
          <PaymentTermsDifferenceBookingPanel
            api={api}
            invoiceOverview={invoiceOverview}
            parentBusy={busy}
            onSuccess={onPaymentTermsDifferenceSuccess}
            testIdNs="finance"
          />
          {invoiceOverview.status === "ENTWURF" ? (
            <div style={{ marginTop: "0.65rem" }} data-testid="finance-prep-draft-difference-allocate-wrap">
              <h4 style={{ fontSize: "0.9rem", margin: "0 0 0.35rem" }}>Offene Differenzzeilen (Projekt, gleiches Aufmass)</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 0.35rem" }}>
                Lesepfad <code>GET /projects/&#123;projectId&#125;/difference-bookings</code>, gefiltert nach Status{" "}
                <code>OPEN</code> und <code>measurementId</code> dieser Rechnung — keine Betragsberechnung im Browser.
              </p>
              <DifferenceBookingReadTable
                rows={openDiffsForMeasurement}
                formatEur={formatEurFromCents}
                wrapTestId="finance-prep-open-diff-bookings-wrap"
                tableTestId="finance-prep-open-diff-bookings-table"
              />
              {openDiffsForMeasurement.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.35rem 0 0" }}>
                  Keine offenen Zeilen für dieses Aufmass — oder Projektliste noch nicht geladen.
                </p>
              ) : null}
              <button
                type="button"
                data-testid="finance-prep-inject-open-diff-ids"
                disabled={busy || openDiffsForMeasurement.length === 0}
                style={{ marginTop: "0.45rem" }}
                onClick={() =>
                  setInjectOpenDiffIds((p) => ({
                    rev: p.rev + 1,
                    text: openDiffsForMeasurement.map((r) => r.id).join(" "),
                  }))
                }
              >
                IDs in Zuordnungsfeld übernehmen
              </button>
              <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: "0.5rem 0 0" }}>
                Mehrere gleichzeitige Entwürfe: keine serverseitige Priorität — explizite Zuordnung (ADR-0022).
              </p>
              <InvoiceDraftDifferenceAllocatePanel
                api={api}
                invoiceId={invoiceOverview.invoiceId}
                parentBusy={busy}
                onSuccess={onPaymentTermsDifferenceSuccess}
                testIdNs="finance"
                injectIdsRevision={injectOpenDiffIds.rev}
                injectIdsText={injectOpenDiffIds.text}
              />
            </div>
          ) : null}
          {invoiceOverview.status === "ENTWURF" ? (
            <div style={{ marginTop: "0.65rem", paddingTop: "0.65rem", borderTop: "1px dashed color-mix(in srgb, var(--border) 80%, transparent)" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 0.35rem" }}>
                Rechnung aus Entwurf verbuchen (entspricht Haupt-Shell, hier direkter POST nach SoT-Prüfung).
              </p>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Buchungsdatum optional (UTC yyyy-mm-dd)
                <input
                  type="text"
                  value={issueDateBook}
                  onChange={(e) => setIssueDateBook(e.target.value)}
                  placeholder="2026-04-22"
                  aria-label="Optionales Buchungsdatum ISO yyyy-mm-dd"
                  style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem", marginTop: "0.25rem" }}
                />
              </label>
              <button
                type="button"
                onClick={() => void onBookInvoice()}
                disabled={busy || !canBookInvoice || !invoiceIdLooksValid}
                title={
                  !invoiceIdLooksValid
                    ? "Gültige Rechnungs-ID erforderlich."
                    : !canBookInvoice
                      ? `SoT ${BOOK_INVOICE_ACTION_ID} fehlt — Rechnung laden (ENTWURF).`
                      : "POST /invoices/{id}/book"
                }
              >
                Rechnung buchen
              </button>
              <FinancePrepNotice notice={bookPanelError} />
              {bookPanelError?.kind === "api" &&
              bookPanelError.error.envelope.code === "INVOICE_TAX_REGIME_CHANGED_RECREATE_DRAFT" ? (
                <div style={{ marginTop: "0.5rem" }}>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-primary)", margin: "0 0 0.35rem" }}>
                    Steuerregime-Drift: bitte mit demselben LV- und Angebotsstand einen neuen Rechnungsentwurf anlegen, dann buchen.
                  </p>
                  <button
                    type="button"
                    data-testid="finance-invoice-recreate-draft-cta"
                    onClick={() => void onRecreateInvoiceDraftFromRegimeDrift()}
                    disabled={busy || !canRecreateDraftAfterRegimeDrift}
                    title={
                      !canRecreateDraftAfterRegimeDrift
                        ? "Angebots-Version fehlt im Snapshot — manuell neuen Entwurf in Schritt 2 anlegen."
                        : "POST /invoices mit gleicher LV-/Angebotsversion — neue Entwurfs-ID laden"
                    }
                  >
                    Neuen Entwurf laden
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          {paymentIntakes != null ? (
            <div style={{ marginTop: "0.75rem" }}>
              <h4 style={{ fontSize: "0.9rem", margin: "0 0 0.35rem" }}>Zahlungseingänge</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 0.35rem" }}>
                <code>GET /invoices/…/payment-intakes</code> — ohne Idempotency-Key; gleiche Leserolle wie Rechnung.
              </p>
              {paymentIntakes.length === 0 ? (
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>Keine Buchungen.</p>
              ) : (
                <div style={{ overflow: "auto", maxWidth: "36rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                    <caption className="visually-hidden">Gebuchte Zahlungseingänge zu dieser Rechnung</caption>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "0.2rem 0.4rem" }}>
                          Zeit (UTC)
                        </th>
                        <th style={{ textAlign: "right", borderBottom: "1px solid var(--border)", padding: "0.2rem 0.4rem" }}>
                          Cent
                        </th>
                        <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "0.2rem 0.4rem" }}>
                          Referenz
                        </th>
                        <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "0.2rem 0.4rem" }}>
                          ID
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentIntakes.map((row, idx) => (
                        <tr
                          key={row.paymentIntakeId}
                          style={{
                            background: idx % 2 === 1 ? "color-mix(in srgb, var(--panel-2) 55%, transparent)" : undefined,
                          }}
                        >
                          <td style={{ padding: "0.25rem 0.4rem", fontFamily: "monospace" }}>{row.createdAt}</td>
                          <td style={{ padding: "0.25rem 0.4rem", textAlign: "right", fontFamily: "monospace" }}>{row.amountCents}</td>
                          <td style={{ padding: "0.25rem 0.4rem" }}>{row.externalReference}</td>
                          <td style={{ padding: "0.25rem 0.4rem", fontFamily: "monospace", fontSize: "0.7rem" }}>
                            {row.paymentIntakeId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
          {dunningReminders != null ? (
            <div style={{ marginTop: "0.75rem" }}>
              <h4 style={{ fontSize: "0.9rem", margin: "0 0 0.35rem" }}>Mahn-Ereignisse (FIN-4)</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 0.35rem" }}>
                <code>GET /invoices/…/dunning-reminders</code> — Lesepfad; Schreibpfad{" "}
                <code>POST /invoices/…/dunning-reminders</code> mit SoT <code>{RECORD_DUNNING_REMINDER_ACTION_ID}</code>; siehe{" "}
                <a href={repoDocHref("docs/adr/0009-fin4-mahnwesen-slice.md")}>ADR-0009</a>
                {" · "}
                <a href={repoDocHref("docs/adr/0010-fin4-m4-dunning-email-and-templates.md")}>ADR-0010</a> (M4 E-Mail/Vorlagen)
                {" · "}
                <a href={repoDocHref("docs/adr/0011-fin4-semi-dunning-context.md")}>ADR-0011</a> (SEMI-Kontext).
              </p>
              {dunningReminders.length === 0 ? (
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>Keine Mahn-Ereignisse.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem" }}>
                  {dunningReminders.map((r) => (
                    <li key={r.dunningReminderId}>
                      Stufe {r.stageOrdinal} · {r.createdAt}
                      {r.note ? ` — ${r.note}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
          {showIntegrationHints ? (
            <FinanceCollapsibleJson summary="Rohdaten GET /invoices (JSON)" json={invoiceOverview ? JSON.stringify(invoiceOverview, null, 2) : ""} />
          ) : null}
        </div>
      ) : null}
    </FinancePrepPanel>
  );
}

export const FinancePrepStepInvoice = memo(FinancePrepStepInvoiceInner);
