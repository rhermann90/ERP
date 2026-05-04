/**
 * FIN-5 §8.16 — Mandanten-Default und Projekt-Override (Lesen + Schreiben).
 * Schreibpfade nur bei SoT-Aktion **MANAGE_INVOICE_TAX_SETTINGS** (wie FIN-3).
 */
import { memo, useEffect, useMemo, useState } from "react";
import type { InvoiceTaxRegimeApi, ProjectInvoiceTaxOverrideRead, TenantInvoiceTaxProfileRead } from "../../../lib/api-client.js";
import { MANAGE_INVOICE_TAX_SETTINGS_ACTION_ID } from "../../../lib/finance-sot.js";
import { FinanceCollapsibleJson } from "../FinanceCollapsibleJson.js";
import { FinancePrepNotice } from "../FinancePrepNotice.js";
import { FinancePrepPanel } from "../FinancePrepPanel.js";
import type { FinNotice } from "../finance-prep-types.js";

const REGIME_OPTIONS: { value: InvoiceTaxRegimeApi; label: string }[] = [
  { value: "STANDARD_VAT_19", label: "Standard 19 % USt" },
  { value: "REVERSE_CHARGE", label: "Reverse Charge" },
  { value: "SMALL_BUSINESS_19", label: "Kleinunternehmen §19" },
  { value: "CONSTRUCTION_13B", label: "Bauleistungen §13b" },
];

export type FinanceInvoiceTaxSettingsPanelProps = {
  busy: boolean;
  liveStatus: string;
  canManageInvoiceTaxSettings: boolean;
  effectiveProjectId: string;
  tenantProfile: TenantInvoiceTaxProfileRead | null;
  projectOverride: ProjectInvoiceTaxOverrideRead | null;
  panelError: FinNotice | null;
  mutationResultJson: string;
  onLoadReads: () => void;
  onPatchTenant: (body: { defaultInvoiceTaxRegime: InvoiceTaxRegimeApi; reason: string }) => void;
  onPutProject: (body: { invoiceTaxRegime: InvoiceTaxRegimeApi; taxReasonCode?: string; reason: string }) => void;
  onDeleteProject: (reason: string) => void;
};

