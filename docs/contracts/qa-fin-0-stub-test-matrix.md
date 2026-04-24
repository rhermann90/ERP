# FIN-0 — Stub-Testmatrix (HTTP, OpenAPI-Skelett)

**Zweck:** Knappe Zuordnung **Happy / Edge / Negative** für die Finanz-Routen aus `docs/api-contract.yaml` — erwartete **HTTP-Status** und Domain-`code` laut [`finance-fin0-openapi-mapping.md`](./finance-fin0-openapi-mapping.md) und [`error-codes.json`](./error-codes.json). **Keine** Gate-Spalten in `FIN-2-START-GATE.md` setzen (nur PL).

**Implementierungsreferenz:** [`test/finance-fin0-stubs.test.ts`](../../test/finance-fin0-stubs.test.ts) — bei Contract-Änderungen dort und in dieser Matrix nachziehen (**G8**).

**Tenant-Isolation:** Stichprobe **Cross-Tenant-Header** in derselben Testdatei (`TENANT_SCOPE_VIOLATION`); Postgres-Tenant-Lecks in [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts).

---

## Routenüberblick

| Route | Methode | OpenAPI `operationId` | Implementierung |
| --- | --- | --- | --- |
| `/finance/payment-terms/versions` | POST | `finPaymentTermsVersionCreate` | **FIN-1** — [`src/api/finance-payment-terms-routes.ts`](../../src/api/finance-payment-terms-routes.ts) |
| `/invoices` | POST | `finInvoiceDraftCreate` | FIN-0 Stub (fail-closed) |
| `/invoices/{invoiceId}` | GET | `finInvoiceGet` | FIN-0 Stub |
| `/finance/payments/intake` | POST | `finPaymentIntakeCreate` | FIN-0 Stub (fail-closed) |

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
| rejects tenant header mismatch with 403 | Negative | POST `/invoices` | `403` / `TENANT_SCOPE_VIOLATION` |
| POST /finance/payments/intake rejects tenant header mismatch with 403 | Negative | POST `/finance/payments/intake` | `403` / `TENANT_SCOPE_VIOLATION` |
| GET /invoices/:id rejects invalid Bearer with 401 UNAUTHORIZED | Negative | GET `/invoices/{id}` | `401` / `UNAUTHORIZED` |
| GET /invoices/:id rejects tenant header mismatch with 403 | Negative | GET `/invoices/{id}` | `403` / `TENANT_SCOPE_VIOLATION` |
| POST /invoices returns 400 VALIDATION_FAILED when reason too short | Edge | POST `/invoices` | `400` / `VALIDATION_FAILED` |
| rejects invalid Bearer with 401 UNAUTHORIZED (POST /finance/payment-terms/versions) | Negative | POST `/finance/payment-terms/versions` | `401` / `UNAUTHORIZED` |

---

## Happy (langfristig / aktuell)

| Route | Erwartung | Hinweis |
| --- | --- | --- |
| POST `/finance/payment-terms/versions` | `201` + Payload | **FIN-1** umgesetzt (`payment_terms_*`, ADR-0008) |
| POST `/invoices` | `201` + `invoiceId` nach FIN-2/Gate | bis dahin Stub fail-closed |
| GET `/invoices/{invoiceId}` | `200` nach FIN-2 | bis dahin Stub |
| POST `/finance/payments/intake` | `201` nach FIN-3/Gate | bis dahin Stub |

---

## Edge (Stub / Validierung / Idempotenz)

| Route | Fall | HTTP | `code` (Domain) |
| --- | --- | --- | --- |
| POST `/finance/payments/intake` | Body ok, **ohne** gültigen `Idempotency-Key` (UUID) | `400` | `VALIDATION_FAILED` |
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
| GET `/invoices/{invoiceId}` | Beliebige UUID, kein Dokument | `404` | `DOCUMENT_NOT_FOUND` | ja |
| GET `/invoices/{invoiceId}` | `x-tenant-id` ≠ Tenant im Token | `403` | `TENANT_SCOPE_VIOLATION` | ja |

---

## Pflege

- Jeder Contract-PR (OpenAPI / `error-codes.json` / Mapping): Matrix + [`test/finance-fin0-stubs.test.ts`](../../test/finance-fin0-stubs.test.ts) abstimmen (**G8**).

