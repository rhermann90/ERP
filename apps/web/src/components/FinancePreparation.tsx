import { FINANCE_PREP_HASH } from "../lib/hash-route.js";
import { repoDocHref } from "../lib/repo-doc-links.js";

const DOC_LINKS: { label: string; repoPath: string }[] = [
  {
    label: "ADR 0007 — Finance-Persistenz und Rechnungsgrenzen",
    repoPath: "docs/adr/0007-finance-persistence-and-invoice-boundaries.md",
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

/**
 * Read-only Hinweisseite: keine Buchungs-, Zahlungs- oder Mahn-UI;
 * keine Schreibaktionen (SoT bleibt GET allowed-actions auf der Shell-Seite).
 */
export function FinancePreparation() {
  return (
    <section className="panel finance-prep" aria-labelledby="finance-prep-heading">
      <h2 id="finance-prep-heading">Finanz (Vorbereitung)</h2>
      <p
        id="finance-prep-intro"
        style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: 0 }}
      >
        FIN-0: Orientierung und Verträge — <strong>kein</strong> produktives FIN-2 (Rechnungsbuchung, 8.4-Motor) vor Freigabe
        G1–G10. Diese Seite verlinkt nur Doku; Schreibpfade in der App weiter ausschließlich über{" "}
        <code>GET /documents/:id/allowed-actions</code>.
      </p>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        <a href="#/">Zurück zur Shell (Start)</a>
        {" · "}
        <span style={{ color: "var(--text-secondary)" }}>diese Seite: </span>
        <code>{FINANCE_PREP_HASH}</code>
      </p>
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
