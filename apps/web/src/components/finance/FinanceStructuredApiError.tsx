import type { ApiErrorEnvelope } from "../../lib/api-error.js";

const STRUCTURED_ERROR_HINTS: Partial<Record<string, string>> = {
  DOCUMENT_NOT_FOUND:
    "Die angefragte Ressource wurde nicht gefunden oder gehört nicht zum aktuellen Mandanten. UUID prüfen und ggf. Rechnung neu laden.",
  PAYMENT_EXCEEDS_OPEN_AMOUNT:
    "Der Zahlungsbetrag ist höher als der offene Rechnungsbetrag. Rechnung laden und „Offenen Betrag übernehmen“ nutzen oder den Cent-Wert anpassen.",
  PAYMENT_INVOICE_NOT_PAYABLE:
    "Zahlungseingang ist für diese Rechnung (Status/Rolle) nicht zulässig. SoT und Rechnungsstatus prüfen.",
  PAYMENT_INTAKE_IDEMPOTENCY_MISMATCH:
    "Derselbe Idempotency-Key wurde mit anderem Payload wiederverwendet. Neuen Key erzeugen oder den ursprünglichen Request wiederholen.",
  INVOICE_TAX_REGIME_INVALID:
    "Steuerregime-Code wird vom Server nicht akzeptiert — gültige Enum-Werte aus OpenAPI/API-Doku verwenden.",
  INVOICE_TAX_REGIME_CHANGED_RECREATE_DRAFT:
    "Steuerregime hat sich seit dem Entwurf geändert (FIN-5 §8.16). Der bestehende Entwurf kann nicht gebucht werden — bitte unten „Neuen Entwurf laden“ wählen, um mit demselben Angebot/LV einen aktualisierten Entwurf zu erzeugen.",
  VALIDATION_FAILED:
    "Eingaben entsprechen nicht der API-Validierung. Pflichtfelder, Formate und Grenzwerte prüfen (Details ggf. im Backend-Log).",
  UNAUTHORIZED: "Sitzung fehlt oder ist abgelaufen — neu anmelden.",
  AUTH_ROLE_FORBIDDEN: "Die aktuelle Rolle darf diese Aktion nicht ausführen.",
  FORBIDDEN_AUDIT_READ:
    "Audit-Lesen ist nur für ADMIN, BUCHHALTUNG oder GESCHAEFTSFUEHRUNG erlaubt — Rolle wechseln oder anderen Nutzer verwenden.",
  TRACEABILITY_LINK_MISSING:
    "Traceability zur LV/Angebotskette fehlt — Entwurf kann so nicht erzeugt oder fortgeführt werden.",
  DUNNING_EMAIL_FOOTER_NOT_READY:
    "E-Mail-Footer (Pflicht-Stammdaten laut FIN-4 / ADR-0010) ist nicht vollständig — zuerst Footer unter Tab Mahnwesen pflegen.",
  DUNNING_EMAIL_SMTP_NOT_CONFIGURED:
    "SMTP ist für diese Umgebung nicht konfiguriert (`ERP_SMTP_*`). Für Tests den Versand-Stub nutzen oder SMTP setzen.",
  DUNNING_EMAIL_SMTP_ERROR:
    "Der SMTP-Server hat den Versand abgelehnt. Empfänger, Credentials und Provider-Logs prüfen.",
  DUNNING_INVOICE_NOT_ELIGIBLE:
    "Rechnung ist für diese Mahnstufe nicht zugelassen (offener Betrag, Fälligkeit oder bereits gebuchte Mahnung).",
  DUNNING_BATCH_EMAIL_CONFIRM_REQUIRED:
    "Batch-E-Mail erwartet eine ausdrückliche Bestätigung im Request (siehe OpenAPI / Spec M4 5c) — Payload prüfen.",
  DUNNING_BATCH_EMAIL_TOO_MANY_ITEMS: "Batch-E-Mail: maximal 25 Zeilen pro Aufruf — items[] kürzen.",
  DUNNING_BATCH_EMAIL_DUPLICATE_INVOICE_ID: "In items[] ist dieselbe Rechnungs-ID mehrfach — Duplikate entfernen.",
  DUNNING_BATCH_EMAIL_DUPLICATE_IDEMPOTENCY_KEY:
    "Derselbe Idempotency-Key wurde für unterschiedliche Batch-Zeilen verwendet — je Zeile eigenen Key setzen.",
  DUNNING_RUN_CONFIG_INCOMPLETE: "Mahnstufen-Konfiguration ist für den Lauf unvollständig — GET Konfig prüfen und Stufen pflegen.",
  DUNNING_RUN_INVOICES_INVALID: "Mindestens eine Rechnungs-ID im Mahnlauf ist ungültig oder nicht mandantentreu.",
  DUNNING_RUN_IDEMPOTENCY_MISMATCH: "Idempotency-Key wurde mit anderem Mahnlauf-Payload wiederverwendet.",
  DUNNING_RUN_STAGE_INVALID: "Mahn-Stufe für den Lauf ungültig — Ordinal 1–9 und Konfiguration prüfen.",
  DUNNING_EMAIL_IDEMPOTENCY_MISMATCH:
    "Derselbe Idempotency-Key wurde für einen anderen E-Mail-Versand wiederverwendet — neuen Key setzen.",
  DUNNING_EMAIL_STAGE_INVALID: "Mahn-Stufe für E-Mail-Vorschau oder Versand passt nicht zur Konfiguration.",
  DUNNING_EMAIL_TEMPLATE_NOT_FOUND: "Keine Vorlage für diese Stufe/Kanal — Vorlagen-GET und Konfig prüfen.",
  DUNNING_EMAIL_STAGE_CONFIG_NOT_FOUND: "Keine aktive Stufen-Zeile für diese Ordinal — Konfiguration prüfen.",
};

