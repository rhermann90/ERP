# FIN-0 — OpenAPI-Finanz-Stubs und bestehende Fehlercodes (G8)

**Zweck:** Abgleich `docs/api-contract.yaml` (FIN-1/FIN-2-Skelett) mit `docs/contracts/error-codes.json` — **keine neuen** `code`-Werte in FIN-0.

**Gate:** Solange `docs/tickets/FIN-2-START-GATE.md` nicht erfüllt ist, ist **FIN-2 Implementation out of scope**; beschriebene Endpunkte sind **Contract-Platzhalter**.

## Fail-closed-Zuordnung (empfohlen, erste Implementierung)

| Situation | HTTP | `code` (Domain) | Bemerkung |
|-----------|------|-----------------|-----------|
| Mutierender Finanz-Endpunkt (z. B. Rechnungsentwurf, Zahlungseingang), Traceability-/LV-Aufmass-Angebot-Kette nicht persistiert/ungenügend laut Gate G1–G3 | 422 | `TRACEABILITY_LINK_MISSING` | Wiederverwendung Export-/Traceability-Klasse; UI: wie Traceability-Diagnostik. |
| Mutierender Endpunkt, fachliche Vorbedingungen wie Export-Preflight nicht erfüllt (Sammelfall) | 422 | `EXPORT_PREFLIGHT_FAILED` | Optional `details.validationErrors` wie bestehend. |
| Lesender Zugriff auf noch nicht vorhandenes Dokument / Slice nicht ausgeliefert | 404 | `DOCUMENT_NOT_FOUND` | Konsistent zu „kein SoT-Dokument“. |
| Token/Tenant/Rolle | 401/403 | `UNAUTHORIZED`, `TENANT_SCOPE_VIOLATION`, `AUTH_ROLE_FORBIDDEN` | unverändert |

**Explizit nicht in FIN-0:** eigene Codes für „Feature aus“ oder Idempotenz-Replay — Erstergänzung nur mit Contract-Version und `error-codes.json`-Update.

## Währung / 8.12

- Request-Schemas: **`invoiceCurrencyCode` required**, Enum nur `EUR`, **ohne** OpenAPI-`default` (kein stiller EUR-Default).

## Idempotency-Key (8.7)

- OpenAPI dokumentiert Header `Idempotency-Key` für Zahlungseingang; technische Eindeutigkeit `(tenant_id, idempotency_key)` im FIN-2/FIN-3-Implementierungs-PR.
- **FIN-0-Stub (`src/api/finance-fin0-stubs.ts`):** Header wird **case-insensitive** gelesen; Wert muss **UUID** sein — sonst `400` / `VALIDATION_FAILED` (Zod), konsistent zu `docs/api-contract.yaml` `responses` für `POST /finance/payments/intake`.
