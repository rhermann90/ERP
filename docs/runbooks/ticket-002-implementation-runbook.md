# Runbook — TICKET-002 Nachtrags-Lebenszyklus (Backend -> Frontend Contracts -> QA -> Reviewer)

## Zweck
Operatives Ablaufdokument für Sprint-Weiterführung nach Phase-1-Slice-GO.  
Dieses Runbook ist **vorbereitend** und führt **keine** Produktions-Implementierung aus, solange in `docs/tickets/TICKET-002-nachtrag-lifecycle-v12.md` kein Review-GO mit Datum steht.

## 0) Preflight (harte Startbedingungen)
1. Ticket enthält dokumentierten Review-GO-Eintrag mit Datum und Freigabepersonen.
2. Scope/Gates sind im Ticket als bestätigt markiert.
3. ADR-0002 offene Punkte sind entschieden (Status-Enum, Schnitt Aufmass/Rechnung).

Wenn eine Bedingung fehlt: **NO_GO**, nur Dokumentations-/Vorbereitungsarbeiten.

## 1) Backend-Agent (Implementierung nach GO)
1. Domänenmodell erweitern: Nachtragsstatus-Lifecycle gemäß v1.2 §5.3.
2. SoT-Aktionen und Endpoint-Guards deckungsgleich halten (keine Umgehung via Direktaufruf).
3. Wirkungsgrenze umsetzen: vor `BEAUFTRAGT` keine abrechenbare Wirkung.
4. Traceability-/Export-Gates fail-closed um Nachtragsbezug ergänzen.
5. Audit für alle kritischen Nachtragsstatus.
6. Tests: mindestens P0 aus `docs/contracts/qa-p0-ticket-002-nachtrag-lifecycle.md`.

Übergabe an Frontend nur bei lokal grünem Typecheck + Tests.

## 2) Frontend-Contracts-Agent
1. `module-contracts.json`, `action-contracts.json`, `error-codes.json` auf Backend-Stand ziehen.
2. SoT-Rule festschreiben: UI führt nur Aktionen aus `allowedActions`.
3. Error-Mapping für neue Nachtragscodes pflegen.

Übergabe an QA nur bei konsistenten Contracts ohne Drift gegen API.

## 3) QA-Agent
1. P0 ausführen (Tenant/AuthZ/Lifecycle/Wirkungsgrenze/Traceability/Export fail-closed).
2. P1/P2 als Regression ergänzen.
3. Defect-Liste + Evidenz mit klarer Severity liefern.

Übergabe an Reviewer nur bei vollständigem Report.

## 4) Senior Code Reviewer
1. Prüft Konsistenz zwischen v1.2, Ticket-002, ADR-0002, Implementierung, Tests.
2. Finalentscheid: `GO` / `GO_MIT_AUFLAGEN` / `NO_GO`.
3. Bei `NO_GO`: konkrete Rework-Aufträge mit Blocker-Klassifikation.

## Artefakte für den Sprint
- Verbindlich: `docs/_archiv/systembeschreibung-und-phasen-legacy/ERP Systembeschreibung v1.2.md`
- Verbindlich: `docs/tickets/TICKET-002-nachtrag-lifecycle-v12.md`
- Verbindlich: `docs/adr/0002-nachtrag-lifecycle.md`
- Verbindlich: `docs/contracts/qa-p0-ticket-002-nachtrag-lifecycle.md`
