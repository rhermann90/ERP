import { ADMIN_USERS_HASH, EINSTELLUNGEN_HASH, FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH } from "../../lib/hash-route.js";
import type { ApiUserRole } from "../../lib/token-payload.js";

type Props = {
  showIntegrationHints?: boolean;
  tokenRole?: ApiUserRole | null;
};

export function EinstellungenHubPage({ showIntegrationHints = false, tokenRole = null }: Props) {
  return (
    <section className="panel domain-hub" aria-labelledby="einstellungen-hub-heading" data-testid="hub-einstellungen">
      <h2 id="einstellungen-hub-heading">Einstellungen</h2>
      <p className="shell-sub">
        Mandantenweiter Expertenmodus der PWA und Sitzungsdaten werden auf der <strong>Startseite</strong> unter „Sitzung
        &amp; API“ verwaltet (nur für berechtigte Rollen sichtbar).
      </p>
      <ul className="domain-hub-list">
        <li>
          <a href="#/">Zur Startseite — Bereich „Sitzung &amp; API“</a>
        </li>
        <li>
          <a href={FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH}>Finanz — Grundeinstellungen Mahnlauf</a>
        </li>
        {tokenRole === "ADMIN" ? (
          <li>
            <a href={ADMIN_USERS_HASH} data-testid="hub-einstellungen-link-admin-users">
              Benutzerverwaltung (Admin)
            </a>
          </li>
        ) : null}
      </ul>
      {showIntegrationHints ? (
        <p className="shell-sub" style={{ marginTop: "1rem" }}>
          Route: <code>{EINSTELLUNGEN_HASH}</code>
        </p>
      ) : null}
    </section>
  );
}
