# FIN-0 — Stub-Testmatrix (HTTP, OpenAPI-Skelett)

**Zweck:** Knappe Zuordnung **Happy / Edge / Negative** für die Finanz-Routen aus `docs/api-contract.yaml` — erwartete **HTTP-Status** und Domain-`code` laut [`finance-fin0-openapi-mapping.md`](./finance-fin0-openapi-mapping.md) und [`error-codes.json`](./error-codes.json). **Keine** Gate-Spalten in `FIN-2-START-GATE.md` setzen (nur PL).

**Implementierungsreferenz:** [`test/finance-fin0-stubs.test.ts`](../../test/finance-fin0-stubs.test.ts) — bei Contract-Änderungen dort und in dieser Matrix nachziehen (**G8**).

**Tenant-Isolation:** Stichprobe **Cross-Tenant-Header** in derselben Testdatei (`TENANT_SCOPE_VIOLATION`); Postgres-Tenant-Lecks in [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts).

**Hinweis Dateiname:** „FIN-0 … Stub“ ist historisch. **`POST /finance/payments/intake`** und **`GET /invoices/{invoiceId}/payment-intakes`** sind **FIN-3** produktiv ([`finance-fin0-openapi-mapping.md`](./finance-fin0-openapi-mapping.md), ADR-0007). **`POST`/`GET /invoices`** sind **FIN-2** produktiv — die Matrix listet weiterhin Edge/Negative über dieselbe Testdatei.

---

## Routenüberblick

| Route | Methode | OpenAPI `operationId` | Implementierung |
| --- | --- | --- | --- |
| `/finance/payment-terms/versions` | POST | `finPaymentTermsVersionCreate` | **FIN-1** — [`src/api/finance-payment-terms-routes.ts`](../../src/api/finance-payment-terms-routes.ts) |
| `/invoices` | POST | `finInvoiceDraftCreate` | **FIN-2** — [`src/api/finance-invoice-routes.ts`](../../src/api/finance-invoice-routes.ts), [`src/services/invoice-service.ts`](../../src/services/invoice-service.ts) |
| `/invoices/{invoiceId}` | GET | `finInvoiceGet` | **FIN-2** — [`src/api/finance-invoice-routes.ts`](../../src/api/finance-invoice-routes.ts), [`src/services/invoice-service.ts`](../../src/services/invoice-service.ts) |
| `/finance/payments/intake` | POST | `finPaymentIntakeCreate` | **FIN-3** — [`src/api/finance-payment-intake-routes.ts`](../../src/api/finance-payment-intake-routes.ts), [`src/services/payment-intake-service.ts`](../../src/services/payment-intake-service.ts), [`src/persistence/payment-intake-persistence.ts`](../../src/persistence/payment-intake-persistence.ts) |
| `/invoices/{invoiceId}/payment-intakes` | GET | `finInvoicePaymentIntakesList` | **FIN-3** — [`src/api/finance-invoice-routes.ts`](../../src/api/finance-invoice-routes.ts), [`src/services/invoice-service.ts`](../../src/services/invoice-service.ts) |
| `/invoices/{invoiceId}/dunning-reminders` | GET | `finInvoiceDunningRemindersList` | FIN-4 — [`src/api/finance-invoice-routes.ts`](../../src/api/finance-invoice-routes.ts) |
| `/invoices/{invoiceId}/dunning-reminders` | POST | `finInvoiceDunningReminderCreate` | FIN-4 Schreibpfad — [`src/services/dunning-reminder-service.ts`](../../src/services/dunning-reminder-service.ts) |
| `/invoices/{invoiceId}/dunning-reminders/email-preview` | POST | `finInvoiceDunningReminderEmailPreview` | M4 Slice 4 — [`src/services/dunning-reminder-email-service.ts`](../../src/services/dunning-reminder-email-service.ts) |
| `/invoices/{invoiceId}/dunning-reminders/send-email-stub` | POST | `finInvoiceDunningReminderSendEmailStub` | M4 Slice 4 — [`src/services/dunning-reminder-email-service.ts`](../../src/services/dunning-reminder-email-service.ts) |
| `/finance/dunning-reminder-config` | GET | `finDunningReminderConfigGet` | FIN-4 — [`src/api/finance-dunning-config-routes.ts`](../../src/api/finance-dunning-config-routes.ts) |
| `/finance/dunning-reminder-config` | PUT | `finDunningReminderConfigPut` | FIN-4 Konfig-Schreibpfad — [`src/services/dunning-reminder-config-service.ts`](../../src/services/dunning-reminder-config-service.ts) |
| `/finance/dunning-reminder-config/stages/{stageOrdinal}` | PATCH | `finDunningReminderStagePatch` | FIN-4 Stufe teilweise — [`src/services/dunning-reminder-config-service.ts`](../../src/services/dunning-reminder-config-service.ts) |
| `/finance/dunning-reminder-config/stages/{stageOrdinal}` | DELETE | `finDunningReminderStageDelete` | FIN-4 Soft-Delete — [`src/services/dunning-reminder-config-service.ts`](../../src/services/dunning-reminder-config-service.ts) |

