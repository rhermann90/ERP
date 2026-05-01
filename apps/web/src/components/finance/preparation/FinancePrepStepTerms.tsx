import { FinanceCollapsibleJson } from "../FinanceCollapsibleJson.js";
import { FinancePrepPanel } from "../FinancePrepPanel.js";

export type FinancePrepStepTermsProps = {
  busy: boolean;
  projectId: string;
  setProjectId: (v: string) => void;
  termsLabel: string;
  setTermsLabel: (v: string) => void;
  listJson: string;
  onLoadPaymentTerms: () => void;
  onCreatePaymentTermsVersion: () => void;
};

export function FinancePrepStepTerms({
  busy,
  projectId,
  setProjectId,
  termsLabel,
  setTermsLabel,
  listJson,
  onLoadPaymentTerms,
  onCreatePaymentTermsVersion,
}: FinancePrepStepTermsProps) {
  return (
    <FinancePrepPanel step={1} title="Zahlungsbedingungen (FIN-1)">
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        <span className="visually-hidden">Projekt-ID</span>
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          aria-label="Projekt-ID (UUID)"
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem" }}
        />
      </label>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Bezeichnung neuer Version
        <input
          type="text"
          value={termsLabel}
          onChange={(e) => setTermsLabel(e.target.value)}
          style={{ width: "100%", marginTop: "0.25rem" }}
        />
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <button type="button" onClick={() => void onLoadPaymentTerms()} disabled={busy}>
          GET Konditionen laden
        </button>
        <button type="button" onClick={() => void onCreatePaymentTermsVersion()} disabled={busy}>
          POST neue Version
        </button>
      </div>
      <FinanceCollapsibleJson summary="Rohantwort API (GET/POST Konditionen)" json={listJson} />
    </FinancePrepPanel>
  );
}
