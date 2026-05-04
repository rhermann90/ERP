# ADR-0013 — LV §9 Hierarchie-Lesepfade (`/structure`, `/nodes/{id}`, `/positions/{id}`)

**Status:** ACCEPTED (2026-05-04)

## Kontext

LV §9 (Hierarchie, Texttrennung Systemtext vs. Bearbeitungstext, SoT `LV_VERSION` / `LV_STRUCTURE_NODE` / `LV_POSITION`) ist in [ADR 0005](./0005-lv-hierarchy-phase2-inc2.md) verankert. `GET /lv/versions/{lvVersionId}` liefert den vollständigen Snapshot inkl. optionaler Katalog-Kurzinfo.

## Entscheidung

### D1 — Zusätzliche **read-only** GET-Endpunkte (Projektion)

| Pfad | Antwort |
|------|---------|
| `GET /lv/versions/{lvVersionId}/structure` | `LvHierarchySnapshot`: `lvVersionId`, `structureNodes[]`, `positions[]` — dieselben Knoten/Positionen wie im Snapshot, **ohne** `catalog` und **ohne** `version`-Kopf. JSON-Felder wie bestehende Ressourcen (`editingText` auf Knoten/Positionen). |
| `GET /lv/versions/{lvVersionId}/nodes/{nodeId}` | Ein `LvStructureNode` wie im Snapshot (Schema-Alias OpenAPI: `LvStructureNode` = `LvStructureNodeResource`). 404 wenn Knoten fehlt oder nicht zu dieser Version gehört. |
| `GET /lv/versions/{lvVersionId}/positions/{positionId}` | Eine `LvPosition` wie im Snapshot (Schema-Alias OpenAPI: `LvPositionV2` = `LvPositionResource`). 404 wenn Position fehlt oder nicht zu dieser Version gehört. |

### D2 — OpenAPI-Aliase

`LvStructureNode` und `LvPositionV2` sind `allOf`-Aliase zu `LvStructureNodeResource` bzw. `LvPositionResource` — keine zweite Wire-Form, keine Umbenennung zu `editableText` in JSON.

**Source of Truth** für erlaubte Aktionen bleibt `GET /documents/{id}/allowed-actions` — nicht eingebettet in `/structure`.

### D3 — AuthZ

Identisch zu `GET /lv/versions/{lvVersionId}` (`assertCanReadLvVersion`, Mandantenisolation).

### D4 — Kein Persistenz-Increment

Keine neue Prisma-Migration (Memory-/Demo; Postgres siehe ADR-0003 bei separatem GO).

## Verweise

- [`docs/tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](../tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md)
- [`docs/api-contract.yaml`](../api-contract.yaml)