function structuredDetailLines(details: unknown): string[] {
  if (details == null) return [];
  if (Array.isArray(details)) {
    return details.map((x) => (typeof x === "string" ? x : JSON.stringify(x)));
  }
  if (typeof details === "object" && details !== null && "errors" in details) {
    const inner = (details as { errors?: unknown }).errors;
    if (Array.isArray(inner)) {
      return inner.map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object" && "message" in x && typeof (x as { message?: unknown }).message === "string") {
          return (x as { message: string }).message;
        }
        return JSON.stringify(x);
      });
    }
  }
  return [];
}

function StructuredErrorCodeHint({ code }: { code: string }) {
  if (code === "DUNNING_REMINDER_RUN_DISABLED") return null;
  const text = STRUCTURED_ERROR_HINTS[code];
  if (!text) return null;
  return (
    <p style={{ margin: "0.35rem 0 0", fontSize: "0.82rem", color: "var(--text-primary)" }}>{text}</p>
  );
}

export function FinanceStructuredApiError({
  envelope,
  status,
  announcementRole = "alert",
}: {
  envelope: ApiErrorEnvelope;
  status: number;
  /** `status` nutzen, wenn ein Eltern-Element bereits `aria-live="polite"` ansagt. */
  announcementRole?: "alert" | "status";
}) {
  return (
    <div
      role={announcementRole}
      style={{
        marginTop: "0.75rem",
        padding: "0.65rem 0.75rem",
        borderRadius: "6px",
        border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)",
        background: "color-mix(in srgb, var(--danger) 8%, transparent)",
        fontSize: "0.85rem",
      }}
    >
      <strong>
        {status} · {envelope.code}
      </strong>
      <p style={{ margin: "0.35rem 0 0.5rem" }}>{envelope.message}</p>
      {(() => {
        const lines = structuredDetailLines(envelope.details);
        if (lines.length === 0) return null;
        return (
          <ul
            data-testid="finance-structured-api-error-detail-list"
            style={{ margin: "0.35rem 0 0.5rem", paddingLeft: "1.2rem", fontSize: "0.82rem" }}
          >
            {lines.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        );
      })()}
      <StructuredErrorCodeHint code={envelope.code} />
      {envelope.code === "DUNNING_REMINDER_RUN_DISABLED" ? (
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.82rem", color: "var(--text-primary)" }}>
          Mandanten-Mahnlauf ist auf <strong>AUS (OFF)</strong>. Bitte unter Grundeinstellungen Automation auf <strong>SEMI</strong> stellen, oder nur Kandidaten laden (kein Dry-Run / keine Batch-Ausführung).
        </p>
      ) : null}
      <dl
        style={{
          margin: "0.5rem 0 0",
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "0.2rem 0.75rem",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
        }}
      >
        <dt>correlationId</dt>
        <dd style={{ margin: 0 }}>
          <code>{envelope.correlationId}</code>
        </dd>
        <dt>retryable</dt>
        <dd style={{ margin: 0 }}>{String(envelope.retryable)}</dd>
        <dt>blocking</dt>
        <dd style={{ margin: 0 }}>{String(envelope.blocking)}</dd>
      </dl>
      <p
        data-testid="finance-structured-api-error-disclaimer"
        style={{
          margin: "0.6rem 0 0",
          fontSize: "0.72rem",
          color: "var(--text-secondary)",
          lineHeight: 1.35,
        }}
      >
        Hinweistexte zur technischen Einordnung — keine Rechts-, Steuer- oder Buchhaltungsberatung.
      </p>
    </div>
  );
}
