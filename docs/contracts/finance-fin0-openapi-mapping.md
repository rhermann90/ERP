# Finanz — OpenAPI, Implementierung und Fehlercodes (G8)

**Zweck:** Abgleich `docs/api-contract.yaml` mit dem **laufenden Code** und mit `docs/contracts/error-codes.json` — keine „Phantom“-`code`-Werte; Änderungen an Domänencodes nur gemeinsam mit Contract-Version und `error-codes.json`.

**Hinweis Dateiname:** Historisch `finance-fin0-…`; Inhalt deckt **FIN-1**, **FIN-2** und verbleibende **FIN-0/FIN-3**-Stubs ab.

## Implementierungsstand (Technik)

| Bereich | HTTP | Module / Einordnung |
|---------|------|---------------------|
| **FIN-1** | `GET /finance/payment-terms?projectId=` | `src/api/finance-payment-terms-routes.ts`, `src/services/payment-terms-service.ts` |
| **FIN-1** | `POST /finance/payment-terms/versions` | dieselben |
| **FIN-2** | `POST /invoices`, `GET /invoices/{invoiceId}` | `src/api/finance-invoice-routes.ts`, `src/services/invoice-service.ts`, `src/persistence/invoice-persistence.ts` |
| **FIN-3** | `POST /finance/payments/intake` | `src/api/finance-payment-intake-routes.ts`, `src/services/payment-intake-service.ts` — Idempotenz `(tenant_id, idempotency_key)`; Zahlung nur bei gebuchter Rechnung mit 8.4-Beträgen |

Traceability-Prüfungen für Rechnungsentwurf: `src/services/invoice-service.ts` (u. a. Aufmaß → LV → Angebot); siehe ADR-0007 / Gate **G5** (`lvVersionId` konsistent zu `offerVersionId`).

## Fail-closed-Zuordnung (HTTP ↔ `code`)

| Situation | HTTP | `code` (Domain) | Bemerkung |
|-----------|------|-----------------|-----------|
| Aufmaß-/LV-/Angebotskette für Entwurf unvollständig | 422 | `TRACEABILITY_LINK_MISSING` | Wie Export-/Traceability-Klasse |
| `lvVersionId` passt nicht zur gewählten `offerVersionId` (Gate **G5**) | 422 | `TRACEABILITY_FIELD_MISMATCH` | u. a. Rechnungsentwurf |
| `paymentTermsVersionId` gesetzt, gehört nicht zum Projekt des Angebots | 422 | `TRACEABILITY_FIELD_MISMATCH` | FIN-1/FIN-2-Verknüpfung |
| Mutierender Endpunkt, Sammelfall Preflight | 422 | `EXPORT_PREFLIGHT_FAILED` | optional `details.validationErrors` |
| Angebotsversion / Angebot / Zahlungsbedingungs-Version / Rechnung fehlt | 404 | `DOCUMENT_NOT_FOUND`, `OFFER_VERSION_NOT_FOUND`, `OFFER_NOT_FOUND` | je nach Pfad |
| Token/Tenant/Rolle | 401/403 | `UNAUTHORIZED`, `TENANT_SCOPE_VIOLATION`, `AUTH_ROLE_FORBIDDEN` | unverändert |

**Explizit:** Keine eigenen Codes für „Feature aus“ oder Idempotenz-Replay ohne `error-codes.json`-Update und Contract-Bump.

## Währung / 8.12

- Request-Schemas: **`invoiceCurrencyCode` required**, Enum nur `EUR`, **ohne** OpenAPI-`default` (kein stiller EUR-Default).

## Idempotency-Key (8.7)

- OpenAPI dokumentiert Header `Idempotency-Key` für Zahlungseingang; technische Eindeutigkeit `(tenant_id, idempotency_key)` in einem späteren FIN-3-Implementierungs-PR.
- **`POST /finance/payments/intake`:** Header wird **case-insensitive** gelesen; Wert muss **UUID** sein — sonst `400` / `VALIDATION_FAILED` (Zod), konsistent zu `docs/api-contract.yaml` (`components.parameters.IdempotencyKey`) und `docs/contracts/qa-fin-0-stub-test-matrix.md`.

## Referenz

- Kanonische OpenAPI: `docs/api-contract.yaml` (Feld `info.version`).
- Gate: `docs/tickets/FIN-2-START-GATE.md` (**G8**).
