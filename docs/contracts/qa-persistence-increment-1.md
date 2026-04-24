# QA Matrix — Persistenz-Inkrement 1 (Offer-Vertikalschnitt, ADR-0006)

**Fachliche Referenz:** `docs/_archiv/systembeschreibung-und-phasen-legacy/ERP Systembeschreibung v1.2.md`, `docs/adr/0003-persistence-spike.md`, `docs/adr/0006-offer-vertical-slice-persistence.md`.

**Scope:** Reproduzierbare Migrationen, tenant-sichere DB-Constraints im migrierten Schnitt, Fail-closed Start ohne `DATABASE_URL` in produktionsnahen Modi, Regression der bestehenden API-Tests (In-Memory bleibt Default in `NODE_ENV=test`).

| ID | Bereich | Given / When / Then (kurz) | Evidenz (`describe` / `it("...")` / Datei) | Status |
| --- | --- | --- | --- | --- |
| PER-P0-01 | Migration / Reproduzierbarkeit (ohne Live-DB) | `prisma validate` läuft mit Platzhalter-`DATABASE_URL` (kein stiller Drift im Schema) | `test/persistence-schema-repro.test.ts` — `persistence increment 1 — schema & migrations reproducible (no live DB)` → `it('runs npm run prisma:validate (placeholder DATABASE_URL via scripts/prisma-env-placeholder.mjs)')` | PASS |
| PER-P0-02 | Migration apply (leere DB) | `prisma migrate deploy` im `beforeAll` + Tabellen `offers` / `offer_versions` / `audit_events` vorhanden | `test/persistence.integration.test.ts` — `Persistence Inkrement 2 (Postgres; in CI ohne SKIP)` → `it("applies migrations including audit_events and offers_current_version_fkey")` — **nur wenn** `PERSISTENCE_DB_TEST_URL` gesetzt (sonst Datei skipped) | PASS *oder* SKIP (siehe Report) |
| PER-P0-03 | Tenant-Isolation DB | Fremdschlüssel `(tenant_id, offer_id)` verhindert „falschen“ Mandanten auf `offer_versions` | dieselbe `describe` → `it("rejects cross-tenant offer_version insert (composite FK tenant_id, offer_id)")` | PASS *oder* SKIP |
| PER-P0-04 | Kein Produktionsstart ohne DB | `NODE_ENV=production` oder `ERP_DEPLOYMENT=integration` ohne `DATABASE_URL` → Abbruch | `test/repository-mode.test.ts` — `repository-mode (ADR-0003 / Agent-1 fail-closed DB policy)` → `it("assertFailClosedProductionDatabase exits 1 when production without DATABASE_URL")`, `it("assertFailClosedProductionDatabase exits 1 when ERP_DEPLOYMENT=integration without DATABASE_URL")` | PASS |
| PER-P0-05 | Postgres-Modus ohne URL | Auflösung `postgres` ohne `DATABASE_URL` wirft beim Assert | `it("assertDatabaseUrlForPostgresMode throws without DATABASE_URL")` in `test/repository-mode.test.ts` | PASS |
| PER-P0-06 | API-Regression (kritische Pfade) | Gesamtlauf grün inkl. Mandant/SoT/Export/LV/Aufmass/Nachtrag-Slices | `npm test` (Repo-Root), u. a. `test/app.test.ts`, `test/pwa-http.test.ts`, `test/auth-token-secret.test.ts` + neue Persistence-Tests | PASS |

**Hinweis Vollnachweis DB:** Für PER-P0-02/03 in CI eine **wegwerfbare** Postgres-Instanz bereitstellen und z. B.  
`PERSISTENCE_DB_TEST_URL=postgresql://…` setzen, dann **0 skipped** im Backend-Lauf.

**Explizit außerhalb Inkrement 1:** Audit-Events und weitere Aggregate nur in-memory / Folgetickets (`docs/tickets/FOLLOWUP-AUDIT-PERSISTENCE.md`).
