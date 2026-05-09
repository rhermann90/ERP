import { useCallback, useEffect, useState } from "react";
import type {
  ApiClient,
  CustomerEInvoicePartyListRow,
  CustomerEInvoicePartyReadResponse,
  PaymentTermsListResponse,
  TenantEInvoicePartyReadResponse,
} from "../../lib/api-client.js";
import { ApiError } from "../../lib/api-error.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";
import {
  ANGEBOTE_NACHTRAEGE_HUB_HASH,
  applyStammdatenCustomerIdToLocationHash,
  DOCUMENT_WORKSPACE_HASH,
  readStammdatenCustomerIdFromHash,
  STAMMDATEN_HASH,
} from "../../lib/hash-route.js";
import { ERP_SECTION_18_1_GITHUB_HASH } from "../../lib/erp-doc-section-hashes.js";
import { repoDocHref } from "../../lib/repo-doc-links.js";
import { customerJumpButtonLabel } from "./stammdaten/customer-display-label.js";
import { EInvoicePartyDetailFields } from "./stammdaten/EInvoicePartyDetailFields.js";
import { StammdatenPaymentTermsPanel } from "./stammdaten/StammdatenPaymentTermsPanel.js";
import { StammdatenCrmReadPanels } from "./stammdaten/StammdatenCrmReadPanels.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = {
  api: ApiClient | null;
  hasSession: boolean;
  showIntegrationHints?: boolean;
  canWriteCrmStammdaten?: boolean;
};

/**
 * Stammdaten-Hub: Kundenliste über FIN-5 XRechnung-Buyer-Stamm; Projektbezug über Pilot-ID und Konditions-Lesepfad,
 * bis PHASE-2 dedizierte Projekt-/Objekt-Listen liefert.
 */
