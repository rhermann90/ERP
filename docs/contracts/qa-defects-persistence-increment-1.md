# QA Defects — Persistenz-Inkrement 1

**Stand:** 2026-04-14

## Aktive Defects

| ID | Severity | Kurzbeschreibung | Status |
| --- | --- | --- | --- |
| — | — | Keine P0/P1-Findings im Inkrement-1-Scope | — |

## Beobachtungen (kein Blocker für technisches Inkrement-Gate)

| ID | Severity | Beschreibung | Empfehlung |
| --- | --- | --- | --- |
| PERSIST-QA-P2-001 | P2 (CI-Prozess) | `test/persistence.integration.test.ts` wird ohne `PERSISTENCE_DB_TEST_URL` **skipped** — kein Fehler; in **GitHub Actions** ist die Variable verpflichtend (Hard-Fail ohne URL). | CI-Workflow mit Service-Container (siehe `.github/workflows/ci.yml`) oder lokaler Lauf laut `docs/runbook/ci-and-persistence-tests.md`. |

## Geschlossen / verifiziert

- Tenant-FK-Verletzung Cross-Tenant: negativer Prisma-Test (`P2003`) wenn DB-URL gesetzt.
- Fail-closed Start: Unit-Tests für `production` / `ERP_DEPLOYMENT=integration`.

## Nicht Gegenstand dieses Tickets

- Vollständige Audit-Persistenz, alle Domänen-Tabellen, GoBD-Abschluss → **Gate Produktions-ERP** bleibt separat.
