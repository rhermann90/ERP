import { memo } from "react";
import { FinanceCollapsibleJson } from "../FinanceCollapsibleJson.js";
import { FinancePrepPanel } from "../FinancePrepPanel.js";

export type FinancePrepStepAuditProps = {
  busy: boolean;
  auditJson: string;
  onLoadAuditEvents: () => void;
};

function FinancePrepStepAuditInner({ busy, auditJson, onLoadAuditEvents }: FinancePrepStepAuditProps) {
  return (
    <FinancePrepPanel step={7} title="Audit — Nachvollziehbarkeit">
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 0 }}>
        <code>GET /audit-events</code> — Leserecht nur für <strong>ADMIN</strong>, <strong>BUCHHALTUNG</strong>,{" "}
        <strong>GESCHAEFTSFUEHRUNG</strong> (sonst 403 <code>FORBIDDEN_AUDIT_READ</code>).
      </p>
      <button type="button" onClick={() => void onLoadAuditEvents()} disabled={busy}>
        Audit-Ereignisse laden (letzte 15)
      </button>
      <FinanceCollapsibleJson summary="Rohantwort GET /audit-events (JSON)" json={auditJson} />
    </FinancePrepPanel>
  );
}

export const FinancePrepStepAudit = memo(FinancePrepStepAuditInner);
