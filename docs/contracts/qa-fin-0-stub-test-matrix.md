# FIN-0 — Stub-Testmatrix (HTTP, OpenAPI-Skelett)

**Zweck:** Knappe Zuordnung **Happy / Edge / Negative** für die Finanz-Stub-Routen aus `docs/api-contract.yaml` — erwartete **HTTP-Status** und Domain-`code` laut [`finance-fin0-openapi-mapping.md`](./finance-fin0-openapi-mapping.md) und [`error-codes.json`](./error-codes.json). **Keine** Gate-Spalten in `FIN-2-START-GATE.md` setzen (nur PL).

**Implementierungsreferenz (kein Duplikat der Testlogik):** [`test/finance-fin0-stubs.test.ts`](../../test/finance-fin0-stubs.test.ts) — bei Erweiterungen des Backend-PRs dort ergänzen; diese Matrix nur pflegen, wenn sich Contract oder Fail-Closed-Semantik ändert.

**Tenant-Isolation:** Stichprobe **Cross-Tenant-Header** ist in derselben Testdatei abgedeckt (`TENANT_SCOPE_VIOLATION`); Persistenz-/Postgres-Tenant-Lecks bleiben in [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts) (siehe Gate G1/G2 in `qa-fin-0-gate-readiness.md`).

---

## Routenüberblick (FIN-0 Scope)

| Route | Methode | OpenAPI `operationId` |
| --- | --- | --- |
| `/finance/payment-terms/versions` | POST | `finPaymentTermsVersionCreate` |
| `/invoices` | POST | `finInvoiceDraftCreate` |
| `/invoices/{invoiceId}` | GET | `finInvoiceGet` |
| `/finance/payments/intake` | POST | `finPaymentIntakeCreate` |

---

## Abdeckung in `test/finance-fin0-stubs.test.ts` (keine Duplikation der Assertions)

| Vitest-Beschreibung (Kurz) | Matrix-Kategorie | Route | Erwartung |
| --- | --- | --- | --- |
| POST payment-terms … 422 TRACEABILITY… | Edge (fail-closed) | POST `/finance/payment-terms/versions` | `422` / `TRACEABILITY_LINK_MISSING` |
| POST /invoices … 422 TRACEABILITY… | Edge | POST `/invoices` | `422` / `TRACEABILITY_LINK_MISSING` |
| GET /invoices/:id … 404 DOCUMENT… | Negative | GET `/invoices/{id}` | `404` / `DOCUMENT_NOT_FOUND` |
| POST intake requires Idempotency-Key | Edge | POST `/finance/payments/intake` | `400` / `VALIDATION_FAILED` |
| POST intake … 422 … | Edge | POST `/finance/payments/intake` | `422` / `TRACEABILITY_LINK_MISSING` |
| rejects tenant header mismatch | Negative | POST `/invoices` | `403` / `TENANT_SCOPE_VIOLATION` |
| rejects invalid Bearer … | Negative | POST `/finance/payment-terms/versions` | `401` / `UNAUTHORIZED` |

---

## Happy (Zielverhalten nach Gate / vollständiger Implementierung — Contract-orientiert)

| Route | Erwartung (langfristig laut OpenAPI-Kommentar) | Hinweis |
| --- | --- | --- |
| POST `/finance/payment-terms/versions` | `201` + Ressource nach FIN-1/Gate | Bis dahin Stub fail-closed |
| POST `/invoices` | `201` + `invoiceId` nach FIN-2/Gate | Bis dahin Stub |
| GET `/invoices/{invoiceId}` | `200` + Payload nach FIN-2 | Bis dahin Stub |
| POST `/finance/payments/intake` | `201` nach FIN-3/Gate | Bis dahin Stub |

*Die aktuellen automatisierten „Happy“-Pfad-Assertions sind bewusst **fail-closed** (422/404), bis Gate und Implementierung die 201/200-Pfade freigeben.*

---

## Edge (Stub / Validierung / Idempotenz-Hook)

| Route | Fall | HTTP | `code` (Domain) | Quelle Mapping |
| --- | --- | --- | --- | --- |
| POST `/finance/payments/intake` | Body ok, **ohne** gültigen `Idempotency-Key` (UUID) | `400` | `VALIDATION_FAILED` | OpenAPI `400`; Mapping Zahlungs-Schema |
| POST `/finance/payments/intake` | Header + Body formal ok, Traceability nicht erfüllt | `422` | `TRACEABILITY_LINK_MISSING` | Mapping Zeile „Mutierender Finanz-Endpunkt …“ |
| POST `/invoices` | Body formal ok, Traceability nicht erfüllt | `422` | `TRACEABILITY_LINK_MISSING` | idem |
| POST `/finance/payment-terms/versions` | Body formal ok, Traceability nicht erfüllt | `422` | `TRACEABILITY_LINK_MISSING` | idem |

---

## Negative (Auth / Tenant / nicht gefunden)

| Route | Fall | HTTP | `code` | Implementiert in Stub-Tests |
| --- | --- | --- | --- | --- |
| POST `/finance/payment-terms/versions` | Ungültiger Bearer | `401` | `UNAUTHORIZED` | ja |
| POST `/invoices` | `x-tenant-id` ≠ Tenant im Token | `403` | `TENANT_SCOPE_VIOLATION` | ja |
| GET `/invoices/{invoiceId}` | Beliebige UUID, kein Dokument | `404` | `DOCUMENT_NOT_FOUND` | ja |

Weitere Kombinationen (`AUTH_ROLE_FORBIDDEN`, `EXPORT_PREFLIGHT_FAILED`, `TRACEABILITY_FIELD_MISMATCH`) gemäß OpenAPI-`responses` ergänzen, sobald im Backend explizit ausgeliefert — jeweils mit Contract-Update (G8).

---

## Pflege

- Jeder Contract-PR (OpenAPI / `error-codes.json` / Mapping): Matrix + [`test/finance-fin0-stubs.test.ts`](../../test/finance-fin0-stubs.test.ts) abstimmen (**G8**).
- Tracker-/Issue-URLs nur **echt** aus dem Team-System ins PR; **keine** erfundenen GitHub-Links.
