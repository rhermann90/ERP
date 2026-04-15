import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  offlineNote?: string;
};

export function AppShell({ children, offlineNote }: Props) {
  return (
    <div className="app-shell">
      <header className="shell-header">
        <div>
          <h1 className="shell-title">ERP · Web</h1>
          <p className="shell-sub">
            Oberfläche strikt an Backend-<code>allowedActions</code> gekoppelt. Schreibaktionen nur nach{" "}
            <code>GET /documents/:id/allowed-actions</code>.
          </p>
        </div>
        {offlineNote ? (
          <p className="shell-sub" style={{ textAlign: "right", maxWidth: "14rem" }}>
            {offlineNote}
          </p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
