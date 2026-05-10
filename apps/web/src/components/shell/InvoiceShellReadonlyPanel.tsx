import { DifferenceBookingReadTable } from "../shared/DifferenceBookingReadTable.js";
import { formatSkontoDisplay } from "../finance/finance-prep-helpers.js";
import type { ApiClient, DifferenceBookingReadRow, InvoiceOverview } from "../../lib/api-client.js";
import { financePrepHashWithTab, LV_AUFMASS_HUB_HASH } from "../../lib/hash-route.js";
import { PaymentTermsDifferenceBookingPanel } from "../finance/PaymentTermsDifferenceBookingPanel.js";
import { InvoiceDraftDifferenceAllocatePanel } from "../finance/InvoiceDraftDifferenceAllocatePanel.js";
import { ShellExpertDiagnosticsJson } from "./ShellExpertDiagnosticsJson.js";

function formatShellEur(cents: number | undefined) {
  return cents == null ? "—" : (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function formatDiffRowEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export type InvoiceShellReadonlyPanelProps = {
  detail: InvoiceOverview;
  busy: boolean;
  showExpertUi: boolean;
  invoicePaymentIntakesJson: string;
  invoiceDunningRemindersJson: string;
  invoicePaymentTermsJson: string;
  invoiceAllowedActionsShellJson: string;
  invoiceOfferVersionAllowedActionsJson: string;
  invoiceEInvoiceTenantJson: string;
  invoiceEInvoiceCustomersListJson: string;
  invoiceEInvoiceBuyerJson: string;
  invoiceTenantTaxProfileJson: string;
  invoiceProjectTaxOverrideJson: string;
  invoiceShellLvSnapshotJson: string;
  invoiceAuditEventsJson: string;
  invoiceDifferenceBookingsJson: string;
  invoiceDifferenceBookingsRows: DifferenceBookingReadRow[] | null;
  invoiceDifferenceBookingsByRefJson: string;
  invoiceDifferenceBookingsByRefRows: DifferenceBookingReadRow[] | null;
  api: ApiClient;
  onReloadInvoiceDetail: () => void | Promise<void>;
  onLoadPaymentIntakes: () => void;
  onLoadDunningReminders: () => void;
  onLoadPaymentTerms: () => void;
  onLoadAllowedActionsInvoice: () => void;
  onLoadAllowedActionsOfferVersion: () => void;
  onLoadEInvoiceTenant: () => void;
  onLoadEInvoiceCustomers: () => void;
  onLoadEInvoiceBuyer: () => void;
  onLoadTenantTaxProfile: () => void;
  onLoadProjectTaxOverride: () => void;
  onLoadLvVersion: () => void;
  onLoadAuditEvents: () => void;
  onLoadDifferenceBookings: () => void;
  onLoadDifferenceBookingsByInvoiceRef: () => void;
};

export function InvoiceShellReadonlyPanel(props: InvoiceShellReadonlyPanelProps) {
  const d = props.detail;
  const allocatedRows = d.allocatedDifferenceBookings ?? [];
  return (
    <section className="panel" data-testid="invoice-shell-detail">
      <h2>Rechnung (GET-Detail, read-only)</h2>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
        <code>GET /invoices/{d.invoiceId}</code> — Lesepfade unten; bei <strong>ENTWURF</strong> Zuordnung/Entzug von
        Differenzzeilen (allocate/deallocate, ADR-0022); bei <strong>gebuchter</strong> Rechnung zusätzlich
        Konditions-Differenz (Slice 2b, ADR-0023). Mandanten- und Domänenregeln gelten API-seitig. Übrige Buchungen über
        SoT/Aktionen.
      </p>
      <p
        className="hint"
        style={{ fontSize: "0.78rem", marginTop: "0.35rem", marginBottom: 0 }}
        data-testid="shell-invoice-dom86-cross-links"
      >
        Gleiche Konditions-Differenz / Entwurfs-Zuordnung wie Finanz-Vorbereitung Schritt 3:{" "}
        <a href={financePrepHashWithTab("rechnung")}>Finanz (Vorbereitung)</a>,{" "}
        <a href={LV_AUFMASS_HUB_HASH}>LV &amp; Aufmaß-Hub</a>.
      </p>
      <dl className="field-grid two" style={{ margin: 0 }}>
        <dt className="label">Status</dt>
        <dd style={{ margin: 0 }}>
          <code>{d.status}</code>
        </dd>
        <dt className="label">Rechnungsnr.</dt>
        <dd style={{ margin: 0 }}>{d.invoiceNumber ?? "—"}</dd>
        <dt className="label">Skonto (B2-1a)</dt>
        <dd style={{ margin: 0 }}>{formatSkontoDisplay(d.skontoBps)}</dd>
        <dt className="label">LV-Netto (nach 8.4)</dt>
        <dd style={{ margin: 0 }}>{formatShellEur(d.lvNetCents)}</dd>
        <dt className="label">USt / Brutto</dt>
        <dd style={{ margin: 0 }}>
          {formatShellEur(d.vatCents)} / {formatShellEur(d.totalGrossCents)}
        </dd>
        <dt className="label">Bezahlt</dt>
        <dd style={{ margin: 0 }}>{formatShellEur(d.totalPaidCents)}</dd>
        <dt className="label">LV-Version (Trace)</dt>
        <dd style={{ margin: 0 }} data-testid="shell-invoice-trace-lv">
          <code>{d.lvVersionId}</code>
        </dd>
        <dt className="label">Aufmass-ID</dt>
        <dd style={{ margin: 0 }} data-testid="shell-invoice-trace-measurement">
          <code>{d.measurementId}</code>
        </dd>
        <dt className="label">Angebotsversion</dt>
        <dd style={{ margin: 0 }} data-testid="shell-invoice-trace-offer-version">
          {d.offerVersionId ? <code>{d.offerVersionId}</code> : <span>—</span>}
        </dd>
      </dl>
      <div style={{ marginTop: "0.75rem" }}>
        <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.35rem" }}>Zugeordnete Differenzbuchungen (GET-Rechnung)</h3>
        <p className="hint" style={{ margin: "0 0 0.35rem", fontSize: "0.8rem" }}>
          Feld <code>allocatedDifferenceBookings</code> — Slice 2 / ADR-0022.
        </p>
        <DifferenceBookingReadTable
          rows={allocatedRows}
          formatEur={formatDiffRowEur}
          showAllocationTimestamps
          wrapTestId="shell-invoice-allocated-difference-bookings-wrap"
          tableTestId="shell-invoice-allocated-difference-bookings-table"
        />
        {allocatedRows.length === 0 ? (
          <p className="hint" data-testid="shell-invoice-allocated-difference-bookings-empty">
            Keine Differenzbuchungen diesem Beleg zugeordnet.
          </p>
        ) : null}
      </div>
      <PaymentTermsDifferenceBookingPanel
        api={props.api}
        invoiceOverview={d}
        parentBusy={props.busy}
        onSuccess={props.onReloadInvoiceDetail}
        testIdNs="shell"
      />
      {d.status === "ENTWURF" ? (
        <InvoiceDraftDifferenceAllocatePanel
          api={props.api}
          invoiceId={d.invoiceId}
          parentBusy={props.busy}
          onSuccess={props.onReloadInvoiceDetail}
          testIdNs="shell"
        />
      ) : null}
      {props.showExpertUi ? (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.65rem", marginBottom: "0.35rem" }}>
          Weitere Lesepfade (keine Schreibaktionen):{" "}
          <code>GET /invoices/{d.invoiceId}/payment-intakes</code>,{" "}
          <code>GET /invoices/{d.invoiceId}/dunning-reminders</code>, <code>GET /finance/payment-terms</code> (
          <code>projectId</code> aus dieser Rechnung: <code>{d.projectId}</code>),{" "}
          <code>GET /documents/…/allowed-actions</code> (<code>INVOICE</code>
          {d.offerVersionId ? (
            <>
              ; bei gesetzter Angebotsversion zusätzlich <code>OFFER_VERSION</code> mit <code>{d.offerVersionId}</code>
            </>
          ) : null}
          ), <code>GET /finance/e-invoice-parties/tenant</code>, <code>GET …/customers</code>,{" "}
          <code>{`GET …/customers/{customerId}`}</code> (aus dieser Rechnung: <code>{d.customerId}</code>),{" "}
          <code>GET /finance/invoice-tax-profile</code>,{" "}
          <code>{`GET /finance/invoice-tax-profile/projects/{projectId}`}</code> (<code>{d.projectId}</code>),{" "}
          <code>{`GET /lv/versions/${d.lvVersionId}`}</code> (LV-Traceability aus Rechnung),{" "}
          <code>GET /audit-events</code> (mandantenweit, Seite 1; Rollen mit Audit-Leserecht),{" "}
          <code>{`GET /projects/{projectId}/difference-bookings`}</code> (Projekt, §5.4/§8.6),{" "}
          <code>{`GET /invoices/{invoiceId}/difference-bookings`}</code> (nur Zeilen mit Bezug zu dieser Rechnungs-ID).
        </p>
      ) : (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.65rem", marginBottom: "0.35rem" }}>
          Über die Schaltflächen unten können Sie ergänzende Lesepfade laden (Zahlungen, Mahnungen, Steuerprofil, Traceability,
          Audit, Differenzbuchungen). Rohdaten erscheinen nur im Expertenmodus.
        </p>
      )}
      <div data-testid="shell-invoice-readonly-subreads" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <button type="button" disabled={props.busy} onClick={props.onLoadPaymentIntakes}>
          {props.showExpertUi ? "Zahlungseingänge (GET)" : "Zahlungseingänge"}
        </button>
        <button type="button" disabled={props.busy} onClick={props.onLoadDunningReminders}>
          {props.showExpertUi ? "Mahn-Ereignisse (GET)" : "Mahn-Ereignisse"}
        </button>
        <button
          type="button"
          disabled={props.busy}
          aria-label="Zahlungsbedingungen zum Projekt der Rechnung laden (GET)"
          onClick={props.onLoadPaymentTerms}
        >
          Zahlungsbedingungen Projekt (GET)
        </button>
        <button
          type="button"
          disabled={props.busy}
          aria-label="Erlaubte Aktionen für diese Rechnung laden (GET)"
          onClick={props.onLoadAllowedActionsInvoice}
        >
          Erlaubte Aktionen Rechnung (GET)
        </button>
        <button
          type="button"
          disabled={props.busy || !d.offerVersionId}
          aria-label="Erlaubte Aktionen für die Angebotsversion dieser Rechnung laden (GET)"
          data-testid="shell-invoice-offer-version-allowed-actions-fetch"
          onClick={props.onLoadAllowedActionsOfferVersion}
        >
          Erlaubte Aktionen Angebotsversion (GET)
        </button>
        <button
          type="button"
          disabled={props.busy}
          aria-label="E-Rechnung Seller-Stammdaten Mandant laden (GET)"
          data-testid="shell-invoice-e-invoice-tenant-fetch"
          onClick={props.onLoadEInvoiceTenant}
        >
          E-Rechnung Seller (GET)
        </button>
        <button
          type="button"
          disabled={props.busy}
          aria-label="E-Rechnung Buyer-Stammdaten Liste laden (GET)"
          data-testid="shell-invoice-e-invoice-customers-fetch"
          onClick={props.onLoadEInvoiceCustomers}
        >
          E-Rechnung Buyer-Liste (GET)
        </button>
        <button
          type="button"
          disabled={props.busy}
          aria-label="E-Rechnung Buyer-Stammdaten für Kunden-ID der Rechnung laden (GET)"
          data-testid="shell-invoice-e-invoice-buyer-fetch"
          onClick={props.onLoadEInvoiceBuyer}
        >
          E-Rechnung Buyer Rechnung (GET)
        </button>
        <button
          type="button"
          disabled={props.busy}
          aria-label="Mandanten-Steuerprofil Rechnung laden (GET)"
          data-testid="shell-invoice-invoice-tax-profile-fetch"
          onClick={props.onLoadTenantTaxProfile}
        >
          Steuerprofil Mandant (GET)
        </button>
        <button
          type="button"
          disabled={props.busy}
          aria-label="Projekt-Steueroverride zur Rechnung laden (GET)"
          data-testid="shell-invoice-project-tax-override-fetch"
          onClick={props.onLoadProjectTaxOverride}
        >
          Steueroverride Projekt (GET)
        </button>
        <button
          type="button"
          disabled={props.busy}
          aria-label="LV-Version zur Traceability dieser Rechnung laden (GET)"
          data-testid="shell-invoice-lv-version-fetch"
          onClick={props.onLoadLvVersion}
        >
          LV-Version Traceability (GET)
        </button>
        <button
          type="button"
          disabled={props.busy}
          aria-label="Audit-Ereignisse Mandant Seite 1 laden (GET)"
          data-testid="shell-invoice-audit-events-fetch"
          onClick={props.onLoadAuditEvents}
        >
          Audit-Ereignisse (GET)
        </button>
        <button
          type="button"
          disabled={props.busy}
          aria-label="Differenzbuchungen zum Projekt der Rechnung laden (GET)"
          data-testid="shell-invoice-difference-bookings-fetch"
          onClick={props.onLoadDifferenceBookings}
        >
          Differenzbuchungen Projekt (GET)
        </button>
        <button
          type="button"
          disabled={props.busy}
          aria-label="Differenzbuchungen mit Bezugsrechnung dieser Rechnung laden (GET)"
          data-testid="shell-invoice-difference-bookings-by-ref-fetch"
          onClick={props.onLoadDifferenceBookingsByInvoiceRef}
        >
          Differenzbuchungen Bezugsrechnung (GET)
        </button>
      </div>
      {props.invoicePaymentIntakesJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>Zahlungseingänge</h3>
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-payment-intakes-json">
            {props.invoicePaymentIntakesJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoiceDunningRemindersJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>Mahn-Ereignisse</h3>
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-dunning-reminders-json">
            {props.invoiceDunningRemindersJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoicePaymentTermsJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
            Antwort GET /finance/payment-terms (Projekt)
          </h3>
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-payment-terms-json">
            {props.invoicePaymentTermsJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoiceAllowedActionsShellJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>Antwort allowed-actions (INVOICE)</h3>
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-allowed-actions-json">
            {props.invoiceAllowedActionsShellJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoiceOfferVersionAllowedActionsJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
            Antwort allowed-actions (OFFER_VERSION)
          </h3>
          <ShellExpertDiagnosticsJson
            showOpen={props.showExpertUi}
            testId="shell-invoice-offer-version-allowed-actions-json"
          >
            {props.invoiceOfferVersionAllowedActionsJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoiceEInvoiceTenantJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
            Antwort GET /finance/e-invoice-parties/tenant
          </h3>
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-e-invoice-tenant-json">
            {props.invoiceEInvoiceTenantJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoiceEInvoiceCustomersListJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
            Antwort GET /finance/e-invoice-parties/customers
          </h3>
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-e-invoice-customers-json">
            {props.invoiceEInvoiceCustomersListJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoiceEInvoiceBuyerJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
            {`Antwort GET /finance/e-invoice-parties/customers/{customerId}`}
          </h3>
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-e-invoice-buyer-json">
            {props.invoiceEInvoiceBuyerJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoiceTenantTaxProfileJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
            Antwort GET /finance/invoice-tax-profile (Mandant)
          </h3>
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-invoice-tax-profile-json">
            {props.invoiceTenantTaxProfileJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoiceProjectTaxOverrideJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
            {`Antwort GET /finance/invoice-tax-profile/projects/${d.projectId}`}
          </h3>
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-project-tax-override-json">
            {props.invoiceProjectTaxOverrideJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoiceShellLvSnapshotJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>{`Antwort GET /lv/versions/${d.lvVersionId}`}</h3>
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-lv-version-json">
            {props.invoiceShellLvSnapshotJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoiceAuditEventsJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>Antwort GET /audit-events (Seite 1)</h3>
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-audit-events-json">
            {props.invoiceAuditEventsJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoiceDifferenceBookingsJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
            Antwort GET /projects/…/difference-bookings
          </h3>
          {props.invoiceDifferenceBookingsRows !== null && props.invoiceDifferenceBookingsRows.length > 0 ? (
            <DifferenceBookingReadTable
              rows={props.invoiceDifferenceBookingsRows}
              formatEur={formatDiffRowEur}
              wrapTestId="shell-invoice-difference-bookings-table-wrap"
              tableTestId="shell-invoice-difference-bookings-table"
            />
          ) : props.invoiceDifferenceBookingsRows !== null && props.invoiceDifferenceBookingsRows.length === 0 ? (
            <p className="hint" data-testid="shell-invoice-difference-bookings-empty">
              Keine Differenzbuchungen für dieses Projekt.
            </p>
          ) : null}
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-difference-bookings-json">
            {props.invoiceDifferenceBookingsJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
      {props.invoiceDifferenceBookingsByRefJson ? (
        <>
          <h3 style={{ fontSize: "0.95rem", margin: "0.75rem 0 0.35rem" }}>
            Antwort GET /invoices/…/difference-bookings (Bezugsrechnung)
          </h3>
          {props.invoiceDifferenceBookingsByRefRows !== null && props.invoiceDifferenceBookingsByRefRows.length > 0 ? (
            <DifferenceBookingReadTable
              rows={props.invoiceDifferenceBookingsByRefRows}
              formatEur={formatDiffRowEur}
              wrapTestId="shell-invoice-difference-bookings-by-ref-table-wrap"
              tableTestId="shell-invoice-difference-bookings-by-ref-table"
            />
          ) : props.invoiceDifferenceBookingsByRefRows !== null &&
            props.invoiceDifferenceBookingsByRefRows.length === 0 ? (
            <p className="hint" data-testid="shell-invoice-difference-bookings-by-ref-empty">
              Keine Differenzbuchungen mit Bezug zu dieser Rechnungs-ID.
            </p>
          ) : null}
          <ShellExpertDiagnosticsJson showOpen={props.showExpertUi} testId="shell-invoice-difference-bookings-by-ref-json">
            {props.invoiceDifferenceBookingsByRefJson}
          </ShellExpertDiagnosticsJson>
        </>
      ) : null}
    </section>
  );
}
