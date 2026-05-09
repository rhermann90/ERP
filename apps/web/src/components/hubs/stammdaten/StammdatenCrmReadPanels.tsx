import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ApiClient,
  CrmConstructionSiteRow,
  CrmCustomerRow,
  CrmProjectContactRow,
  CrmProjectRow,
} from "../../../lib/api-client.js";
import { ApiError } from "../../../lib/api-error.js";
import { DEMO_SEED_IDS as SEED } from "../../../lib/demo-seed-ids.js";

const DEFAULT_PATCH_REASON = "Stammdaten-Hub CRM-Pflege";

function formatWriteError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.envelope.code === "CRM_STALE_VERSION") {
      return "Datensatz wurde zwischenzeitlich geändert — bitte „CRM-Stamm aktualisieren“ und erneut speichern.";
    }
    return `${e.envelope.code}: ${e.envelope.message}`;
  }
  return String(e);
}

type Props = {
  api: ApiClient | null;
  hasSession: boolean;
  canWriteCrmStammdaten?: boolean;
};

export function StammdatenCrmReadPanels({ api, hasSession, canWriteCrmStammdaten = false }: Props) {
  const [sites, setSites] = useState<CrmConstructionSiteRow[] | null>(null);
  const [customers, setCustomers] = useState<CrmCustomerRow[] | null>(null);
  const [projects, setProjects] = useState<CrmProjectRow[] | null>(null);
  const [contactsByProject, setContactsByProject] = useState<Record<string, CrmProjectContactRow[]>>({});
  const [contactsProjectId, setContactsProjectId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [memoryOnly, setMemoryOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [writeReason, setWriteReason] = useState(DEFAULT_PATCH_REASON);
  const [writeBusy, setWriteBusy] = useState(false);
  const [writeMessage, setWriteMessage] = useState<string | null>(null);

  const [newSiteOpen, setNewSiteOpen] = useState(false);
  const [newSiteLabel, setNewSiteLabel] = useState("");
  const [newSitePostal, setNewSitePostal] = useState("");
  const [newSiteCity, setNewSiteCity] = useState("");

  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomerLegal, setNewCustomerLegal] = useState("");
  const [newCustomerPostal, setNewCustomerPostal] = useState("");
  const [newCustomerCity, setNewCustomerCity] = useState("");

  const [editSiteId, setEditSiteId] = useState<string | null>(null);
  const [editSiteLabel, setEditSiteLabel] = useState("");
  const [editSitePostal, setEditSitePostal] = useState("");
  const [editSiteCity, setEditSiteCity] = useState("");
  const [editSiteVersion, setEditSiteVersion] = useState(1);

  const [editCustomerId, setEditCustomerId] = useState<string | null>(null);
  const [editCustomerLegal, setEditCustomerLegal] = useState("");
  const [editCustomerPostal, setEditCustomerPostal] = useState("");
  const [editCustomerCity, setEditCustomerCity] = useState("");
  const [editCustomerVersion, setEditCustomerVersion] = useState(1);

  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [editProjectLabel, setEditProjectLabel] = useState("");
  const [editProjectStatus, setEditProjectStatus] = useState("");
  const [editProjectCustomerId, setEditProjectCustomerId] = useState("");
  const [editProjectSiteId, setEditProjectSiteId] = useState("");
  const [editProjectVersion, setEditProjectVersion] = useState(1);

  const [newContactOpen, setNewContactOpen] = useState(false);
  const [newContactRole, setNewContactRole] = useState("ANSPRECHPARTNER");
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  const [editContactId, setEditContactId] = useState<string | null>(null);
  const [editContactRole, setEditContactRole] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editContactVersion, setEditContactVersion] = useState(1);

  const pilotProject = useMemo(
    () => (projects ? projects.find((x) => x.id === SEED.projectId) ?? null : null),
    [projects],
  );

  const loadContactsFor = useCallback(
    async (projectId: string) => {
      if (!api || !projectId) return;
      const c = await api.listCrmProjectContacts(projectId);
      setContactsByProject((prev) => ({ ...prev, [projectId]: c.data }));
    },
    [api],
  );

  const load = useCallback(async () => {
    if (!api) return;
    setBusy(true);
    setError(null);
    setWriteMessage(null);
    try {
      const [s, cust, p] = await Promise.all([
        api.listCrmConstructionSites(),
        api.listCrmCustomers(),
        api.listCrmProjects(),
      ]);
      setSites(s.data);
      setCustomers(cust.data);
      setProjects(p.data);
      const defaultPid = p.data.find((x) => x.id === SEED.projectId)?.id ?? p.data[0]?.id ?? "";
      setContactsProjectId(defaultPid);
      if (defaultPid) {
        const c = await api.listCrmProjectContacts(defaultPid);
        setContactsByProject({ [defaultPid]: c.data });
      } else {
        setContactsByProject({});
      }
    } catch (e) {
      if (e instanceof ApiError && e.envelope.code === "CRM_PERSISTENCE_UNAVAILABLE") {
        setSites([]);
        setCustomers([]);
        setProjects([]);
        setContactsByProject({});
        setContactsProjectId("");
        setError(null);
        setMemoryOnly(true);
      } else {
        setSites(null);
        setCustomers(null);
        setProjects(null);
        setContactsByProject({});
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
      setContactsByProject({});
      setContactsProjectId("");
      setError(null);
      setMemoryOnly(false);
      setWriteMessage(null);
      setEditSiteId(null);
      setEditCustomerId(null);
      setEditProjectId(null);
      setEditContactId(null);
      return;
    }
    void load();
  }, [hasSession, api, load]);

  useEffect(() => {
    if (!api || !contactsProjectId || memoryOnly) return;
    void loadContactsFor(contactsProjectId);
  }, [api, contactsProjectId, memoryOnly, loadContactsFor]);

  const reasonOk = writeReason.trim().length >= 5;

  const submitNewSite = useCallback(async () => {
    if (!api || memoryOnly || !reasonOk) return;
    const label = newSiteLabel.trim();
    if (!label) {
      setWriteMessage("Bezeichnung der Baustelle ist Pflicht.");
      return;
    }
    setWriteBusy(true);
    setWriteMessage(null);
    try {
      await api.postCrmConstructionSite({
        label,
        reason: writeReason.trim(),
        postalCode: newSitePostal.trim() || null,
        city: newSiteCity.trim() || null,
      });
      setNewSiteOpen(false);
      setNewSiteLabel("");
      setNewSitePostal("");
      setNewSiteCity("");
      setWriteMessage("Baustelle angelegt.");
      await load();
    } catch (e) {
      setWriteMessage(formatWriteError(e));
    } finally {
      setWriteBusy(false);
    }
  }, [api, memoryOnly, reasonOk, newSiteLabel, newSitePostal, newSiteCity, writeReason, load]);

  const submitNewCustomer = useCallback(async () => {
    if (!api || memoryOnly || !reasonOk) return;
    const legal = newCustomerLegal.trim();
    if (!legal) {
      setWriteMessage("Firmenname ist Pflicht.");
      return;
    }
    setWriteBusy(true);
    setWriteMessage(null);
    try {
      await api.postCrmCustomer({
        legalName: legal,
        reason: writeReason.trim(),
        postalCode: newCustomerPostal.trim() || null,
        city: newCustomerCity.trim() || null,
      });
      setNewCustomerOpen(false);
      setNewCustomerLegal("");
      setNewCustomerPostal("");
      setNewCustomerCity("");
      setWriteMessage("CRM-Kunde angelegt.");
      await load();
    } catch (e) {
      setWriteMessage(formatWriteError(e));
    } finally {
      setWriteBusy(false);
    }
  }, [api, memoryOnly, reasonOk, newCustomerLegal, newCustomerPostal, newCustomerCity, writeReason, load]);

  const submitSitePatch = useCallback(async () => {
    if (!api || !editSiteId || memoryOnly || !reasonOk) return;
    const label = editSiteLabel.trim();
    if (!label) {
      setWriteMessage("Bezeichnung darf nicht leer sein.");
      return;
    }
    setWriteBusy(true);
    setWriteMessage(null);
    try {
      await api.patchCrmConstructionSite(editSiteId, {
        reason: writeReason.trim(),
        versionNumber: editSiteVersion,
        label,
        postalCode: editSitePostal.trim() || null,
        city: editSiteCity.trim() || null,
      });
      setEditSiteId(null);
      setWriteMessage("Baustelle gespeichert.");
      await load();
    } catch (e) {
      setWriteMessage(formatWriteError(e));
    } finally {
      setWriteBusy(false);
    }
  }, [api, editSiteId, memoryOnly, reasonOk, editSiteLabel, editSitePostal, editSiteCity, editSiteVersion, writeReason, load]);

  const submitCustomerPatch = useCallback(async () => {
    if (!api || !editCustomerId || memoryOnly || !reasonOk) return;
    const legal = editCustomerLegal.trim();
    if (!legal) {
      setWriteMessage("Firmenname darf nicht leer sein.");
      return;
    }
    setWriteBusy(true);
    setWriteMessage(null);
    try {
      await api.patchCrmCustomer(editCustomerId, {
        reason: writeReason.trim(),
        versionNumber: editCustomerVersion,
        legalName: legal,
        postalCode: editCustomerPostal.trim() || null,
        city: editCustomerCity.trim() || null,
      });
      setEditCustomerId(null);
      setWriteMessage("CRM-Kunde gespeichert.");
      await load();
    } catch (e) {
      setWriteMessage(formatWriteError(e));
    } finally {
      setWriteBusy(false);
    }
  }, [
    api,
    editCustomerId,
    memoryOnly,
    reasonOk,
    editCustomerLegal,
    editCustomerPostal,
    editCustomerCity,
    editCustomerVersion,
    writeReason,
    load,
  ]);

  const submitProjectPatch = useCallback(async () => {
    if (!api || !editProjectId || memoryOnly || !reasonOk) return;
    const trimmed = editProjectLabel.trim();
    const label = trimmed.length === 0 ? null : trimmed;
    setWriteBusy(true);
    setWriteMessage(null);
    try {
      await api.patchCrmProject(editProjectId, {
        reason: writeReason.trim(),
        versionNumber: editProjectVersion,
        label,
        status: editProjectStatus.trim() || undefined,
        primaryCustomerId: editProjectCustomerId || undefined,
        constructionSiteId: editProjectSiteId || undefined,
      });
      setEditProjectId(null);
      setWriteMessage("Projekt gespeichert.");
      await load();
    } catch (e) {
      setWriteMessage(formatWriteError(e));
    } finally {
      setWriteBusy(false);
    }
  }, [
    api,
    editProjectId,
    memoryOnly,
    reasonOk,
    editProjectLabel,
    editProjectStatus,
    editProjectCustomerId,
    editProjectSiteId,
    editProjectVersion,
    writeReason,
    load,
  ]);

  const submitNewContact = useCallback(async () => {
    if (!api || !contactsProjectId || memoryOnly || !reasonOk) return;
    const name = newContactName.trim();
    if (!name) {
      setWriteMessage("Anzeigename Kontakt ist Pflicht.");
      return;
    }
    setWriteBusy(true);
    setWriteMessage(null);
    try {
      await api.postCrmProjectContact({
        projectId: contactsProjectId,
        reason: writeReason.trim(),
        role: newContactRole.trim() || "KONTAKT",
        displayName: name,
        email: newContactEmail.trim() || null,
        phone: newContactPhone.trim() || null,
      });
      setNewContactOpen(false);
      setNewContactName("");
      setNewContactEmail("");
      setNewContactPhone("");
      setWriteMessage("Projektkontakt angelegt.");
      await loadContactsFor(contactsProjectId);
      await load();
    } catch (e) {
      setWriteMessage(formatWriteError(e));
    } finally {
      setWriteBusy(false);
    }
  }, [
    api,
    contactsProjectId,
    memoryOnly,
    reasonOk,
    newContactRole,
    newContactName,
    newContactEmail,
    newContactPhone,
    writeReason,
    loadContactsFor,
    load,
  ]);

  const submitContactPatch = useCallback(async () => {
    if (!api || !editContactId || memoryOnly || !reasonOk) return;
    const name = editContactName.trim();
    if (!name) {
      setWriteMessage("Anzeigename darf nicht leer sein.");
      return;
    }
    setWriteBusy(true);
    setWriteMessage(null);
    try {
      await api.patchCrmProjectContact(editContactId, {
        reason: writeReason.trim(),
        versionNumber: editContactVersion,
        role: editContactRole.trim() || undefined,
        displayName: name,
        email: editContactEmail.trim() || null,
        phone: editContactPhone.trim() || null,
      });
      setEditContactId(null);
      setWriteMessage("Projektkontakt gespeichert.");
      if (contactsProjectId) await loadContactsFor(contactsProjectId);
      await load();
    } catch (e) {
      setWriteMessage(formatWriteError(e));
    } finally {
      setWriteBusy(false);
    }
  }, [
    api,
    editContactId,
    memoryOnly,
    reasonOk,
    editContactRole,
    editContactName,
    editContactEmail,
    editContactPhone,
    editContactVersion,
    writeReason,
    contactsProjectId,
    loadContactsFor,
    load,
  ]);

  if (!hasSession) {
    return null;
  }

  const contacts = contactsProjectId ? contactsByProject[contactsProjectId] ?? null : null;

  return (
    <section className="panel" style={{ marginTop: "1rem" }} aria-labelledby="stamm-crm-heading">
      <h3 id="stamm-crm-heading">CRM-Stamm</h3>
      <p className="shell-sub">
        Lesend: <code>GET /crm/…</code>. Schreiben (berechtigte Rollen): <code>POST|PATCH /crm/…</code> mit{" "}
        <strong>Grund</strong> und <strong>versionNumber</strong> bei PATCH (ADR 0019; Optimistic Locking).
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
          <div style={{ marginTop: "0.75rem", maxWidth: "40rem" }}>
            <label className="shell-sub" htmlFor="stamm-crm-global-reason">
              Grund für alle Schreibvorgänge (mindestens 5 Zeichen)
            </label>
            <textarea
              id="stamm-crm-global-reason"
              rows={2}
              value={writeReason}
              onChange={(ev) => setWriteReason(ev.target.value)}
              disabled={writeBusy || memoryOnly || !canWriteCrmStammdaten}
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </div>

          <h4 className="shell-sub" style={{ marginTop: "0.75rem" }}>
            Baustellen / Objekte
          </h4>
          {canWriteCrmStammdaten && !memoryOnly ? (
            <div style={{ marginBottom: "0.5rem" }}>
              <button type="button" className="btn secondary" onClick={() => setNewSiteOpen((v) => !v)} disabled={writeBusy}>
                {newSiteOpen ? "Abbrechen" : "Neue Baustelle"}
              </button>
              {newSiteOpen ? (
                <div data-testid="stamm-crm-new-site" style={{ marginTop: "0.5rem", padding: "0.5rem", border: "1px solid var(--border-color, #44444444)" }}>
                  <label className="shell-sub" htmlFor="new-site-label">
                    Bezeichnung
                  </label>
                  <input id="new-site-label" value={newSiteLabel} onChange={(e) => setNewSiteLabel(e.target.value)} style={{ width: "100%" }} />
                  <label className="shell-sub" htmlFor="new-site-plz" style={{ display: "block", marginTop: "0.35rem" }}>
                    PLZ / Ort
                  </label>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <input id="new-site-plz" value={newSitePostal} onChange={(e) => setNewSitePostal(e.target.value)} style={{ flex: 1 }} />
                    <input value={newSiteCity} onChange={(e) => setNewSiteCity(e.target.value)} style={{ flex: 2 }} />
                  </div>
                  <button type="button" className="btn primary" style={{ marginTop: "0.5rem" }} disabled={writeBusy || !reasonOk} onClick={() => void submitNewSite()}>
                    Baustelle anlegen
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
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
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    V.
                  </th>
                  {canWriteCrmStammdaten && !memoryOnly ? (
                    <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                      Aktion
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s.id}>
                    <td style={{ padding: "0.35rem" }}>{s.label}</td>
                    <td style={{ padding: "0.35rem" }}>
                      {s.postalCode} {s.city}
                    </td>
                    <td style={{ padding: "0.35rem" }}>{s.versionNumber}</td>
                    {canWriteCrmStammdaten && !memoryOnly ? (
                      <td style={{ padding: "0.35rem" }}>
                        <button
                          type="button"
                          className="btn secondary"
                          disabled={writeBusy}
                          onClick={() => {
                            setEditSiteId(s.id);
                            setEditSiteLabel(s.label);
                            setEditSitePostal(s.postalCode ?? "");
                            setEditSiteCity(s.city ?? "");
                            setEditSiteVersion(s.versionNumber);
                          }}
                        >
                          Bearbeiten
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editSiteId && canWriteCrmStammdaten && !memoryOnly ? (
            <div data-testid="stamm-crm-edit-site" style={{ marginTop: "0.5rem", padding: "0.5rem", border: "1px solid var(--border-color, #44444444)" }}>
              <p className="shell-sub">Baustelle bearbeiten (version {editSiteVersion})</p>
              <label className="shell-sub" htmlFor="edit-site-label">
                Bezeichnung
              </label>
              <input id="edit-site-label" value={editSiteLabel} onChange={(e) => setEditSiteLabel(e.target.value)} style={{ width: "100%" }} />
              <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.35rem" }}>
                <input value={editSitePostal} onChange={(e) => setEditSitePostal(e.target.value)} placeholder="PLZ" style={{ flex: 1 }} />
                <input value={editSiteCity} onChange={(e) => setEditSiteCity(e.target.value)} placeholder="Ort" style={{ flex: 2 }} />
              </div>
              <button type="button" className="btn primary" style={{ marginTop: "0.5rem" }} disabled={writeBusy || !reasonOk} onClick={() => void submitSitePatch()}>
                Speichern
              </button>
              <button type="button" className="btn secondary" style={{ marginLeft: "0.35rem" }} disabled={writeBusy} onClick={() => setEditSiteId(null)}>
                Abbrechen
              </button>
            </div>
          ) : null}

          <h4 className="shell-sub" style={{ marginTop: "0.75rem" }}>
            CRM-Kunden
          </h4>
          {canWriteCrmStammdaten && !memoryOnly ? (
            <div style={{ marginBottom: "0.5rem" }}>
              <button type="button" className="btn secondary" onClick={() => setNewCustomerOpen((v) => !v)} disabled={writeBusy}>
                {newCustomerOpen ? "Abbrechen" : "Neuer CRM-Kunde"}
              </button>
              {newCustomerOpen ? (
                <div data-testid="stamm-crm-new-customer" style={{ marginTop: "0.5rem", padding: "0.5rem", border: "1px solid var(--border-color, #44444444)" }}>
                  <label className="shell-sub" htmlFor="new-cust-legal">
                    Firma
                  </label>
                  <input id="new-cust-legal" value={newCustomerLegal} onChange={(e) => setNewCustomerLegal(e.target.value)} style={{ width: "100%" }} />
                  <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.35rem" }}>
                    <input value={newCustomerPostal} onChange={(e) => setNewCustomerPostal(e.target.value)} placeholder="PLZ" style={{ flex: 1 }} />
                    <input value={newCustomerCity} onChange={(e) => setNewCustomerCity(e.target.value)} placeholder="Ort" style={{ flex: 2 }} />
                  </div>
                  <button type="button" className="btn primary" style={{ marginTop: "0.5rem" }} disabled={writeBusy || !reasonOk} onClick={() => void submitNewCustomer()}>
                    Kunde anlegen
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
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
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    V.
                  </th>
                  {canWriteCrmStammdaten && !memoryOnly ? (
                    <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                      Aktion
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: "0.35rem" }}>{c.legalName}</td>
                    <td style={{ padding: "0.35rem" }}>
                      {c.postalCode} {c.city}
                    </td>
                    <td style={{ padding: "0.35rem" }}>{c.versionNumber}</td>
                    {canWriteCrmStammdaten && !memoryOnly ? (
                      <td style={{ padding: "0.35rem" }}>
                        <button
                          type="button"
                          className="btn secondary"
                          disabled={writeBusy}
                          onClick={() => {
                            setEditCustomerId(c.id);
                            setEditCustomerLegal(c.legalName);
                            setEditCustomerPostal(c.postalCode ?? "");
                            setEditCustomerCity(c.city ?? "");
                            setEditCustomerVersion(c.versionNumber);
                          }}
                        >
                          Bearbeiten
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editCustomerId && canWriteCrmStammdaten && !memoryOnly ? (
            <div data-testid="stamm-crm-edit-customer" style={{ marginTop: "0.5rem", padding: "0.5rem", border: "1px solid var(--border-color, #44444444)" }}>
              <p className="shell-sub">CRM-Kunde bearbeiten (version {editCustomerVersion})</p>
              <input value={editCustomerLegal} onChange={(e) => setEditCustomerLegal(e.target.value)} style={{ width: "100%" }} />
              <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.35rem" }}>
                <input value={editCustomerPostal} onChange={(e) => setEditCustomerPostal(e.target.value)} placeholder="PLZ" style={{ flex: 1 }} />
                <input value={editCustomerCity} onChange={(e) => setEditCustomerCity(e.target.value)} placeholder="Ort" style={{ flex: 2 }} />
              </div>
              <button type="button" className="btn primary" style={{ marginTop: "0.5rem" }} disabled={writeBusy || !reasonOk} onClick={() => void submitCustomerPatch()}>
                Speichern
              </button>
              <button type="button" className="btn secondary" style={{ marginLeft: "0.35rem" }} disabled={writeBusy} onClick={() => setEditCustomerId(null)}>
                Abbrechen
              </button>
            </div>
          ) : null}

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
                    Status
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                    V.
                  </th>
                  {canWriteCrmStammdaten && !memoryOnly ? (
                    <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                      Aktion
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: "0.35rem" }}>
                      <code>{p.id}</code>
                    </td>
                    <td style={{ padding: "0.35rem" }}>{p.label ?? "—"}</td>
                    <td style={{ padding: "0.35rem" }}>{p.status}</td>
                    <td style={{ padding: "0.35rem" }}>{p.versionNumber}</td>
                    {canWriteCrmStammdaten && !memoryOnly ? (
                      <td style={{ padding: "0.35rem" }}>
                        <button
                          type="button"
                          className="btn secondary"
                          disabled={writeBusy}
                          onClick={() => {
                            setEditProjectId(p.id);
                            setEditProjectLabel(p.label ?? "");
                            setEditProjectStatus(p.status);
                            setEditProjectCustomerId(p.primaryCustomerId);
                            setEditProjectSiteId(p.constructionSiteId);
                            setEditProjectVersion(p.versionNumber);
                          }}
                        >
                          Bearbeiten
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editProjectId && canWriteCrmStammdaten && !memoryOnly ? (
            <div data-testid="stamm-crm-edit-project" style={{ marginTop: "0.5rem", padding: "0.5rem", border: "1px solid var(--border-color, #44444444)" }}>
              <p className="shell-sub">Projekt bearbeiten (version {editProjectVersion})</p>
              <label className="shell-sub" htmlFor="edit-proj-label">
                Label (leer = null)
              </label>
              <input id="edit-proj-label" value={editProjectLabel} onChange={(e) => setEditProjectLabel(e.target.value)} style={{ width: "100%" }} />
              <label className="shell-sub" htmlFor="edit-proj-status" style={{ display: "block", marginTop: "0.35rem" }}>
                Status
              </label>
              <input id="edit-proj-status" value={editProjectStatus} onChange={(e) => setEditProjectStatus(e.target.value)} style={{ width: "100%" }} />
              <label className="shell-sub" htmlFor="edit-proj-cust" style={{ display: "block", marginTop: "0.35rem" }}>
                Primärer CRM-Kunde
              </label>
              <select id="edit-proj-cust" value={editProjectCustomerId} onChange={(e) => setEditProjectCustomerId(e.target.value)} style={{ width: "100%" }}>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.legalName}
                  </option>
                ))}
              </select>
              <label className="shell-sub" htmlFor="edit-proj-site" style={{ display: "block", marginTop: "0.35rem" }}>
                Baustelle
              </label>
              <select id="edit-proj-site" value={editProjectSiteId} onChange={(e) => setEditProjectSiteId(e.target.value)} style={{ width: "100%" }}>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button type="button" className="btn primary" style={{ marginTop: "0.5rem" }} disabled={writeBusy || !reasonOk} onClick={() => void submitProjectPatch()}>
                Speichern
              </button>
              <button type="button" className="btn secondary" style={{ marginLeft: "0.35rem" }} disabled={writeBusy} onClick={() => setEditProjectId(null)}>
                Abbrechen
              </button>
            </div>
          ) : null}

          <h4 className="shell-sub" style={{ marginTop: "0.75rem" }}>
            Projektkontakte
          </h4>
          {projects.length > 0 ? (
            <label className="shell-sub" htmlFor="stamm-crm-contacts-project">
              Projekt für Kontaktliste
            </label>
          ) : null}
          {projects.length > 0 ? (
            <select
              id="stamm-crm-contacts-project"
              value={contactsProjectId}
              onChange={(e) => setContactsProjectId(e.target.value)}
              style={{ width: "100%", maxWidth: "32rem", marginTop: "0.25rem" }}
              disabled={busy}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label ?? p.id}
                </option>
              ))}
            </select>
          ) : null}
          {canWriteCrmStammdaten && !memoryOnly && contactsProjectId ? (
            <div style={{ marginTop: "0.5rem" }}>
              <button type="button" className="btn secondary" onClick={() => setNewContactOpen((v) => !v)} disabled={writeBusy}>
                {newContactOpen ? "Abbrechen" : "Neuer Projektkontakt"}
              </button>
              {newContactOpen ? (
                <div data-testid="stamm-crm-new-contact" style={{ marginTop: "0.5rem", padding: "0.5rem", border: "1px solid var(--border-color, #44444444)" }}>
                  <label className="shell-sub" htmlFor="new-contact-role">
                    Rolle
                  </label>
                  <input id="new-contact-role" value={newContactRole} onChange={(e) => setNewContactRole(e.target.value)} style={{ width: "100%" }} />
                  <label className="shell-sub" htmlFor="new-contact-name" style={{ display: "block", marginTop: "0.35rem" }}>
                    Anzeigename
                  </label>
                  <input id="new-contact-name" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} style={{ width: "100%" }} />
                  <label className="shell-sub" htmlFor="new-contact-email" style={{ display: "block", marginTop: "0.35rem" }}>
                    E-Mail
                  </label>
                  <input id="new-contact-email" value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} style={{ width: "100%" }} />
                  <label className="shell-sub" htmlFor="new-contact-phone" style={{ display: "block", marginTop: "0.35rem" }}>
                    Telefon
                  </label>
                  <input id="new-contact-phone" value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} style={{ width: "100%" }} />
                  <button type="button" className="btn primary" style={{ marginTop: "0.5rem" }} disabled={writeBusy || !reasonOk} onClick={() => void submitNewContact()}>
                    Kontakt anlegen
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          {contactsProjectId && contacts ? (
            <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
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
                    <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                      V.
                    </th>
                    {canWriteCrmStammdaten && !memoryOnly ? (
                      <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                        Aktion
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id}>
                      <td style={{ padding: "0.35rem" }}>{c.displayName}</td>
                      <td style={{ padding: "0.35rem" }}>{c.role}</td>
                      <td style={{ padding: "0.35rem" }}>{c.email ?? "—"}</td>
                      <td style={{ padding: "0.35rem" }}>{c.versionNumber}</td>
                      {canWriteCrmStammdaten && !memoryOnly ? (
                        <td style={{ padding: "0.35rem" }}>
                          <button
                            type="button"
                            className="btn secondary"
                            disabled={writeBusy}
                            onClick={() => {
                              setEditContactId(c.id);
                              setEditContactRole(c.role);
                              setEditContactName(c.displayName);
                              setEditContactEmail(c.email ?? "");
                              setEditContactPhone(c.phone ?? "");
                              setEditContactVersion(c.versionNumber);
                            }}
                          >
                            Bearbeiten
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : projects.length > 0 ? (
            <p className="hint">Kontakte werden geladen …</p>
          ) : (
            <p className="hint">Keine Projekte — Traceability prüfen.</p>
          )}
          {editContactId && canWriteCrmStammdaten && !memoryOnly ? (
            <div data-testid="stamm-crm-edit-contact" style={{ marginTop: "0.5rem", padding: "0.5rem", border: "1px solid var(--border-color, #44444444)" }}>
              <p className="shell-sub">Kontakt bearbeiten (version {editContactVersion})</p>
              <input value={editContactRole} onChange={(e) => setEditContactRole(e.target.value)} placeholder="Rolle" style={{ width: "100%" }} />
              <input value={editContactName} onChange={(e) => setEditContactName(e.target.value)} placeholder="Name" style={{ width: "100%", marginTop: "0.35rem" }} />
              <input value={editContactEmail} onChange={(e) => setEditContactEmail(e.target.value)} placeholder="E-Mail" style={{ width: "100%", marginTop: "0.35rem" }} />
              <input value={editContactPhone} onChange={(e) => setEditContactPhone(e.target.value)} placeholder="Telefon" style={{ width: "100%", marginTop: "0.35rem" }} />
              <button type="button" className="btn primary" style={{ marginTop: "0.5rem" }} disabled={writeBusy || !reasonOk} onClick={() => void submitContactPatch()}>
                Speichern
              </button>
              <button type="button" className="btn secondary" style={{ marginLeft: "0.35rem" }} disabled={writeBusy} onClick={() => setEditContactId(null)}>
                Abbrechen
              </button>
            </div>
          ) : null}

          {pilotProject && canWriteCrmStammdaten && !memoryOnly ? (
            <p className="hint" data-testid="stamm-crm-pilot-patch" style={{ marginTop: "0.75rem" }}>
              Pilot-Projekt <code>{pilotProject.id}</code> kann über „Projekte → Bearbeiten“ gepflegt werden (inkl.{" "}
              <code>versionNumber</code>).
            </p>
          ) : null}

          {writeMessage ? (
            <p className="hint" data-testid="stamm-crm-patch-message" style={{ marginTop: "0.75rem" }}>
              {writeMessage}
            </p>
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