---

## Abdeckung in `test/finance-fin0-stubs.test.ts`

Reihenfolge = Reihenfolge der `it(…)`-Blöcke.

| `it(…)`-Titel (1:1) | Matrix-Kategorie | Route | Erwartung |
| --- | --- | --- | --- |
| POST /finance/payment-terms/versions creates version (FIN-1) | Happy | POST `/finance/payment-terms/versions` | `201` + JSON mit u. a. `paymentTermsVersionId`, `versionNumber` |
| POST /finance/payment-terms/versions increments versionNumber for same project | Happy | POST `/finance/payment-terms/versions` | zweiter Aufruf `201`, `versionNumber` = 2 |
| POST /invoices returns 422 TRACEABILITY_LINK_MISSING when body valid | Edge (fail-closed) | POST `/invoices` | `422` / `TRACEABILITY_LINK_MISSING` |
| GET /invoices/:id returns 404 DOCUMENT_NOT_FOUND | Negative | GET `/invoices/{id}` | `404` / `DOCUMENT_NOT_FOUND` |
| POST /finance/payments/intake requires Idempotency-Key UUID | Edge | POST `/finance/payments/intake` | `400` / `VALIDATION_FAILED` |
| POST /finance/payments/intake rejects non-UUID Idempotency-Key with 400 | Edge | POST `/finance/payments/intake` | `400` / `VALIDATION_FAILED` |
| POST /finance/payments/intake returns 422 when header and body valid | Edge | POST `/finance/payments/intake` | `422` / `TRACEABILITY_LINK_MISSING` |
| POST /finance/payments/intake accepts Idempotency-Key header name case-insensitive (UPPERCASE) | Edge | POST `/finance/payments/intake` | `422` / `TRACEABILITY_LINK_MISSING` |
| POST /finance/payments/intake trims Idempotency-Key value before UUID parse | Edge | POST `/finance/payments/intake` | `422` / `TRACEABILITY_LINK_MISSING` |
| GET /invoices/:invoiceId/dunning-reminders returns empty list (FIN-4 read stub) | Happy | GET `/invoices/{invoiceId}/dunning-reminders` | `200` + `{ "data": [] }` |
| GET /finance/dunning-reminder-config returns MVP or tenant DB stages (FIN-4 Slice 3–4) | Happy | GET `/finance/dunning-reminder-config` | `200` + `data.configSource` **MVP_STATIC_DEFAULTS** oder **TENANT_DATABASE**, 9 Stufen |
| GET /finance/dunning-reminder-config allows VIEWER (read-only) | Happy | GET `/finance/dunning-reminder-config` | `200` (Leserecht wie Rechnung) |
| GET /finance/dunning-reminder-config rejects tenant header mismatch with 403 | Negative | GET `/finance/dunning-reminder-config` | `403` / `TENANT_SCOPE_VIOLATION` |
| PATCH /finance/dunning-reminder-config/stages/1 returns 503 in memory mode | Negative | PATCH `/finance/dunning-reminder-config/stages/1` | `503` / `DUNNING_STAGE_CONFIG_NOT_PERSISTABLE` |
| DELETE /finance/dunning-reminder-config/stages/1 returns 503 in memory mode | Negative | DELETE `/finance/dunning-reminder-config/stages/1` | `503` / `DUNNING_STAGE_CONFIG_NOT_PERSISTABLE` |
| PUT /finance/dunning-reminder-config returns 503 in memory mode | Negative | PUT `/finance/dunning-reminder-config` | `503` / `DUNNING_STAGE_CONFIG_NOT_PERSISTABLE` |
| PUT /finance/dunning-reminder-config rejects VIEWER with 403 | Negative | PUT `/finance/dunning-reminder-config` | `403` / `AUTH_ROLE_FORBIDDEN` |
| PUT /finance/dunning-reminder-config rejects invalid stages with 400 | Edge | PUT `/finance/dunning-reminder-config` | `400` / `VALIDATION_FAILED` |
| rejects tenant header mismatch with 403 | Negative | POST `/invoices` | `403` / `TENANT_SCOPE_VIOLATION` |
| POST /finance/payments/intake rejects tenant header mismatch with 403 | Negative | POST `/finance/payments/intake` | `403` / `TENANT_SCOPE_VIOLATION` |
| GET /invoices/:id rejects invalid Bearer with 401 UNAUTHORIZED | Negative | GET `/invoices/{id}` | `401` / `UNAUTHORIZED` |
| GET /invoices/:id rejects tenant header mismatch with 403 | Negative | GET `/invoices/{id}` | `403` / `TENANT_SCOPE_VIOLATION` |
| POST /invoices returns 400 VALIDATION_FAILED when reason too short | Edge | POST `/invoices` | `400` / `VALIDATION_FAILED` |
| rejects invalid Bearer with 401 UNAUTHORIZED (POST /finance/payment-terms/versions) | Negative | POST `/finance/payment-terms/versions` | `401` / `UNAUTHORIZED` |
| GET /invoices/:invoiceId/payment-intakes returns empty list before payments (FIN-3 read) | Happy | GET `/invoices/{invoiceId}/payment-intakes` | `200` + `{ "data": [] }` |
| GET /invoices/:invoiceId/payment-intakes lists row after intake (no idempotency key in body) | Happy | GET `/invoices/{invoiceId}/payment-intakes` | `200`, Einträge ohne `idempotencyKey` in der Antwort |
| GET /invoices/:invoiceId/payment-intakes returns 404 for unknown invoice | Negative | GET `/invoices/{invoiceId}/payment-intakes` | `404` / `DOCUMENT_NOT_FOUND` |
| POST /finance/payments/intake records full payment for seed invoice (FIN-3) | Happy | POST `/finance/payments/intake` | `201`, `invoiceStatus` **BEZAHLT** wenn Vollzahlung |
| POST /finance/payments/intake is idempotent (200 replay) | Happy | POST `/finance/payments/intake` | zweiter Aufruf gleicher Key+Body → `200`, gleicher JSON-Body wie erstes `201` |
| POST /finance/payments/intake returns PAYMENT_INTAKE_IDEMPOTENCY_MISMATCH when key reused with different amount | Edge | POST `/finance/payments/intake` | `400` / `PAYMENT_INTAKE_IDEMPOTENCY_MISMATCH` |
| POST /finance/payments/intake returns PAYMENT_EXCEEDS_OPEN_AMOUNT when overpaying | Negative | POST `/finance/payments/intake` | `400` / `PAYMENT_EXCEEDS_OPEN_AMOUNT` |

