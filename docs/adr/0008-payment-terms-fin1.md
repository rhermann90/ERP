# ADR-0008: Zahlungsbedingungen (FIN-1, Spez 8.5)

## Status

Akzeptiert (2026-04-21).

## Kontext

Spezifikation v1.3 **8.5** verlangt einen Konditionskopf pro Projekt und **append-only** Versionszeilen (keine stillen Überschreibungen).

## Entscheidung

- **Tabellen:** `payment_terms_heads` (eindeutig `(tenant_id, project_id)`), `payment_terms_versions` (eindeutig `(tenant_id, head_id, version_number)`), FK `(tenant_id, head_id)` → `payment_terms_heads` mit `ON DELETE RESTRICT`.
- **Domäne:** `PaymentTermsHead` / `PaymentTermsVersion` im Arbeitsspeicher; Write-Through über `PrismaPaymentTermsPersistence` bei `repositoryMode=postgres`.
- **API:** `GET /finance/payment-terms?projectId=` — Konditionskopf inkl. aller Versionen (sortiert); ohne Kopf `404` / `DOCUMENT_NOT_FOUND`. Lesende Rollen gemäß Autorisierung (u. a. `BUCHHALTUNG`, `GESCHAEFTSFUEHRUNG`, `ADMIN`).
- **API:** `POST /finance/payment-terms/versions` — erste Version legt den Kopf an, weitere erhöhen `version_number` monoton. Schreibende Rollen: `ADMIN`, `GESCHAEFTSFUEHRUNG`, `BUCHHALTUNG`.
- **Audit:** `entityType` = `PAYMENT_TERMS_VERSION`, `action` = `VERSION_CREATED`.

## Konsequenzen

- Rechnungsentwurf (**FIN-2**) kann optional eine `paymentTermsVersionId` referenzieren; die Version muss zum **Projekt** des Angebots passen (siehe `InvoiceService.createDraft`).
- Zahlungseingang (**FIN-3**) und produktive Buchung außerhalb des FIN-2-Slices bleiben **fail-closed** wo noch nicht implementiert (`POST /finance/payments/intake` Stub).

