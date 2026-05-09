# PWA: `action-executor` vs. `action-contracts.json`

**Zweck:** Klarstellen, welche `actionId`-Werte aus [`action-contracts.json`](./action-contracts.json) die Shell-Funktion [`executeAllowedAction`](../../apps/web/src/lib/action-executor.ts) (Import aus `apps/web/src/lib/action-executor.js`) abdeckt — und welche **nicht** über diesen Pfad laufen.

**Quelle der Wahrheit für erlaubte Aktionen:** Backend `GET /documents/{id}/allowed-actions` (keine parallele Berechtigungslogik in der UI).

## Abdeckung `executeAllowedAction` (Haupt-Shell / Dokumentkontext)

| actionId-Gruppe | Bemerkung |
|-----------------|-----------|
| `OFFER_SET_*`, `SUPPLEMENT_SET_*` | Status-POSTs |
| `SUPPLEMENT_APPLY_BILLING_IMPACT` | Rechnungszuordnung |
| `MEASUREMENT_*` (Create, Version, Status, Positions) | — |
| `OFFER_CREATE`, `OFFER_CREATE_VERSION`, `OFFER_CREATE_SUPPLEMENT` | `OFFER_CREATE` → `POST /offers` |
| `BOOK_INVOICE`, `EXPORT_INVOICE` (kanonisch), `EXPORT_OFFER_VERSION`, `EXPORT_SUPPLEMENT_VERSION` | `EXPORT_INVOICE_XRECHNUNG` ist **verboten** (Explizitfehler im Executor) |
| `RECORD_DUNNING_REMINDER` | Mahn-POST je Rechnung |
| `LV_*` (Katalog, Version, Struktur, Positionen) | — |
| `AUDIT_READ` | `GET /audit-events` (paginiert) |

`OFFER_SET_ARCHIVIERT` ist im Executor über `OFFER_NEXT` abgebildet; falls das Backend die Aktion liefert, funktioniert der Aufruf. Fehlt sie in `action-contracts.json`, ist das ein **Contract-Backlog** (getrennt von Code).

## Nicht über `executeAllowedAction` (eigene UI / ApiClient)

| actionId | Ort / Muster |
|----------|----------------|
| `RECORD_PAYMENT_INTAKE` | Finanz-Vorbereitung, SoT in [`apps/web/src/lib/finance-sot.ts`](../../apps/web/src/lib/finance-sot.ts); `POST /finance/payments/intake` mit Idempotency-Key |
| `MANAGE_INVOICE_TAX_SETTINGS` | [`FinanceInvoiceTaxSettingsPanel`](../../apps/web/src/components/finance/preparation/FinanceInvoiceTaxSettingsPanel.tsx); FIN-5 `/finance/invoice-tax-profile…` |

## Pflege bei neuen `actionId`

1. Eintrag in [`action-contracts.json`](./action-contracts.json).
2. Entweder Erweiterung von [`action-executor.ts`](../../apps/web/src/lib/action-executor.ts) **oder** bewusste Parallel-UI mit Dokumentation hier und in [`apps/web/README.md`](../../apps/web/README.md).
