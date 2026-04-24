import { useCallback, useState } from "react";
import { FINANCE_PREP_HASH } from "../lib/hash-route.js";
import { DEMO_SEED_IDS } from "../lib/demo-seed-ids.js";
import { repoDocHref } from "../lib/repo-doc-links.js";
import type { ApiClient, InvoiceOverview } from "../lib/api-client.js";
import { ApiError } from "../lib/api-error.js";

const SOT_ENTITY_TYPES = [
  "INVOICE",
  "OFFER_VERSION",
  "SUPPLEMENT_VERSION",
  "MEASUREMENT_VERSION",
  "LV_VERSION",
  "LV_STRUCTURE_NODE",
  "LV_POSITION",
] as const;

type SotEntityType = (typeof SOT_ENTITY_TYPES)[number];

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
  {
    label: "UI — v1.3-Fachrollen → API-Rollen (Mapping)",
    repoPath: "docs/contracts/ui-role-mapping-v1-3.md",
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

function openAmountCents(overview: InvoiceOverview | null): number | null {
  if (!overview) return null;
  if (overview.totalGrossCents === undefined || overview.totalPaidCents === undefined) return null;
  return Math.max(0, overview.totalGrossCents - overview.totalPaidCents);
}

export function FinancePreparation({ api }: { api: ApiClient }) {
  const [projectId, setProjectId] = useState(DEMO_PROJECT_ID);
  const [termsLabel, setTermsLabel] = useState("14 Tage netto");
  const [listJson, setListJson] = useState<string>("");
  const [draftJson, setDraftJson] = useState<string>("");
  const [invoiceIdRead, setInvoiceIdRead] = useState(DEMO_INVOICE_ID);
  const [invoiceOverview, setInvoiceOverview] = useState<InvoiceOverview | null>(null);
  const [intakeAmountCents, setIntakeAmountCents] = useState("100");
  const [intakeExternalRef, setIntakeExternalRef] = useState("PWA-DEMO-INTAKE-1");
  const [intakeResultJson, setIntakeResultJson] = useState<string>("");
  const [auditJson, setAuditJson] = useState<string>("");
  const [sotEntityType, setSotEntityType] = useState<SotEntityType>("OFFER_VERSION");
  const [sotDocumentId, setSotDocumentId] = useState<string>(DEMO_SEED_IDS.offerVersionId);
  const [sotJson, setSotJson] = useState<string>("");
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

  const loadSotAllowedActions = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await api.getAllowedActions(sotDocumentId.trim(), sotEntityType);
      setSotJson(JSON.stringify(res, null, 2));
    } catch (e) {
      setSotJson("");
      setErr(e instanceof ApiError ? `${e.status}: ${JSON.stringify(e.envelope)}` : String(e));
    } finally {
      setBusy(false);
    }
  }, [api, sotDocumentId, sotEntityType]);

  const applyOpenBalanceToIntake = useCallback(() => {
    const open = openAmountCents(invoiceOverview);
    if (open != null && open > 0) setIntakeAmountCents(String(open));
  }, [invoiceOverview]);

  const submitPaymentIntake = useCallback(async () => {
    setErr(null);
    setBusy(true);
    setIntakeResultJson("");
    try {
      const amount = Number.parseInt(intakeAmountCents.trim(), 10);
      if (!Number.isFinite(amount) || amount < 1) {
        setErr("Zahlungsbetrag (Cent) muss eine ganze Zahl ≥ 1 sein.");
        return;
      }
      const idem = crypto.randomUUID();
      const out = await api.recordPaymentIntake(
        {
          invoiceId: invoiceIdRead.trim(),
          amountCents: amount,
          externalReference: intakeExternalRef.trim() || "PWA-INTAKE",
          reason: "Zahlungseingang aus Finanz-Vorbereitung (FIN-3 Demo)",
        },
        idem,
      );
      setIntakeResultJson(JSON.stringify(out, null, 2));
      await loadInvoice();
    } catch (e) {
      setIntakeResultJson("");
      setErr(e instanceof ApiError ? `${e.status}: ${JSON.stringify(e.envelope)}` : String(e));
    } finally {
      setBusy(false);
    }
  }, [api, intakeAmountCents, intakeExternalRef, invoiceIdRead, loadInvoice]);

  const loadAuditEvents = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const data = await api.getAuditEvents(1, 15);
      setAuditJson(JSON.stringify(data, null, 2));
    } catch (e) {
      setAuditJson("");
      setErr(e instanceof ApiError ? `${e.status}: ${JSON.stringify(e.envelope)}` : String(e));
    } finally {
      setBusy(false);
    }
  }, [api]);

  const openCents = openAmountCents(invoiceOverview);

  return (
    <section className="panel finance-prep" aria-labelledby="finance-prep-heading">
      <h2 id="finance-prep-heading">Finanz (Vorbereitung)</h2>
      <p
        id="finance-prep-intro"
        style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: 0 }}
      >
        <strong>FIN-1</strong> Zahlungsbedingungen, <strong>FIN-2</strong> Rechnung (Entwurf + Lesen mit 8.4-Beträgen), <strong>FIN-3</strong>{" "}
        Zahlungseingang — nur mit gültiger Anmeldung; Demo nutzt feste Seed-UUIDs aus dem Backend. Nach Buchungen hilft{" "}
        <strong>Audit</strong> (<code>GET /audit-events</code>) zur Nachvollziehbarkeit im Mandanten.
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

        <h3 style={{ fontSize: "1rem", marginTop: "1.25rem" }}>SoT — erlaubte Aktionen (Schritt 4)</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
          <code>GET /documents/:id/allowed-actions</code> — gleiche Quelle wie die Dokument-Shell; <code>id</code> ist die UUID der gewählten Entität (nicht immer die Rechnungs-ID).
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <button
            type="button"
            onClick={() => {
              setSotEntityType("OFFER_VERSION");
              setSotDocumentId(DEMO_SEED_IDS.offerVersionId);
            }}
            disabled={busy}
          >
            Voreinstellung: Angebotsversion
          </button>
          <button
            type="button"
            onClick={() => {
              setSotEntityType("MEASUREMENT_VERSION");
              setSotDocumentId(DEMO_SEED_IDS.measurementVersionId);
            }}
            disabled={busy}
          >
            Voreinstellung: Aufmaßversion
          </button>
          <button
            type="button"
            onClick={() => {
              setSotEntityType("LV_VERSION");
              setSotDocumentId(DEMO_SEED_IDS.lvVersionId);
            }}
            disabled={busy}
          >
            Voreinstellung: LV-Version
          </button>
          <button
            type="button"
            onClick={() => {
              setSotEntityType("LV_STRUCTURE_NODE");
              setSotDocumentId(DEMO_SEED_IDS.lvBereichId);
            }}
            disabled={busy}
          >
            Voreinstellung: LV-Bereich
          </button>
          <button
            type="button"
            onClick={() => {
              setSotEntityType("LV_POSITION");
              setSotDocumentId(DEMO_SEED_IDS.lvPositionId);
            }}
            disabled={busy}
          >
            Voreinstellung: LV-Position
          </button>
          <button
            type="button"
            onClick={() => {
              setSotEntityType("INVOICE");
              setSotDocumentId(invoiceIdRead.trim());
            }}
            disabled={busy}
          >
            Rechnungs-ID aus Feld übernehmen
          </button>
        </div>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          entityType
          <select
            value={sotEntityType}
            onChange={(e) => setSotEntityType(e.target.value as SotEntityType)}
            aria-label="entityType für allowed-actions"
            style={{ display: "block", width: "100%", marginTop: "0.25rem", maxWidth: "28rem" }}
          >
            {SOT_ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Dokument-ID (UUID)
          <input
            type="text"
            value={sotDocumentId}
            onChange={(e) => setSotDocumentId(e.target.value)}
            aria-label="Dokument-ID für allowed-actions"
            style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem", marginTop: "0.25rem" }}
          />
        </label>
        <button type="button" onClick={() => void loadSotAllowedActions()} disabled={busy}>
          Erlaubte Aktionen laden
        </button>
        {sotJson ? <pre style={{ fontSize: "0.75rem", overflow: "auto", marginTop: "0.5rem", maxHeight: "12rem" }}>{sotJson}</pre> : null}

        <h3 style={{ fontSize: "1rem", marginTop: "1.25rem" }}>Zahlungseingang (FIN-3) — drei Klicks</h3>
        <ol style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 0, paddingLeft: "1.2rem" }}>
          <li>
            Rechnung laden (Abschnitt oben: <strong>GET Rechnung laden</strong>).
          </li>
          <li>
            Offenen Restbetrag übernehmen oder Cent-Betrag anpassen
            {openCents != null && openCents > 0 ? (
              <>
                {" "}
                (aktuell offen: <strong>{openCents}</strong> Cent).
              </>
            ) : (
              <> (zuerst Rechnung laden, wenn keine Daten angezeigt werden).</>
            )}
          </li>
          <li>
            <strong>Zahlung buchen</strong> — pro Klick neuer <code>Idempotency-Key</code> (UUID); Wiederholung mit gleichem Key liefert Replay (HTTP 200).
          </li>
        </ol>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
          <button type="button" onClick={() => applyOpenBalanceToIntake()} disabled={busy || openCents == null || openCents < 1}>
            Offenen Betrag übernehmen
          </button>
        </div>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Betrag (Cent, ganzzahlig)
          <input
            type="text"
            inputMode="numeric"
            value={intakeAmountCents}
            onChange={(e) => setIntakeAmountCents(e.target.value)}
            aria-label="Zahlungsbetrag in Cent"
            style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem", marginTop: "0.25rem" }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Externe Referenz (Bank / CSV)
          <input
            type="text"
            value={intakeExternalRef}
            onChange={(e) => setIntakeExternalRef(e.target.value)}
            style={{ width: "100%", marginTop: "0.25rem" }}
          />
        </label>
        <button type="button" onClick={() => void submitPaymentIntake()} disabled={busy}>
          Zahlung buchen (POST /finance/payments/intake)
        </button>
        {intakeResultJson ? (
          <pre style={{ fontSize: "0.75rem", overflow: "auto", marginTop: "0.5rem", maxHeight: "10rem" }}>{intakeResultJson}</pre>
        ) : null}

        <h3 style={{ fontSize: "1rem", marginTop: "1.25rem" }}>Nachvollziehbarkeit — Audit (Schritt 4)</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
          <code>GET /audit-events</code> — Leserecht nur für <strong>ADMIN</strong>, <strong>BUCHHALTUNG</strong>, <strong>GESCHAEFTSFUEHRUNG</strong> (sonst 403{" "}
          <code>FORBIDDEN_AUDIT_READ</code>).
        </p>
        <button type="button" onClick={() => void loadAuditEvents()} disabled={busy}>
          Audit-Ereignisse laden (letzte 15)
        </button>
        {auditJson ? (
          <pre style={{ fontSize: "0.75rem", overflow: "auto", marginTop: "0.5rem", maxHeight: "14rem" }}>{auditJson}</pre>
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
