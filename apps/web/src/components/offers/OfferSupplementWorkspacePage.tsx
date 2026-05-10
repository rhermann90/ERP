import { useCallback, useEffect, useState } from "react";
import type {
  ApiClient,
  OfferListItem,
  OfferVersionDetail,
  SupplementListItem,
  SupplementVersionRead,
} from "../../lib/api-client.js";
import { ApiError } from "../../lib/api-error.js";
import {
  CANONICAL_EXPORT_INVOICE_ACTION_ID,
  type ActionFormFields,
  executeActionWithSotGuard,
} from "../../lib/action-executor.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";
import {
  ANGEBOTE_NACHTRAEGE_HUB_HASH,
  DOCUMENT_WORKSPACE_HASH,
  LV_AUFMASS_HUB_HASH,
  MEASUREMENT_PILOT_LIST_HASH,
  OFFER_WORKSPACE_HASH,
  readOfferWorkspaceVersionIdsFromHash,
  useHashRoute,
} from "../../lib/hash-route.js";

type Props = {
  api: ApiClient;
  showIntegrationHints?: boolean;
};

const OFFER_DRIVER = new Set([
  "OFFER_SET_IN_FREIGABE",
  "OFFER_SET_FREIGEGEBEN",
  "OFFER_SET_VERSENDET",
  "OFFER_SET_ANGENOMMEN",
  "OFFER_SET_ABGELEHNT",
  "OFFER_SET_ARCHIVIERT",
  "OFFER_CREATE_VERSION",
  "OFFER_CREATE_SUPPLEMENT",
  "EXPORT_OFFER_VERSION",
]);

const SUPP_DRIVER = new Set([
  "SUPPLEMENT_SET_IN_FREIGABE",
  "SUPPLEMENT_SET_FREIGEGEBEN",
  "SUPPLEMENT_SET_VERSENDET",
  "SUPPLEMENT_SET_BEAUFTRAGT",
  "SUPPLEMENT_SET_ABGELEHNT",
  "SUPPLEMENT_SET_ARCHIVIERT",
  "SUPPLEMENT_APPLY_BILLING_IMPACT",
  "EXPORT_SUPPLEMENT_VERSION",
]);