*Die FIN-3-`it`-Blöcke stehen im Quellfile von `finance-fin0-stubs.test.ts` **nach** den Mahn-Tests; die Tabelle listet sie am Tabellenende gebündelt.*

---

## Happy (langfristig / aktuell)

| Route | Erwartung | Hinweis |
| --- | --- | --- |
| POST `/finance/payment-terms/versions` | `201` + Payload | **FIN-1** umgesetzt (`payment_terms_*`, ADR-0008) |
| POST `/invoices` | `201` + `invoiceId` bei gültiger Traceability | **FIN-2**; ohne Kette `422` / `TRACEABILITY_LINK_MISSING` (Edge unten) |
| GET `/invoices/{invoiceId}` | `200` Rechnungskopf | **FIN-2** |
| POST `/finance/payments/intake` | `201` bzw. Replay `200` (Idempotenz), Zahlungsstatus **TEILBEZAHLT**/**BEZAHLT** | **FIN-3**; Persistenz-Stichproben in [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts) |
| GET `/invoices/{invoiceId}/payment-intakes` | `200` + Liste (ohne Idempotency-Key-Felder in Zeilen) | **FIN-3**; Leserecht wie Rechnung |
| GET `/invoices/{invoiceId}/dunning-reminders` | `200` + `{ "data": [] }` (oder persistierte Zeilen) | FIN-4; Postgres-Stichprobe in [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts) |
| POST `/invoices/{invoiceId}/dunning-reminders/email-preview` | `200` + `data.fullPlainText` | M4 Slice 4; Stubs + Persistenz-`it` |
| POST `/invoices/{invoiceId}/dunning-reminders/send-email-stub` | `200` + `outcome: NOT_SENT_NO_SMTP` nach Footer-Setup; sonst `400` `DUNNING_EMAIL_FOOTER_NOT_READY` | M4 Slice 4; Stubs + Persistenz-`it` |
| POST `/invoices/{invoiceId}/dunning-reminders/send-email` | `200` + `outcome: SENT` mit gemocktem SMTP (Persistenz-`it`); ohne SMTP nach Footer `503` `DUNNING_EMAIL_SMTP_NOT_CONFIGURED`; Replay gleicher `Idempotency-Key` → `REPLAY` | M4 Slice 5a; Header `Idempotency-Key` + Body `toEmail` |
| GET `/finance/dunning-reminder-config` | `200` + neun Stufen; ohne vollständige DB-Zeilen `MVP_STATIC_DEFAULTS`, mit 9 Zeilen in `dunning_tenant_stage_config` `TENANT_DATABASE` | FIN-4 — [`docs/adr/0009-fin4-mahnwesen-slice.md`](../adr/0009-fin4-mahnwesen-slice.md); Persistenz-`it` |
| PUT `/finance/dunning-reminder-config` | `200` + `TENANT_DATABASE` nach atomarer Ersetzung; Audit+Konfig in **einer** Tx | FIN-4; Persistenz-`it` |
| `PATCH|DELETE …/stages/{n}` | Postgres: siehe Persistenz-`it` (Soft-Delete → GET MVP; PATCH Tombstone → `404`) | [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts) |
| POST `/invoices/{invoiceId}/dunning-reminders` | `201` + `dunningReminderId` bei gebuchter/teilbezahlter Rechnung | SoT **`RECORD_DUNNING_REMINDER`**; Stubs + Persistenz-`it` |

---

## Edge (Validierung / Idempotenz / Traceability)

| Route | Fall | HTTP | `code` (Domain) |
| --- | --- | --- | --- |
| POST `/finance/payments/intake` | Body ok, **ohne** gültigen `Idempotency-Key` (UUID) | `400` | `VALIDATION_FAILED` |
| POST `/invoices/{invoiceId}/dunning-reminders/send-email` | Body ok, **ohne** `Idempotency-Key` oder keine UUID | `400` | `VALIDATION_FAILED` |
| POST `/finance/payments/intake` | Header gesetzt, Wert **keine** UUID | `400` | `VALIDATION_FAILED` |
| POST `/invoices` | `reason` kürzer als `minLength` | `400` | `VALIDATION_FAILED` |
| POST `/finance/payments/intake` | Header + Body formal ok, Traceability nicht erfüllt | `422` | `TRACEABILITY_LINK_MISSING` |
| POST `/invoices` | Body formal ok, Traceability nicht erfüllt | `422` | `TRACEABILITY_LINK_MISSING` |

---

## Negative (Auth / Tenant / nicht gefunden)

| Route | Fall | HTTP | `code` | Tests |
| --- | --- | --- | --- | --- |
| POST `/finance/payment-terms/versions` | Ungültiger Bearer | `401` | `UNAUTHORIZED` | ja |
| POST `/invoices` | `x-tenant-id` ≠ Tenant im Token | `403` | `TENANT_SCOPE_VIOLATION` | ja |
| POST `/finance/payments/intake` | `x-tenant-id` ≠ Tenant im Token | `403` | `TENANT_SCOPE_VIOLATION` | ja |
| POST `/finance/payments/intake` | Betrag über offenem Saldo (Überzahlung) | `400` | `PAYMENT_EXCEEDS_OPEN_AMOUNT` | ja |
| GET `/invoices/{invoiceId}` | Beliebige UUID, kein Dokument | `404` | `DOCUMENT_NOT_FOUND` | ja |
| GET `/invoices/{invoiceId}/payment-intakes` | unbekannte `invoiceId` | `404` | `DOCUMENT_NOT_FOUND` | ja |
| GET `/invoices/{invoiceId}` | `x-tenant-id` ≠ Tenant im Token | `403` | `TENANT_SCOPE_VIOLATION` | ja |
| GET `/invoices/{invoiceId}/dunning-reminders` | gültige Rechnung, kein fremder Mandant | `200` | — | Persistenz-`it` (Tenant + leere Liste) |
| POST `/invoices/{invoiceId}/dunning-reminders` | Rechnung **ENTWURF** (nicht mahnbereit) | `400` | `DUNNING_INVOICE_NOT_ELIGIBLE` | ja |
| POST `/invoices/{invoiceId}/dunning-reminders` | Rolle **VIEWER** | `403` | `AUTH_ROLE_FORBIDDEN` | ja |
| POST `/invoices/{invoiceId}/dunning-reminders` | `x-tenant-id` ≠ Token-Tenant | `403` | `TENANT_SCOPE_VIOLATION` | ja |
| POST `/invoices/{invoiceId}/dunning-reminders` | unbekannte `invoiceId` | `404` | `DOCUMENT_NOT_FOUND` | ja |
| POST `/invoices/{invoiceId}/dunning-reminders` | `reason` zu kurz / `stageOrdinal` außerhalb 1–9 | `400` | `VALIDATION_FAILED` | ja |
| POST `/invoices/{invoiceId}/dunning-reminders/send-email-stub` | Footer technisch unvollständig (`readyForEmailFooter=false`) | `400` | `DUNNING_EMAIL_FOOTER_NOT_READY` | ja |
| POST `/invoices/{invoiceId}/dunning-reminders/send-email-stub` | Rolle **VIEWER** | `403` | `AUTH_ROLE_FORBIDDEN` | ja |
| POST `/invoices/{invoiceId}/dunning-reminders/send-email` | Rolle **VIEWER** | `403` | `AUTH_ROLE_FORBIDDEN` | ja |
| POST `/invoices/{invoiceId}/dunning-reminders/send-email` | Gleicher `Idempotency-Key`, abweichendes `toEmail` | `400` | `DUNNING_EMAIL_IDEMPOTENCY_MISMATCH` | Persistenz-`it` |
| POST `/invoices/{invoiceId}/dunning-reminders/email-preview` | Rolle **VIEWER** (Lesepfad) | `200` | — | ja |
| GET `/finance/dunning-reminder-config` | `x-tenant-id` ≠ Token-Tenant | `403` | `TENANT_SCOPE_VIOLATION` | ja |
| PUT `/finance/dunning-reminder-config` | `x-tenant-id` ≠ Token-Tenant | `403` | `TENANT_SCOPE_VIOLATION` | (analog GET) |
| PUT `/finance/dunning-reminder-config` | Rolle **VIEWER** | `403` | `AUTH_ROLE_FORBIDDEN` | ja |
| PUT `/finance/dunning-reminder-config` | In-Memory-Modus | `503` | `DUNNING_STAGE_CONFIG_NOT_PERSISTABLE` | ja |

---

## Pflege

- Jeder Contract-PR (OpenAPI / `error-codes.json` / Mapping): Matrix + [`test/finance-fin0-stubs.test.ts`](../../test/finance-fin0-stubs.test.ts) abstimmen (**G8**).

