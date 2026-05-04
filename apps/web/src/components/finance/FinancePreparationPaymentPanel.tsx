import { memo } from "react";
import { FinanceCollapsibleJson } from "./FinanceCollapsibleJson.js";
import { FinancePrepNotice } from "./FinancePrepNotice.js";
import { FinancePrepPanel } from "./FinancePrepPanel.js";
import type { FinNotice } from "./finance-prep-types.js";
import { FIN_PREP_A11Y } from "./finance-preparation-meta.js";
import { RECORD_PAYMENT_INTAKE_ACTION_ID } from "../../lib/finance-sot.js";

export type FinancePreparationPaymentPanelProps = {
  busy: boolean;
  liveStatus: string;
  openCents: number | null;
  intakeAmountCents: string;
  setIntakeAmountCents: (v: string) => void;
  intakeExternalRef: string;
  setIntakeExternalRef: (v: string) => void;
  canRecordPaymentIntake: boolean;
  invoiceIdLooksValid: boolean;
  paymentPanelError: FinNotice | null;
  intakeResultJson: string;
  onApplyOpenBalance: () => void;
  onSubmitPaymentIntake: () => void;
};

function FinancePreparationPaymentPanelInner({
  busy,
  liveStatus,
  openCents,
  intakeAmountCents,
  setIntakeAmountCents,
  intakeExternalRef,
  setIntakeExternalRef,
  canRecordPaymentIntake,
  invoiceIdLooksValid,
  paymentPanelError,
  intakeResultJson,
  onApplyOpenBalance,
  onSubmitPaymentIntake,
}: FinancePreparationPaymentPanelProps) {
  return (
    <FinancePrepPanel step={5} title="Zahlungseingang (FIN-3)" liveStatus={liveStatus}>
      <ol id={FIN_PREP_A11Y.fin3Steps} style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 0, paddingLeft: "1.2rem" }}>
        <li>
          Rechnung laden (Schritt 3: <strong>Rechnung laden</strong>) — lädt automatisch <code>allowed-actions</code> für SoT{" "}
          <code>{RECORD_PAYMENT_INTAKE_ACTION_ID}</code>.
        </li>
        <li>
          Offenen Restbetrag übernehmen oder Cent-Betrag anpassen
          {openCents != null && openCents > 0 ? (
            <>
              {" "}
              (aktuell offen: <strong>{openCents}</strong> Cent).
            </>
          ) : (
            <> (zuerst Rechnung laden, wenn keine Daten angezeigt werden).</>
          )}
        </li>
        <li>
          <strong>Zahlung buchen</strong> — pro Klick neuer <code>Idempotency-Key</code> (UUID); Wiederholung mit gleichem Key liefert Replay (HTTP 200).
        </li>
      </ol>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
        <button type="button" onClick={onApplyOpenBalance} disabled={busy || openCents == null || openCents < 1}>
          Offenen Betrag übernehmen
        </button>
      </div>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Betrag (Cent, ganzzahlig)
        <input
          type="text"
          inputMode="numeric"
          value={intakeAmountCents}
          onChange={(e) => setIntakeAmountCents(e.target.value)}
          aria-label="Zahlungsbetrag in Cent"
          aria-describedby={FIN_PREP_A11Y.fin3Steps}
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem", marginTop: "0.25rem" }}
        />
      </label>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Externe Referenz (Bank / CSV)
        <input
          type="text"
          value={intakeExternalRef}
          onChange={(e) => setIntakeExternalRef(e.target.value)}
          aria-describedby={FIN_PREP_A11Y.fin3Steps}
          style={{ width: "100%", marginTop: "0.25rem" }}
        />
      </label>
      <FinancePrepNotice notice={paymentPanelError} />
      <button
        type="button"
        onClick={() => void onSubmitPaymentIntake()}
        disabled={busy || !canRecordPaymentIntake || !invoiceIdLooksValid}
        title={
          !invoiceIdLooksValid
            ? "Gültige Rechnungs-ID (Schritt 3) erforderlich."
            : canRecordPaymentIntake
              ? "Zahlung verbuchen (neuer Idempotency-Key pro Klick)"
              : "Zuerst Rechnung laden; Aktion RECORD_PAYMENT_INTAKE muss in allowed-actions sein."
        }
      >
        Zahlung verbuchen
      </button>
      <FinanceCollapsibleJson summary="Rohantwort Zahlungseingang (JSON)" json={intakeResultJson} />
    </FinancePrepPanel>
  );
}

export const FinancePreparationPaymentPanel = memo(FinancePreparationPaymentPanelInner);
