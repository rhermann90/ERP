import { memo, useMemo } from "react";
import { FinanceCollapsibleJson } from "./FinanceCollapsibleJson.js";
import { FinancePrepPanel } from "./FinancePrepPanel.js";
import type { DunningEmailFooterData } from "./finance-prep-helpers.js";
import {
  impressumComplianceTierExplanationDe,
  impressumComplianceTierTitleDe,
  impressumGapLabelDe,
} from "./finance-prep-helpers.js";
import type { FinNotice } from "./finance-prep-types.js";
import { RECORD_DUNNING_REMINDER_ACTION_ID } from "../../lib/finance-sot.js";
import { repoDocHref } from "../../lib/repo-doc-links.js";

export type FinancePreparationDunningPanelProps = {
  busy: boolean;
  /** JSON von `GET /finance/dunning-reminder-config` (MVP-Defaults), leer bis geladen. */
  dunningReminderConfigJson: string;
  /** JSON von `GET /finance/dunning-reminder-templates` (M4 Slice 1). */
  dunningTemplatesJson: string;
  /** JSON von `GET /finance/dunning-email-footer` (M4 Slice 3). */
  dunningEmailFooterJson: string;
  dunningStageOrdinal: string;
  setDunningStageOrdinal: (v: string) => void;
  dunningNote: string;
  setDunningNote: (v: string) => void;
  canRecordDunningReminder: boolean;
  invoiceIdLooksValid: boolean;
  dunningPanelError: FinNotice | null;
  dunningResultJson: string;
  onSubmitDunningReminder: () => void;
  configPutJson: string;
  setConfigPutJson: (v: string) => void;
  configPutReason: string;
  setConfigPutReason: (v: string) => void;
  onPrefillConfigPutFromGet: () => void;
  onSubmitDunningConfigPut: () => void;
  configPatchOrdinal: string;
  setConfigPatchOrdinal: (v: string) => void;
  configPatchDays: string;
  setConfigPatchDays: (v: string) => void;
  configPatchFee: string;
  setConfigPatchFee: (v: string) => void;
  configPatchLabel: string;
  setConfigPatchLabel: (v: string) => void;
  configPatchReason: string;
  setConfigPatchReason: (v: string) => void;
  onSubmitDunningConfigPatch: () => void;
  configDeleteOrdinal: string;
  setConfigDeleteOrdinal: (v: string) => void;
  configDeleteReason: string;
  setConfigDeleteReason: (v: string) => void;
  onSubmitDunningConfigDelete: () => void;
  /** GET-Konfig + GET-Vorlagen erneut laden (nach Lesepfad-Fehler). */
  onReloadDunningReads: () => void;
  hasLoadedInvoice: boolean;
  dunningEmailPreviewJson: string;
  dunningEmailSendStubJson: string;
  dunningEmailRecipient: string;
  setDunningEmailRecipient: (v: string) => void;
  dunningEmailSendJson: string;
  canSendDunningReminderEmail: boolean;
  footerPatchReason: string;
  setFooterPatchReason: (v: string) => void;
  footerCompanyLegalName: string;
  setFooterCompanyLegalName: (v: string) => void;
  footerStreetLine: string;
  setFooterStreetLine: (v: string) => void;
  footerPostalCode: string;
  setFooterPostalCode: (v: string) => void;
  footerCity: string;
  setFooterCity: (v: string) => void;
  footerCountryCode: string;
  setFooterCountryCode: (v: string) => void;
  footerPublicEmail: string;
  setFooterPublicEmail: (v: string) => void;
  footerPublicPhone: string;
  setFooterPublicPhone: (v: string) => void;
  footerLegalRepresentative: string;
  setFooterLegalRepresentative: (v: string) => void;
  footerRegisterCourt: string;
  setFooterRegisterCourt: (v: string) => void;
  footerRegisterNumber: string;
  setFooterRegisterNumber: (v: string) => void;
  footerVatId: string;
  setFooterVatId: (v: string) => void;
  footerSignatureLine: string;
  setFooterSignatureLine: (v: string) => void;
  onPrefillFooterPatchFromGet: () => void;
  onSubmitFooterPatch: () => void;
  onSubmitEmailPreview: () => void;
  onSubmitEmailSendStub: () => void;
  onSubmitEmailSend: () => void;
};

