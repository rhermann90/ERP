import {
  ANGEBOTE_NACHTRAEGE_HUB_HASH,
  DOCUMENT_WORKSPACE_HASH,
  FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH,
  FINANCE_PREP_HASH,
  FINANCE_WORKLIST_HASH,
  GESCHAEFSPROZESS_HASH,
  HILFE_HASH,
  LV_AUFMASS_HUB_HASH,
  LV_BEARBEITEN_HASH,
  MEASUREMENT_PILOT_LIST_HASH,
  OFFER_WORKSPACE_HASH,
  STAMMDATEN_HASH,
} from "../lib/hash-route.js";

type Props = {
  /** Integrationstext im Einleitungsabsatz und technische Unterzeile „Dokument und Details“ — wie RoleQuickNav. */
  showIntegrationHints?: boolean;
};

/**
 * Startseite nach Login: aufgabenorientierte Kacheln statt sofortiger Dokument-/Shell-Vollblick.
 */
export function HomeDashboard({ showIntegrationHints = false }: Props) {
  return (
    <section className="panel home-dashboard" aria-labelledby="home-dashboard-heading">
      <h2 id="home-dashboard-heading">Start</h2>
      {showIntegrationHints ? (
        <p className="shell-sub">
          Wählen Sie einen Bereich. Für Dokument-IDs, Lesepfade und Diagnose nutzen Sie{" "}
          <a href={DOCUMENT_WORKSPACE_HASH} data-testid="home-nav-document-workspace">
            Dokument und Details
          </a>{" "}
          oder die <a href={HILFE_HASH}>Hilfe</a>.
        </p>
      ) : (
        <p className="shell-sub">
          Wählen Sie einen Bereich — die linke Navigation führt zu allen Domänen-Hubs.
        </p>
      )}

      <h3 className="home-dashboard-domain-heading">Stammdaten</h3>
      <div className="quick-role-grid home-dashboard-tile-grid">
        <a className="quick-role-tile" href={STAMMDATEN_HASH} data-testid="home-tile-stammdaten-hub">
          <span className="quick-role-tile-title">Stammdaten</span>
          <span className="quick-role-tile-sub">Einstieg Projekt/Kunde (Roadmap)</span>
        </a>
      </div>

      <h3 className="home-dashboard-domain-heading">Finanz</h3>
      <div className="quick-role-grid home-dashboard-tile-grid">
        <a
          className="quick-role-tile"
          href={FINANCE_PREP_HASH}
          data-testid="home-tile-finance-prep"
        >
          <span className="quick-role-tile-title">Finanz-Vorbereitung</span>
          <span className="quick-role-tile-sub">Rechnung, Zahlung, Mahnwesen</span>
        </a>
        <a
          className="quick-role-tile"
          href={FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH}
          data-testid="home-tile-grundeinstellungen"
        >
          <span className="quick-role-tile-title">Grundeinstellungen Mahnlauf</span>
          <span className="quick-role-tile-sub">Automation und Batch-Einstellungen</span>
        </a>
        <a
          className="quick-role-tile"
          href={FINANCE_WORKLIST_HASH}
          data-testid="home-tile-finance-worklist"
        >
          <span className="quick-role-tile-title">Finanz-Arbeitsliste</span>
          <span className="quick-role-tile-sub">Offene Posten und Mahn-Kandidaten (FIN-4)</span>
        </a>
      </div>

      <h3 className="home-dashboard-domain-heading">LV &amp; Aufmaß</h3>
      <div className="quick-role-grid home-dashboard-tile-grid">
        <a className="quick-role-tile" href={LV_AUFMASS_HUB_HASH} data-testid="home-tile-lv-aufmass-hub">
          <span className="quick-role-tile-title">LV &amp; Aufmaß (Übersicht)</span>
          <span className="quick-role-tile-sub">Sprünge zu Pilot und Shell</span>
        </a>
        <a className="quick-role-tile" href={LV_BEARBEITEN_HASH} data-testid="home-tile-lv">
          <span className="quick-role-tile-title">LV lesen</span>
          <span className="quick-role-tile-sub">Pilot: LV §9 und Sprung zu Aktionen</span>
        </a>
        <a
          className="quick-role-tile"
          href={MEASUREMENT_PILOT_LIST_HASH}
          data-testid="home-tile-measurements-pilot"
        >
          <span className="quick-role-tile-title">Messungen (Pilot)</span>
          <span className="quick-role-tile-sub">Liste und Detail neben Wizard und Shell</span>
        </a>
        <a
          className="quick-role-tile"
          href={GESCHAEFSPROZESS_HASH}
          data-testid="home-tile-geschaeftsprozess"
        >
          <span className="quick-role-tile-title">Geschäftsprozess</span>
          <span className="quick-role-tile-sub">Pilot: LV bis Rechnungsentwurf</span>
        </a>
      </div>

      <h3 className="home-dashboard-domain-heading">Angebote &amp; Dokument</h3>
      <div className="quick-role-grid home-dashboard-tile-grid">
        <a
          className="quick-role-tile"
          href={ANGEBOTE_NACHTRAEGE_HUB_HASH}
          data-testid="home-tile-angebote-hub"
        >
          <span className="quick-role-tile-title">Angebote &amp; Nachträge</span>
          <span className="quick-role-tile-sub">Übersicht Wizard und Shell</span>
        </a>
        <a
          className="quick-role-tile"
          href={OFFER_WORKSPACE_HASH}
          data-testid="home-tile-offer-workspace"
        >
          <span className="quick-role-tile-title">Angebots-Arbeitsfläche</span>
          <span className="quick-role-tile-sub">Pilot: SoT für Angebot und Nachtrag</span>
        </a>
        <a
          className="quick-role-tile"
          href={DOCUMENT_WORKSPACE_HASH}
          data-testid="home-tile-document-workspace"
        >
          <span className="quick-role-tile-title">Dokument und Details</span>
          <span className="quick-role-tile-sub">
            {showIntegrationHints
              ? "Erweitert: UUIDs, Lesepfade, Konfiguration"
              : "Erweiterte Ansicht und Detailpfade"}
          </span>
        </a>
      </div>
    </section>
  );
}
