import { useEffect, useState } from "react";
import { ApiError } from "../lib/api-error.js";
import { confirmPasswordReset, requestPasswordReset } from "../lib/api-client.js";
import { readHashQuery } from "../lib/hash-route.js";

type Props = {
  apiBase: string;
  defaultTenantId?: string;
};

export function PasswordResetPage({ apiBase, defaultTenantId }: Props) {
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [tenantId, setTenantId] = useState(defaultTenantId ?? "");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; code?: string; correlationId?: string } | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const q = readHashQuery();
    const t = q.get("token")?.trim();
    if (t) {
      setToken(t);
      setStep("confirm");
    }
  }, []);

  const sendRequest = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const r = await requestPasswordReset(apiBase, { tenantId, email });
      setInfo(r.message);
    } catch (e) {
      if (e instanceof ApiError) {
        setError({
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else {
        const raw = e instanceof Error ? e.message : String(e);
        const network =
          e instanceof TypeError ||
          raw === "Failed to fetch" ||
          raw === "NetworkError when attempting to fetch resource." ||
          raw === "Load failed";
        setError({
          text: network
            ? "Netzwerk: API nicht erreichbar oder CORS blockiert. Backend (Port 3000) starten; Root-.env: CORS_ORIGINS exakt wie PWA-Adresse (z. B. http://localhost:5173). Siehe apps/web/README.md „Lokal gegen Backend“."
            : raw,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const sendConfirm = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await confirmPasswordReset(apiBase, { token, password });
      setInfo("Passwort wurde geändert. Sie können sich anmelden.");
      setTimeout(() => {
        window.location.hash = "#/login";
      }, 1500);
    } catch (e) {
      if (e instanceof ApiError) {
        setError({
          text: e.envelope.message,
          code: e.envelope.code,
          correlationId: e.envelope.correlationId,
        });
      } else {
        const raw = e instanceof Error ? e.message : String(e);
        const network =
          e instanceof TypeError ||
          raw === "Failed to fetch" ||
          raw === "NetworkError when attempting to fetch resource." ||
          raw === "Load failed";
        setError({
          text: network
            ? "Netzwerk: API nicht erreichbar oder CORS blockiert. Backend (Port 3000) starten; Root-.env: CORS_ORIGINS exakt wie PWA-Adresse (z. B. http://localhost:5173). Siehe apps/web/README.md „Lokal gegen Backend“."
            : raw,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" style={{ maxWidth: "28rem" }}>
      <h2>Passwort zurücksetzen</h2>
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
      {info ? (
        <div className="success-banner">
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{info}</pre>
        </div>
      ) : null}

      {step === "request" ? (
        <>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
            Link wird per E-Mail versendet, wenn SMTP und Datenbank konfiguriert sind.
          </p>
          <div className="field-grid">
            {defaultTenantId ? null : (
              <label className="field">
                <span>Mandanten-ID</span>
                <input type="text" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
              </label>
            )}
            <label className="field">
              <span>E-Mail</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
          <div className="actions-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="btn" disabled={busy} onClick={() => void sendRequest()}>
              Link anfordern
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
            Neues Passwort setzen (mindestens 12 Zeichen).
          </p>
          <div className="field-grid">
            <label className="field">
              <span>Token (aus E-Mail-Link)</span>
              <input type="text" value={token} onChange={(e) => setToken(e.target.value)} />
            </label>
            <label className="field">
              <span>Neues Passwort</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
          </div>
          <div className="actions-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="btn" disabled={busy} onClick={() => void sendConfirm()}>
              Passwort speichern
            </button>
          </div>
        </>
      )}

      <p style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
        <a href="#/login">Zur Anmeldung</a>
        {" · "}
        <a href="#/">Zur Shell</a>
      </p>
    </section>
  );
}
