import { useId, useState, type ReactNode } from "react";
import { ThemePreferenceControl } from "./ThemePreferenceControl.js";

type Props = {
  children: ReactNode;
  offlineNote?: string;
  /** Hauptnavigation (Hash-Links); auf schmalen Viewports oben, ab 880px linke Rail. */
  nav?: ReactNode;
  /**
   * true: Integrations-Titel und ausklappbarer Hinweis zu allowed-actions.
   * false: kurze produktfreundliche Beschreibung (Standard ohne Expertenmodus).
   */
  integrationChrome?: boolean;
};

export function AppShell({ children, offlineNote, nav, integrationChrome = false }: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const helpPanelId = useId();

  return (
    <div className="app-shell">
      <header className="shell-header">
        <div className="shell-header-text">
          <h1 className="shell-title">ERP · Web</h1>
          {integrationChrome ? (
            <>
              <p className="shell-sub">
                Integrationsansicht für Mandanten-APIs: Dokumente, Lesepfade und Finanz-Vorbereitung. Schreibaktionen nur, wenn das Backend die
                Aktion in <code>allowedActions</code> freigibt.
              </p>
              <button
                type="button"
                className="shell-help"
                aria-expanded={helpOpen}
                aria-controls={helpOpen ? helpPanelId : undefined}
                onClick={() => setHelpOpen((o) => !o)}
              >
                {helpOpen ? "Technischen Hinweis ausblenden" : "Technischer Hinweis (allowed-actions)"}
              </button>
              {helpOpen ? (
                <div id={helpPanelId} className="shell-help-panel" role="region" aria-label="Technischer Hinweis">
                  Oberfläche strikt an Backend-<code>allowedActions</code> gekoppelt. Schreibaktionen nur nach{" "}
                  <code>GET /documents/:id/allowed-actions</code> mit passender Entität und Rolle — keine parallele Berechtigungslogik in der UI.
                </div>
              ) : null}
            </>
          ) : (
            <p className="shell-sub">
              Mandantenoberfläche für Finanz, LV und Angebote. Änderungen und Buchungen nur, wenn Ihre Rolle und der Server die jeweilige Aktion
              freigeben — ohne parallele Sonderlogik in dieser App.
            </p>
          )}
        </div>
        <div className="shell-header-aside">
          <ThemePreferenceControl />
          {offlineNote ? (
            <p className="shell-sub shell-offline-note" style={{ textAlign: "right", maxWidth: "14rem", margin: 0 }}>
              {offlineNote}
            </p>
          ) : null}
        </div>
      </header>
      <div className={nav ? "app-shell-body" : "app-shell-body app-shell-body--single"}>
        {nav}
        <div className="shell-main">{children}</div>
      </div>
    </div>
  );
}
