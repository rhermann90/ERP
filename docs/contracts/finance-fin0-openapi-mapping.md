# Finanz — OpenAPI, Implementierung und Fehlercodes (G8)

**Zweck:** Abgleich `docs/api-contract.yaml` mit dem **laufenden Code** und mit `docs/contracts/error-codes.json` — keine „Phantom“-`code`-Werte; Änderungen an Domänencodes nur gemeinsam mit Contract-Version und `error-codes.json`.

**Hinweis Dateiname:** Historisch `finance-fin0-…`; Inhalt deckt **FIN-1**, **FIN-2**, **FIN-3** (Zahlungseingang), **FIN-4** (Mahnwesen Lesepfad + Mahn-POST + Konfig **GET/PUT/PATCH/DELETE**) + **M4** (Vorlagen/Footer/E-Mail; siehe **`docs/adr/0010-fin4-m4-dunning-email-and-templates.md`**) und verbleibende **FIN-0**-Contract-Stubs ab.

**Externe Integratoren (FIN-4):** Release-Notes, Breaking-Felder und Antwort-Header `x-erp-openapi-contract-version` — [`FIN4-external-client-integration.md`](./FIN4-external-client-integration.md).

## Implementierungsstand (Technik)

| Bereich | HTTP | Module / Einordnung |
|---------|------|---------------------|
| **FIN-1** | `GET /finance/payment-terms?projectId=` | `src/api/finance-payment-terms-routes.ts`, `src/services/payment-terms-service.ts` |
| **FIN-1** | `POST /finance/payment-terms/versions` | dieselben |
| **FIN-2** | `POST /invoices`, `GET /invoices/{invoiceId}`, `POST /invoices/{invoiceId}/book` | `src/api/finance-invoice-routes.ts`, `src/services/invoice-service.ts`, `src/persistence/invoice-persistence.ts` |
| **FIN-2 (Shell-SoT)** | *(kein eigener HTTP-Pfad)* — `GET /documents/{invoiceId}/allowed-actions?entityType=INVOICE` liefert kanonisch **`BOOK_INVOICE`** nur bei Status **ENTWURF** und Rollen wie `assertCanBookInvoice` | `src/services/authorization-service.ts` (`allowedInvoiceActionsByStatus`); PWA-Haupt-Shell: `apps/web/src/lib/action-executor.ts` (**`BOOK_INVOICE`** → `POST /invoices/{invoiceId}/book` mit `reason`, optional `issueDate`); Contract: `docs/contracts/action-contracts.json` |
| **FIN-3** | `POST /finance/payments/intake` | `src/api/finance-payment-intake-routes.ts`, `src/services/payment-intake-service.ts`, `src/persistence/payment-intake-persistence.ts` — Idempotenz `(tenant_id, idempotency_key)`; Zahlung nur bei **GEBUCHT_VERSENDET** / **TEILBEZAHLT** mit 8.4-Beträgen; Persistenz + Status **TEILBEZAHLT** / **BEZAHLT**; bei DB-Unique-Kollision nach Rollback optional Replay desselben Keys |
| **FIN-3** | `GET /invoices/{invoiceId}/payment-intakes` | `src/api/finance-invoice-routes.ts`, `src/services/invoice-service.ts` — Lesepfad je Rechnung; gleiche Rolle wie Rechnung lesen (`assertCanReadInvoice`); Antwort **ohne** Idempotency-Key (minimiert) |
| **FIN-4** | `GET /invoices/{invoiceId}/dunning-reminders` | `src/api/finance-invoice-routes.ts`, `src/services/invoice-service.ts` (`listDunningRemindersForInvoiceRead`); Daten aus In-Memory nach Hydrate aus `src/persistence/dunning-reminder-persistence.ts` (**Postgres:** Tabelle `dunning_reminders`); gleiche Leserolle wie Rechnung (`assertCanReadInvoice`); **`docs/adr/0009-fin4-mahnwesen-slice.md`** |
| **FIN-4 (SoT Schreibpfad)** | *(SoT)* `GET /documents/{invoiceId}/allowed-actions?entityType=INVOICE` liefert **`RECORD_DUNNING_REMINDER`** bei **GEBUCHT_VERSENDET** / **TEILBEZAHLT** und Rollen wie Zahlungseingang | `src/services/authorization-service.ts`; PWA: `POST /invoices/{invoiceId}/dunning-reminders` via `apps/web/src/lib/action-executor.ts` / Finanz-Vorbereitung; **`docs/contracts/action-contracts.json`** |
| **FIN-4** | `POST /invoices/{invoiceId}/dunning-reminders` | `src/api/finance-invoice-routes.ts`, `src/services/dunning-reminder-service.ts`, `src/persistence/dunning-reminder-persistence.ts` (`persistDunningReminder`); **keine** Idempotenz auf Mahnzeile im MVP-Slice |
| **FIN-4** | `GET|PUT|PATCH|DELETE /finance/dunning-reminder-config` (+ `…/stages/{stageOrdinal}`) | `src/api/finance-dunning-config-routes.ts`, `src/services/dunning-reminder-config-service.ts`, `src/persistence/dunning-stage-config-persistence.ts` — GET/PUT/PATCH/DELETE wie ADR-0009 Slices 3–8; **`docs/adr/0009-fin4-mahnwesen-slice.md`** |
| **FIN-4 / M4** | `GET /finance/dunning-reminder-templates` | dieselbe Route-Datei, `src/services/dunning-reminder-template-service.ts`, `src/persistence/dunning-template-persistence.ts`, `src/domain/dunning-reminder-template-defaults.ts` — ADR-0010 **M4 Slice 1** |
| **FIN-4 / M4** | `PATCH /finance/dunning-reminder-templates/stages/{stageOrdinal}/channels/{channel}` | `finance-dunning-config-routes.ts`, `dunning-reminder-template-service.ts`, `dunning-template-persistence.ts`, `dunning-reminder-template-defaults.ts` — ADR-0010 **M4 Slice 2** |
| **FIN-4 / M4** | `GET|PATCH /finance/dunning-email-footer` | `finance-dunning-config-routes.ts`, `dunning-email-footer-service.ts`, `dunning-email-footer-persistence.ts`, `dunning-email-footer.ts` — ADR-0010 **M4 Slice 3** |
| **FIN-4 / M4** | `POST /invoices/{invoiceId}/dunning-reminders/email-preview`, `POST …/send-email-stub` | `finance-invoice-routes.ts`, `dunning-reminder-email-service.ts`, `dunning-email-compose.ts` — ADR-0010 **M4 Slice 4** (Plain-Text-Vorschau; Versand nur Audit-Stub) |
| **FIN-4 / M4** | `POST /invoices/{invoiceId}/dunning-reminders/send-email` (Header `Idempotency-Key`) | `finance-invoice-routes.ts`, `dunning-reminder-email-service.ts`, `dunning-email-send-persistence.ts`, `smtp-mail-transport.ts` — ADR-0010 **M4 Slice 5a** (SMTP; Idempotenz `dunning_email_sends`; Audit `DUNNING_EMAIL_SENT`) |
| **FIN-4 / M4** | `GET /finance/dunning-reminder-candidates` | `finance-dunning-config-routes.ts`, `dunning-reminder-candidates-service.ts`, `dunning-reminder-config-service.ts` — ADR-0010 **M4 Slice 5b-0** (Lesepfad; `assertCanReadInvoice`; kein SMTP); Antwort inkl. `eligibilityContext` und pro Kandidat `stageDeadlineIso` (ADR-0011 **B3**) |
| **FIN-4 / M4** | `POST /finance/dunning-reminder-run` | `finance-dunning-config-routes.ts`, `dunning-reminder-run-service.ts`, `dunning-reminder-run-intent-persistence.ts` — ADR-0010 **M4 Slice 5b-1** (`DRY_RUN`: `assertCanReadInvoice`; `EXECUTE`: `assertCanRecordDunningReminder`, Header `Idempotency-Key`, Idempotenz/Replay wie ADR) |
| **FIN-4 / M4** | `GET|PATCH /finance/dunning-reminder-automation` | `finance-dunning-config-routes.ts`, `dunning-tenant-automation-service.ts`, `dunning-tenant-automation-persistence.ts` — Mandanten-Modus **OFF**/**SEMI** + SEMI-Kontext (Zeitzone, optional DE-Bundesland, Kalender-/Werktage, Kanal); PATCH nur Postgres (`DUNNING_AUTOMATION_NOT_PERSISTABLE` im Memory-Modus); ADR-0010, **ADR-0011** |

*Hintergrund-Cron oder Mandantenmodus **AUTO** für Mahnungen sind nicht Bestandteil des Produkts — ADR-0011, Runbooks unter `docs/runbooks/dunning-*.md`.*

Traceability-Prüfungen für Rechnungsentwurf und **Buchung**: `src/services/invoice-service.ts` / `TraceabilityService.assertInvoiceTraceability` (u. a. Aufmaß → LV → Angebot); siehe ADR-0007 / Gate **G5** (`lvVersionId` konsistent zu `offerVersionId`).

## Fail-closed-Zuordnung (HTTP ↔ `code`)

| Situation | HTTP | `code` (Domain) | Bemerkung |
|-----------|------|-----------------|-----------|
| Aufmaß-/LV-/Angebotskette für Entwurf unvollständig | 422 | `TRACEABILITY_LINK_MISSING` | Wie Export-/Traceability-Klasse |
| `lvVersionId` passt nicht zur gewählten `offerVersionId` (Gate **G5**) | 422 | `TRACEABILITY_FIELD_MISMATCH` | u. a. Rechnungsentwurf |
| `paymentTermsVersionId` gesetzt, gehört nicht zum Projekt des Angebots | 422 | `TRACEABILITY_FIELD_MISMATCH` | FIN-1/FIN-2-Verknüpfung |
| Mutierender Endpunkt, Sammelfall Preflight | 422 | `EXPORT_PREFLIGHT_FAILED` | optional `details.validationErrors` |
| Angebotsversion / Angebot / Zahlungsbedingungs-Version / Rechnung fehlt | 404 | `DOCUMENT_NOT_FOUND`, `OFFER_VERSION_NOT_FOUND`, `OFFER_NOT_FOUND` | je nach Pfad |
| Rechnung buchen, Status nicht `ENTWURF` | 409 | `INVOICE_NOT_BOOKABLE` | kein erneutes Buchen |
| Rechnung buchen, Entwurf ohne `lvNetCents`/`vatCents`/`totalGrossCents` | 422 | `INVOICE_DRAFT_INCOMPLETE` | Entwurf neu erzeugen |
| Rechnung buchen, Rechnungsnummer-Kollision (DB-Unique) | 409 | `INVOICE_NUMBER_CONFLICT` | Retry mit neuem Nummernkreis |
| Zahlungseingang, Rechnung unbekannt / falscher Mandant | 404 | `DOCUMENT_NOT_FOUND` | |
| Zahlungseingang, Rechnung nicht zahlbar (z. B. `ENTWURF`) | 400 | `PAYMENT_INVOICE_NOT_PAYABLE` | |
| Zahlungseingang, Rechnung ohne `totalGrossCents` / 8.4-Felder | 400 | `PAYMENT_INVOICE_AMOUNT_MISSING` | |
| Zahlungseingang, Summe über Brutto offen | 400 | `PAYMENT_EXCEEDS_OPEN_AMOUNT` | |
| Zahlungseingang, gleicher Idempotency-Key mit anderem `invoiceId` oder `amountCents` | 400 | `PAYMENT_INTAKE_IDEMPOTENCY_MISMATCH` | Neuer Key |
| Zahlungseingänge lesen, Rechnung unbekannt | 404 | `DOCUMENT_NOT_FOUND` | |
| Zahlungseingänge lesen, Rolle ohne Rechnungsleserecht | 403 | `AUTH_ROLE_FORBIDDEN` | wie `GET /invoices/{invoiceId}` |
| Mahn-Ereignisse lesen, Rechnung unbekannt | 404 | `DOCUMENT_NOT_FOUND` | FIN-4 Stub-Lesepfad |
| Mahn-Ereignisse lesen, Rolle ohne Rechnungsleserecht | 403 | `AUTH_ROLE_FORBIDDEN` | wie `GET /invoices/{invoiceId}` |
| Mahn-Konfig-Defaults lesen, Rolle ohne Rechnungsleserecht | 403 | `AUTH_ROLE_FORBIDDEN` | Slice 3, wie Rechnung lesen |
| Mahn-Ereignis anlegen, Rechnung nicht gebucht/teilbezahlt | 400 | `DUNNING_INVOICE_NOT_ELIGIBLE` | z. B. `ENTWURF`, `BEZAHLT` |
| Mahn-Ereignis anlegen, Rechnung unbekannt | 404 | `DOCUMENT_NOT_FOUND` | |
| Mahn-Ereignis anlegen, Rolle ohne Buchhaltungsrecht | 403 | `AUTH_ROLE_FORBIDDEN` | wie `assertCanRecordDunningReminder` |
| Mahnlauf `POST …/dunning-reminder-run`, `invoiceIds` nicht in Kandidatenmenge | 400 | `DUNNING_RUN_INVOICES_INVALID` | Slice 5b-1 |
| Mahnlauf `EXECUTE`, gleicher Idempotency-Key, anderer Fingerprint | 400 | `DUNNING_RUN_IDEMPOTENCY_MISMATCH` | Slice 5b-1 |
| Token/Tenant/Rolle | 401/403 | `UNAUTHORIZED`, `TENANT_SCOPE_VIOLATION`, `AUTH_ROLE_FORBIDDEN` | unverändert |

**Explizit:** Idempotenter Erfolgs-Replay liefert **HTTP 200** mit gleichem Erfolgskörper — kein zusätzlicher Fehler-`code`; siehe OpenAPI `PaymentIntakeResponse`.

## Währung / 8.12

- Request-Schemas: **`invoiceCurrencyCode` required**, Enum nur `EUR`, **ohne** OpenAPI-`default` (kein stiller EUR-Default).

## Idempotency-Key (8.7)

- **`POST /finance/payments/intake`:** Header `Idempotency-Key` **Pflicht**, **case-insensitive** gelesen; Wert muss **UUID** sein — sonst `400` / `VALIDATION_FAILED` (Zod), konsistent zu `docs/api-contract.yaml` (`components.parameters.IdempotencyKey`; `responses` für denselben Pfad) und `docs/contracts/qa-fin-0-stub-test-matrix.md`.
- DB-Eindeutigkeit `(tenant_id, idempotency_key)` (`payment_intakes`); fachlicher Replay nur bei identischem `invoiceId` und `amountCents`, sonst `PAYMENT_INTAKE_IDEMPOTENCY_MISMATCH`.

## Referenz

- Kanonische OpenAPI: `docs/api-contract.yaml` (Feld `info.version`).
- Gate: `docs/tickets/FIN-2-START-GATE.md` (**G8**).
- Mahnwesen **Kern** (Mahn-Ereignis, Stufen-Konfig): `docs/adr/0009-fin4-mahnwesen-slice.md`.
- Mahnwesen **M4** (Vorlagen, Footer, E-Mail inkl. SMTP 5a): `docs/adr/0010-fin4-m4-dunning-email-and-templates.md`.
