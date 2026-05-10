import { useMemo, useState } from "react";
import type { ApiClient } from "../../lib/api-client.js";
import { ApiError } from "../../lib/api-error.js";
import {
  type ActionFormFields,
  executeActionWithSotGuard,
} from "../../lib/action-executor.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";
import {
  DOCUMENT_WORKSPACE_HASH,
  measurementPilotListHashWithVersionId,
  OFFER_WORKSPACE_HASH,
} from "../../lib/hash-route.js";
import { LvWorkbench } from "../lv-workbench/LvWorkbench.js";

const DEFAULT_MEASUREMENT_POSITIONS_JSON = JSON.stringify(
  [
    {
      lvPositionId: SEED.lvPositionId,
      quantity: 12.5,
      unit: "m2",
      note: "Geschaeftsprozess-Wizard — Pilot Aufmassposition",
    },
  ],
  null,
  2,
);

/**
 * Geführter Pilotpfad LV → Aufmass (SoT) → Angebot → Rechnungsentwurf.
 * Nach MEASUREMENT_CREATE wird die zurückgegebene measurementId an POST /invoices übergeben (stabile Traceability bei mehreren Aufmassen).
 */
export function GeschaeftsprozessWizard({
  api,
  showIntegrationHints = false,
}: {
  api: ApiClient;
  showIntegrationHints?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [lvVersionId, setLvVersionId] = useState<string>(SEED.lvVersionId);
  const [wizardMeasurementId, setWizardMeasurementId] = useState<string>("");
  /** Erste Messungsversion nach MEASUREMENT_CREATE — für Shell `MEASUREMENT_VERSION` und Pilotliste (`GET /measurements/:id`). */
  const [wizardMeasurementVersionId, setWizardMeasurementVersionId] = useState<string>("");
  const [offerVersionId, setOfferVersionId] = useState("");
  const [draftSummary, setDraftSummary] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [projectAllowedActions, setProjectAllowedActions] = useState<string[] | null>(null);
  const [measurementBanner, setMeasurementBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [measurementForm, setMeasurementForm] = useState<ActionFormFields>(() => ({
    reason: "Geschaeftsprozess-Wizard — MEASUREMENT_CREATE (Pilot Phase-2)",
    projectId: SEED.projectId,
    customerId: SEED.customerId,
    lvVersionId: SEED.lvVersionId,
    positionsJson: DEFAULT_MEASUREMENT_POSITIONS_JSON,
  }));

  const [pilotQuantity, setPilotQuantity] = useState("12.5");
  const [pilotUnit, setPilotUnit] = useState("m2");
  const [pilotNote, setPilotNote] = useState("Geschaeftsprozess-Wizard — Pilot Aufmassposition");

  const measurementFormSyncedLv = useMemo(
    () => ({
      ...measurementForm,
      lvVersionId: lvVersionId.trim(),
    }),
    [measurementForm, lvVersionId],
  );

  const loadProjectSoT = async () => {
    setBusy(true);
    setMeasurementBanner(null);
    try {
      const r = await api.getAllowedActions(SEED.projectId, "PROJECT");
      setProjectAllowedActions(r.allowedActions);
      setMeasurementForm((f) => ({ ...f, lvVersionId: lvVersionId.trim() }));
    } catch (e) {
      setProjectAllowedActions(null);
      setMeasurementBanner({
        kind: "err",
        text: e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const buildPositionsJsonForPilotFields = (): { ok: true; json: string } | { ok: false; message: string } => {
    const raw = pilotQuantity.trim().replace(",", ".");
    const q = Number(raw);
    if (!Number.isFinite(q) || q <= 0) {
      return { ok: false, message: "Bitte eine gültige Menge größer 0 eingeben (Komma oder Punkt als Dezimaltrennzeichen)." };
    }
    const unit = pilotUnit.trim();
    if (!unit) {
      return { ok: false, message: "Bitte eine Einheit angeben (z. B. m2, m, Stk.)." };
    }
    const row: Record<string, unknown> = {
      lvPositionId: SEED.lvPositionId,
      quantity: q,
      unit,
    };
    const note = pilotNote.trim();
    if (note) row.note = note;
    return { ok: true, json: JSON.stringify([row], null, 2) };
  };

  const runMeasurementCreate = async () => {
    const allowed = projectAllowedActions;
    if (!allowed?.includes("MEASUREMENT_CREATE")) return;
    setBusy(true);
    setMeasurementBanner(null);
    setWizardMeasurementVersionId("");
    try {
      let fields: ActionFormFields;
      if (showIntegrationHints) {
        fields = { ...measurementFormSyncedLv };
      } else {
        const built = buildPositionsJsonForPilotFields();
        if (!built.ok) {
          setMeasurementBanner({ kind: "err", text: built.message });
          setBusy(false);
          return;
        }
        fields = { ...measurementFormSyncedLv, positionsJson: built.json };
      }
      const result = await executeActionWithSotGuard(
        api,
        "MEASUREMENT_CREATE",
        "PROJECT",
        SEED.projectId,
        allowed,
        fields,
      );
      const mid =
        result && typeof result === "object" && "measurementId" in result
          ? String((result as { measurementId: unknown }).measurementId)
          : "";
      const mvid =
        result && typeof result === "object" && "measurementVersionId" in result
          ? String((result as { measurementVersionId: unknown }).measurementVersionId).trim()
          : "";
      setWizardMeasurementVersionId(mvid);
      setMeasurementBanner({
        kind: "ok",
        text: showIntegrationHints
          ? JSON.stringify(result, null, 2)
          : mid
            ? `Aufmass angelegt. Messungs-ID: ${mid}${mvid ? ` · Messungsversions-ID: ${mvid}` : ""}.`
            : "Aufmass angelegt.",
      });
      if (mid) setWizardMeasurementId(mid);
    } catch (e) {
      setWizardMeasurementVersionId("");
      setMeasurementBanner({
        kind: "err",
        text: e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const measurementVersionShellHref = wizardMeasurementVersionId.trim()
    ? `${DOCUMENT_WORKSPACE_HASH}?documentId=${encodeURIComponent(wizardMeasurementVersionId.trim())}&entityType=MEASUREMENT_VERSION`
    : "";

  const runCreateOffer = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const r = await api.createOffer({
        projectId: SEED.projectId,
        customerId: SEED.customerId,
        lvVersionId: lvVersionId.trim(),
        systemText: "Systemtext Geschaeftsprozess-Wizard",
        editingText: "Bearbeitungstext Geschaeftsprozess-Wizard",
        reason: "Geschaeftsprozess-Wizard — Angebot anlegen (Pilot Phase-2)",
      });
      setOfferVersionId(r.offerVersionId);
      setBanner({ kind: "ok", text: `Angebot angelegt. offerVersionId: ${r.offerVersionId}` });
      setStep(3);
    } catch (e) {
      setDraftSummary(null);
      setBanner({
        kind: "err",
        text: e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const runCreateDraft = async () => {
    setBusy(true);
    setBanner(null);
    setDraftSummary(null);
    try {
      const mid = wizardMeasurementId.trim();
      const r = await api.createInvoiceDraft({
        lvVersionId: lvVersionId.trim(),
        offerVersionId,
        invoiceCurrencyCode: "EUR",
        skontoBps: 0,
        reason: "Geschaeftsprozess-Wizard — Rechnungsentwurf (Pilot Phase-2)",
        ...(mid ? { measurementId: mid } : {}),
      });
      setDraftSummary(
        `invoiceId ${r.invoiceId} — Netto ${(r.lvNetCents / 100).toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR",
        })} · Brutto ${(r.totalGrossCents / 100).toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR",
        })}`,
      );
      setBanner({ kind: "ok", text: "Rechnungsentwurf erstellt." });
    } catch (e) {
      setBanner({
        kind: "err",
        text: e instanceof ApiError ? `${e.envelope.code}: ${e.envelope.message}` : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const step2Label = showIntegrationHints ? "Schritt 2 — Aufmass (SoT)" : "Schritt 2 — Aufmass";
  const weiterAufmass = showIntegrationHints ? "Weiter zu Aufmass (SoT)" : "Weiter zu Aufmass";

  return (
    <div data-testid="geschaeftsprozess-wizard">
      <section className="panel geschaeftsprozess-intro-panel">
        <h2>Geschäftsprozess (Pilot)</h2>
        {showIntegrationHints ? (
          <p className="hint">
            Kette bis Rechnungsentwurf: gleiche <code>projectId</code> / <code>customerId</code> wie das Demo-Projekt;
            LV-Version steuerbar. Aufmass-Schritt nutzt SoT (
            <code>GET …/allowed-actions?entityType=PROJECT</code>) und optional <code>MEASUREMENT_CREATE</code>. Keine
            parallele Domänenlogik in der UI.
          </p>
        ) : (
          <p className="shell-sub">
            Geführter Ablauf von der LV-Ansicht über Aufmass und Angebot bis zum Rechnungsentwurf — mit den Demo-Stammdaten
            des Mandanten. Schreibvorgänge laufen nur, wenn das Backend die jeweilige Aktion erlaubt.
          </p>
        )}
        <ol className="geschaeftsprozess-step-list">
          <li className={step === 0 ? "geschaeftsprozess-step-active" : undefined}>Schritt 1 — LV prüfen</li>
          <li className={step === 1 ? "geschaeftsprozess-step-active" : undefined}>{step2Label}</li>
          <li className={step === 2 ? "geschaeftsprozess-step-active" : undefined}>Schritt 3 — Angebot anlegen</li>
          <li className={step === 3 ? "geschaeftsprozess-step-active" : undefined}>Schritt 4 — Rechnungsentwurf</li>
        </ol>
        <p className="shell-sub" style={{ marginTop: "0.35rem" }}>
          Stammdaten (Pilot, CRM):{" "}
          <a href="#/stammdaten" data-testid="geschaeftsprozess-stammdaten-link">
            Stammdaten-Hub öffnen
          </a>
          . Traceability: Demo-<code>projectId</code> / <code>customerId</code> entsprechen Rechnung und Aufmass im
          Seed; Nachberechnungen (Differenzbuchungen) lesen Sie unter{" "}
          <a href="#/dokument">Dokument und Details</a> für <code>INVOICE</code> → Button „Differenzbuchungen Projekt
          (GET)“.
        </p>
        {banner ? (
          <p className={banner.kind === "err" ? "error-banner" : "success-banner"} role="status">
            {banner.text}
          </p>
        ) : null}
      </section>

      {step === 0 ? (
        <section className="panel">
          <label className="field">
            <span>LV-Version-ID</span>
            <input
              type="text"
              value={lvVersionId}
              onChange={(e) => setLvVersionId(e.target.value)}
              data-testid="geschaeftsprozess-lv-version-input"
            />
          </label>
          <LvWorkbench api={api} lvVersionId={lvVersionId} showIntegrationHints={showIntegrationHints} />
          <button type="button" className="btn-primary" disabled={busy} onClick={() => setStep(1)}>
            {weiterAufmass}
          </button>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="panel">
          <h3 className="geschaeftsprozess-step-heading">Aufmass anlegen</h3>
          {showIntegrationHints ? (
            <p className="hint">
              Dokument-ID = <code>{SEED.projectId}</code> · <code>entityType=PROJECT</code>. Bei Pilot ohne bestehendes
              Aufmass: <code>MEASUREMENT_CREATE</code> mit Positionen zu LV-Positionen dieser Version.
            </p>
          ) : (
            <p className="hint">
              Zuerst die erlaubten Projekt-Aktionen laden. Ist „Aufmass anlegen“ möglich, können Sie Positionen und Grund
              anpassen und das Aufmass erstellen.
            </p>
          )}
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => void loadProjectSoT()}
            data-testid="geschaeftsprozess-project-sot-load"
          >
            Erlaubte Projekt-Aktionen laden
          </button>
          {projectAllowedActions && showIntegrationHints ? (
            <pre
              className="system-block geschaeftsprozess-allowed-json"
              data-testid="geschaeftsprozess-project-allowed-json"
            >
              {JSON.stringify({ allowedActions: projectAllowedActions }, null, 2)}
            </pre>
          ) : null}
          {projectAllowedActions && !showIntegrationHints ? (
            <p className="hint geschaeftsprozess-allowed-summary" data-testid="geschaeftsprozess-project-allowed-summary">
              Erlaubte Aktionen: {projectAllowedActions.join(", ")}
            </p>
          ) : null}
          {measurementBanner ? (
            <pre
              className={measurementBanner.kind === "err" ? "error-banner" : "success-banner"}
              style={{ marginTop: "0.75rem", whiteSpace: "pre-wrap" }}
              role="status"
              data-testid="geschaeftsprozess-measurement-banner"
            >
              {measurementBanner.text}
            </pre>
          ) : null}
          {wizardMeasurementVersionId.trim() && measurementVersionShellHref ? (
            <p className="shell-sub" style={{ marginTop: "0.75rem" }} data-testid="geschaeftsprozess-measurement-trace">
              Messungsversion <code>{wizardMeasurementVersionId.trim()}</code>:{" "}
              <a href={measurementVersionShellHref} data-testid="geschaeftsprozess-measurement-trace-measurement-shell">
                Dokument-Shell (MEASUREMENT_VERSION)
              </a>
              {" · "}
              <a
                href={measurementPilotListHashWithVersionId(wizardMeasurementVersionId.trim())}
                data-testid="geschaeftsprozess-measurement-trace-pilot-list"
              >
                Messungs-Pilotliste (Deep-Link)
              </a>
            </p>
          ) : null}
          {projectAllowedActions?.includes("MEASUREMENT_CREATE") ? (
            <>
              {showIntegrationHints ? (
                <label className="field geschaeftsprozess-field-spaced">
                  <span>positions (JSON-Array)</span>
                  <textarea
                    value={measurementForm.positionsJson ?? ""}
                    onChange={(e) => setMeasurementForm((f) => ({ ...f, positionsJson: e.target.value }))}
                    data-testid="geschaeftsprozess-measurement-positions-json"
                  />
                </label>
              ) : (
                <>
                  <p className="hint geschaeftsprozess-field-spaced" style={{ marginBottom: "0.5rem" }}>
                    Eine Pilot-Position an die Demo-LV-Position geknüpft. Menge und Einheit anpassen; die LV-Positions-ID
                    kommt aus dem Seed (keine manuelle UUID nötig).
                  </p>
                  <p className="hint" style={{ fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                    LV-Position (Seed): <code>{SEED.lvPositionId}</code>
                  </p>
                  <label className="field">
                    <span>Menge</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={pilotQuantity}
                      onChange={(e) => setPilotQuantity(e.target.value)}
                      data-testid="geschaeftsprozess-measurement-pilot-quantity"
                      aria-label="Aufmass-Pilotposition Menge"
                    />
                  </label>
                  <label className="field">
                    <span>Einheit</span>
                    <input
                      type="text"
                      value={pilotUnit}
                      onChange={(e) => setPilotUnit(e.target.value)}
                      data-testid="geschaeftsprozess-measurement-pilot-unit"
                      aria-label="Aufmass-Pilotposition Einheit"
                    />
                  </label>
                  <label className="field">
                    <span>Anmerkung (optional)</span>
                    <textarea
                      value={pilotNote}
                      onChange={(e) => setPilotNote(e.target.value)}
                      rows={2}
                      data-testid="geschaeftsprozess-measurement-pilot-note"
                      aria-label="Aufmass-Pilotposition Anmerkung"
                    />
                  </label>
                </>
              )}
              <label className="field">
                <span>Grund</span>
                <textarea
                  value={measurementForm.reason}
                  onChange={(e) => setMeasurementForm((f) => ({ ...f, reason: e.target.value }))}
                  data-testid="geschaeftsprozess-measurement-reason"
                />
              </label>
              <button
                type="button"
                className="btn-primary geschaeftsprozess-btn-spaced"
                disabled={busy}
                onClick={() => void runMeasurementCreate()}
                data-testid="geschaeftsprozess-measurement-create"
              >
                {showIntegrationHints ? "Aufmass anlegen (MEASUREMENT_CREATE)" : "Aufmass anlegen"}
              </button>
            </>
          ) : projectAllowedActions ? (
            <p className="hint">Kein Aufmass-Anlegen in der aktuellen Berechtigungsliste (Rolle oder Kontext).</p>
          ) : null}
          <div className="geschaeftsprozess-nav-row">
            <button type="button" disabled={busy} onClick={() => setStep(0)}>
              Zurück
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => setStep(2)}
              data-testid="geschaeftsprozess-step-measurement-next"
            >
              Weiter zu Angebot
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="panel">
          <p>
            LV-Version: <code>{lvVersionId.trim()}</code> · Projekt <code>{SEED.projectId}</code>
          </p>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => void runCreateOffer()}
            data-testid="geschaeftsprozess-create-offer"
          >
            {busy ? "Bitte warten …" : showIntegrationHints ? "Angebot anlegen (POST /offers)" : "Angebot anlegen"}
          </button>
          <button type="button" className="geschaeftsprozess-back-inline" disabled={busy} onClick={() => setStep(1)}>
            Zurück
          </button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="panel">
          <p>
            Angebotsversion: <code>{offerVersionId}</code>
          </p>
          {wizardMeasurementId.trim() ? (
            <p className="shell-sub" data-testid="geschaeftsprozess-trace-measurement-id">
              Aufmass (Wizard): <code>{wizardMeasurementId.trim()}</code> — wird an <code>POST /invoices</code> als{" "}
              <code>measurementId</code> übergeben, wenn gesetzt.
            </p>
          ) : null}
          {wizardMeasurementVersionId.trim() ? (
            <p className="shell-sub" data-testid="geschaeftsprozess-trace-measurement-version">
              Messungsversion: <code>{wizardMeasurementVersionId.trim()}</code> —{" "}
              <a href={measurementPilotListHashWithVersionId(wizardMeasurementVersionId.trim())} data-testid="geschaeftsprozess-trace-measurement-version-pilot">
                Pilot-Liste (Deep-Link)
              </a>
              {" · "}
              <a
                href={`${DOCUMENT_WORKSPACE_HASH}?documentId=${encodeURIComponent(wizardMeasurementVersionId.trim())}&entityType=MEASUREMENT_VERSION`}
                data-testid="geschaeftsprozess-trace-measurement-version-shell"
              >
                Shell (MEASUREMENT_VERSION)
              </a>
            </p>
          ) : null}
          {offerVersionId.trim() ? (
            <p className="shell-sub" data-testid="geschaeftsprozess-trace-links">
              Traceability / SoT:{" "}
              <a href={OFFER_WORKSPACE_HASH} data-testid="geschaeftsprozess-trace-offer-workspace">
                Angebots- und Nachtrags-Arbeitsfläche
              </a>
              {" · "}
              <a
                href={`${DOCUMENT_WORKSPACE_HASH}?documentId=${encodeURIComponent(offerVersionId.trim())}&entityType=OFFER_VERSION`}
                data-testid="geschaeftsprozess-trace-offer-shell"
              >
                Dokument-Shell (OFFER_VERSION)
              </a>
              . Demo-Nachtrag: <code>{SEED.supplementVersionId}</code> in der Arbeitsfläche mit „Nachtrag lesen“ prüfbar
              (nicht automatisch durch diesen Wizard angelegt).
            </p>
          ) : null}
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !offerVersionId}
            onClick={() => void runCreateDraft()}
            data-testid="geschaeftsprozess-create-draft"
          >
            {busy
              ? "Bitte warten …"
              : showIntegrationHints
                ? "Rechnungsentwurf (POST /invoices)"
                : "Rechnungsentwurf erstellen"}
          </button>
          <button type="button" className="geschaeftsprozess-back-inline" disabled={busy} onClick={() => setStep(2)}>
            Zurück
          </button>
          {draftSummary ? <p data-testid="geschaeftsprozess-draft-summary">{draftSummary}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
