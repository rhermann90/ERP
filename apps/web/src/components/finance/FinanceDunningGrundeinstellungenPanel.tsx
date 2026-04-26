/**
 * Mandanten-Mahnlauf (ADR-0011, FIN-4 M4 5b).
 *
 * **PL / Team-Default „Variante 1a“ (runMode OFF):** In der PWA sind **Dry-Run**, **EXECUTE** (5b-1) und **Batch-E-Mail** (5c)
 * deaktiviert, wenn der Server `runMode === "OFF"` meldet. **GET Kandidaten** bleibt erlaubt (Lesepfad,
 * Transparenz). HTTP **1b:** `POST /finance/dunning-reminder-run` und `POST …/send-emails` liefern **409** `DUNNING_REMINDER_RUN_DISABLED`.
 */
import { useMemo } from "react";
import { FinanceCollapsibleJson } from "./FinanceCollapsibleJson.js";
import { FinancePrepPanel } from "./FinancePrepPanel.js";
import type {
  DunningCandidatesEligibilityContextRead,
  DunningReminderCandidateRow,
  DunningReminderCandidatesReadResponse,
} from "../../lib/finance-dunning-api-types.js";
import { repoDocHref } from "../../lib/repo-doc-links.js";

/** Tooltip (nur Lesen): gleiche Frist/Kontext-Infos wie Tabelle, für Hover „Warum sichtbar?“. */
function dunningCandidateRowTitle(
  row: DunningReminderCandidateRow,
  stageOrdinal: number,
  asOfDate: string,
  ec: DunningCandidatesEligibilityContextRead,
): string {
  const bl = ec.federalStateCode ? `DE-${ec.federalStateCode} (Feiertage)` : "ohne DE-Bundesland";
  const prev =
    row.lastDunningStageOrdinal != null ? `Letzte Mahnstufe auf Rechnung: ${row.lastDunningStageOrdinal}. ` : "";
  return (
    `${prev}` +
    `Kandidat für Mahnstufe ${stageOrdinal} (asOfDate ${asOfDate}). ` +
    `Rechnung ${row.invoiceId}. Rechnungsfälligkeit ${row.dueDate}. ` +
    `Stufenfrist (Engine) ${row.stageDeadlineIso}. Offen ${row.openAmountCents} Cent. ` +
    `Kontext: ${ec.ianaTimezone}, ${ec.paymentTermDayKind}, Kanal ${ec.preferredDunningChannel}, ${bl}.`
  );
}

export type FinanceDunningGrundeinstellungenPanelProps = {
  busy: boolean;
  serverAutomationRunMode: "OFF" | "SEMI" | null;
  dunningAutomationJson: string;
  dunningAutomationRunMode: "OFF" | "SEMI";
  setDunningAutomationRunMode: (v: "OFF" | "SEMI") => void;
  dunningAutomationIanaTimezone: string;
  setDunningAutomationIanaTimezone: (v: string) => void;
  dunningAutomationFederalState: string;
  setDunningAutomationFederalState: (v: string) => void;
  dunningAutomationPaymentTermDayKind: "CALENDAR" | "BUSINESS";
  setDunningAutomationPaymentTermDayKind: (v: "CALENDAR" | "BUSINESS") => void;
  dunningAutomationPreferredChannel: "EMAIL" | "PRINT";
  setDunningAutomationPreferredChannel: (v: "EMAIL" | "PRINT") => void;
  dunningAutomationPatchReason: string;
  setDunningAutomationPatchReason: (v: string) => void;
  onSubmitDunningTenantAutomationPatch: () => void;
  dunningStageOrdinal: string;
  setDunningStageOrdinal: (v: string) => void;
  dunningBatchAsOfDate: string;
  setDunningBatchAsOfDate: (v: string) => void;
  dunningBatchRunJson: string;
  onDunningBatchDryRun: () => void;
  onDunningBatchExecute: () => void;
  canRecordDunningReminder: boolean;
  dunningCandidatesJson: string;
  onLoadDunningCandidates: () => void;
  dunningBatchEmailItemsJson: string;
  setDunningBatchEmailItemsJson: (v: string) => void;
  dunningBatchEmailResultJson: string;
  onPrefillBatchEmailItemsFromCandidates: () => void;
  onDunningBatchEmailDryRun: () => void;
  onDunningBatchEmailExecute: () => void;
};

