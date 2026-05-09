import {
  DOCUMENT_WORKSPACE_HASH,
  GESCHAEFSPROZESS_HASH,
  LV_AUFMASS_HUB_HASH,
  LV_BEARBEITEN_HASH,
  MEASUREMENT_PILOT_LIST_HASH,
} from "../../lib/hash-route.js";

type Props = {
  showIntegrationHints?: boolean;
};

export function LvAufmassHubPage({ showIntegrationHints = false }: Props) {
  return (
    <section className="panel domain-hub" aria-labelledby="lv-aufmass-hub-heading" data-testid="hub-lv-aufmass">
      <h2 id="lv-aufmass-hub-heading">LV &amp; Aufmaß</h2>
      <p className="shell-sub">
        Lesepfad LV §9, Pilot-Wizard und Shell für Messungen — Schreibaktionen nur über Backend-<code>allowedActions</code>.
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
      {showIntegrationHints ? (
        <p className="shell-sub" style={{ marginTop: "1rem" }}>
          Route: <code>{LV_AUFMASS_HUB_HASH}</code>
        </p>
      ) : null}
    </section>
  );
}