function FinancePreparationDunningPanelInner({
  busy,
  dunningReminderConfigJson,
  dunningTemplatesJson,
  dunningEmailFooterJson,
  dunningStageOrdinal,
  setDunningStageOrdinal,
  dunningNote,
  setDunningNote,
  canRecordDunningReminder,
  invoiceIdLooksValid,
  dunningPanelError,
  dunningResultJson,
  onSubmitDunningReminder,
  configPutJson,
  setConfigPutJson,
  configPutReason,
  setConfigPutReason,
  onPrefillConfigPutFromGet,
  onSubmitDunningConfigPut,
  configPatchOrdinal,
  setConfigPatchOrdinal,
  configPatchDays,
  setConfigPatchDays,
  configPatchFee,
  setConfigPatchFee,
  configPatchLabel,
  setConfigPatchLabel,
  configPatchReason,
  setConfigPatchReason,
  onSubmitDunningConfigPatch,
  configDeleteOrdinal,
  setConfigDeleteOrdinal,
  configDeleteReason,
  setConfigDeleteReason,
  onSubmitDunningConfigDelete,
  onReloadDunningReads,
  hasLoadedInvoice,
  dunningEmailPreviewJson,
  dunningEmailSendStubJson,
  dunningEmailRecipient,
  setDunningEmailRecipient,
  dunningEmailSendJson,
  canSendDunningReminderEmail,
  footerPatchReason,
  setFooterPatchReason,
  footerCompanyLegalName,
  setFooterCompanyLegalName,
  footerStreetLine,
  setFooterStreetLine,
  footerPostalCode,
  setFooterPostalCode,
  footerCity,
  setFooterCity,
  footerCountryCode,
  setFooterCountryCode,
  footerPublicEmail,
  setFooterPublicEmail,
  footerPublicPhone,
  setFooterPublicPhone,
  footerLegalRepresentative,
  setFooterLegalRepresentative,
  footerRegisterCourt,
  setFooterRegisterCourt,
  footerRegisterNumber,
  setFooterRegisterNumber,
  footerVatId,
  setFooterVatId,
  footerSignatureLine,
  setFooterSignatureLine,
  onPrefillFooterPatchFromGet,
  onSubmitFooterPatch,
  onSubmitEmailPreview,
  onSubmitEmailSendStub,
  onSubmitEmailSend,
}: FinancePreparationDunningPanelProps) {
  const readLoadFailed = Boolean(dunningPanelError && !dunningReminderConfigJson.trim());
  const emailFooterData = useMemo((): DunningEmailFooterData | null => {
    const raw = dunningEmailFooterJson.trim();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { data?: DunningEmailFooterData };
      const d = parsed?.data;
      if (!d || typeof d.impressumComplianceTier !== "string" || !Array.isArray(d.impressumGaps)) return null;
      return d;
    } catch {
      return null;
    }
  }, [dunningEmailFooterJson]);
  return (
    <FinancePrepPanel step={6} title="Mahn-Ereignis (FIN-4)">
      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 0 }}>
        Nach „Rechnung laden“ prüft die UI SoT <code>{RECORD_DUNNING_REMINDER_ACTION_ID}</code>. <strong>M4 Slice 4:</strong> <code>POST …/dunning-reminders/email-preview</code> (Plain-Text) und <code>POST …/send-email-stub</code> (Audit, kein SMTP). <strong>M4 Slice 5a:</strong> <code>POST …/send-email</code> mit Header <code>Idempotency-Key</code> und SMTP (<code>ERP_SMTP_*</code>), wenn Footer technisch bereit ist. Konfig- und Vorlagen-Lesepfade beim Öffnen:{" "}
        <code>GET /finance/dunning-reminder-config</code>, <code>GET /finance/dunning-reminder-templates</code>, <code>GET /finance/dunning-email-footer</code>. Stammdaten: <code>PATCH /finance/dunning-email-footer</code> (Formular unten). Vorlagentext:{" "}
        <code>PATCH /finance/dunning-reminder-templates/stages/…/channels/EMAIL|PRINT</code> (§8.10-Pflichtplatzhalter, sonst <code>400</code>).
      </p>
      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.35rem", marginBottom: "0.5rem" }}>
        Fehler von Lesepfad oder Schreibaktionen erscheinen <strong>über den Tabs</strong> (<code>403</code> Rolle, <code>503</code> ohne Postgres, Validierung). Ohne erfolgreichen Lesepfad bleiben die JSON-Ausklappfelder leer — bei Lesepfad-Fehler „Mahn-Lesepfade erneut laden“ nutzen.
      </p>
      {readLoadFailed ? (
        <div style={{ marginBottom: "0.65rem" }}>
          <button type="button" disabled={busy} onClick={() => void onReloadDunningReads()} aria-label="Mahn-Lesepfade und E-Mail-Footer erneut laden">
            Mahn-Lesepfade erneut laden
          </button>
        </div>
      ) : null}
      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.65rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
        <strong>Mandanten-Mahnlauf (Automation, Kandidaten, Batch):</strong> Tab <strong>Grundeinstellungen Mahnlauf</strong> (Hauptnavigation) —{" "}
        <code>GET|PATCH …/dunning-reminder-automation</code>, <code>GET …/dunning-reminder-candidates</code>, <code>POST …/dunning-reminder-run</code> (siehe{" "}
        <a href={repoDocHref("docs/adr/0011-fin4-semi-dunning-context.md")}>ADR-0011</a>
        {", "}
        <a href={repoDocHref("docs/contracts/FIN4-external-client-integration.md")}>FIN4-external-client-integration</a>).
      </p>
      {dunningReminderConfigJson ? (
        <FinanceCollapsibleJson summary="Mahnstufen-Konfiguration (GET /finance/dunning-reminder-config)" json={dunningReminderConfigJson} />
      ) : null}
      {dunningTemplatesJson ? (
        <FinanceCollapsibleJson summary="Mahn-Vorlagen (GET /finance/dunning-reminder-templates)" json={dunningTemplatesJson} />
      ) : null}
      {dunningEmailFooterJson.trim() ? (
        <>
          {emailFooterData ? (
            <div
              role="region"
              aria-label="Impressum-Compliance, heuristisch"
              style={{
                marginTop: "0.65rem",
                padding: "0.55rem 0.65rem",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface-muted, rgba(127, 127, 127, 0.08))",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
              }}
            >
              <p style={{ margin: "0 0 0.35rem", color: "var(--text-primary)" }}>
                <strong>{impressumComplianceTierTitleDe(emailFooterData.impressumComplianceTier)}</strong>
                {" — "}
                <span>
                  Techn. Footer bereit:{" "}
                  <strong>{emailFooterData.readyForEmailFooter ? "ja" : "nein"}</strong>
                </span>
              </p>
              <p style={{ margin: "0 0 0.45rem" }}>{impressumComplianceTierExplanationDe(emailFooterData)}</p>
              {emailFooterData.impressumGaps.length > 0 ? (
                <>
                  <p style={{ margin: "0 0 0.25rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    Heuristik-Hinweise (mit API-Code)
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "1.15rem" }}>
                    {emailFooterData.impressumGaps.map((code) => (
                      <li key={code} style={{ marginBottom: "0.2rem" }}>
                        {impressumGapLabelDe(code)}{" "}
                        <code style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{code}</code>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p style={{ margin: 0 }}>Keine zusätzlichen Heuristik-Hinweise in dieser Antwort.</p>
              )}
            </div>
          ) : null}
          <FinanceCollapsibleJson summary="E-Mail-Footer / Impressum (GET /finance/dunning-email-footer)" json={dunningEmailFooterJson} />
        </>
      ) : null}

      <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "0.75rem 0" }} />
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 0 }}>
        <strong>PATCH E-Mail-Footer</strong> — mindestens ein Feld und <code>reason</code> (≥5); Rolle wie Mahnstufen-Konfiguration. Ohne Postgres <code>503</code>{" "}
        <code>DUNNING_EMAIL_FOOTER_NOT_PERSISTABLE</code>.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.4rem" }}>
        <button type="button" disabled={busy || !dunningEmailFooterJson.trim()} onClick={() => onPrefillFooterPatchFromGet()}>
          Footer-Felder aus GET übernehmen
        </button>
        <button type="button" disabled={busy} onClick={() => void onSubmitFooterPatch()}>
          PATCH /finance/dunning-email-footer
        </button>
      </div>
      <label style={{ display: "block", marginBottom: "0.35rem" }}>
        PATCH — reason
        <input
          type="text"
          value={footerPatchReason}
          onChange={(e) => setFooterPatchReason(e.target.value)}
          style={{ width: "100%", marginTop: "0.15rem", fontSize: "0.85rem" }}
        />
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))",
          gap: "0.35rem",
          marginBottom: "0.5rem",
        }}
      >
        <label>
          Firma
          <input
            type="text"
            value={footerCompanyLegalName}
            onChange={(e) => setFooterCompanyLegalName(e.target.value)}
            style={{ width: "100%", marginTop: "0.12rem", fontSize: "0.82rem" }}
          />
        </label>
        <label>
          Straße
          <input
            type="text"
            value={footerStreetLine}
            onChange={(e) => setFooterStreetLine(e.target.value)}
            style={{ width: "100%", marginTop: "0.12rem", fontSize: "0.82rem" }}
          />
        </label>
        <label>
          PLZ
          <input
            type="text"
            value={footerPostalCode}
            onChange={(e) => setFooterPostalCode(e.target.value)}
            style={{ width: "100%", marginTop: "0.12rem", fontSize: "0.82rem" }}
          />
        </label>
        <label>
          Ort
          <input
            type="text"
            value={footerCity}
            onChange={(e) => setFooterCity(e.target.value)}
            style={{ width: "100%", marginTop: "0.12rem", fontSize: "0.82rem" }}
          />
        </label>
        <label>
          Land (ISO-2)
          <input
            type="text"
            value={footerCountryCode}
            onChange={(e) => setFooterCountryCode(e.target.value)}
            style={{ width: "100%", marginTop: "0.12rem", fontSize: "0.82rem" }}
          />
        </label>
        <label>
          Öffentliche E-Mail
          <input
            type="text"
            value={footerPublicEmail}
            onChange={(e) => setFooterPublicEmail(e.target.value)}
            style={{ width: "100%", marginTop: "0.12rem", fontSize: "0.82rem" }}
          />
        </label>
        <label>
          Telefon
          <input
            type="text"
            value={footerPublicPhone}
            onChange={(e) => setFooterPublicPhone(e.target.value)}
            style={{ width: "100%", marginTop: "0.12rem", fontSize: "0.82rem" }}
          />
        </label>
        <label>
          Vertretung
          <input
            type="text"
            value={footerLegalRepresentative}
            onChange={(e) => setFooterLegalRepresentative(e.target.value)}
            style={{ width: "100%", marginTop: "0.12rem", fontSize: "0.82rem" }}
          />
        </label>
        <label>
          Registergericht
          <input
            type="text"
            value={footerRegisterCourt}
            onChange={(e) => setFooterRegisterCourt(e.target.value)}
            style={{ width: "100%", marginTop: "0.12rem", fontSize: "0.82rem" }}
          />
        </label>
        <label>
          Registernummer
          <input
            type="text"
            value={footerRegisterNumber}
            onChange={(e) => setFooterRegisterNumber(e.target.value)}
            style={{ width: "100%", marginTop: "0.12rem", fontSize: "0.82rem" }}
          />
        </label>
        <label>
          USt-Id
          <input
            type="text"
            value={footerVatId}
            onChange={(e) => setFooterVatId(e.target.value)}
            style={{ width: "100%", marginTop: "0.12rem", fontSize: "0.82rem" }}
          />
        </label>
        <label>
          Signaturzeile
          <input
            type="text"
            value={footerSignatureLine}
            onChange={(e) => setFooterSignatureLine(e.target.value)}
            style={{ width: "100%", marginTop: "0.12rem", fontSize: "0.82rem" }}
          />
        </label>
      </div>

      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.5rem 0 0.25rem" }}>
        <strong>M4 Slice 4–5a — E-Mail</strong> (Stufe wie „Mahn-Stufe“ unten): Vorschau = Leserecht; Versand-Stub = gleiche SoT wie Mahn-Ereignis; produktiver Versand = gleiche SoT + technisch vollständiger Footer + SMTP-Konfiguration auf dem Server.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
        <button type="button" disabled={busy || !hasLoadedInvoice} onClick={() => void onSubmitEmailPreview()} title="Benötigt geladene Rechnung (Schritt 3).">
          POST …/email-preview
        </button>
        <button
          type="button"
          disabled={busy || !canRecordDunningReminder}
          onClick={() => void onSubmitEmailSendStub()}
          title={canRecordDunningReminder ? "Audit-Stub ohne SMTP" : `Benötigt SoT ${RECORD_DUNNING_REMINDER_ACTION_ID}`}
        >
          POST …/send-email-stub
        </button>
      </div>
      <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.82rem" }}>
        Empfänger (Slice 5a, explizit)
        <input
          type="email"
          value={dunningEmailRecipient}
          onChange={(e) => setDunningEmailRecipient(e.target.value)}
          autoComplete="email"
          style={{ width: "100%", marginTop: "0.12rem", fontFamily: "monospace", fontSize: "0.82rem" }}
        />
      </label>
      <div style={{ marginBottom: "0.5rem" }}>
        <button
          type="button"
          disabled={busy || !canSendDunningReminderEmail || !dunningEmailRecipient.trim()}
          onClick={() => void onSubmitEmailSend()}
          title={
            canSendDunningReminderEmail
              ? "Neuer Idempotency-Key pro Klick; SMTP ERP_SMTP_* auf dem Server"
              : `Benötigt SoT ${RECORD_DUNNING_REMINDER_ACTION_ID}, geladene Rechnung und readyForEmailFooter=true`
          }
        >
          POST …/send-email (SMTP)
        </button>
      </div>
      {dunningEmailPreviewJson.trim() ? (
        <FinanceCollapsibleJson summary="E-Mail-Vorschau (JSON)" json={dunningEmailPreviewJson} />
      ) : null}
      {dunningEmailSendStubJson.trim() ? (
        <FinanceCollapsibleJson summary="E-Mail-Versand-Stub (JSON)" json={dunningEmailSendStubJson} />
      ) : null}
      {dunningEmailSendJson.trim() ? (
        <FinanceCollapsibleJson summary="E-Mail-Versand SMTP (JSON)" json={dunningEmailSendJson} />
      ) : null}

      <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "0.75rem 0" }} />
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 0 }}>
        Konfiguration schreiben: nur Rollen wie Zahlungseingang; ohne Postgres <code>503</code> (Domain-Code in der Fehlerbox). PUT-Body = OpenAPI{" "}
        <code>PutDunningReminderConfigRequest</code> (9× <code>stages</code> + <code>reason</code>).
      </p>
      <label style={{ display: "block", marginBottom: "0.35rem" }}>
        PUT — Standard-<code>reason</code> für „Aus GET vorbefüllen“
        <input
          type="text"
          value={configPutReason}
          onChange={(e) => setConfigPutReason(e.target.value)}
          style={{ width: "100%", marginTop: "0.2rem", fontSize: "0.85rem" }}
        />
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.35rem" }}>
        <button type="button" disabled={busy || !dunningReminderConfigJson} onClick={() => onPrefillConfigPutFromGet()}>
          PUT-JSON aus GET vorbefüllen
        </button>
        <button type="button" disabled={busy || !configPutJson.trim()} onClick={() => void onSubmitDunningConfigPut()}>
          PUT /finance/dunning-reminder-config
        </button>
      </div>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        PUT — JSON-Body
        <textarea
          value={configPutJson}
          onChange={(e) => setConfigPutJson(e.target.value)}
          rows={5}
          style={{ width: "100%", marginTop: "0.2rem", fontFamily: "monospace", fontSize: "0.78rem" }}
        />
      </label>

      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.5rem 0 0.25rem" }}>
        PATCH einzelne Stufe — mindestens ein Feld neben <code>reason</code>:
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem", marginBottom: "0.35rem" }}>
        <label>
          Ordinal
          <input
            type="text"
            inputMode="numeric"
            value={configPatchOrdinal}
            onChange={(e) => setConfigPatchOrdinal(e.target.value)}
            style={{ width: "100%", marginTop: "0.15rem", fontFamily: "monospace", fontSize: "0.85rem" }}
          />
        </label>
        <label>
          daysAfterDue (optional)
          <input
            type="text"
            inputMode="numeric"
            value={configPatchDays}
            onChange={(e) => setConfigPatchDays(e.target.value)}
            style={{ width: "100%", marginTop: "0.15rem", fontFamily: "monospace", fontSize: "0.85rem" }}
          />
        </label>
        <label>
          feeCents (optional)
          <input
            type="text"
            inputMode="numeric"
            value={configPatchFee}
            onChange={(e) => setConfigPatchFee(e.target.value)}
            style={{ width: "100%", marginTop: "0.15rem", fontFamily: "monospace", fontSize: "0.85rem" }}
          />
        </label>
        <label>
          label (optional)
          <input
            type="text"
            value={configPatchLabel}
            onChange={(e) => setConfigPatchLabel(e.target.value)}
            style={{ width: "100%", marginTop: "0.15rem", fontSize: "0.85rem" }}
          />
        </label>
      </div>
      <label style={{ display: "block", marginBottom: "0.35rem" }}>
        PATCH — reason
        <input
          type="text"
          value={configPatchReason}
          onChange={(e) => setConfigPatchReason(e.target.value)}
          style={{ width: "100%", marginTop: "0.15rem", fontSize: "0.85rem" }}
        />
      </label>
      <button type="button" disabled={busy} onClick={() => void onSubmitDunningConfigPatch()} style={{ marginBottom: "0.5rem" }}>
        PATCH Stufe
      </button>

      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.5rem 0 0.25rem" }}>
        DELETE — Soft-Delete einer Stufe:
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "flex-end", marginBottom: "0.5rem" }}>
        <label>
          Ordinal
          <input
            type="text"
            inputMode="numeric"
            value={configDeleteOrdinal}
            onChange={(e) => setConfigDeleteOrdinal(e.target.value)}
            style={{ width: "4rem", marginTop: "0.15rem", fontFamily: "monospace", fontSize: "0.85rem" }}
          />
        </label>
        <label style={{ flex: "1 1 12rem" }}>
          reason
          <input
            type="text"
            value={configDeleteReason}
            onChange={(e) => setConfigDeleteReason(e.target.value)}
            style={{ width: "100%", marginTop: "0.15rem", fontSize: "0.85rem" }}
          />
        </label>
        <button type="button" disabled={busy} onClick={() => void onSubmitDunningConfigDelete()}>
          DELETE Stufe
        </button>
      </div>

      <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "0.75rem 0" }} />
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Mahn-Stufe (1–9)
        <input
          type="text"
          inputMode="numeric"
          value={dunningStageOrdinal}
          onChange={(e) => setDunningStageOrdinal(e.target.value)}
          aria-label="Mahn-Stufe Ordinal"
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem", marginTop: "0.25rem" }}
        />
      </label>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Notiz (optional)
        <textarea
          value={dunningNote}
          onChange={(e) => setDunningNote(e.target.value)}
          rows={2}
          style={{ width: "100%", marginTop: "0.25rem", fontSize: "0.85rem" }}
        />
      </label>
      <button
        type="button"
        onClick={() => void onSubmitDunningReminder()}
        disabled={busy || !canRecordDunningReminder || !invoiceIdLooksValid}
        title={
          !invoiceIdLooksValid
            ? "Gültige Rechnungs-ID (Schritt 3) erforderlich."
            : canRecordDunningReminder
              ? "Mahn-Ereignis protokollieren"
              : "Zuerst Rechnung laden; RECORD_DUNNING_REMINDER muss in allowed-actions sein."
        }
      >
        Mahn-Ereignis speichern
      </button>
      <FinanceCollapsibleJson summary="Rohantwort Mahn-Ereignis (JSON)" json={dunningResultJson} />
    </FinancePrepPanel>
  );
}

export const FinancePreparationDunningPanel = memo(FinancePreparationDunningPanelInner);
