# M4 Mini-Slice 5a — Mahn-E-Mail per SMTP (FIN-4)

**Status:** umgesetzt (Code + Vertrag + Tests). **PL-Gate:** weiterhin [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) und [`docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md) §PL-Gate beachten.

## Ziel

Ein **produktiver** Plain-Text-Versand einer Mahn-E-Mail je Rechnung und Stufe über **konfigurierbares SMTP** (`ERP_SMTP_*`), mit **Idempotenz** (`Idempotency-Key` Header, UUID) und **Audit** `DUNNING_EMAIL_SENT`. Der Slice-4-**Stub** (`send-email-stub`) bleibt parallel (Demo / kein SMTP).

## In-Scope

- **HTTP:** `POST /invoices/{invoiceId}/dunning-reminders/send-email`  
  - Header: **`Idempotency-Key`** (UUID, case-insensitive wie Zahlungseingang).  
  - Body: `{ stageOrdinal, reason, toEmail }` — Empfänger **explizit** (kein Kunden-E-Mail-Feld am Rechnungsaggregat in diesem MVP).
- **Auth / SoT:** wie Mahn-Ereignis / Stub — `assertCanRecordDunningReminder`.
- **Gates:** `readyForEmailFooter` wie Vorschau/Stub; SMTP nur wenn `MailTransportPort.isConfigured()` (sonst **503** `DUNNING_EMAIL_SMTP_NOT_CONFIGURED`).
- **Idempotenz:** Tabelle `dunning_email_sends`, Unique `(tenant_id, idempotency_key)`; Replay liefert `outcome: REPLAY`; Parameterabweichung → **400** `DUNNING_EMAIL_IDEMPOTENCY_MISMATCH`.
- **Audit:** bei erfolgreichem Versand `DUNNING_EMAIL_SENT` (`entityType: INVOICE`).
- **Fehler:** **502** `DUNNING_EMAIL_SMTP_ERROR` bei Transport-Fehler.

## Out-of-Scope (Non-Goals)

- Massenversand; Orchestrierung außerhalb der dokumentierten SEMI-APIs (`dunning-reminder-candidates` / `dunning-reminder-run`) — siehe ADR-0011.
- HTML-Templates, vollständiger Rechtshinweis-Block.
- Empfänger automatisch aus Kundenstamm (folgt Datenmodell-Erweiterung).

## Konfiguration

Siehe Root-**`.env.example`**: `ERP_SMTP_HOST` (Pflicht für aktiven Versand), optional Port, TLS, User, Pass, Absender-Default.

## Verweise

- ADR: [`docs/adr/0010-fin4-m4-dunning-email-and-templates.md`](../adr/0010-fin4-m4-dunning-email-and-templates.md) — Abschnitt M4 Slice 5a.  
- OpenAPI / Fehlercodes / Mapping: `docs/api-contract.yaml`, `docs/contracts/error-codes.json`, `docs/contracts/finance-fin0-openapi-mapping.md`, `docs/contracts/qa-fin-0-stub-test-matrix.md`.
