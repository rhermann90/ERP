import { useCallback, useEffect, useState } from "react";
import type {
  ApiClient,
  CrmConstructionSiteRow,
  CrmCustomerRow,
  CrmProjectContactRow,
  CrmProjectRow,
} from "../../../lib/api-client.js";
import { ApiError } from "../../../lib/api-error.js";
import { DEMO_SEED_IDS as SEED } from "../../../lib/demo-seed-ids.js";

const DEFAULT_PATCH_REASON = "Stammdaten-Hub Pilot-Projekt";

type Props = {
  api: ApiClient | null;
  hasSession: boolean;
  /** ADMIN / GESCHAEFTSFUEHRUNG / BUCHHALTUNG — gleiche Rollenmatrix wie FIN-1 Stammdaten-Pflege (Backend). */
  canWriteCrmStammdaten?: boolean;
};

export function StammdatenCrmReadPanels({ api, hasSession, canWriteCrmStammdaten = false }: Props) {
  const [sites, setSites] = useState<CrmConstructionSiteRow[] | null>(null);
  const [customers, setCustomers] = useState<CrmCustomerRow[] | null>(null);
  const [projects, setProjects] = useState<CrmProjectRow[] | null>(null);
  const [pilotProject, setPilotProject] = useState<CrmProjectRow | null>(null);
  const [contacts, setContacts] = useState<CrmProjectContactRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memoryOnly, setMemoryOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pilotLabelDraft, setPilotLabelDraft] = useState("");
  const [patchReason, setPatchReason] = useState(DEFAULT_PATCH_REASON);
  const [patchBusy, setPatchBusy] = useState(false);
  const [patchMessage, setPatchMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!api) return;
    setBusy(true);
    setError(null);
    setPatchMessage(null);
    try {
      const [s, cust, p] = await Promise.all([
        api.listCrmConstructionSites(),
        api.listCrmCustomers(),
        api.listCrmProjects(),
      ]);
      setSites(s.data);
      setCustomers(cust.data);
      setProjects(p.data);
      const pilot = p.data.find((x) => x.id === SEED.projectId) ?? null;
      setPilotProject(pilot);
      setPilotLabelDraft(pilot?.label ?? "");
      if (pilot) {
        const c = await api.listCrmProjectContacts(pilot.id);
        setContacts(c.data);
      } else {
        setContacts([]);
      }
    } catch (e) {
      if (e instanceof ApiError && e.envelope.code === "CRM_PERSISTENCE_UNAVAILABLE") {
        setSites([]);
        setCustomers([]);
        setProjects([]);
        setPilotProject(null);
        setContacts([]);
        setPilotLabelDraft("");
        setError(null);
        setMemoryOnly(true);
      } else {
        setSites(null);
        setCustomers(null);
        setProjects(null);
        setPilotProject(null);
        setContacts(null);
        setPilotLabelDraft("");
        setError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
        setMemoryOnly(false);
      }
    } finally {
      setBusy(false);
    }
  }, [api]);

  useEffect(() => {
    if (!hasSession || !api) {
      setSites(null);
      setCustomers(null);
      setProjects(null);
      setPilotProject(null);
      setContacts(null);
      setError(null);
      setMemoryOnly(false);
      setPilotLabelDraft("");
      setPatchMessage(null);
      return;
    }
    void load();
  }, [hasSession, api, load]);

  const submitPilotLabel = useCallback(async () => {
    if (!api || !pilotProject || memoryOnly) return;
    const reason = patchReason.trim();
    if (reason.length < 5) {
      setPatchMessage("Grund mindestens 5 Zeichen.");
      return;
    }
    const trimmed = pilotLabelDraft.trim();
    const label = trimmed.length === 0 ? null : trimmed;
    setPatchBusy(true);
    setPatchMessage(null);
    try {
      await api.patchCrmProject(pilotProject.id, { label, reason });
      setPatchMessage("Gespeichert.");
      await load();
    } catch (e) {
      setPatchMessage(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setPatchBusy(false);
    }
  }, [api, pilotProject, pilotLabelDraft, patchReason, memoryOnly, load]);

  if (!hasSession) {
    return null;
  }

  return (
    <section className="panel" style={{ marginTop: "1rem" }} aria-labelledby="stamm-crm-heading">
      <h3 id="stamm-crm-heading">CRM-Stamm</h3>
      <p className="shell-sub">
        Lesend: <code>GET /crm/construction-sites</code>, <code>GET /crm/customers</code>, <code>GET /crm/projects</code>,{" "}
        <code>GET /crm/projects/…/contacts</code>. Schreiben (berechtigte Rollen): <code>PATCH /crm/projects/…</code> usw.
        (ADR 0019, mandanten-isoliert; Berechtigung wie FIN-1 Stammdaten-Pflege am Server).
      </p>
      {memoryOnly ? (
        <p className="hint" data-testid="stamm-crm-memory-hint">
          CRM-Stammdaten-API ist im Demo-API-Modus ohne Postgres nicht aktiv — lokal mit <code>ERP_REPOSITORY=postgres</code>{" "}
          und Datenbank testen.
        </p>
      ) : null}
      {busy && !projects ? <p data-testid="stamm-crm-loading">Lade CRM-Stamm …</p> : null}
      {error ? (
        <p className="error-banner" role="alert" aria-live="polite" data-testid="stamm-crm-error">
          {error}
        </p>
      ) : null}
      {projects && sites && customers ? (
        <div data-testid="stamm-crm-panels">
          <h4 className="shell-sub" style={{ marginTop: "0.75rem" }}>
            Baustellen / Objekte
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table
              data-testid="stamm-crm-sites-table"
              style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    Bezeichnung
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    Ort
                  </th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s.id}>
                    <td style={{ padding: "0.35rem" }}>{s.label}</td>
                    <td style={{ padding: "0.35rem" }}>
                      {s.postalCode} {s.city}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="shell-sub" style={{ marginTop: "0.75rem" }}>
            CRM-Kunden
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table
              data-testid="stamm-crm-customers-table"
              style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    Firma
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    Ort
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: "0.35rem" }}>{c.legalName}</td>
                    <td style={{ padding: "0.35rem" }}>
                      {c.postalCode} {c.city}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="shell-sub" style={{ marginTop: "0.75rem" }}>
            Projekte
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table
              data-testid="stamm-crm-projects-table"
              style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    Projekt-ID
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    Label
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    CRM-Kunde
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    Baustelle
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: "0.35rem" }}>
                      <code>{p.id}</code>
                    </td>
                    <td style={{ padding: "0.35rem" }}>{p.label ?? "—"}</td>
                    <td style={{ padding: "0.35rem" }}>
                      <code>{p.primaryCustomerId}</code>
                    </td>
                    <td style={{ padding: "0.35rem" }}>
                      <code>{p.constructionSiteId}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="shell-sub" style={{ marginTop: "0.75rem" }}>
            Projektkontakte (Pilot-Projekt)
          </h4>
          {pilotProject && contacts ? (
            <div style={{ overflowX: "auto" }}>
              <table
                data-testid="stamm-crm-contacts-table"
                style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                      Name
                    </th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                      Rolle
                    </th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                      E-Mail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id}>
                      <td style={{ padding: "0.35rem" }}>{c.displayName}</td>
                      <td style={{ padding: "0.35rem" }}>{c.role}</td>
                      <td style={{ padding: "0.35rem" }}>{c.email ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="hint">Kein Pilot-Projekt in der CRM-Liste — Traceability prüfen.</p>
          )}

          {canWriteCrmStammdaten && !memoryOnly && pilotProject ? (
            <div data-testid="stamm-crm-pilot-patch" style={{ marginTop: "1rem", maxWidth: "32rem" }}>
              <h4 className="shell-sub">Pilot-Projekt-Bezeichnung (PATCH)</h4>
              <p className="shell-sub" style={{ fontSize: "0.85rem" }}>
                Nur sichtbar mit Schreibrolle wie Zahlungsbedingungen. Leeres Feld setzt das Label auf leer (null). Bei
                Fehlern zuerst „CRM-Stamm aktualisieren“, dann erneut speichern.
              </p>
              <label className="shell-sub" htmlFor="stamm-crm-pilot-label">
                Label
              </label>
              <input
                id="stamm-crm-pilot-label"
                type="text"
                value={pilotLabelDraft}
                onChange={(ev) => setPilotLabelDraft(ev.target.value)}
                disabled={patchBusy}
                style={{ width: "100%", marginTop: "0.25rem" }}
              />
              <label className="shell-sub" htmlFor="stamm-crm-patch-reason" style={{ display: "block", marginTop: "0.5rem" }}>
                Grund (Pflicht)
              </label>
              <textarea
                id="stamm-crm-patch-reason"
                rows={2}
                value={patchReason}
                onChange={(ev) => setPatchReason(ev.target.value)}
                disabled={patchBusy}
                style={{ width: "100%", marginTop: "0.25rem" }}
              />
              <button
                type="button"
                className="btn primary"
                style={{ marginTop: "0.5rem" }}
                onClick={() => void submitPilotLabel()}
                disabled={patchBusy}
                data-testid="stamm-crm-pilot-patch-submit"
              >
                Speichern
              </button>
              {patchMessage ? (
                <p className="hint" data-testid="stamm-crm-patch-message" style={{ marginTop: "0.35rem" }}>
                  {patchMessage}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {api ? (
        <button type="button" className="btn secondary" style={{ marginTop: "0.5rem" }} onClick={() => void load()} disabled={busy}>
          CRM-Stamm aktualisieren
        </button>
      ) : null}
    </section>
  );
}
