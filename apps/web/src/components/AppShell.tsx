import { useId, useState, type ReactNode } from "react";
import { ThemePreferenceControl } from "./ThemePreferenceControl.js";

type Props = {
  children: ReactNode;
  offlineNote?: string;
  /** Hauptnavigation (Hash-Links); auf schmalen Viewports oben, ab 880px linke Rail. */
  nav?: ReactNode;
};

export function AppShell({ children, offlineNote, nav }: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const helpPanelId = useId();

  return (
    <div className="app-shell">
      <header className="shell-header">
        <div className="shell-header-text">
          <h1 className="shell-title">ERP · Web</h1>
          <p className="shell-sub">
            Dev-Oberfläche für Mandanten-APIs: Dokumente, Finanz-Vorbereitung. Schreibaktionen nur, wenn das Backend die Aktion in{" "}
            <code>allowedActions</code> freigibt.
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
