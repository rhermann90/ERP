import { useCallback, useState } from "react";
import { FINANCE_PREP_HASH } from "../lib/hash-route.js";
import { repoDocHref } from "../lib/repo-doc-links.js";
import type { ApiClient, InvoiceOverview } from "../lib/api-client.js";
import { ApiError } from "../lib/api-error.js";

const DOC_LINKS: { label: string; repoPath: string }[] = [
  {
    label: "ADR 0007 — Finance-Persistenz und Rechnungsgrenzen",
    repoPath: "docs/adr/0007-finance-persistence-and-invoice-boundaries.md",
  },
  {
    label: "ADR 0008 — Zahlungsbedingungen (FIN-1)",
    repoPath: "docs/adr/0008-payment-terms-fin1.md",
  },
  {
    label: "FIN-2-Start-Gate (G1–G10)",
    repoPath: "docs/tickets/FIN-2-START-GATE.md",
  },
  {
    label: "OpenAPI-Mapping FIN-0 (fail-closed)",
    repoPath: "docs/contracts/finance-fin0-openapi-mapping.md",
  },
  {
    label: "Stub-Testmatrix FIN-0 (QA)",
    repoPath: "docs/contracts/qa-fin-0-stub-test-matrix.md",
  },
  {
    label: "MVP-Phasen (FIN-0 … FIN-6)",
    repoPath: "docs/ENTWICKLUNGSPHASEN-MVP-V1.3.md",
  },
  {
    label: "PL / System — Sprint-Snapshot (Koordination)",
    repoPath: "docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md",
  },
];

/** Seed-Projekt aus Backend `SEED_IDS.projectId` (Demos). */
const DEMO_PROJECT_ID = "10101010-1010-4010-8010-101010101010";
const DEMO_CUSTOMER_ID = "20202020-2020-4020-8020-202020202020";
/** Seed-Rechnung `SEED_IDS.invoiceId` (gebucht, mit 8.4-Beträgen). */
const DEMO_INVOICE_ID = "44444444-4444-4444-8444-444444444444";

