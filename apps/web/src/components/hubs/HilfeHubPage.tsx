import { ERP_SECTION_18_1_GITHUB_HASH } from "../../lib/erp-doc-section-hashes.js";
import { HILFE_HASH, STAMMDATEN_HASH } from "../../lib/hash-route.js";
import { repoDocHref } from "../../lib/repo-doc-links.js";

type Props = {
  showIntegrationHints?: boolean;
};

export function HilfeHubPage({ showIntegrationHints = false }: Props) {
  const agents = repoDocHref("AGENTS.md");
  const mapping = repoDocHref("docs/contracts/ui-role-mapping-v1-3.md");
  const roadmap = repoDocHref("docs/plans/roadmap-fertige-app.md");
  const coverage = repoDocHref("docs/plans/pwa-backend-coverage-matrix.md");
  const erpSystembeschreibung = repoDocHref("docs/ERP-Systembeschreibung.md");
  const erpSection181Href = erpSystembeschreibung
    ? `${erpSystembeschreibung}#${ERP_SECTION_18_1_GITHUB_HASH}`
    : undefined;

  const Item = ({ href, label }: { href: string | undefined; label: string }) =>
    href ? (
      <li>
        <a href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      </li>
    ) : (
      <li>
        <span>{label}</span> — <code>VITE_REPO_DOCS_BASE</code> setzen für klickbare Links
      </li>
    );

  return (
    <section className="panel domain-hub" aria-labelledby="hilfe-hub-heading" data-testid="hub-hilfe">
      <h2 id="hilfe-hub-heading">Hilfe &amp; Diagnose</h2>
      <p className="shell-sub">
        Verweise auf Repo-Dokumentation. Keine Freigabe von Buchungen oder Mandantendaten durch diese Seite.
      </p>
      <ul className="domain-hub-list">
        <Item href={agents} label="AGENTS.md — Befehle und Einstieg" />
        <Item href={mapping} label="Rollen-Mapping v1.3 (UI)" />
        <Item href={roadmap} label="Roadmap fertige App" />
        <Item href={coverage} label="PWA ↔ Backend Coverage-Matrix" />
      </ul>
      <h3 id="hilfe-stammdaten-pilot-heading" style={{ marginTop: "1.25rem", marginBottom: "0.35rem", fontSize: "1.05rem" }}>
        Pilot: Stammdaten (W1)
      </h3>
      <p className="shell-sub" style={{ marginTop: 0 }}>
        Lesepfade XRechnung (FIN-5) und Zahlungsbedingungen (FIN-1) ohne vollständiges CRM-Stamm — siehe Matrix und PHASE-2-Backlog.
      </p>
      <ul className="domain-hub-list">
        <li>
          <a href={STAMMDATEN_HASH} data-testid="hilfe-link-stammdaten-pilot">
            Stammdaten-Hub öffnen
          </a>{" "}
          (<code>{STAMMDATEN_HASH}</code>)
        </li>
        <Item href={erpSection181Href} label="ERP-Systembeschreibung — Abschnitt 18.1 (Objekt, Projekt, Kontakte)" />
      </ul>
      {showIntegrationHints ? (
        <p className="shell-sub" style={{ marginTop: "1rem" }}>
          Route: <code>{HILFE_HASH}</code>
        </p>
      ) : null}
    </section>
  );
}
