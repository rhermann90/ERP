# TICKET-002 Contract-Hinweise (vor GO)

## Verbindliche Quellen
- `docs/_archiv/systembeschreibung-und-phasen-legacy/ERP Systembeschreibung v1.2.md`
- `docs/tickets/TICKET-002-nachtrag-lifecycle-v12.md`
- `docs/adr/0002-nachtrag-lifecycle.md`
- `docs/contracts/qa-p0-ticket-002-nachtrag-lifecycle.md`

## Aktueller SoT-Stand (implementiert)
- Nachtrag-Anlage:
  - `POST /offers/{offerId}/supplements`
  - Fehlercode: `SUPPLEMENT_BASE_NOT_ACCEPTED` (409)
- Rollen/SoT:
  - `GET /documents/{id}/allowed-actions?entityType=OFFER_VERSION`
  - `OFFER_CREATE_SUPPLEMENT` nur bei `ANGENOMMEN` und berechtigter Rolle

## Noch nicht freigegeben (GO-pflichtig)
- Voller Nachtrags-Lifecycle (`ENTWURF -> ... -> BEAUFTRAGT/ABGELEHNT -> ARCHIVIERT`) als produktiver Backend-Flow
- Wirkungsgrenze-Implementierung mit Aufmass-/Rechnungskopplung ab `BEAUFTRAGT`
- Traceability-Erweiterung fuer Rechnungskette inkl. Nachtragsreferenz

## Contract-Regel bis GO
- Keine Erweiterung von `action-contracts.json` auf nicht implementierte Lifecycle-Actions als produktiv markiert.
- Nur als vorbereitende Hinweise/Entwuerfe kennzeichnen.