function parseCandidatesResponse(raw: string): DunningReminderCandidatesReadResponse["data"] | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const o = JSON.parse(t) as DunningReminderCandidatesReadResponse;
    const d = o?.data;
    if (!d || typeof d.asOfDate !== "string" || typeof d.stageOrdinal !== "number") return null;
    if (!d.eligibilityContext || typeof d.eligibilityContext.ianaTimezone !== "string") return null;
    if (!Array.isArray(d.candidates)) return null;
    return d;
  } catch {
    return null;
  }
}

export function FinanceDunningGrundeinstellungenPanel({
  busy,
  serverAutomationRunMode,
  dunningAutomationJson,
  dunningAutomationRunMode,
  setDunningAutomationRunMode,
  dunningAutomationIanaTimezone,
  setDunningAutomationIanaTimezone,
  dunningAutomationFederalState,
  setDunningAutomationFederalState,
  dunningAutomationPaymentTermDayKind,
  setDunningAutomationPaymentTermDayKind,
  dunningAutomationPreferredChannel,
  setDunningAutomationPreferredChannel,
  dunningAutomationPatchReason,
  setDunningAutomationPatchReason,
  onSubmitDunningTenantAutomationPatch,
  dunningStageOrdinal,
  setDunningStageOrdinal,
  dunningBatchAsOfDate,
  setDunningBatchAsOfDate,
  dunningBatchRunJson,
  onDunningBatchDryRun,
  onDunningBatchExecute,
  canRecordDunningReminder,
  dunningCandidatesJson,
  onLoadDunningCandidates,
  dunningBatchEmailItemsJson,
  setDunningBatchEmailItemsJson,
  dunningBatchEmailResultJson,
  onPrefillBatchEmailItemsFromCandidates,
  onDunningBatchEmailDryRun,
  onDunningBatchEmailExecute,
}: FinanceDunningGrundeinstellungenPanelProps) {
  const candidatesData = useMemo(() => parseCandidatesResponse(dunningCandidatesJson), [dunningCandidatesJson]);
  const batchMahnlaufDisabled = serverAutomationRunMode === "OFF";

  return (
    <FinancePrepPanel step={5} title="Grundeinstellungen Mahnlauf (SEMI, ADR-0011)">
      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 0 }}>
        Mandantenzeit, optional DE-Bundesland für Feiertage, Kalender- vs. Werktage und Kanalvorgabe steuern <strong>Kandidaten</strong>,{" "}
        <code>DRY_RUN</code>/<code>EXECUTE</code> und dieselbe Frist (<code>stageDeadlineIso</code>) wie die Engine — siehe{" "}
        <a href={repoDocHref("docs/adr/0011-fin4-semi-dunning-context.md")}>ADR-0011</a>. Tab <strong>Mahnwesen</strong>: Einzel-Mahnung, Konfiguration, E-Mail.
      </p>
      <div style={{ marginBottom: "0.75rem", paddingBottom: "0.65rem", borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.35rem" }}>Mandanten-Mahnlauf (Automation + Batch 5b-1)</h3>
        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 0, marginBottom: "0.45rem" }}>
          <strong>SEMI</strong> steuert Vorschau und Mahnlauf in der UI; es gibt <strong>keinen</strong> Hintergrund-Cron.{" "}
          <code>GET|PATCH /finance/dunning-reminder-automation</code> — nur <strong>OFF</strong> / <strong>SEMI</strong>.
        </p>
        {serverAutomationRunMode != null && serverAutomationRunMode !== dunningAutomationRunMode ? (
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 0, marginBottom: "0.45rem" }}>
            <strong>Servertreu: {serverAutomationRunMode}.</strong> Formular weicht ab — nach Speichern oder erneutem GET angleichen.
          </p>
        ) : null}
        {batchMahnlaufDisabled ? (
          <p
            role="status"
            style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 0, marginBottom: "0.45rem" }}
          >
            <strong>Mandant OFF:</strong> Vorschau (Dry-Run) und Ausführen (EXECUTE) sind in der PWA deaktiviert (Variante 1a — API unverändert).{" "}
            <strong>Kandidaten laden</strong> bleibt möglich.
          </p>
        ) : null}
        {dunningAutomationJson.trim() ? (
          <FinanceCollapsibleJson summary="Mandanten-Automation (GET)" json={dunningAutomationJson} />
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-end", marginTop: "0.5rem" }}>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem" }}>
            Modus
            <select
              value={dunningAutomationRunMode}
              onChange={(e) => setDunningAutomationRunMode(e.target.value as "OFF" | "SEMI")}
              disabled={busy}
              aria-label="Mandanten-Mahnlauf-Modus"
            >
              <option value="OFF">OFF (Mahn-Batch/Automation aus)</option>
              <option value="SEMI">SEMI (UI — Vorschau und Mahnlauf)</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem" }}>
            IANA-Zeitzone
            <input
              type="text"
              value={dunningAutomationIanaTimezone}
              onChange={(e) => setDunningAutomationIanaTimezone(e.target.value)}
              disabled={busy}
              aria-label="IANA-Zeitzone fuer Mahn-Faelligkeit"
              placeholder="Europe/Berlin"
              style={{ width: "12rem", fontFamily: "monospace" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem" }}>
            DE-Bundesland (optional)
            <input
              type="text"
              value={dunningAutomationFederalState}
              onChange={(e) => setDunningAutomationFederalState(e.target.value.toUpperCase())}
              disabled={busy}
              aria-label="DE-Bundeslandcode fuer Feiertage"
              placeholder="z. B. BY, BW"
              style={{ width: "6rem", fontFamily: "monospace" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem" }}>
            Zahlungsziel je Stufe
            <select
              value={dunningAutomationPaymentTermDayKind}
              onChange={(e) => setDunningAutomationPaymentTermDayKind(e.target.value as "CALENDAR" | "BUSINESS")}
              disabled={busy}
              aria-label="Kalender- oder Werktage fuer daysAfterDue"
            >
              <option value="CALENDAR">Kalendertage</option>
              <option value="BUSINESS">Werktage (Mo–Fr, DE-Feiertage)</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem" }}>
            Bevorzugter Kanal (SEMI)
            <select
              value={dunningAutomationPreferredChannel}
              onChange={(e) => setDunningAutomationPreferredChannel(e.target.value as "EMAIL" | "PRINT")}
              disabled={busy}
              aria-label="Bevorzugter Mahnkanal"
            >
              <option value="EMAIL">E-Mail</option>
              <option value="PRINT">Druck / Post (Umsetzung inkrementell)</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", flex: "1 1 12rem", minWidth: "10rem" }}>
            Grund (PATCH)
            <input
              type="text"
              value={dunningAutomationPatchReason}
              onChange={(e) => setDunningAutomationPatchReason(e.target.value)}
              disabled={busy}
              style={{ width: "100%" }}
            />
          </label>
          <button type="button" disabled={busy} onClick={onSubmitDunningTenantAutomationPatch}>
            Automation speichern
          </button>
        </div>

        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.65rem", marginBottom: "0.35rem" }}>
          Stufe und <code>asOfDate</code> gelten für <strong>Kandidaten-GET</strong>, <strong>Vorschau (Dry-Run)</strong> und <strong>EXECUTE</strong> (gleiches Feld wie
          Einzel-Mahnung im Tab Mahnwesen).
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-end", marginTop: "0.35rem" }}>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem" }}>
            Mahn-Stufe (1–9)
            <input
              type="text"
              inputMode="numeric"
              value={dunningStageOrdinal}
              onChange={(e) => setDunningStageOrdinal(e.target.value)}
              disabled={busy}
              aria-label="Mahn-Stufe fuer Kandidaten und Batch"
              style={{ width: "4.5rem", fontFamily: "monospace" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem" }}>
            asOfDate (optional)
            <input
              type="text"
              value={dunningBatchAsOfDate}
              onChange={(e) => setDunningBatchAsOfDate(e.target.value)}
              disabled={busy}
              aria-label="asOfDate fuer Mahnlauf und Kandidaten"
              placeholder="yyyy-mm-dd"
              style={{ width: "11rem", fontFamily: "monospace" }}
            />
          </label>
          <button type="button" disabled={busy} onClick={onLoadDunningCandidates}>
            Kandidaten laden (GET)
          </button>
          <button type="button" disabled={busy || batchMahnlaufDisabled} onClick={onDunningBatchDryRun}>
            Vorschau (Dry-Run)
          </button>
          <button
            type="button"
            disabled={busy || batchMahnlaufDisabled || !canRecordDunningReminder}
            onClick={onDunningBatchExecute}
          >
            Ausführen (EXECUTE)
          </button>
        </div>

        {candidatesData ? (
          <div
            role="region"
            aria-label="Mahn-Kandidaten und Eligibility-Kontext"
            style={{
              marginTop: "0.65rem",
              padding: "0.55rem 0.65rem",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "var(--surface-muted, rgba(127, 127, 127, 0.08))",
              fontSize: "0.82rem",
            }}
          >
            <p style={{ margin: "0 0 0.4rem", fontWeight: 600, color: "var(--text-primary)" }}>Fälligkeit / Kontext (B3)</p>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "0.2rem 0.75rem",
                margin: "0 0 0.5rem",
                maxWidth: "32rem",
              }}
            >
              <dt style={{ color: "var(--text-secondary)" }}>asOfDate (Antwort)</dt>
              <dd style={{ margin: 0, fontFamily: "monospace" }}>{candidatesData.asOfDate}</dd>
              <dt style={{ color: "var(--text-secondary)" }}>Stufe</dt>
              <dd style={{ margin: 0 }}>{candidatesData.stageOrdinal}</dd>
              <dt style={{ color: "var(--text-secondary)" }}>daysAfterDue (Stufe)</dt>
              <dd style={{ margin: 0 }}>{candidatesData.daysAfterDueForStage}</dd>
              <dt style={{ color: "var(--text-secondary)" }}>Konfig-Quelle</dt>
              <dd style={{ margin: 0 }}>{candidatesData.configSource}</dd>
              <dt style={{ color: "var(--text-secondary)" }}>eligibilityContext — Zeitzone</dt>
              <dd style={{ margin: 0, fontFamily: "monospace" }}>{candidatesData.eligibilityContext.ianaTimezone}</dd>
              <dt style={{ color: "var(--text-secondary)" }}>Bundesland</dt>
              <dd style={{ margin: 0, fontFamily: "monospace" }}>{candidatesData.eligibilityContext.federalStateCode ?? "—"}</dd>
              <dt style={{ color: "var(--text-secondary)" }}>Zahlungsziel-Art</dt>
              <dd style={{ margin: 0 }}>{candidatesData.eligibilityContext.paymentTermDayKind}</dd>
              <dt style={{ color: "var(--text-secondary)" }}>Kanal</dt>
              <dd style={{ margin: 0 }}>{candidatesData.eligibilityContext.preferredDunningChannel}</dd>
            </dl>
            <p style={{ margin: "0 0 0.25rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Kandidaten ({candidatesData.candidates.length})
            </p>
            {candidatesData.candidates.length === 0 ? (
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>Keine Kandidaten für diese Stufe und das gewählte Datum.</p>
            ) : (
              <div style={{ overflow: "auto", maxWidth: "100%" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <caption className="visually-hidden">Mahn-Kandidaten mit Stufenfrist</caption>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "0.2rem 0.35rem" }}>Rechnung</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "0.2rem 0.35rem" }}>Fälligkeit</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "0.2rem 0.35rem" }}>Stufenfrist (ISO)</th>
                      <th style={{ textAlign: "right", borderBottom: "1px solid var(--border)", padding: "0.2rem 0.35rem" }}>Offen (Cent)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidatesData.candidates.map((row, idx) => (
                      <tr
                        key={row.invoiceId}
                        title={dunningCandidateRowTitle(
                          row,
                          candidatesData.stageOrdinal,
                          candidatesData.asOfDate,
                          candidatesData.eligibilityContext,
                        )}
                        style={{
                          background: idx % 2 === 1 ? "color-mix(in srgb, var(--panel-2) 55%, transparent)" : undefined,
                        }}
                      >
                        <td style={{ padding: "0.25rem 0.35rem", fontFamily: "monospace", fontSize: "0.72rem" }}>{row.invoiceId}</td>
                        <td style={{ padding: "0.25rem 0.35rem", fontFamily: "monospace" }}>{row.dueDate}</td>
                        <td style={{ padding: "0.25rem 0.35rem", fontFamily: "monospace" }}>{row.stageDeadlineIso}</td>
                        <td style={{ padding: "0.25rem 0.35rem", textAlign: "right", fontFamily: "monospace" }}>{row.openAmountCents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {dunningCandidatesJson.trim() ? (
          <FinanceCollapsibleJson summary="Rohantwort GET /finance/dunning-reminder-candidates" json={dunningCandidatesJson} />
        ) : null}

        {dunningBatchRunJson.trim() ? (
          <>
            <FinanceCollapsibleJson summary="Letzter Batch-Lauf (Dry-Run oder EXECUTE)" json={dunningBatchRunJson} />
            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.35rem", marginBottom: 0 }}>
              Bei <code>DRY_RUN</code> zeigt <code>planned[]</code> je Rechnung <code>stageDeadlineIso</code> — dieselbe Berechnung wie beim Kandidaten-GET.
            </p>
          </>
        ) : null}
        <h3 style={{ fontSize: "0.95rem", margin: "0.85rem 0 0.35rem" }}>Batch-E-Mail (M4 Slice 5c)</h3>
        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 0, marginBottom: "0.45rem" }}>
          <code>POST /finance/dunning-reminder-run/send-emails</code> — pro Zeile wie Slice <strong>5a</strong> mit explizitem <code>toEmail</code> und eigenem <code>idempotencyKey</code> bei <code>EXECUTE</code>. Spec:{" "}
          <a href={repoDocHref("docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md")}>M4-BATCH-DUNNING-EMAIL-SPEC</a>. Bei <strong>OFF</strong> gesperrt wie Mahnlauf.
        </p>
        <label style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.78rem" }}>
          items[] (JSON, max. 25)
          <textarea
            value={dunningBatchEmailItemsJson}
            onChange={(e) => setDunningBatchEmailItemsJson(e.target.value)}
            aria-label="Batch-E-Mail items JSON"
            rows={6}
            spellCheck={false}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "0.72rem", marginTop: "0.25rem" }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.55rem" }}>
          <button type="button" disabled={busy || !candidatesData?.candidates?.length} onClick={onPrefillBatchEmailItemsFromCandidates}>
            Items aus Kandidaten (Platzhalter-E-Mail)
          </button>
          <button type="button" disabled={busy || batchMahnlaufDisabled} onClick={onDunningBatchEmailDryRun}>
            Batch-E-Mail Dry-Run
          </button>
          <button
            type="button"
            disabled={busy || batchMahnlaufDisabled || !canRecordDunningReminder}
            onClick={onDunningBatchEmailExecute}
          >
            Batch-E-Mail EXECUTE
          </button>
        </div>
        {dunningBatchEmailResultJson.trim() ? (
          <FinanceCollapsibleJson summary="Letzter Batch-E-Mail-Lauf (send-emails)" json={dunningBatchEmailResultJson} />
        ) : null}

      </div>
    </FinancePrepPanel>
  );
}
