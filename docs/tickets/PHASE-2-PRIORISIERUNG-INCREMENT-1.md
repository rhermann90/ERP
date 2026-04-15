# Phase 2 — Verbindliche Priorisierung Increment 1

**Entschieden am:** 2026-04-14  
**Entschieden durch:** Projektleiter + Softwarearchitekt

## Increment 1 (verbindlich)

**Aufmass-Lebenszyklus-Slice** gemäß `ERP Systembeschreibung v1.2.md` **§5.4 Aufmass** (und Querverweise §2 Traceability, §7 Nachvollziehbarkeit).

### Begründung (Trade-off)

| Option | Gewählt | Verworfen (in dieser Reihenfolge) |
|--------|---------|-----------------------------------|
| **Aufmass** | Ja | — |
| LV-Hierarchie-Slice (§9) | Später (Increment 2 Kandidat) | Zuerst: erhöht Modellfläche ohne unmittelbare Kopplung zu bereits export-/traceability-getesteten Rechnungspfaden |
| Rechnungslogik-Schnitt (§5.5/§8) | Später | Zuerst: hohes §8-Risiko und Scope-Creep ohne belastbare Messdaten-Seite |

**Fachlich:** Die Kette *Rechnung → Aufmass → LV → Angebot → Projekt → Kunde* bleibt zentral; ein belastbarer **Aufmass-Lebenszyklus** stärkt Traceability und reduziert das Risiko, Rechnungslogik auf dünnen Messdaten zu bauen.

### Explizit nicht Teil von Increment 1

- **TICKET-002 Iteration 1b** (Nachtrags-Positions-/LV-Tiefe)
- **Produktive Prisma/Postgres-Migration** (nur Planung laut `docs/adr/0003-persistence-spike.md` bis separates GO)
- **Vollständige Finanzlogik §8** (nur soweit für fail-closed Export/Traceability im bestehenden Rechnungs-Slice zwingend)
- **PWA / UI-Implementierung** (nur Contracts)

### Deliverable-Definition Increment 1 (Zielbild)

1. Domänentypen und tenant-sichere Repos für **Aufmass** / **Aufmassposition** (Minimum für Lifecycle-Tests).
2. Statusmodell §5.4 mit **nicht-destruktiven** Korrekturpfaden (z. B. neue Aufmassversion nach Freigabe — gemäß Spec, nicht vereinfachtes CRUD).
3. API + **dieselbe** AuthZ-/Policy-Quelle wie `GET /documents/{id}/allowed-actions` (SoT-Parität).
4. **AuditEvent** für alle kritischen Statusübergänge.
5. **Traceability**: stabile Referenzen zu `LV-Version` / Projekt / Mandant; keine Brüche der bestehenden Rechnungs-Preflight-Pfade.
6. Tests: P0 Tenant, SoT, Audit, Negative; Regression bestehender Suite **grün**.
7. `docs/api-contract.yaml`, ADR-Ergänzung bei Policy-Entscheidungen, Contract-Sync durch Frontend-Agent.

### Nächste Increments (Vorschlag, nicht verbindlich bis erneute PL-Entscheidung)

2. **LV-Hierarchie / Positionsmodell** (§9) — Vorbereitung für editorische Tiefe  
3. **Rechnungserweiterung** — nur in abgegrenztem Schnitt, ohne §8-Vollausbau  

## Evidenz / Konfliktauflösung QA

**Single Source of Truth für Testanzahl:** aktueller Stand im Repo — `npm test` (z. B. 39/39) und `docs/contracts/qa-report-ticket-002.md`.  
Abweichende Angaben (z. B. 35/35) sind als **veralteter Branch/Stand** zu behandeln, nicht als Widerspruch zum Final Closure.

## Verweise

- `docs/tickets/PHASE-2-STARTAUFTRAG.md`
- `docs/tickets/PHASE-2-BACKEND-KICKOFF-STATUS.md`
- `docs/tickets/TICKET-002-nachtrag-lifecycle-v12.md` (CLOSED)
- Folge-Increment: **`docs/tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md`** (LV §9)