function formatEurFromCents(cents: number | undefined): string {
  if (cents === undefined) return "—";
  return `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
}

export function FinancePreparation({ api }: { api: ApiClient }) {
  const [projectId, setProjectId] = useState(DEMO_PROJECT_ID);
  const [termsLabel, setTermsLabel] = useState("14 Tage netto");
  const [listJson, setListJson] = useState<string>("");
  const [draftJson, setDraftJson] = useState<string>("");
  const [invoiceIdRead, setInvoiceIdRead] = useState(DEMO_INVOICE_ID);
  const [invoiceOverview, setInvoiceOverview] = useState<InvoiceOverview | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadPaymentTerms = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const data = await api.getPaymentTermsByProject(projectId.trim());
      setListJson(JSON.stringify(data, null, 2));
    } catch (e) {
      setListJson("");
      setErr(e instanceof ApiError ? `${e.status}: ${JSON.stringify(e.envelope)}` : String(e));
    } finally {
      setBusy(false);
    }
  }, [api, projectId]);

  const createPaymentTermsVersion = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      await api.requestJson("POST", "/finance/payment-terms/versions", {
        projectId: projectId.trim(),
        customerId: DEMO_CUSTOMER_ID,
        termsLabel: termsLabel.trim() || "Kondition",
        reason: "Demo aus Finanz-Vorbereitung (FIN-1)",
      });
      await loadPaymentTerms();
    } catch (e) {
      setErr(e instanceof ApiError ? `${e.status}: ${JSON.stringify(e.envelope)}` : String(e));
    } finally {
      setBusy(false);
    }
  }, [api, projectId, termsLabel, loadPaymentTerms]);

  const createInvoiceDraft = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const data = await api.createInvoiceDraft({
        lvVersionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001",
        offerVersionId: "33333333-3333-4333-8333-333333333333",
        invoiceCurrencyCode: "EUR",
        reason: "Demo-Rechnungsentwurf aus Finanz-Vorbereitung (FIN-2)",
      });
      setDraftJson(JSON.stringify(data, null, 2));
      setInvoiceIdRead(data.invoiceId);
    } catch (e) {
      setDraftJson("");
      setErr(e instanceof ApiError ? `${e.status}: ${JSON.stringify(e.envelope)}` : String(e));
    } finally {
      setBusy(false);
    }
  }, [api]);

  const loadInvoice = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const data = await api.getInvoice(invoiceIdRead.trim());
      setInvoiceOverview(data);
    } catch (e) {
      setInvoiceOverview(null);
      setErr(e instanceof ApiError ? `${e.status}: ${JSON.stringify(e.envelope)}` : String(e));
    } finally {
      setBusy(false);
    }
  }, [api, invoiceIdRead]);

  return (
    <section className="panel finance-prep" aria-labelledby="finance-prep-heading">
      <h2 id="finance-prep-heading">Finanz (Vorbereitung)</h2>
      <p
        id="finance-prep-intro"
        style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: 0 }}
      >
        <strong>FIN-1</strong> Zahlungsbedingungen, <strong>FIN-2</strong> Rechnung (Entwurf + Lesen mit 8.4-Beträgen) — nur mit gültiger
        Anmeldung; Demo nutzt feste Seed-UUIDs aus dem Backend.
      </p>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        <a href="#/">Zurück zur Shell (Start)</a>
        {" · "}
        <span style={{ color: "var(--text-secondary)" }}>diese Seite: </span>
        <code>{FINANCE_PREP_HASH}</code>
      </p>

      <div className="finance-prep-tools" style={{ marginTop: "1rem", maxWidth: "42rem" }}>
        <h3 style={{ fontSize: "1rem" }}>Zahlungsbedingungen (FIN-1)</h3>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          <span className="visually-hidden">Projekt-ID</span>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            aria-label="Projekt-ID (UUID)"
            style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem" }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Bezeichnung neuer Version
          <input
            type="text"
            value={termsLabel}
            onChange={(e) => setTermsLabel(e.target.value)}
            style={{ width: "100%", marginTop: "0.25rem" }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <button type="button" onClick={() => void loadPaymentTerms()} disabled={busy}>
            GET Konditionen laden
          </button>
          <button type="button" onClick={() => void createPaymentTermsVersion()} disabled={busy}>
            POST neue Version
          </button>
        </div>
        {listJson ? (
          <pre style={{ fontSize: "0.75rem", overflow: "auto", maxHeight: "12rem" }}>{listJson}</pre>
        ) : null}

        <h3 style={{ fontSize: "1rem", marginTop: "1.25rem" }}>Rechnungsentwurf (FIN-2)</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
          Erzeugt einen Entwurf mit Seed-LV/Angebot, sofern Traceability im Backend erfüllt ist.
        </p>
        <button type="button" onClick={() => void createInvoiceDraft()} disabled={busy}>
          POST Rechnungsentwurf
        </button>
        {draftJson ? (
          <pre style={{ fontSize: "0.75rem", overflow: "auto", marginTop: "0.5rem" }}>{draftJson}</pre>
        ) : null}

        <h3 style={{ fontSize: "1rem", marginTop: "1.25rem" }}>Rechnung lesen (GET)</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
          Live-Prüfung <code>GET /invoices/:invoiceId</code> — Netto/USt/Brutto wie vom Server berechnet (8.4 MVP).
        </p>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Rechnungs-ID (UUID)
          <input
            type="text"
            value={invoiceIdRead}
            onChange={(e) => setInvoiceIdRead(e.target.value)}
            aria-label="Rechnungs-ID für GET"
            style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem", marginTop: "0.25rem" }}
          />
        </label>
        <button type="button" onClick={() => void loadInvoice()} disabled={busy}>
          GET Rechnung laden
        </button>
        {invoiceOverview ? (
          <div style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
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
              <dt style={{ color: "var(--text-secondary)" }}>LV-Netto (8.4/1)</dt>
              <dd style={{ margin: 0 }}>{formatEurFromCents(invoiceOverview.lvNetCents)}</dd>
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
            </dl>
            <pre style={{ fontSize: "0.7rem", overflow: "auto", marginTop: "0.5rem", maxHeight: "10rem" }}>
              {JSON.stringify(invoiceOverview, null, 2)}
            </pre>
          </div>
        ) : null}
        {err ? (
          <p role="alert" style={{ color: "var(--danger, #c00)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            {err}
          </p>
        ) : null}
      </div>

      <h3 className="visually-hidden">Referenzdokumente im Repository</h3>
      <nav aria-label="FIN-0 Referenzdokumente im Repository">
        <ul className="finance-prep-links" aria-describedby="finance-prep-intro">
          {DOC_LINKS.map(({ label, repoPath }) => {
            const href = repoDocHref(repoPath);
            return (
              <li key={repoPath}>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                  </a>
                ) : (
                  <span>
                    <strong>{label}</strong> — <code>{repoPath}</code>{" "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      (lokal im Repo öffnen oder <code>VITE_REPO_DOCS_BASE</code> in <code>.env</code> setzen)
                    </span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}
