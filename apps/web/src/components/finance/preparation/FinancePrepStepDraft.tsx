import { memo } from "react";
import type { InvoiceBillingKindApi } from "../../../lib/api-client.js";
import { FinanceCollapsibleJson } from "../FinanceCollapsibleJson.js";
import { FinancePrepNotice } from "../FinancePrepNotice.js";
import { FinancePrepPanel } from "../FinancePrepPanel.js";
import type { FinNotice } from "../finance-prep-types.js";
import { FIN_PREP_A11Y } from "../finance-preparation-meta.js";

const BILLING_KIND_OPTIONS: { value: InvoiceBillingKindApi; label: string }[] = [
  { value: "REGULAR", label: "Regulär" },
  { value: "SCHLUSSRECHNUNG", label: "Schlussrechnung" },
  { value: "FOLGERECHNUNG", label: "Folgerechnung" },
  { value: "GUTSCHRIFT", label: "Gutschrift" },
];

export type FinancePrepStepDraftProps = {
  busy: boolean;
  liveStatus: string;
  stepNotice: FinNotice | null;
  draftSkontoBps: string;
  setDraftSkontoBps: (v: string) => void;
  draftBillingKind: InvoiceBillingKindApi;
  setDraftBillingKind: (v: InvoiceBillingKindApi) => void;
  draftSummary: string | null;
  draftJson: string;
  onCreateInvoiceDraft: () => void;
  showIntegrationHints?: boolean;
};

function FinancePrepStepDraftInner({
  busy,
  liveStatus,
  stepNotice,
  draftSkontoBps,
  setDraftSkontoBps,
  draftBillingKind,
  setDraftBillingKind,
  draftSummary,
  draftJson,
  onCreateInvoiceDraft,
  showIntegrationHints = false,
}: FinancePrepStepDraftProps) {
  return (
    <FinancePrepPanel step={2} title="Rechnungsentwurf (FIN-2)" liveStatus={liveStatus}>
      <FinancePrepNotice notice={stepNotice} structuredAnnouncementRole="status" />
      <p id={FIN_PREP_A11Y.draftIntro} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
        Erzeugt einen Entwurf mit Seed-LV/Angebot und fester Demo-<code>measurementId</code>, sofern Traceability im Backend erfüllt ist. Optional: Skonto in Basispunkten (B2-1a), z. B.{" "}
        <strong>200</strong> = 2 % Abzug auf das LV-Netto nach Schritt 1 vor USt.
      </p>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Rechnungsart (billingKind)
        <select
          data-testid="finance-prep-billing-kind-select"
          value={draftBillingKind}
          onChange={(e) => setDraftBillingKind(e.target.value as InvoiceBillingKindApi)}
          aria-label="Rechnungsart für neuen Rechnungsentwurf"
          disabled={busy}
          style={{ width: "100%", fontSize: "0.85rem", marginTop: "0.25rem", padding: "0.35rem 0.5rem" }}
        >
          {BILLING_KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} ({o.value})
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Skonto (Basispunkte, 0–10_000)
        <input
          type="text"
          inputMode="numeric"
          data-testid="finance-prep-skonto-bps-input"
          value={draftSkontoBps}
          onChange={(e) => setDraftSkontoBps(e.target.value)}
          aria-label="Skonto in Basispunkten für neuen Rechnungsentwurf"
          aria-describedby={FIN_PREP_A11Y.draftIntro}
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem", marginTop: "0.25rem" }}
        />
      </label>
      <button type="button" onClick={() => void onCreateInvoiceDraft()} disabled={busy}>
        Rechnungsentwurf anlegen
      </button>
      {draftSummary ? (
        <p style={{ fontSize: "0.82rem", marginTop: "0.5rem", marginBottom: 0 }} role="status">
          {draftSummary}
        </p>
      ) : null}
      {showIntegrationHints && draftJson.trim() ? (
        <FinanceCollapsibleJson summary="Rohantwort API (POST /invoices)" json={draftJson} testId="finance-prep-draft-raw-json" />
      ) : null}
    </FinancePrepPanel>
  );
}

export const FinancePrepStepDraft = memo(FinancePrepStepDraftInner);
