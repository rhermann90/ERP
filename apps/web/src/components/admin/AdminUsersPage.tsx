import { useCallback, useEffect, useState } from "react";
import type { ApiClient, TenantUserRole, TenantUserRow } from "../../lib/api-client.js";
import { ApiError } from "../../lib/api-error.js";
import { ADMIN_USERS_HASH, EINSTELLUNGEN_HASH } from "../../lib/hash-route.js";

type Props = {
  api: ApiClient;
  showIntegrationHints?: boolean;
};

const ROLES: TenantUserRole[] = [
  "ADMIN",
  "BUCHHALTUNG",
  "GESCHAEFTSFUEHRUNG",
  "VERTRIEB_BAULEITUNG",
  "VIEWER",
];

/** Mandanten-Benutzer — nur serverseitig durch Rolle ADMIN geschützt. */
export function AdminUsersPage({ api, showIntegrationHints = false }: Props) {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<TenantUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<TenantUserRole>("VIEWER");

  const [patchUserId, setPatchUserId] = useState("");
  const [patchRole, setPatchRole] = useState<TenantUserRole | "">("");
  const [patchActive, setPatchActive] = useState<"" | "true" | "false">("");
  const [patchPassword, setPatchPassword] = useState("");
  const [patchReason, setPatchReason] = useState("Admin UI — Kontakt angepasst");

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.listTenantUsers({ page, pageSize: 25 });
      setUsers(r.data);
      setTotal(r.total);
    } catch (e) {
      setUsers([]);
      setError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
  }, [api, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const createUser = async () => {
    setBanner(null);
    setBusy(true);
    try {
      await api.createTenantUser({
        email: createEmail.trim(),
        password: createPassword,
        role: createRole,
        reason: "Admin UI — neuer Benutzer",
      });
      setCreatePassword("");
      setBanner("Benutzer angelegt.");
      await load();
    } catch (e) {
      setBanner(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
  };

  const patchUser = async () => {
    const id = patchUserId.trim();
    if (!id) return;
    setBanner(null);
    setBusy(true);
    try {
      const body: { reason: string; role?: TenantUserRole; active?: boolean; password?: string } = {
        reason: patchReason.trim() || "Admin UI — Änderung",
      };
      if (patchRole) body.role = patchRole;
      if (patchActive === "true") body.active = true;
      if (patchActive === "false") body.active = false;
      if (patchPassword.trim()) body.password = patchPassword.trim();
      if (!body.role && body.active === undefined && !body.password) {
        setBanner("Mindestens eines: Rolle, aktiv oder Passwort.");
        setBusy(false);
        return;
      }
      await api.patchTenantUser(id, body);
      setPatchPassword("");
      setBanner("Benutzer aktualisiert.");
      await load();
    } catch (e) {
      setBanner(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel domain-hub" data-testid="admin-users-page">
      <h2>Administration — Benutzer</h2>
      <p className="shell-sub">
        Nur Rolle <strong>ADMIN</strong> und Postgres-Backend. Fehler <code>403</code> oder <code>503</code> sind erwartbar in
        Demo-Umgebungen.
      </p>
      <p>
        <a href={EINSTELLUNGEN_HASH}>← Einstellungen</a>
      </p>

      {error ? (
        <p className="error-banner" role="alert">
          {error}
        </p>
      ) : null}
      {banner ? (
        <p className={banner.includes(":") ? "error-banner" : "success-banner"} role="status">
          {banner}
        </p>
      ) : null}

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Liste (Seite {page})</h3>
        <div className="actions-row">
          <button type="button" className="btn secondary" disabled={busy || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Zurück
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={busy || page * 25 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Weiter
          </button>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void load()} data-testid="admin-users-refresh">
            Aktualisieren
          </button>
        </div>
        <p className="hint">Treffer gesamt: {total}</p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {users.map((u) => (
            <li key={u.id} style={{ padding: "0.35rem 0", borderBottom: "1px solid var(--border-color, #44444444)" }}>
              <code>{u.email}</code> · {u.role} · {u.active ? "aktiv" : "inaktiv"} · <code>{u.id}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Benutzer anlegen</h3>
        <label className="field">
          <span>E-Mail</span>
          <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} data-testid="admin-create-email" />
        </label>
        <label className="field">
          <span>Passwort (min. 12 Zeichen)</span>
          <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} />
        </label>
        <label className="field">
          <span>Rolle</span>
          <select value={createRole} onChange={(e) => setCreateRole(e.target.value as TenantUserRole)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void createUser()} data-testid="admin-create-submit">
          Anlegen
        </button>
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Benutzer aktualisieren</h3>
        <label className="field">
          <span>userId (UUID)</span>
          <input type="text" value={patchUserId} onChange={(e) => setPatchUserId(e.target.value)} data-testid="admin-patch-id" />
        </label>
        <label className="field">
          <span>Rolle (optional)</span>
          <select value={patchRole} onChange={(e) => setPatchRole(e.target.value as TenantUserRole | "")}>
            <option value="">— unverändert</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Aktiv (optional)</span>
          <select value={patchActive} onChange={(e) => setPatchActive(e.target.value as "" | "true" | "false")}>
            <option value="">— unverändert</option>
            <option value="true">aktiv</option>
            <option value="false">inaktiv</option>
          </select>
        </label>
        <label className="field">
          <span>Neues Passwort (optional)</span>
          <input type="password" value={patchPassword} onChange={(e) => setPatchPassword(e.target.value)} />
        </label>
        <label className="field">
          <span>Grund (reason)</span>
          <textarea value={patchReason} onChange={(e) => setPatchReason(e.target.value)} />
        </label>
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void patchUser()} data-testid="admin-patch-submit">
          Speichern
        </button>
      </section>

      {showIntegrationHints ? (
        <p className="shell-sub" style={{ marginTop: "1rem" }}>
          Route: <code>{ADMIN_USERS_HASH}</code>
        </p>
      ) : null}
    </section>
  );
}
