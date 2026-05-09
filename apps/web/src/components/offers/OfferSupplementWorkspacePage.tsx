import { useState } from "react";
import type { ApiClient, OfferVersionDetail } from "../../lib/api-client.js";
import { ApiError } from "../../lib/api-error.js";
import {
  CANONICAL_EXPORT_INVOICE_ACTION_ID,
  type ActionFormFields,
  executeActionWithSotGuard,
} from "../../lib/action-executor.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";
import { DOCUMENT_WORKSPACE_HASH, OFFER_WORKSPACE_HASH } from "../../lib/hash-route.js";

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

  const loadOffer = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const d = await api.getOfferVersion(offerVersionId.trim());
      setOfferDetail(d);
      setOfferForm((f) => ({ ...f, offerId: d.offerId }));
    } catch (e) {
      setOfferDetail(null);
      setBanner(e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e));
    } finally {
      setBusy(false);
    }
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

  const runOffer = async () => {
    const id = offerVersionId.trim();
    const a = offerAction.trim();
    if (!id || !a || !offerAllowed?.includes(a)) return;
    setBusy(true);
    setBanner(null);
    try {
      const res = await executeActionWithSotGuard(api, a, "OFFER_VERSION", id, offerAllowed, offerForm);
      setBanner(JSON.stringify(res, null, 2));
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
      setBanner(JSON.stringify(res, null, 2));
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
        <p className="shell-sub" style={{ marginTop: "1rem" }}>
          Route: <code>{OFFER_WORKSPACE_HASH}</code>
        </p>
      ) : null}
    </section>
  );
}
