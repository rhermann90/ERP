# Contract Hints — TICKET-002 Nachtrags-Lebenszyklus (Vorbereitung)

## Zweck
Vorbereitende Hinweise für den Frontend-Contracts-Schritt nach Backend-GO.  
Keine produktive Contract-Umstellung auf den vollen Lebenszyklus, solange TICKET-002 nicht formal freigegeben ist.

## Erwartete Contract-Erweiterungen (nach GO)

### action-contracts.json
- Neue/erweiterte `actionId`s für Nachtragsstatus:
  - `SUPPLEMENT_SET_IN_FREIGABE`
  - `SUPPLEMENT_SET_FREIGEGEBEN`
  - `SUPPLEMENT_SET_VERSENDET`
  - `SUPPLEMENT_SET_BEAUFTRAGT`
  - `SUPPLEMENT_SET_ABGELEHNT`
  - `SUPPLEMENT_SET_ARCHIVIERT`
- `OFFER_CREATE_SUPPLEMENT` bleibt erhalten (Anlagepfad aus Ticket-001).
- Für jede Aktion: `requiredRole`, `allowedFromStatus`, `backendErrors`, `auditEventType`.

### module-contracts.json
- Nachtragsmodul aufnehmen:
  - Entity-Felder inkl. `baseOfferVersionId`, `status`, `tenantId`.
  - Marker für Wirkungsgrenze:
    - vor `BEAUFTRAGT`: keine abrechenbare Wirkung
    - ab `BEAUFTRAGT`: referenzierte Wirkung auf Aufmaß/Rechnung (Iterationsschnitt aus Ticket-002)

### error-codes.json
- Reserve für Lifecycle-/Wirkungsgrenzen-Codes:
  - Statusübergangsblocker für Nachtrag
  - Wirkung-vor-Beauftragt fail-closed
  - Traceability-/Export-Blocker mit Nachtragsbezug
- Alle neuen Codes mit `httpStatus`, `retryable`, `blocking`, `uiReaction`.

## API-Contract-Hinweise (docs/api-contract.yaml)
- Nachtragsspezifische Statusübergangsendpunkte oder generische Dokument-Transitions (abhängig von Backend-Design nach GO).
- `allowed-actions` SoT klar dokumentieren (kein UI-Regel-Derivat).

## QA-Hinweis
Jede Contract-Erweiterung muss auf mindestens eine P0-Zeile aus `qa-p0-ticket-002-nachtrag-lifecycle.md` mappen.
