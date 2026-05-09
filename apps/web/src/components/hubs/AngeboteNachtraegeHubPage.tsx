import {
  ANGEBOTE_NACHTRAEGE_HUB_HASH,
  DOCUMENT_WORKSPACE_HASH,
  GESCHAEFSPROZESS_HASH,
  OFFER_WORKSPACE_HASH,
} from "../../lib/hash-route.js";

type Props = {
  showIntegrationHints?: boolean;
};

export function AngeboteNachtraegeHubPage({ showIntegrationHints = false }: Props) {
  return (
    <section className="panel domain-hub" aria-labelledby="angebote-hub-heading" data-testid="hub-angebote">
      <h2 id="angebote-hub-heading">Angebote &amp; Nachträge</h2>
      <p className="shell-sub">
        Pilot-Wizard und Dokument-Shell für Angebotsversionen und Nachträge — Berechtigung weiterhin über den Server.
      </p>
      <div className="quick-role-grid home-dashboard-tile-grid">
        <a className="quick-role-tile" href={GESCHAEFSPROZESS_HASH} data-testid="hub-angebote-link-gp">
          <span className="quick-role-tile-title">Geschäftsprozess</span>
          <span className="quick-role-tile-sub">LV bis Rechnungsentwurf</span>
        </a>
        <a className="quick-role-tile" href={DOCUMENT_WORKSPACE_HASH} data-testid="hub-angebote-link-document">
          <span className="quick-role-tile-title">Dokument und Details</span>
          <span className="quick-role-tile-sub">OFFER_VERSION, Supplement, erlaubte Aktionen</span>
        </a>
        <a className="quick-role-tile" href={OFFER_WORKSPACE_HASH} data-testid="hub-angebote-link-workspace">
          <span className="quick-role-tile-title">Angebots-Arbeitsfläche</span>
          <span className="quick-role-tile-sub">Pilot: SoT für Angebot und Nachtrag</span>
        </a>
      </div>
      {showIntegrationHints ? (
        <p className="shell-sub" style={{ marginTop: "1rem" }}>
          Route: <code>{ANGEBOTE_NACHTRAEGE_HUB_HASH}</code>
        </p>
      ) : null}
    </section>
  );
}
