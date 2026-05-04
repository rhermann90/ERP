import { memo } from "react";
import { DEMO_SEED_IDS } from "../../../lib/demo-seed-ids.js";
import { FinanceCollapsibleJson } from "../FinanceCollapsibleJson.js";
import { FinancePrepPanel } from "../FinancePrepPanel.js";
import type { SotEntityType } from "../finance-preparation-meta.js";
import { FIN_PREP_A11Y, SOT_ENTITY_TYPES } from "../finance-preparation-meta.js";

export type FinancePrepStepSotProps = {
  busy: boolean;
  invoiceIdRead: string;
  sotEntityType: SotEntityType;
  setSotEntityType: (t: SotEntityType) => void;
  sotDocumentId: string;
  setSotDocumentId: (v: string) => void;
  sotJson: string;
  onLoadSotAllowedActions: () => void;
};

function FinancePrepStepSotInner({
  busy,
  invoiceIdRead,
  sotEntityType,
  setSotEntityType,
  sotDocumentId,
  setSotDocumentId,
  sotJson,
  onLoadSotAllowedActions,
}: FinancePrepStepSotProps) {
  return (
    <FinancePrepPanel step={4} title="SoT — erlaubte Aktionen (Fortgeschritten)">
      <p id={FIN_PREP_A11Y.sotIntro} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
        <code>GET /documents/:id/allowed-actions</code> — gleiche Quelle wie die Dokument-Shell; <code>id</code> ist die UUID der
        gewählten Entität (nicht immer die Rechnungs-ID).
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <button
          type="button"
          onClick={() => {
            setSotEntityType("OFFER_VERSION");
            setSotDocumentId(DEMO_SEED_IDS.offerVersionId);
          }}
          disabled={busy}
        >
          Voreinstellung: Angebotsversion
        </button>
        <button
          type="button"
          onClick={() => {
            setSotEntityType("MEASUREMENT_VERSION");
            setSotDocumentId(DEMO_SEED_IDS.measurementVersionId);
          }}
          disabled={busy}
        >
          Voreinstellung: Aufmaßversion
        </button>
        <button
          type="button"
          onClick={() => {
            setSotEntityType("LV_VERSION");
            setSotDocumentId(DEMO_SEED_IDS.lvVersionId);
          }}
          disabled={busy}
        >
          Voreinstellung: LV-Version
        </button>
        <button
          type="button"
          onClick={() => {
            setSotEntityType("LV_STRUCTURE_NODE");
            setSotDocumentId(DEMO_SEED_IDS.lvBereichId);
          }}
          disabled={busy}
        >
          Voreinstellung: LV-Bereich
        </button>
        <button
          type="button"
          onClick={() => {
            setSotEntityType("LV_POSITION");
            setSotDocumentId(DEMO_SEED_IDS.lvPositionId);
          }}
          disabled={busy}
        >
          Voreinstellung: LV-Position
        </button>
        <button
          type="button"
          onClick={() => {
            setSotEntityType("INVOICE");
            setSotDocumentId(invoiceIdRead.trim());
          }}
          disabled={busy}
        >
          Rechnungs-ID aus Feld übernehmen
        </button>
      </div>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        entityType
        <select
          value={sotEntityType}
          onChange={(e) => setSotEntityType(e.target.value as SotEntityType)}
          aria-label="entityType für allowed-actions"
          aria-describedby={FIN_PREP_A11Y.sotIntro}
          style={{ display: "block", width: "100%", marginTop: "0.25rem", maxWidth: "28rem" }}
        >
          {SOT_ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Dokument-ID (UUID)
        <input
          type="text"
          value={sotDocumentId}
          onChange={(e) => setSotDocumentId(e.target.value)}
          aria-label="Dokument-ID für allowed-actions"
          aria-describedby={FIN_PREP_A11Y.sotIntro}
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem", marginTop: "0.25rem" }}
        />
      </label>
      <button type="button" onClick={() => void onLoadSotAllowedActions()} disabled={busy}>
        Erlaubte Aktionen laden
      </button>
      <FinanceCollapsibleJson summary="Rohantwort allowed-actions (JSON)" json={sotJson} />
    </FinancePrepPanel>
  );
}

export const FinancePrepStepSot = memo(FinancePrepStepSotInner);
