import { memo } from "react";
import { FinanceCollapsibleJson } from "../FinanceCollapsibleJson.js";
import { FinancePrepNotice } from "../FinancePrepNotice.js";
import { FinancePrepPanel } from "../FinancePrepPanel.js";
import type { FinNotice } from "../finance-prep-types.js";
import { DEMO_PROJECT_ID, FIN_PREP_A11Y } from "../finance-preparation-meta.js";

export type FinancePrepStepTermsProps = {
  busy: boolean;
  liveStatus: string;
  stepNotice: FinNotice | null;
  projectId: string;
  setProjectId: (v: string) => void;
  termsLabel: string;
  setTermsLabel: (v: string) => void;
  listJson: string;
  onLoadPaymentTerms: () => void;
  onCreatePaymentTermsVersion: () => void;
};

function FinancePrepStepTermsInner({
  busy,
  liveStatus,
  stepNotice,
  projectId,
  setProjectId,
  termsLabel,
  setTermsLabel,
  listJson,
  onLoadPaymentTerms,
  onCreatePaymentTermsVersion,
}: FinancePrepStepTermsProps) {
  return (
    <FinancePrepPanel step={1} title="Zahlungsbedingungen (FIN-1)" liveStatus={liveStatus}>
      <FinancePrepNotice notice={stepNotice} structuredAnnouncementRole="status" />
      <p
        id={FIN_PREP_A11Y.termsIntro}
        style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}
      >
        <code>GET /finance/payment-terms</code> und <code>POST …/versions</code> gelten je Projekt. Das Feld unten ist mit der Demo-Projekt-ID aus dem Memory-Seed vorbelegt (
        <code>{DEMO_PROJECT_ID}</code>
        ).
      </p>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Projekt-ID (UUID)
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          aria-label="Projekt-ID (UUID)"
          aria-describedby={FIN_PREP_A11Y.termsIntro}
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem", marginTop: "0.25rem" }}
        />
      </label>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Bezeichnung neuer Version
        <input
          type="text"
          value={termsLabel}
          onChange={(e) => setTermsLabel(e.target.value)}
          aria-describedby={FIN_PREP_A11Y.termsIntro}
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

export const FinancePrepStepTerms = memo(FinancePrepStepTermsInner);
