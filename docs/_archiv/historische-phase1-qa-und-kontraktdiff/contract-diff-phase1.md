# Contract Diff - Phase 1 (Frontend vs Backend Reality)

## Delta List (Vorher -> Nachher)

1. **Statusmodell vereinheitlicht**
- Vorher: Englische Zielstatus (`DRAFT/SUBMITTED/...`) und Module außerhalb Backend-Scope.
- Nachher: Backend-Status 1:1 (`ENTWURF`, `IN_FREIGABE`, `FREIGEGEBEN`, `VERSENDET`, ...).
- Kritikalität: **kritisch**

2. **Aktionskatalog auf implementierte Endpunkte reduziert**
- Vorher: Viele nicht-implementierte Aktionen (LV/Measurement/Invoice-Workflow intern).
- Nachher: Nur implementierte kritische Aktionen (`/offers/version`, `/offers/status`, `/exports`, `/audit-events`).
- Kritikalität: **kritisch**

3. **allowedActions-SoT präzisiert**
- Vorher: dokument/row/bulk als gleichermaßen verpflichtend.
- Nachher: Dokument-Level verpflichtend in Phase 1; Row/Bulk explizit Phase-2-Auflage.
- Kritikalität: **hoch**

4. **Rollenmodell harmonisiert**
- Vorher: Gemischte Rollenbegriffe mit Domänenrollen ohne Backend-Pendant.
- Nachher: Verbindliche Mapping-Tabelle Frontend->Backend dokumentiert.
- Kritikalität: **hoch**

5. **Error-Codes auf Backend-Reality gemappt**
- Vorher: Teilweise nicht implementierte Codes (`AUTH_SESSION_EXPIRED`, `VERSION_CONFLICT`) in älteren Entwürfen.
- Nachher: `error-codes.json` listet nur in Phase 1 tatsächlich emittierte DomainError-Codes plus `VALIDATION_FAILED` (Catch-All); siehe `domainErrorCodesEmitted`.
- Kritikalität: **kritisch**

6. **Error-Envelope**
- Vorher: Historisch Annahme, Backend liefere nur `code/message/details?`.
- Nachher (final): Backend liefert volles Envelope (`correlationId`, `retryable`, `blocking`); Frontend **Passthrough**; siehe Delta9 / QA-P1-001.
- Kritikalität: **hoch**

7. **Version-Conflict-Strategie angepasst**
- Vorher: Feldklassen-Merge mit `VERSION_CONFLICT`.
- Nachher: Kein dedizierter Backend-Code in Phase 1; UI-Reload-Strategie bei 409.
- Kritikalität: **mittel**

8. **QA-P0-Ableitung explizit gemacht**
- Vorher: P0-Ableitung nur indirekt.
- Nachher: `qaP0MappingHints` und testbare Regeln für Scope-Grenzen.
- Kritikalität: **hoch**

9. **QA-P1-001 Error-Envelope und Code-Liste**
- Vorher: `error-codes.json` enthielt `backendGap` (correlationId/retryable/blocking als nicht backendgeliefert); Abweichung zu `handleError` und OpenAPI `Error`-Schema.
- Nachher: `backendGap` entfernt / QA-Closure dokumentiert; `backendEnvelope` und `domainErrorCodesEmitted` 1:1 zu Implementierung; OpenAPI `Error` mit Pflichtfeldern wie Backend; Decision-Log: Frontend **Passthrough**, Fallback nur temporär begründet.
- Kritikalität: **mittel** (Dokumentation, keine Fachlogikänderung)
- Geschlossen: **2026-04-14** (siehe `./qa-defects-phase1.md`)

## Delta-Bewertung
- Kritische Deltas offen: **0**
- Hohe Deltas offen: **0**
- Mittlere/Niedrige Restpunkte: nur als Phase-2-Auflagen dokumentiert (Row/Bulk, dediziertes VERSION_CONFLICT-Protokoll).

## Delta Segment v1.2 (Policy Mirror Closure)

10. **OFFER_CREATE_VERSION Fehleremission präzisiert**
- Vorher: Teilweise Interpretation, dass `NEW_VERSION_REQUIRED` noch relevant sein könnte.
- Nachher: `action-contracts.json` spiegelt nur reale Emissionen; `NEW_VERSION_REQUIRED` explizit als **nicht emittiert** markiert.
- Kritikalität: **hoch**

11. **v1.2-Regel für VERSENDET/ANGENOMMEN explizit**
- Vorher: v1.2-Aussage war vorhanden, aber nicht klar genug für QA-Ableitung.
- Nachher: `module-contracts.json` stellt klar:
  - `VERSENDET`: keine In-Place-Aenderung, nur neue Angebotsversion.
  - `ANGENOMMEN`: nur Nachtragspfad (sobald Backend-Endpunkt geliefert wird).
- Kritikalität: **hoch**

12. **SoT Nachtrag (Supplement) angebunden**
- Vorher: Nachtragspfad nur textlich erwähnt, nicht vollständig als Action-Contract/P0-SoT ausgeprägt.
- Nachher:
  - `action-contracts.json` enthält `OFFER_CREATE_SUPPLEMENT` (`POST /offers/{offerId}/supplements`) mit Rollen, `allowedFromStatus=["ANGENOMMEN"]` und Backend-Fehlercodes inkl. `SUPPLEMENT_BASE_NOT_ACCEPTED`, `AUTH_ROLE_FORBIDDEN`, `TENANT_SCOPE_VIOLATION`, `UNAUTHORIZED`.
  - `error-codes.json` führt `SUPPLEMENT_BASE_NOT_ACCEPTED` unter emittierten Domain-Codes und im HTTP-409 Workflow-Block.
  - `qa-p0-v12-offer-version-policy.md` enthält konkrete Fastify-inject/curl Beispiele je P0-ID.
- Kritikalität: **hoch**

## Delta Segment TICKET-002 (Nachtrag Lifecycle)

13. **Supplement Lifecycle Actions auf Backend-SoT erweitert**
- Vorher: Nachtragsaktionen unvollständig (fehlend: `SUPPLEMENT_SET_ABGELEHNT`, `SUPPLEMENT_SET_ARCHIVIERT`, `EXPORT_SUPPLEMENT_VERSION`).
- Nachher: `action-contracts.json` enthält alle aktuell backendseitig aus `allowedActions`/Endpoints ableitbaren Nachtragsaktionen.
- Kritikalität: **kritisch**

14. **Supplement Backend-Errors auf Auth/Tenant/Unauthorized ergänzt**
- Vorher: Bei mehreren Supplement-Aktionen fehlten `TENANT_SCOPE_VIOLATION`/`UNAUTHORIZED` als tatsächliche Transport-/Auth-Fehlerpfade.
- Nachher: Backend-Errorlisten je Aktion enthalten jetzt die real emittierten Querschnittscodes.
- Kritikalität: **hoch**

15. **P0-TICKET-002 konkretisiert**
- Vorher: Nur generische P0-Matrix ohne konkrete Request-Beispiele.
- Nachher: `qa-p0-ticket-002-nachtrag-lifecycle.md` enthält pro P0-ID konkrete Fastify-inject/curl-Beispiele.
- Kritikalität: **hoch**
