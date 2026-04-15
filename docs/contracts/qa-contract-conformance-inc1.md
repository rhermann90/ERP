# QA — Contract vs. API Konformität (Phase 2 Increment 1)

Ziel: Schnelle, wiederholbare Prüfpunkte ohne vollständige E2E-UI.  
Basis: `docs/api-contract.yaml`, `docs/contracts/action-contracts.json`, `docs/contracts/error-codes.json`, aktueller Backend-Stand.

## Prüfpunkte (manuell oder per Test abgedeckt)

| # | Prüfung | Erwartung |
|---|---------|-----------|
| 1 | Jede `actionId` in `action-contracts.json` für Measurement hat einen dokumentierten Endpoint | Pfad + Methode in OpenAPI oder klarer Verweis |
| 2 | `GET /documents/{id}/allowed-actions?entityType=MEASUREMENT_VERSION` | Liefert nur Aktionen, die `POST`-Äquivalente mit gleicher AuthZ erlauben |
| 3 | `MEASUREMENT_CREATE_VERSION` | Nur wenn Policy + Rolle es erlauben; sonst DomainError |
| 4 | Measurement-Statusübergänge | Nur erlaubte Kanten; Audit bei kritischen Schritten |
| 5 | `SUPPLEMENT_SET_ARCHIVIERT` aus `ENTWURF` | In SoT für berechtigte Rolle (ADMIN/GF); nicht für Rollen ohne Recht |
| 6 | `POST /supplements/status` | Kein Übergang, der nicht in `ALLOWED_SUPPLEMENT_TRANSITIONS` und SoT-Matrix steht |
| 7 | Rechnungs-Export mit `measurementId` | Traceability fail-closed bei Kopf-Inkonsistenz |
| 8 | Error-Envelope | `code`, `message`, `correlationId`, `retryable`, `blocking` bei Domain-Fehlern |
| 9 | `error-codes.json` `domainErrorCodesEmitted` | Kein Code nur im Contract ohne Backend-Emission im geprüften Scope |
| 10 | Tenant | `TENANT_SCOPE_VIOLATION` bei Header/Token-Mismatch auf neuen Measurement-/Supplement-Pfaden |

## Ergebnis (pro Lauf einzutragen)

- Datum:
- `npm test`: __ / __- Abweichungen:
