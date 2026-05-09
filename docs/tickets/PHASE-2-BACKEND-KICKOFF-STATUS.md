# Phase 2 Backend Kickoff Status (Agent 1)

## Scope-Check (verbindliche Quellen gelesen)
- `docs/ERP-Systembeschreibung.md`
- `docs/tickets/PHASE-2-STARTAUFTRAG.md`
- `docs/tickets/TICKET-002-nachtrag-lifecycle-v12.md` (CLOSED, Final Closure vorhanden)
- `docs/adr/0002-nachtrag-lifecycle.md` (ACCEPTED, Iteration-1-Schnitt abgeschlossen)
- `docs/adr/0003-persistence-spike.md` (Persistenz nur planen, kein Produktionsumstieg)

## Ergebnis Vorbedingungen
- TICKET-002 Iteration 1 ist final geschlossen und als Basis fuer Phase 2 freigegeben.
- Persistenzmigration bleibt ausserhalb des produktiven Startumfangs.
- Reihenfolge Agenten bleibt: Backend -> Frontend Contracts -> QA -> Reviewer.

## Priorisierung Increment 1 (abgeschlossen)

Siehe **`docs/tickets/PHASE-2-PRIORISIERUNG-INCREMENT-1.md`** — **Aufmass** §5.4 (ADR-0004).

## Priorisierung Increment 2 (Repo-Ist: umgesetzt)

Siehe **`docs/tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md`**.

- **Gewählt:** **LV §9** — Hierarchie Bereich/Titel/Untertitel/Position, Systemtext vs. Bearbeitungstext, LV-Versionierung, SoT, Audit, Tenant-Isolation.
- **Nicht enthalten:** §10 Mietlogik, TICKET-002-1b, produktive Postgres-Migration, PWA.

**Evidenz (Backend):** ADR [`docs/adr/0013-lv-section9-hierarchy-and-text-separation.md`](../adr/0013-lv-section9-hierarchy-and-text-separation.md) (Accepted); Routen `GET /lv/versions/{lvVersionId}`, `…/structure`, `…/nodes/{nodeId}`, `…/positions/{positionId}` → `lv-hierarchy-service` (Codemap [`docs/CODEMAPS/overview.md`](../CODEMAPS/overview.md)); Tests u. a. LV-/Hierarchy-Pfade in Root-`npm test` / `verify:ci`.

## Gate-Empfehlung Agent 1

- **GO fuer produktive Backend-Implementierung** — **nur** fuer den Umfang in `PHASE-2-PRIORISIERUNG-INCREMENT-2.md`.
- **NO_GO** bei Scope-Ueberschreitung (z. B. vollständige Mietlogik §10, Nachtrag-1b-Positionsdetail ohne Ticket, produktives Prisma ohne separates GO).

## Evidenz-Hinweis (QA)

- Inkremente **1** und **2** (Backend-Umfang laut Tickets): mit **`npm run verify:ci`** verifizieren; Persistenz bei Bedarf **`npm run verify:ci:local-db`** ([`AGENTS.md`](../../AGENTS.md)). Konkrete Testanzahl nicht fest verdrahten — immer lokalen Run auswerten.