function FinanceInvoiceTaxSettingsPanelInner(props: FinanceInvoiceTaxSettingsPanelProps) {
  const [tenantReason, setTenantReason] = useState("Finanz-Vorbereitung PATCH Mandanten-Steuerprofil (FIN-5)");
  const [tenantRegime, setTenantRegime] = useState<InvoiceTaxRegimeApi>("STANDARD_VAT_19");
  const [putReason, setPutReason] = useState("Finanz-Vorbereitung PUT Projekt-Steueroverride (FIN-5)");
  const [putRegime, setPutRegime] = useState<InvoiceTaxRegimeApi>("STANDARD_VAT_19");
  const [putTaxReasonCode, setPutTaxReasonCode] = useState("");
  const [deleteReason, setDeleteReason] = useState("Finanz-Vorbereitung DELETE Projekt-Steueroverride (FIN-5)");

  useEffect(() => {
    if (props.tenantProfile) {
      setTenantRegime(props.tenantProfile.defaultInvoiceTaxRegime);
    }
  }, [props.tenantProfile]);

  useEffect(() => {
    const r = props.projectOverride?.invoiceTaxRegime;
    setPutRegime(r ?? "STANDARD_VAT_19");
  }, [props.projectOverride]);

  const tenantJson = useMemo(
    () => (props.tenantProfile ? JSON.stringify(props.tenantProfile, null, 2) : ""),
    [props.tenantProfile],
  );
  const projectJson = useMemo(
    () => (props.projectOverride ? JSON.stringify(props.projectOverride, null, 2) : ""),
    [props.projectOverride],
  );

  const hasProjectRow = props.projectOverride?.invoiceTaxRegime != null;
  const deleteDisabled = props.busy || !props.canManageInvoiceTaxSettings || !props.effectiveProjectId || !hasProjectRow;

  return (
    <div data-testid="finance-invoice-tax-panel">
      <FinancePrepPanel title="Steuerprofil Rechnung (FIN-5)" liveStatus={props.liveStatus}>
        <ol style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 0, paddingLeft: "1.2rem" }}>
          <li>
            Rechnung laden (Tab „Rechnung und Zahlung“) — lädt <code>allowed-actions</code> für SoT{" "}
            <code>{MANAGE_INVOICE_TAX_SETTINGS_ACTION_ID}</code>.
          </li>
          <li>
            <strong>Steuerprofil laden</strong> — GET Mandanten-Default und GET Projekt-Override (Projekt-ID aus geladener
            Rechnung oder FIN-1-Feld).
          </li>
          <li>
            Schreiben nur mit Berechtigung (gleiche Rollen wie Zahlungseingang); <code>reason</code> je Request mindestens 5
            Zeichen.
          </li>
        </ol>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.65rem" }}>
          <button type="button" data-testid="finance-invoice-tax-load" disabled={props.busy} onClick={() => props.onLoadReads()}>
            Steuerprofil laden (GET)
          </button>
        </div>
        <FinancePrepNotice notice={props.panelError} />
        <FinanceCollapsibleJson summary="Rohantwort GET Mandanten-Steuerprofil (JSON)" json={tenantJson} testId="finance-invoice-tax-tenant-json" />
        <FinanceCollapsibleJson summary="Rohantwort GET Projekt-Override (JSON)" json={projectJson} testId="finance-invoice-tax-project-json" />

        <h4 style={{ fontSize: "0.88rem", margin: "0.75rem 0 0.35rem" }}>Mandanten-Default ändern (PATCH)</h4>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Steuerregime
          <select
            value={tenantRegime}
            onChange={(e) => setTenantRegime(e.target.value as InvoiceTaxRegimeApi)}
            disabled={props.busy || !props.canManageInvoiceTaxSettings}
            style={{ display: "block", marginTop: "0.25rem", width: "100%", maxWidth: "24rem" }}
          >
            {REGIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Grund (min. 5 Zeichen)
          <input
            type="text"
            value={tenantReason}
            onChange={(e) => setTenantReason(e.target.value)}
            disabled={props.busy || !props.canManageInvoiceTaxSettings}
            aria-label="Grund Mandanten-Steuerprofil PATCH"
            style={{ display: "block", marginTop: "0.25rem", width: "100%", fontFamily: "monospace", fontSize: "0.85rem" }}
          />
        </label>
        <button
          type="button"
          data-testid="finance-invoice-tax-patch-tenant"
          disabled={props.busy || !props.canManageInvoiceTaxSettings}
          title={
            props.canManageInvoiceTaxSettings
              ? "PATCH /finance/invoice-tax-profile"
              : `Aktion ${MANAGE_INVOICE_TAX_SETTINGS_ACTION_ID} fehlt in allowed-actions (Rechnung laden).`
          }
          onClick={() =>
            props.onPatchTenant({ defaultInvoiceTaxRegime: tenantRegime, reason: tenantReason.trim() || "patch" })
          }
        >
          Mandanten-Default speichern (PATCH)
        </button>

        <h4 style={{ fontSize: "0.88rem", margin: "0.85rem 0 0.35rem" }}>Projekt-Override</h4>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 0.5rem" }}>
          Projekt-UUID: <code>{props.effectiveProjectId || "(keine gültige UUID — Rechnung laden oder Projekt-ID setzen)"}</code>
        </p>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Steuerregime (PUT)
          <select
            value={putRegime}
            onChange={(e) => setPutRegime(e.target.value as InvoiceTaxRegimeApi)}
            disabled={props.busy || !props.canManageInvoiceTaxSettings || !props.effectiveProjectId}
            style={{ display: "block", marginTop: "0.25rem", width: "100%", maxWidth: "24rem" }}
          >
            {REGIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          taxReasonCode (optional, max. 128)
          <input
            type="text"
            value={putTaxReasonCode}
            onChange={(e) => setPutTaxReasonCode(e.target.value)}
            disabled={props.busy || !props.canManageInvoiceTaxSettings || !props.effectiveProjectId}
            style={{ display: "block", marginTop: "0.25rem", width: "100%" }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Grund PUT (min. 5 Zeichen)
          <input
            type="text"
            value={putReason}
            onChange={(e) => setPutReason(e.target.value)}
            disabled={props.busy || !props.canManageInvoiceTaxSettings || !props.effectiveProjectId}
            aria-label="Grund Projekt-Override PUT"
            style={{ display: "block", marginTop: "0.25rem", width: "100%", fontFamily: "monospace", fontSize: "0.85rem" }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <button
            type="button"
            data-testid="finance-invoice-tax-put-project"
            disabled={props.busy || !props.canManageInvoiceTaxSettings || !props.effectiveProjectId}
            onClick={() =>
              props.onPutProject({
                invoiceTaxRegime: putRegime,
                taxReasonCode: putTaxReasonCode.trim() || undefined,
                reason: putReason.trim() || "put",
              })
            }
          >
            Projekt-Override speichern (PUT)
          </button>
        </div>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Grund DELETE (min. 5 Zeichen)
          <input
            type="text"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            disabled={props.busy || !props.canManageInvoiceTaxSettings || !props.effectiveProjectId}
            aria-label="Grund Projekt-Override DELETE"
            style={{ display: "block", marginTop: "0.25rem", width: "100%", fontFamily: "monospace", fontSize: "0.85rem" }}
          />
        </label>
        <button type="button" data-testid="finance-invoice-tax-delete-project" disabled={deleteDisabled} onClick={() => props.onDeleteProject(deleteReason.trim() || "delete")}>
          Projekt-Override entfernen (DELETE)
        </button>

        <FinanceCollapsibleJson
          summary="Letzte Schreib-Antwort (PATCH/PUT, JSON)"
          json={props.mutationResultJson}
          defaultOpen
          testId="finance-invoice-tax-mutation-json"
        />
      </FinancePrepPanel>
    </div>
  );
}

export const FinanceInvoiceTaxSettingsPanel = memo(FinanceInvoiceTaxSettingsPanelInner);
