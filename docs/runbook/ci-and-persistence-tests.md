# Runbook — CI und Persistenz-Tests

## GitHub Actions

**PR-Hygiene:** Produkt-PRs (z. B. Finanz/Mahnwesen) nicht mit **Dependabot-PRs** vermischen — getrennte Branches von `main`, getrennte Reviews; siehe [`.github/pull_request_template.md`](../../.github/pull_request_template.md) (Abschnitt „Abhängigkeiten vs. Produkt“).

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

- **Postgres 16** als Service-Container auf Port5432.
- **`DATABASE_URL`** und **`PERSISTENCE_DB_TEST_URL`** zeigen auf dieselbe Test-DB (`erp_test`).
- Ablauf: `npm ci` → `prisma migrate deploy` → `prisma:validate` → `typecheck` → `npm test`.
- **Prisma-CLI-Version** entspricht den Root-Abhängigkeiten in `package.json` / `package-lock.json` (Major-Upgrade: [`docs/tickets/PRISMA-7-UPGRADE.md`](../tickets/PRISMA-7-UPGRADE.md)). In CI: `npm run check:prisma-stack` vor `prisma:validate`.

Ohne `PERSISTENCE_DB_TEST_URL` schlagen die Persistenz-Suites in CI nicht fehl durch Überspringen: `test/persistence*.ts` werfen bei `GITHUB_ACTIONS=true` ohne Variable einen Fehler (**Stop-the-line**).

## Lokal — voller Testlauf mit Postgres

1. Leere/wegbare DB starten, z. B.:

   ```bash
   docker run --rm -d --name erp-pg-test -p 54333:5432 \
     -e POSTGRES_USER=erp -e POSTGRES_PASSWORD=erp -e POSTGRES_DB=erp_test \
     postgres:16-alpine
   ```

2. Im Repo-Root (Reihenfolge: Variablen gelten für **`npm test`**, nicht nur für `cd`):

   ```bash
   cd /pfad/zum/ERP
   export PERSISTENCE_DB_TEST_URL='postgresql://erp:erp@127.0.0.1:54333/erp_test'
   export DATABASE_URL="$PERSISTENCE_DB_TEST_URL"
   npm test
   ```

Ohne `PERSISTENCE_DB_TEST_URL` laufen die In-Memory- und Schema-Tests; die Postgres-Integrationssuite wird **bewusst übersprungen** (`describe.skip` statt aktiver Suite).

### Repo-`docker-compose.yml` (Host-Port **15432** → Container 5432, DB `erp_test`)

1. `npm run ensure:local-test-db` — `docker compose up -d`, wartet auf Postgres, legt **`erp_test`** an falls noch fehlend (idempotent; hilft bei alten Volumes mit nur DB `erp`).
2. `npm run verify:ci:local-db` — setzt `DATABASE_URL` / `PERSISTENCE_DB_TEST_URL` standardmäßig auf `127.0.0.1:15432/erp_test` und führt dieselbe Kette wie CI aus (**inkl. `migrate deploy`**, Persistenz-Suites **ohne SKIP**, sofern die DB erreichbar ist).
3. Anderer Host-Port: Compose `ports` anpassen und URLs setzen, z. B. `DATABASE_URL=postgresql://… PERSISTENCE_DB_TEST_URL=postgresql://… npm run verify:ci:with-migrate`.

## Relevante Tests

| Datei | Zweck |
| --- | --- |
| `test/persistence.integration.test.ts` | `prisma migrate deploy`, Tabellen inkl. `audit_events`, tenant-FK, `offers_current_version_fkey`, Audit-Schreib-/Lesepfad, Reconnect-Stichprobe, `GET /audit-events` Tenant-Filter; FIN-4 **`dunning_tenant_stage_config`** (inkl. Migrationen mit **`deleted_at`**) und Konfig-HTTP (GET/PUT/PATCH/DELETE) gemäß ADR-0009 |
| `test/persistence-schema-repro.test.ts` | `prisma validate` ohne Live-DB |

## PR-Checkliste (Persistenz / Schema)

Bei jedem PR, der **Prisma** oder **Persistenz** berührt:

1. **Migrationen:** nur versionierte SQL unter `prisma/migrations/` (kein blindes `db push` als Merge-Pfad).
2. Lokal oder in CI-äquivalenter Umgebung: **`npm run prisma:validate`**, **`npm run typecheck`**, **`npm test`**.
3. Mit Postgres: dieselbe Kette wie CI — **`PERSISTENCE_DB_TEST_URL`** und **`DATABASE_URL`** setzen, dann **`npm test`** (Persistenz-Suites ohne SKIP).
4. **FIN-2:** keine produktiven `/finance`- oder `/invoices`-Routen und kein **8.4**-Buchungsmotor, **solange** [`docs/tickets/FIN-2-START-GATE.md`](../../docs/tickets/FIN-2-START-GATE.md) **G1–G10** nicht alle **ja** sind (Gate pflegt **Projektleitung**).
5. **Audit / Transaktionen:** **Kein** PR, der **`AuditService`**, **Dual-Write** oder die **Transaktionsgrenze für Audit** ändert, öffnen oder mergen, solange im Ticket [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../../docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) in **„PL-Eintrag“** noch **`—`** in **einer** der **vier** Inhaltszellen steht (**nur Projektleitung**; **keine** Dev-Scheinwerte). Kommunizierter Rahmen **„PL / System — zuerst“:** Sprint-Snapshot z. B. [`PL-SYSTEM-ZUERST-2026-04-14.md`](../../docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md); Vorlage/Index [`PL-SYSTEM-ZUERST-VORLAGE.md`](../../docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md). **Nach** PL-Vollzug: **genau ein** fokussierter Implementierungs-PR; **erste Zeile** = **Option A–D** + **SLA-Verweis**; Tests **Memory ↔ Postgres** (`PERSISTENCE_DB_TEST_URL`); **A–C:** simulierte DB-/Audit-Fehler + vereinbarte Semantik — **kein undiszipliniertes 2xx** ohne dort vereinbartes **DomainError 4xx** (sonst PR laut Ticket **unzureichend**); **Option D:** Tests/Monitoring/Freigabe **nur** laut **ausgefülltem** SLA. Nur im **eigenen** PR; kein beiläufiges Abschwächen von `.catch`-Logik in fachfremden PRs.
6. **Nächster Persistenz-Slice** (Supplement **oder** FIN-1): **nur** mit schriftlichem **PL-Go** und Ticket — nicht parallel ohne Auftrag starten.
7. **LV-Löschen / FKs:** keine heimliche `ON DELETE`- oder Schemaänderung — nur nach dokumentierter PL-Regel, siehe [`docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md`](../../docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md).
