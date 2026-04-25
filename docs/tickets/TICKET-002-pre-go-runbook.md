# TICKET-002 Pre-GO Runbook (No-Implementation Mode)

## Zweck
Vorbereitungsdokument fuer Sprint-Fortfuehrung **ohne** produktive Implementierung des vollen Nachtrags-Lebenszyklus, solange kein formales Review-GO mit Datum im Ticket eingetragen ist.

## GO-Pruefung (harte Vorbedingung)
- Quelle: `docs/tickets/TICKET-002-nachtrag-lifecycle-v12.md`
- Erforderlich:
  - Eintrag "Review-GO erteilt" mit **Datum** und Verantwortlichen (Projektleiter + Softwarearchitekt; optional Senior Code Reviewer)
  - Scope-Freigabe In/Out
  - Rollenmatrix-Freigabe fuer Nachtrag
  - Schnitt Aufmass/Rechnung (Iteration-1 minimal) bestaetigt

## Aktueller Stand (2026-04-14)
- Ticketstatus: `DRAFT`
- Checkliste: GO-Punkte offen
- Konsequenz: **NO_GO fuer Produktions-Feature-Implementierung**

## Erlaubte Arbeiten vor GO
1. Test-/Runbook-Vorbereitung (keine Domain-Feature-Aktivierung)
2. Contract-Hinweise und Delta-Plan fuer Agent "Frontend (Contracts)"
3. QA-Testplanung und Mapping auf geplante Endpunkte/Codes
4. Reviewer-Checkliste (Konsistenz Entscheidung -> Contract -> Test)

## Contract-Hinweise fuer Folgeagenten (ohne Implementierungszwang)
- `docs/contracts/action-contracts.json`
  - Nachtragsaktionen als geplanter Scope klar markieren:
    - `SUPPLEMENT_SET_IN_FREIGABE`
    - `SUPPLEMENT_SET_FREIGEGEBEN`
    - `SUPPLEMENT_SET_VERSENDET`
    - `SUPPLEMENT_SET_BEAUFTRAGT`
    - `SUPPLEMENT_SET_ABGELEHNT`
    - `SUPPLEMENT_SET_ARCHIVIERT`
  - Quelle fuer Statusmodell auf ADR-0002 verweisen (bis final: DRAFT).
- `docs/contracts/error-codes.json`
  - Reservecodes als "planned" kennzeichnen (nicht emittiert vor GO), z. B. Wirkungsgate vor `BEAUFTRAGT`.
- `docs/api-contract.yaml`
  - Geplante Lifecycle-Endpunkte nur als Pending-Kommentar/Backlog referenzieren, nicht als aktive API zusichern.

## QA-Vorbereitung (P0 aus Ticket-002)
- Referenz: `docs/contracts/qa-p0-ticket-002-nachtrag-lifecycle.md`
- Vorbereitend zu konkretisieren:
  - erwarteter Endpoint je P0-N-Zeile
  - erwarteter Fehlercode je Negativfall
  - erwartete Envelope-Semantik (`correlationId`, `retryable`, `blocking`)
- Keine "PASS"-Aussagen fuer nicht implementierte Lifecycle-Pfade vor GO.

## Reviewer-Readiness-Kriterien fuer Go-Lift
1. GO mit Datum und Rollen im Ticket eingetragen
2. ADR-0002 Status auf mindestens "Accepted" oder "Approved for Implementation"
3. Ticket-002 Scope/Gates unveraendert nachvollziehbar
4. Backlog-Schnitt Iteration-1 vs. 1b dokumentiert (kein Scope-Drift)

## Contract-Readiness (ohne Implementierung)

- [`docs/contracts/action-contracts.json`](../contracts/action-contracts.json) enthaelt Nachtrags-Lifecycle-Aktionen (`SUPPLEMENT_SET_*`, …) als **Zielbild** fuer UI/QA; referenzierte Endpunkte (z. B. `POST /supplements/status`) **erst nach Review-GO** im Hauptticket produktiv umsetzen — bis dahin keine Phantom-`error`-Codes in OpenAPI, die das Backend nicht emittiert.
- P0-Matrix und Codes: [`docs/contracts/qa-p0-ticket-002-nachtrag-lifecycle.md`](../contracts/qa-p0-ticket-002-nachtrag-lifecycle.md) mit [`docs/contracts/error-codes.json`](../contracts/error-codes.json) abgleichen.