/** Pilot-Arbeitsfläche: SoT für Angebotsversion und Nachtragsversion ohne Shell-Kontext. */
export function OfferSupplementWorkspacePage({ api, showIntegrationHints = false }: Props) {
  const [offerVersionId, setOfferVersionId] = useState<string>(SEED.offerVersionId);
  const [supplementVersionId, setSupplementVersionId] = useState<string>(SEED.supplementVersionId);
  const [offerDetail, setOfferDetail] = useState<OfferVersionDetail | null>(null);
  const [offerAllowed, setOfferAllowed] = useState<string[] | null>(null);
  const [suppAllowed, setSuppAllowed] = useState<string[] | null>(null);
  const [offerAction, setOfferAction] = useState("");
  const [suppAction, setSuppAction] = useState("");
  const [suppDetail, setSuppDetail] = useState<SupplementVersionRead | null>(null);
  const [offerForm, setOfferForm] = useState<ActionFormFields>({
    reason: "Angebots-Arbeitsfläche — Pilot SoT",
    lvVersionId: SEED.lvVersionId,
    editingText: "Bearbeitungstext aus Pilot-Arbeitsfläche",
  });
  const [suppForm, setSuppForm] = useState<ActionFormFields>({
    reason: "Nachtrag — Pilot SoT",
    invoiceId: SEED.invoiceId,
  });
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const hashPath = useHashRoute();
  const [projectIdInput, setProjectIdInput] = useState<string>(SEED.projectId);
  const [offerListRows, setOfferListRows] = useState<OfferListItem[] | null>(null);
  const [suppListRows, setSuppListRows] = useState<SupplementListItem[] | null>(null);
  const [listBusy, setListBusy] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const loadProjectLists = useCallback(async () => {
    const pid = projectIdInput.trim();
    if (!pid) return;
    setListBusy(true);
    setListError(null);
    setOfferListRows(null);
    setSuppListRows(null);
    try {
      const [offers, supps] = await Promise.all([api.listProjectOffers(pid), api.listProjectSupplements(pid)]);
      setOfferListRows(offers.data);
      setSuppListRows(supps.data);
    } catch (e) {
      setListError(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setListBusy(false);
    }
  }, [api, projectIdInput]);

  useEffect(() => {
    if (hashPath !== "/angebote-arbeitsflaeche") return;
    const { offerVersionId: ovFromHash, supplementVersionId: svFromHash } = readOfferWorkspaceVersionIdsFromHash();
    if (ovFromHash) setOfferVersionId(ovFromHash);
    if (svFromHash) setSupplementVersionId(svFromHash);
    if (!ovFromHash && !svFromHash) return;
    void (async () => {
      setBusy(true);
      setBanner(null);
      try {
        if (ovFromHash) {
          const d = await api.getOfferVersion(ovFromHash);
          setOfferDetail(d);
          setOfferForm((f) => ({ ...f, offerId: d.offerId }));
        }
        if (svFromHash) {
          const sd = await api.getSupplementVersion(svFromHash);
          setSuppDetail(sd);
        }
      } catch (e) {
        setBanner(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
      } finally {
        setBusy(false);
      }
    })();
  }, [api, hashPath]);

  const loadOfferForId = async (versionId: string) => {
    const id = versionId.trim();
    if (!id) return;
    setBusy(true);
    setBanner(null);
    try {
      const d = await api.getOfferVersion(id);
      setOfferDetail(d);
      setOfferForm((f) => ({ ...f, offerId: d.offerId }));
    } catch (e) {
      setOfferDetail(null);
      setBanner(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
  };

  const loadSuppForId = async (versionId: string) => {
    const id = versionId.trim();
    if (!id) return;
    setBusy(true);
    setBanner(null);
    try {
      const d = await api.getSupplementVersion(id);
      setSuppDetail(d);
    } catch (e) {
      setSuppDetail(null);
      setBanner(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
  };

  const loadOffer = async () => {
    await loadOfferForId(offerVersionId);
  };

  const loadOfferSoT = async () => {
    const id = offerVersionId.trim();
    setBusy(true);
    setBanner(null);
    try {
      const r = await api.getAllowedActions(id, "OFFER_VERSION");
      setOfferAllowed(r.allowedActions);
      setOfferAction("");
    } catch (e) {
      setOfferAllowed(null);
      setBanner(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
  };

  const loadSuppSoT = async () => {
    const id = supplementVersionId.trim();
    setBusy(true);
    setBanner(null);
    try {
      const r = await api.getAllowedActions(id, "SUPPLEMENT_VERSION");
      setSuppAllowed(r.allowedActions);
      setSuppAction("");
    } catch (e) {
      setSuppAllowed(null);
      setBanner(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
  };

  const loadSuppDetail = async () => {
    await loadSuppForId(supplementVersionId);
  };

  const runOffer = async () => {
    const id = offerVersionId.trim();
    const a = offerAction.trim();
    if (!id || !a || !offerAllowed?.includes(a)) return;
    setBusy(true);
    setBanner(null);
    try {
      const res = await executeActionWithSotGuard(api, a, "OFFER_VERSION", id, offerAllowed, offerForm);
      setBanner(showIntegrationHints ? JSON.stringify(res, null, 2) : "Aktion erfolgreich ausgeführt.");
      await loadOffer();
      await loadOfferSoT();
    } catch (e) {
      setBanner(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
  };

  const runSupp = async () => {
    const id = supplementVersionId.trim();
    const a = suppAction.trim();
    if (!id || !a || !suppAllowed?.includes(a)) return;
    setBusy(true);
    setBanner(null);
    try {
      const res = await executeActionWithSotGuard(api, a, "SUPPLEMENT_VERSION", id, suppAllowed, suppForm);
      setBanner(showIntegrationHints ? JSON.stringify(res, null, 2) : "Aktion erfolgreich ausgeführt.");
      await loadSuppSoT();
    } catch (e) {
      setBanner(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
  };

  const offerChoices = (offerAllowed ?? []).filter((x) => OFFER_DRIVER.has(x));
  const suppChoices = (suppAllowed ?? []).filter((x) => SUPP_DRIVER.has(x));

  return (
    <section className="panel domain-hub" data-testid="offer-workspace-page">
      <h2>Angebote &amp; Nachträge — Arbeitsfläche</h2>
      <p className="shell-sub">
        Schreibaktionen nur nach Server-<code>allowedActions</code>. Für Buchungsimpact beim Nachtrag ist eine passende{" "}
        <code>invoiceId</code> nötig ({CANONICAL_EXPORT_INVOICE_ACTION_ID} bleibt am Rechnungsdokument).
      </p>
      <p className="shell-sub" data-testid="ows-api-hint">
        Projektlisten vom Server: <code>GET /projects/&#123;projectId&#125;/offers</code>,{" "}
        <code>GET /projects/&#123;projectId&#125;/supplements</code> (Lesepfad wie Aufmass/Rechnung). Deep-Link:{" "}
        <code>{OFFER_WORKSPACE_HASH}?offerVersionId=…&amp;supplementVersionId=…</code>
      </p>
      <p className="shell-sub" data-testid="ows-cross-links">
        Hub <a href={ANGEBOTE_NACHTRAEGE_HUB_HASH}>Angebote &amp; Nachträge</a> ·{" "}
        <a href={MEASUREMENT_PILOT_LIST_HASH}>Aufmaß-Messungen</a> · <a href={LV_AUFMASS_HUB_HASH}>LV &amp; Aufmaß</a>
      </p>

      <div className="field-grid two" style={{ marginTop: "0.75rem" }}>
        <label className="field">
          <span>Projekt-ID (Listen vom Server)</span>
          <input
            type="text"
            value={projectIdInput}
            onChange={(e) => setProjectIdInput(e.target.value)}
            data-testid="ows-project-id"
            autoComplete="off"
          />
        </label>
        <div className="actions-row" style={{ alignSelf: "end" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void loadProjectLists()}
            disabled={listBusy || !projectIdInput.trim()}
            data-testid="ows-load-project-lists"
          >
            {listBusy ? "Listen laden…" : "Projekt-Listen laden"}
          </button>
        </div>
      </div>
      {listError ? (
        <p className="error-banner" role="alert" data-testid="ows-list-error">
          {listError}
        </p>
      ) : null}
      {offerListRows ? (
        <div className="panel" style={{ marginTop: "0.75rem" }} data-testid="ows-offer-table-wrap">
          <h3 className="shell-sub" style={{ marginTop: 0 }}>
            Angebote im Projekt (Server)
          </h3>
          {offerListRows.length === 0 ? (
            <p className="shell-sub">Keine Angebotsköpfe für dieses Projekt.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}
                data-testid="ows-offer-server-table"
              >
                <thead>
                  <tr>
                    <th
                      scope="col"
                      style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      offerId
                    </th>
                    <th
                      scope="col"
                      style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      Status (aktuell)
                    </th>
                    <th
                      scope="col"
                      style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      Angebotsversion
                    </th>
                    <th
                      scope="col"
                      style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      Aktion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offerListRows.map((row) => (
                    <tr key={row.offerId}>
                      <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <code>{row.offerId}</code>
                      </td>
                      <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        {row.currentVersion.status}
                      </td>
                      <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <code>{row.currentOfferVersionId}</code>
                      </td>
                      <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <button
                          type="button"
                          className="btn secondary"
                          data-testid={`ows-select-offer-${row.offerId}`}
                          onClick={() => {
                            setOfferVersionId(row.currentOfferVersionId);
                            void loadOfferForId(row.currentOfferVersionId);
                          }}
                        >
                          Anzeigen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
      {suppListRows ? (
        <div className="panel" style={{ marginTop: "0.75rem" }} data-testid="ows-supp-table-wrap">
          <h3 className="shell-sub" style={{ marginTop: 0 }}>
            Nachträge im Projekt (Server)
          </h3>
          {suppListRows.length === 0 ? (
            <p className="shell-sub">Keine Nachträge für dieses Projekt.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}
                data-testid="ows-supp-server-table"
              >
                <thead>
                  <tr>
                    <th
                      scope="col"
                      style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      supplementOfferId
                    </th>
                    <th
                      scope="col"
                      style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      Status (aktuell)
                    </th>
                    <th
                      scope="col"
                      style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      Nachtragsversion
                    </th>
                    <th
                      scope="col"
                      style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      Aktion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {suppListRows.map((row) => (
                    <tr key={row.supplementOfferId}>
                      <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <code>{row.supplementOfferId}</code>
                      </td>
                      <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        {row.currentVersion.status}
                      </td>
                      <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <code>{row.currentSupplementVersionId}</code>
                      </td>
                      <td style={{ padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                        <button
                          type="button"
                          className="btn secondary"
                          data-testid={`ows-select-supp-${row.supplementOfferId}`}
                          onClick={() => {
                            setSupplementVersionId(row.currentSupplementVersionId);
                            void loadSuppForId(row.currentSupplementVersionId);
                          }}
                        >
                          Anzeigen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Angebotsversion</h3>
        <label className="field">
          <span>offerVersionId</span>
          <input type="text" value={offerVersionId} onChange={(e) => setOfferVersionId(e.target.value)} data-testid="ows-offer-version-id" />
        </label>
        <div className="actions-row">
          <button type="button" className="btn secondary" disabled={busy} onClick={() => void loadOffer()}>
            Version lesen
          </button>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void loadOfferSoT()} data-testid="ows-offer-sot-load">
            SoT laden
          </button>
          <a className="btn secondary" href={`${DOCUMENT_WORKSPACE_HASH}?documentId=${encodeURIComponent(offerVersionId.trim())}&entityType=OFFER_VERSION`}>
            Dokument-Shell
          </a>
        </div>
        {offerDetail ? (
          <p className="hint">
            Status <code>{offerDetail.status}</code> · offerId <code>{offerDetail.offerId}</code> · lvVersionId{" "}
            <code>{offerDetail.lvVersionId}</code>
          </p>
        ) : null}
        {offerChoices.length > 0 ? (
          <>
            <label className="field">
              <span>Aktion</span>
              <select value={offerAction} onChange={(e) => setOfferAction(e.target.value)} data-testid="ows-offer-action">
                <option value="">—</option>
                {offerChoices.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Grund</span>
              <textarea value={offerForm.reason} onChange={(e) => setOfferForm((f) => ({ ...f, reason: e.target.value }))} />
            </label>
            {(offerAction === "OFFER_CREATE_VERSION" || offerAction === "OFFER_CREATE_SUPPLEMENT") && (
              <>
                <label className="field">
                  <span>lvVersionId</span>
                  <input
                    type="text"
                    value={offerForm.lvVersionId ?? ""}
                    onChange={(e) => setOfferForm((f) => ({ ...f, lvVersionId: e.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>editingText</span>
                  <textarea
                    value={offerForm.editingText ?? ""}
                    onChange={(e) => setOfferForm((f) => ({ ...f, editingText: e.target.value }))}
                  />
                </label>
              </>
            )}
            <button type="button" className="btn-primary" disabled={busy || !offerAction} onClick={() => void runOffer()} data-testid="ows-offer-run">
              Ausführen
            </button>
          </>
        ) : offerAllowed ? (
          <p className="hint">Keine pilotierten Angebotsaktionen freigegeben.</p>
        ) : null}
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h3>Nachtragsversion</h3>
        <label className="field">
          <span>supplementVersionId</span>
          <input type="text" value={supplementVersionId} onChange={(e) => setSupplementVersionId(e.target.value)} data-testid="ows-supp-version-id" />
        </label>
        <div className="actions-row">
          <button type="button" className="btn secondary" disabled={busy} onClick={() => void loadSuppDetail()} data-testid="ows-supp-detail-load">
            Nachtrag lesen
          </button>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void loadSuppSoT()} data-testid="ows-supp-sot-load">
            SoT laden
          </button>
          <a
            className="btn secondary"
            href={`${DOCUMENT_WORKSPACE_HASH}?documentId=${encodeURIComponent(supplementVersionId.trim())}&entityType=SUPPLEMENT_VERSION`}
          >
            Dokument-Shell
          </a>
        </div>
        {suppDetail ? (
          <dl data-testid="ows-supp-detail-dl" style={{ marginTop: "0.75rem" }}>
            <dt className="shell-sub">Status</dt>
            <dd>
              <code>{suppDetail.status}</code>
            </dd>
            <dt className="shell-sub">Basis-Angebotsversion</dt>
            <dd>
              <code>{suppDetail.baseOfferVersionId}</code>{" "}
              <a
                className="btn secondary"
                style={{ marginLeft: "0.35rem", fontSize: "0.85rem" }}
                href={`${DOCUMENT_WORKSPACE_HASH}?documentId=${encodeURIComponent(suppDetail.baseOfferVersionId)}&entityType=OFFER_VERSION`}
                data-testid="ows-supp-link-base-offer-shell"
              >
                In Shell öffnen
              </a>
            </dd>
            <dt className="shell-sub">supplementOfferId</dt>
            <dd>
              <code>{suppDetail.supplementOfferId}</code>
            </dd>
          </dl>
        ) : null}
        {suppChoices.length > 0 ? (
          <>
            <label className="field">
              <span>Aktion</span>
              <select value={suppAction} onChange={(e) => setSuppAction(e.target.value)} data-testid="ows-supp-action">
                <option value="">—</option>
                {suppChoices.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Grund</span>
              <textarea value={suppForm.reason} onChange={(e) => setSuppForm((f) => ({ ...f, reason: e.target.value }))} />
            </label>
            {suppAction === "SUPPLEMENT_APPLY_BILLING_IMPACT" ? (
              <label className="field">
                <span>invoiceId</span>
                <input
                  type="text"
                  value={suppForm.invoiceId ?? ""}
                  onChange={(e) => setSuppForm((f) => ({ ...f, invoiceId: e.target.value }))}
                />
              </label>
            ) : null}
            <button type="button" className="btn-primary" disabled={busy || !suppAction} onClick={() => void runSupp()} data-testid="ows-supp-run">
              Ausführen
            </button>
          </>
        ) : suppAllowed ? (
          <p className="hint">Keine pilotierten Nachtragsaktionen freigegeben.</p>
        ) : null}
      </section>

      {banner ? (
        <pre className="system-block" style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }} data-testid="ows-banner">
          {banner}
        </pre>
      ) : null}
      {showIntegrationHints ? (
        <p className="shell-sub" style={{ marginTop: "1rem" }} data-testid="ows-integration-route-hint">
          Route: <code>{OFFER_WORKSPACE_HASH}</code>
        </p>
      ) : null}
    </section>
  );
}
