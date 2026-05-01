# Phase 2 — Startauftrag (Geschäftslogik & API-Ausbau)

**Status:** Freigegeben nach Final Closure TICKET-002 Iteration 1 (2026-04-14).  
**Verbindliche Domänenquelle:** `docs/ERP-Systembeschreibung.md`

## Phase-Ziel

Ausbau der **Geschäftslogik und API** über den bisherigen vertikalen Slice (Angebot, Nachtrag/Supplement-Kern, Rechnung/Export/Traceability-Ausschnitt) hinaus — **ohne** vollständige PWA und **ohne** in diesem Startpaket die folgenden separaten Arbeitspakete zu vermischen.

## In Scope (Phase 2 — Start)

- Erweiterung der **API- und Domänenschicht** für weitere Kerndokumente und Prozesse aus v1.2, priorisiert nach Team-Roadmap (z. B. LV-Hierarchie, Aufmass-Lebenszyklus, weiterführende Rechnungslogik-Schnitte), jeweils mit:
  - strikter **Mandantentrennung**
  - **Versionierung** / nicht-destruktive Änderungen
  - **Audit** bei kritischen Übergängen
  - **SoT** `allowedActions` ≡ schreibende Endpunkte
  - **fail-closed** Export-/Traceability-Guards wo rechtlich relevant
- Fortführung **OpenAPI** (`docs/api-contract.yaml`), **ADR** bei Architekturentscheidungen, **Contracts** (`action-contracts.json`, `error-codes.json`, `module-contracts.json`).

## Explizit nicht im Phase-2-Startumfang

- **TICKET-002 Iteration 1b:** Nachtrags-Positions-/LV-Tiefe (eigenes Ticket/Gate).
- **Persistenzmigration:** Prisma/Postgres produktiv nach `docs/adr/0003-persistence-spike.md` — eigenes Ticket „Iteration 2 Persistenz“; In-Memory-Slice bleibt bis zur Freigabe die Referenzimplementierung.
- **Frontend/PWA-Implementierung** (Phase 3) — hier nur Vertragsanbindung wie bisher.

## Folgearbeit (Verweise)

| Paket | Dokument |
|--------|-----------|
| Nachtrag Iteration 1b | Ticket (noch anzulegen / Scope aus `TICKET-002` § Iteration 1b) |
| Persistenz | `docs/adr/0003-persistence-spike.md`, Migration-Perspektive in `TICKET-002` |
| Abgeschlossen | `TICKET-002` Iteration 1 — `docs/tickets/TICKET-002-nachtrag-lifecycle-v12.md` (Final Closure) |

## Agenten-Reihenfolge (verbindlich)

1. Fullstack Backend Entwickler  
2. Frontend Entwickler (Contracts)  
3. QA Engineer  
4. Senior Code Reviewer (final)

## Quality Gates (Phase 2 je Lieferincrement)

- `npm run typecheck` grün  
- P0/P1 gemäß QA-Matrix grün  
- Keine Tenant-Leaks, keine SoT-Umgehung, keine Phantom-Contract-Codes  
- Bei Zweifel: **fachliche Korrektheit vor Geschwindigkeit**

## Kick-off-Nachricht

Siehe Projekt-Kommunikation: **Phase-2-Kick-off-Prompt** (vom Projektleiter an alle Agenten verteilt).

## Increment 1 (verbindlich priorisiert)

**Aufmass-Lebenszyklus-Slice** — siehe `docs/tickets/PHASE-2-PRIORISIERUNG-INCREMENT-1.md`.

## Increment 2 (verbindlich benannt und priorisiert)

**LV-Hierarchie & Textlogik gemäß v1.2 §9** — Projektbezeichnung: **„Phase-2 Increment 2 = LV §9“**.  
Details: `docs/tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md`.
