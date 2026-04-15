# QA P0 Matrix - Phase 2 Increment 1 (Aufmass)

Quellen: `ERP Systembeschreibung v1.2.md`, `docs/contracts/action-contracts.json`, `docs/contracts/error-codes.json`, `docs/api-contract.yaml`

Fokus P0: Tenant-Isolation, SoT (`allowedActions`) vs schreibende API, Audit auf kritischen Übergängen, Traceability/fail-closed.

| P0-ID | Bereich | Erwartung | Test (`it("...")`) | Datei | Status |
| --- | --- | --- | --- | --- | --- |
| P2I1-P0-01 | Tenant | Kein Cross-Tenant-Zugriff auf Aufmass | `it("P2-M-02 tenant isolation on measurement read", ...)` | `test/app.test.ts` | PASS |
| P2I1-P0-02 | Audit kritische Übergänge | Statuswechsel `GEPRUEFT -> FREIGEGEBEN -> ABGERECHNET -> ARCHIVIERT` auditierbar | `it("P2-M-01 full lifecycle with audit on status changes", ...)` | `test/app.test.ts` | PASS |
| P2I1-P0-03 | Unveraenderbarkeit nach Freigabe | Positionsedit nach `FREIGEGEBEN` blockiert (`§5.4`) | `it("P2-M-03 position edit forbidden after FREIGEGEBEN (§5.4)", ...)` | `test/app.test.ts` | PASS |
| P2I1-P0-04 | Versionierungsregel Aufmass | Neue Aufmassversion aus `ENTWURF` verboten (nur definierte Statusfenster) | `it("P2-M-04 MEASUREMENT_CREATE_VERSION forbidden from ENTWURF", ...)` | `test/app.test.ts` | PASS |
| P2I1-P0-05 | SoT vs API (Rollen) | Aktion ohne SoT-Eintrag darf nicht ausführbar sein (`MEASUREMENT_UPDATE_POSITIONS`) | `it("P2-M-05 SoT parity: BUCHHALTUNG cannot POST positions when SoT omits MEASUREMENT_UPDATE_POSITIONS", ...)` | `test/app.test.ts` | PASS |
| P2I1-P0-06 | SoT vs API (Versionkontext) | Nicht-aktuelle Version: leere SoT + Status-API blockiert | `it("P2-M-06 non-current version: empty SoT and status transition blocked", ...)` | `test/app.test.ts` | PASS |
| P2I1-P0-07 | Traceability fail-closed | Rechnungsexport blockiert bei Aufmass/LV-Mismatch | `it("P2-M-07 invoice traceability fails when measurement LV mismatch", ...)` | `test/app.test.ts` | PASS |

## Ergänzende Regression (Kontext, nicht zusätzliche P0-ID)
- `it("blocks invoice export for draft invoices (negative preflight)", ...)` in `test/app.test.ts`
- `it("fails invoice export when traceability is broken (negative)", ...)` in `test/app.test.ts`
- `it("fails invoice export when traceability fields are inconsistent (negative)", ...)` in `test/app.test.ts`
