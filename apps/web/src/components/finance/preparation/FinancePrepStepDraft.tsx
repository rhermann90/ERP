import { memo } from "react";
import { FinanceCollapsibleJson } from "../FinanceCollapsibleJson.js";
import { FinancePrepPanel } from "../FinancePrepPanel.js";
import { FIN_PREP_A11Y } from "../finance-preparation-meta.js";

export type FinancePrepStepDraftProps = {
  busy: boolean;
  draftSkontoBps: string;
  setDraftSkontoBps: (v: string) => void;
  draftSummary: string | null;
  draftJson: string;
  onCreateInvoiceDraft: () => void;
};

function FinancePrepStepDraftInner({
  busy,
  draftSkontoBps,
  setDraftSkontoBps,
  draftSummary,
  draftJson,
  onCreateInvoiceDraft,
}: FinancePrepStepDraftProps) {
  return (
    <FinancePrepPanel step={2} title="Rechnungsentwurf (FIN-2)">
      <p id={FIN_PREP_A11Y.draftIntro} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
        Erzeugt einen Entwurf mit Seed-LV/Angebot, sofern Traceability im Backend erfüllt ist. Optional: Skonto in Basispunkten (B2-1a), z. B.{" "}
        <strong>200</strong> = 2 % Abzug auf das LV-Netto nach Schritt 1 vor USt.
      </p>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Skonto (Basispunkte, 0–10_000)
        <input
          type="text"
          inputMode="numeric"
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
      <FinanceCollapsibleJson summary="Rohantwort API (POST /invoices)" json={draftJson} />
    </FinancePrepPanel>
  );
}

export const FinancePrepStepDraft = memo(FinancePrepStepDraftInner);
