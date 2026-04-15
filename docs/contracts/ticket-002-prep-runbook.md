# TICKET-002 Prep Runbook (vor Review-GO)

## Zweck
Vorbereitungsleitfaden bis zum formalen Review-GO mit Datum im Ticket.
Kein Produktions-Feature-Commit fuer den vollen Nachtrags-Lebenszyklus.

## GO-Vorbedingung (hart)
- In `docs/tickets/TICKET-002-nachtrag-lifecycle-v12.md` muss die Checkliste enthalten:
  - `Review-GO für TICKET-002 erteilt` = angehakt
  - Datum + Namen (Projektleiter + Softwarearchitekt) im Tickettext

## Reihenfolge nach GO
1. Backend
2. Frontend (Contracts)
3. QA
4. Senior Code Reviewer

## Backend-Prep (jetzt erlaubt)
- Endpunkt-/Code-Inventory fuer Nachtrag aktualisieren:
  - `POST /offers/{offerId}/supplements`
  - `SUPPLEMENT_BASE_NOT_ACCEPTED`
  - Rollen/allowed-actions fuer `ANGENOMMEN`
- Testmatrix-Mapping vorbereiten gegen:
  - `docs/contracts/qa-p0-ticket-002-nachtrag-lifecycle.md`
- Kein neuer Lifecycle-Endpunkt ohne GO.

## Frontend-Prep (jetzt erlaubt)
- Contract-Notizen markieren:
  - Nachtrag-SoT ist aktuell Minimal-API + bestehende allowed-actions-SoT.
  - Voller Nachtrags-Lifecycle bleibt blockiert bis GO.

## QA-Prep (jetzt erlaubt)
- P0-Matrix vorstrukturieren:
  - Welche Tests schon auf TICKET-001/Tagesstand laufen
  - Welche Tests explizit auf GO warten (P0-N-02..N-09 je nach Endpoint-Verfuegbarkeit)

## Reviewer-Prep (jetzt erlaubt)
- Review-Template bereitstellen:
  - Decision -> Implementation -> Test Konsistenz
  - harte Blocker: Tenant/AuthZ/Immutability/Traceability/Export fail-closed
