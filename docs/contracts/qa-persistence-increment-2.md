# QA Matrix — Persistenz-Inkrement 2 (CI-Postgres, `current_version_id`, Audit-DB)

**Fachliche Referenz:** `docs/ERP-Systembeschreibung.md`, `docs/adr/0006-offer-vertical-slice-persistence.md`, Migration `prisma/migrations/20260215120000_deferrable_offer_fks_and_audit_events/migration.sql`.

**Suite:** `test/persistence.integration.test.ts` — `describe`-Name exakt: **`Persistence Inkrement 2 (Postgres; in CI ohne SKIP)`** (`describe.sequential` bei gesetztem `PERSISTENCE_DB_TEST_URL`, sonst `describe.skip`).

**CI-Zielzustand (kein SKIP):** `.github/workflows/ci.yml` setzt `DATABASE_URL` und `PERSISTENCE_DB_TEST_URL` und führt `npx prisma migrate deploy` vor `npm test` aus.

| ID | Bereich | Given / When / Then (kurz) | Evidenz (`it("...")` wörtlich) | Status (CI-Ziel) |
| --- | --- | --- | --- | --- |
| PER2-P0-01 | CI-Postgres-Job | Unter `GITHUB_ACTIONS` ist `PERSISTENCE_DB_TEST_URL` gesetzt (Postgres-Service) | `it("CI Postgres job: PERSISTENCE_DB_TEST_URL is set when running under GitHub Actions")` | PASS |
| PER2-P0-02 | Migration + `current_version` FK-Objekt | Nach `migrate deploy` existieren `audit_events`, `offers`, `offer_versions`; Constraint `offers_current_version_fkey` vorhanden | `it("applies migrations including audit_events and offers_current_version_fkey")` | PASS |
| PER2-P0-03 | Tenant-Isolation (Offer-Version-FK) | Cross-Tenant `offer_version` zu fremdem `offer` wird abgewiesen | `it("rejects cross-tenant offer_version insert (composite FK tenant_id, offer_id)")` | PASS |
| PER2-P0-04 | FK `current_version_id` (negativ) | Offer ohne passende `offer_version`-Zeile für `current_version_id` scheitert am Commit | `it("rejects offer when current_version_id has no matching offer_version at commit (offers_current_version_fkey)")` | PASS |
| PER2-P0-05 | FK `current_version_id` (deferrable, positiv) | In einer Transaktion: Offer vor Version einfügbar, wenn `DEFERRED` und konsistente IDs | `it("allows deferred insert: offer row before offer_version when current_version_id matches (same transaction)")` | PASS |
| PER2-P0-06 | Audit-Persistenz (Reconnect) | `audit_events`-Zeile überlebt `$disconnect` und neuen `PrismaClient` | `it("persisted audit_event survives PrismaClient disconnect and new connection (restart simulation)")` | PASS |
| PER2-P0-07 | API + Prisma-Include `current_version` | Seed-Offer: `currentVersion` ist per FK auflösbar | `it("Offer.current_version_id referenziert offer_versions (Prisma-Include)")` | PASS |
| PER2-P0-08 | Audit API (Schreiben + minimiertes GET) | Statuswechsel persistiert Audit; `GET /audit-events` ohne `beforeState`/`reason` im JSON | `it("Audit: Schreibpfad Postgres + GET liefert nur minimierte Felder")` | PASS |
| PER2-P0-09 | Tenant-Filter Audit-GET | Fremd-Mandanten-Zeile erscheint nicht in Tenant-Response | `it("GET /audit-events liest nur eigenen Tenant aus DB")` | PASS |

**Hinweis lokal:** Ohne `PERSISTENCE_DB_TEST_URL` wird die gesamte Suite **skipped** (9 Tests); das ist **kein** CI-Zielzustand — siehe `docs/runbook/ci-and-persistence-tests.md`.