export function StammdatenHubPage({ api, hasSession, showIntegrationHints = false, canWriteCrmStammdaten = false }: Props) {
  const ticketHref = repoDocHref("docs/tickets/PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md");
  const erpSystembeschreibungBase = repoDocHref("docs/ERP-Systembeschreibung.md");
  const erpSection181Href = erpSystembeschreibungBase
    ? `${erpSystembeschreibungBase}#${ERP_SECTION_18_1_GITHUB_HASH}`
    : undefined;
  const projectDocumentHref = `${DOCUMENT_WORKSPACE_HASH}?documentId=${encodeURIComponent(SEED.projectId)}&entityType=PROJECT`;

  const [customers, setCustomers] = useState<CustomerEInvoicePartyListRow[] | null>(null);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [busyCustomers, setBusyCustomers] = useState(false);

  const [customerIdFromHash, setCustomerIdFromHash] = useState(readStammdatenCustomerIdFromHash);
  const [customerDetail, setCustomerDetail] = useState<CustomerEInvoicePartyReadResponse | null>(null);
  const [customerDetailError, setCustomerDetailError] = useState<string | null>(null);
  const [busyCustomerDetail, setBusyCustomerDetail] = useState(false);

  const [tenantParty, setTenantParty] = useState<TenantEInvoicePartyReadResponse | null>(null);
  const [tenantPartyError, setTenantPartyError] = useState<string | null>(null);
  const [busyTenantParty, setBusyTenantParty] = useState(false);

  const [paymentTerms, setPaymentTerms] = useState<PaymentTermsListResponse | null>(null);
  const [paymentTermsError, setPaymentTermsError] = useState<string | null>(null);
  const [busyTerms, setBusyTerms] = useState(false);

  useEffect(() => {
    const sync = () => setCustomerIdFromHash(readStammdatenCustomerIdFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const loadCustomers = useCallback(async () => {
    if (!api) return;
    setBusyCustomers(true);
    setCustomersError(null);
    try {
      const r = await api.listCustomerEInvoiceParties();
      setCustomers(r.customers ?? []);
    } catch (e) {
      setCustomers(null);
      setCustomersError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusyCustomers(false);
    }
  }, [api]);

  useEffect(() => {
    if (!hasSession || !api) {
      setCustomers(null);
      return;
    }
    void loadCustomers();
  }, [hasSession, api, loadCustomers]);

  useEffect(() => {
    if (!api || !hasSession || !customerIdFromHash) {
      setCustomerDetail(null);
      setCustomerDetailError(null);
      return;
    }
    if (!UUID_RE.test(customerIdFromHash)) {
      setCustomerDetail(null);
      setCustomerDetailError(
        "Ungültige Kunden-ID in der URL — bitte eine gültige UUID verwenden oder die Auswahl aufheben.",
      );
      return;
    }

    let cancelled = false;
    setBusyCustomerDetail(true);
    setCustomerDetailError(null);
    void (async () => {
      try {
        const d = await api.getCustomerEInvoiceParty(customerIdFromHash);
        if (!cancelled) {
          setCustomerDetail(d);
          setCustomerDetailError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setCustomerDetail(null);
          setCustomerDetailError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
        }
      } finally {
        if (!cancelled) setBusyCustomerDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, hasSession, customerIdFromHash]);

  const loadTenantParty = useCallback(async () => {
    if (!api) return;
    setBusyTenantParty(true);
    setTenantPartyError(null);
    try {
      const r = await api.getTenantEInvoiceParty();
      setTenantParty(r);
    } catch (e) {
      setTenantParty(null);
      setTenantPartyError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusyTenantParty(false);
    }
  }, [api]);

  useEffect(() => {
    if (!hasSession || !api) {
      setTenantParty(null);
      return;
    }
    void loadTenantParty();
  }, [hasSession, api, loadTenantParty]);

  const loadPilotPaymentTerms = async () => {
    if (!api) return;
    setBusyTerms(true);
    setPaymentTermsError(null);
    setPaymentTerms(null);
    try {
      const raw = await api.getPaymentTermsByProject(SEED.projectId);
      setPaymentTerms(raw);
    } catch (e) {
      setPaymentTermsError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusyTerms(false);
    }
  };

  const selectCustomer = (customerId: string) => {
    applyStammdatenCustomerIdToLocationHash(customerId);
  };

  const clearCustomerSelection = () => {
    applyStammdatenCustomerIdToLocationHash(null);
  };

  return (
    <section className="panel domain-hub" aria-labelledby="stammdaten-hub-heading" data-testid="hub-stammdaten">
      <h2 id="stammdaten-hub-heading">Stammdaten</h2>
      <p className="shell-sub">
        <strong>XRechnung Buyer-Stamm</strong> (Kundenzeilen unten) bleibt der FIN-5-Profil-Stamm. Zusätzlich liefert der
        Hub lesende <strong>CRM-Stamm</strong>-Listen (Baustelle, CRM-Kunde, Projekt, Kontakte) über{" "}
        <code>/crm/…</code> gemäß ADR 0019 — Ticket{" "}
        {ticketHref ? (
          <a href={ticketHref} target="_blank" rel="noopener noreferrer">
            PHASE-2
          </a>
        ) : (
          <>PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM</>
        )}{" "}
        für Scope und Gate.
      </p>

      <StammdatenCrmReadPanels api={api} hasSession={hasSession} canWriteCrmStammdaten={canWriteCrmStammdaten} />

      <section className="panel" style={{ marginTop: "1rem" }} aria-labelledby="stamm-customers-heading">
        <h3 id="stamm-customers-heading">Kunden (XRechnung Buyer-Stamm)</h3>
        {!hasSession ? (
          <p className="hint">Bitte anmelden, um die Kundenliste zu laden.</p>
        ) : busyCustomers && !customers ? (
          <p>Lade …</p>
        ) : customersError ? (
          <p className="error-banner" role="alert" aria-live="polite">
            {customersError}
          </p>
        ) : customers && customers.length === 0 ? (
          <p className="hint">Keine Kundenzeilen — Buyer-Stammdaten können unter Finanz-Vorbereitung gepflegt werden.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              data-testid="stamm-customers-table"
              style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    Kunden-ID
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    Name
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    Ort
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    Land
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody>
                {(customers ?? []).map((c) => (
                  <tr
                    key={c.customerId}
                    style={{
                      background:
                        customerIdFromHash === c.customerId ? "var(--surface-elevated, rgba(128,128,128,0.12))" : undefined,
                    }}
                  >
                    <td style={{ padding: "0.35rem", verticalAlign: "top" }}>
                      <code>{c.customerId}</code>
                    </td>
                    <td style={{ padding: "0.35rem", verticalAlign: "top" }}>{c.legalName}</td>
                    <td style={{ padding: "0.35rem", verticalAlign: "top" }}>
                      {c.postalZone} {c.cityName}
                    </td>
                    <td style={{ padding: "0.35rem", verticalAlign: "top" }}>{c.countryCode}</td>
                    <td style={{ padding: "0.35rem", verticalAlign: "top" }}>
                      <button
                        type="button"
                        className="btn secondary"
                        data-testid={`stamm-customer-open-${c.customerId}`}
                        onClick={() => selectCustomer(c.customerId)}
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
        {hasSession ? (
          <div className="actions-row" style={{ marginTop: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <button type="button" className="btn secondary" onClick={() => void loadCustomers()} disabled={busyCustomers}>
              Liste aktualisieren
            </button>
            {customerIdFromHash ? (
              <button
                type="button"
                className="btn secondary"
                onClick={clearCustomerSelection}
                data-testid="stamm-customer-clear"
              >
                Auswahl aufheben
              </button>
            ) : null}
          </div>
        ) : null}

        {hasSession && customerIdFromHash ? (
          <section
            className="panel"
            style={{ marginTop: "1rem", borderStyle: "dashed" }}
            aria-labelledby="stamm-customer-detail-heading"
          >
            <h4 id="stamm-customer-detail-heading">Kundendetail (XRechnung)</h4>
            <p className="shell-sub" style={{ marginTop: 0 }}>
              Deep-Link:{" "}
              <code data-testid="stamm-customer-hash-preview">
                {STAMMDATEN_HASH}?customerId={customerIdFromHash}
              </code>
            </p>
            {busyCustomerDetail ? (
              <p data-testid="stamm-customer-detail-loading">Lade Detail …</p>
            ) : customerDetailError ? (
              <p className="error-banner" role="alert" aria-live="polite" data-testid="stamm-customer-detail-error">
                {customerDetailError}
              </p>
            ) : customerDetail ? (
              <div data-testid="stamm-customer-detail-panel">
                <p className="shell-sub">
                  Konfiguriert:{" "}
                  <strong data-testid="stamm-customer-configured">{customerDetail.configured ? "ja" : "nein"}</strong>
                </p>
                <EInvoicePartyDetailFields party={customerDetail.party} testId="stamm-customer-detail-fields" />
              </div>
            ) : null}
          </section>
        ) : null}
      </section>

      <section className="panel" style={{ marginTop: "1rem" }} aria-labelledby="stamm-tenant-seller-heading">
        <h3 id="stamm-tenant-seller-heading">Verkäufer (XRechnung, Mandant)</h3>
        <p className="shell-sub">
          Lesepfad aus <code>GET /finance/e-invoice-parties/tenant</code> — Pflege über Finanz-Vorbereitung am Server.
        </p>
        {!hasSession ? (
          <p className="hint">Bitte anmelden.</p>
        ) : busyTenantParty && !tenantParty ? (
          <p data-testid="stamm-tenant-seller-loading">Lade …</p>
        ) : tenantPartyError ? (
          <p className="error-banner" role="alert" aria-live="polite" data-testid="stamm-tenant-seller-error">
            {tenantPartyError}
          </p>
        ) : tenantParty ? (
          <div data-testid="stamm-tenant-seller-panel">
            <p className="shell-sub">
              Konfiguriert: <strong data-testid="stamm-tenant-configured">{tenantParty.configured ? "ja" : "nein"}</strong>
            </p>
            <EInvoicePartyDetailFields party={tenantParty.party} testId="stamm-tenant-seller-fields" />
          </div>
        ) : null}
        {hasSession && api ? (
          <button
            type="button"
            className="btn secondary"
            style={{ marginTop: "0.5rem" }}
            onClick={() => void loadTenantParty()}
            disabled={busyTenantParty}
            data-testid="stamm-tenant-seller-refresh"
          >
            Aktualisieren
          </button>
        ) : null}
      </section>

      <section className="panel" style={{ marginTop: "1rem" }} aria-labelledby="stamm-project-heading">
        <h3 id="stamm-project-heading">Projekt (Pilot)</h3>
        <p className="shell-sub">
          Objekt/Baustelle ist mandantenbezogen; Projekt verbindet Kunde und Objekt (ERP Zielbild). Normative Zielvorgabe:{" "}
          {erpSection181Href ? (
            <a href={erpSection181Href} target="_blank" rel="noopener noreferrer" data-testid="stamm-link-erp-181">
              ERP-Systembeschreibung (Abschnitt 18.1)
            </a>
          ) : (
            <>
              <code>docs/ERP-Systembeschreibung.md</code> (Abschnitt 18.1 — bei gesetztem{" "}
              <code>VITE_REPO_DOCS_BASE</code> klickbar)
            </>
          )}
          . Die Pilot-<code>projectId</code> entspricht der CRM-Projektzeile (PK); der Dokument-Arbeitsbereich bleibt SoT für{" "}
          <code>entityType=PROJECT</code>.
        </p>
        <p>
          <strong>Pilot projectId:</strong> <code data-testid="stamm-pilot-project-id">{SEED.projectId}</code>
        </p>
        <div className="actions-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
          <a className="btn-primary" href={projectDocumentHref} data-testid="stamm-link-document-project">
            Projekt in Dokument und Details öffnen
          </a>
          <a className="btn secondary" href={DOCUMENT_WORKSPACE_HASH} data-testid="stamm-link-document-generic">
            Dokument-Arbeitsbereich (letzte Auswahl)
          </a>
          {hasSession && api ? (
            <button type="button" className="btn secondary" disabled={busyTerms} onClick={() => void loadPilotPaymentTerms()}>
              Zahlungsbedingungen zum Pilot-Projekt laden
            </button>
          ) : null}
        </div>
        {paymentTermsError ? (
          <p className="error-banner" role="alert" aria-live="polite">
            {paymentTermsError}
          </p>
        ) : null}
        {paymentTerms ? (
          <StammdatenPaymentTermsPanel
            paymentTerms={paymentTerms}
            showIntegrationHints={showIntegrationHints}
            selectCustomer={selectCustomer}
            customerJumpLabel={customerJumpButtonLabel(paymentTerms.customerId, customers)}
          />
        ) : null}
      </section>

      <p className="shell-sub" style={{ marginTop: "1rem" }}>
        Weitere Einstiege:{" "}
        <a href={ANGEBOTE_NACHTRAEGE_HUB_HASH}>Angebote &amp; Nachträge</a>,{" "}
        <a href={DOCUMENT_WORKSPACE_HASH}>Dokument und Details</a>.
        {ticketHref ? (
          <>
            {" "}
            Backlog:{" "}
            <a href={ticketHref} target="_blank" rel="noopener noreferrer">
              PHASE-2 Projekt/Kunde-Stamm
            </a>
            .
          </>
        ) : (
          <>
            {" "}
            Backlog: <code>docs/tickets/PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md</code> (optional{" "}
            <code>VITE_REPO_DOCS_BASE</code> für klickbare Repo-Links).
          </>
        )}
      </p>
      {showIntegrationHints ? (
        <p className="shell-sub" style={{ margin: "0.5rem 0 0" }}>
          Route: <code>{STAMMDATEN_HASH}</code>
        </p>
      ) : null}
    </section>
  );
}
