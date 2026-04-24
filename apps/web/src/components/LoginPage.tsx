import { useState } from "react";
import { ApiError } from "../lib/api-error.js";
import { loginWithPassword, type LoginResponse } from "../lib/api-client.js";

type Props = {
  apiBase: string;
  defaultTenantId?: string;
  onSuccess: (r: LoginResponse) => void;
  onNavigateHome: () => void;
};

export function LoginPage({ apiBase, defaultTenantId, onSuccess, onNavigateHome }: Props) {
  const [tenantId, setTenantId] = useState(defaultTenantId ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; code?: string; correlationId?: string } | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await loginWithPassword(apiBase, { tenantId, email, password });
      onSuccess(r);
    } catch (e) {
      if (e instanceof ApiError) {
        setError({
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else {
        setError({ text: e instanceof Error ? e.message : String(e) });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" style={{ maxWidth: "28rem" }}>
      <h2>Anmeldung</h2>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
        Passwort-Login gemäß Backend (<code>POST /auth/login</code>). Nach erfolgreicher Anmeldung wird die Session im{" "}
        <strong>sessionStorage</strong> abgelegt (Tab-Lebensdauer).
      </p>
      {error ? (
        <div className="error-banner" role="alert">
          <strong>{error.code ? `${error.code}: ` : ""}</strong>
          {error.text}
          {error.correlationId ? (
            <>
              {" "}
              <code>correlationId={error.correlationId}</code>
            </>
          ) : null}
        </div>
      ) : null}
      <div className="field-grid">
        {defaultTenantId ? null : (
          <label className="field">
            <span>Mandanten-ID (UUID)</span>
            <input type="text" value={tenantId} onChange={(e) => setTenantId(e.target.value)} autoComplete="off" />
          </label>
        )}
        <label className="field">
          <span>E-Mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="field">
          <span>Passwort</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
      </div>
      <div className="actions-row" style={{ marginTop: "1rem" }}>
        <button type="button" className="btn" disabled={busy} onClick={() => void submit()}>
          Anmelden
        </button>
        <button type="button" className="btn secondary" disabled={busy} onClick={onNavigateHome}>
          Abbrechen
        </button>
      </div>
      <p style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
        <a href="#/password-reset">Passwort vergessen?</a>
      </p>
    </section>
  );
}
