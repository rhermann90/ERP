# QA Defects - Phase 1 Final Gate

## Pflichtformat Defect-Liste

| Defect ID | Titel | Reproduktion | Betroffene Fachregel | Severity | Risiko | Status | Re-Test-Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| QA-P1-001 | Dokumentationsdrift Error-Envelope (`backendGap` veraltet) | 1) `docs/contracts/error-codes.json` lesen (`backendGap` nennt `correlationId/retryable/blocking` als fehlend). 2) Fehlerantwort von kritischem Endpoint pruefen (z. B. Tenant-Scope-Verstoss). 3) Backend liefert diese Felder bereits. | Contract-/Decision-Konsistenz Frontend-Normalisierung | Mittel | operativ | **Resolved** | **Doc consistency review** (2026-04-14): `error-codes.json` ohne `backendGap`; `backendEnvelope`/`domainErrorCodesEmitted` abgeglichen mit `src/api/app.ts` + DomainError-Quellen; `docs/api-contract.yaml` Schema `Error` ergänzt; `decision-log-phase1-frontend.md` Passthrough final; `contract-diff-phase1.md` Delta 9 ergänzt. |

## Kein kritischer P0-Blocker offen
- Offene **kritische** Defekte: **0**
- Offene **hohe** Defekte: **0**
- Offene **mittlere** Defekte: **0** (QA-P1-001 geschlossen)

## v1.2 P0 Erweiterung (SoT/API)
- Ausfuehrung: `OFFER_CREATE_VERSION` Statusmatrix gegen v1.2 inkl. Negativfaelle `ANGENOMMEN`, `ABGELEHNT`, `ARCHIVIERT`.
- **Nachtrag (SoT-Luecke formal geschlossen):** `OFFER_CREATE_SUPPLEMENT` nach `ANGENOMMEN` fuer `ADMIN`/`VERTRIEB`/`GESCHAEFTSFUEHRUNG` in `allowedActions` und abgestimmt mit `POST /offers/{offerId}/supplements` (`P0-15`); fehlt fuer `VIEWER` (und `BUCHHALTUNG`) inkl. API `403` (`P0-16`).
- Ergebnis: Keine neuen Defekte; SoT (`allowedActions`) und API-Verhalten konsistent.
- Re-Test-Status: **Regression gruen (28/28)**; Matrix mit `it("...")`-Zeilenverweisen: `docs/contracts/qa-p0-matrix-phase1.md`.
