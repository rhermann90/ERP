# Runbook — CI und Persistenz-Tests

## GitHub Actions

**PR-Hygiene:** Produkt-PRs (z. B. Finanz/Mahnwesen) nicht mit **Dependabot-PRs** vermischen — getrennte Branches von `main`, getrennte Reviews; siehe [`.github/pull_request_template.md`](../../.github/pull_request_template.md) (Abschnitt „Abhängigkeiten vs. Produkt“).

**Fokussierte PRs:** Auth/Rollen/Migrationen, Finanz/LV und reine Doku/Contract-PRs nicht vermischen; je PR `npm run verify:ci`, bei Schema/Migration zusätzlich `npm run verify:ci:local-db` (siehe Abschnitt „Repo-docker-compose“). Umfangreiche WIP-Branches vor Merge in thematisch getrennte PRs splitten.

## QA und Review vor Merge auf `main` (Querschnitt)

1. **PR-Beschreibung:** [`.github/pull_request_template.md`](../../.github/pull_request_template.md) vollständig; bei Finanz/SoT zusätzlich [`docs/contracts/review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md) abhaken oder gleichwertige Review-Notiz im PR verlinken.
2. **Lokal (Autor):** `npm run verify:ci`; bei Merge-Nähe zur CI-E2E-Kette zusätzlich `npm run verify:pre-merge` — Finanz-Smoke (`e2e/login-finance-smoke.spec.ts`) plus App-Shell-Smoke (`e2e/app-shell-smoke.spec.ts`, ohne Login). Bei Änderungen an `prisma/migrations/`, Postgres-Persistenz oder neuen Persistenz-`it` zusätzlich `npm run verify:ci:local-db` (dieses Runbook, Abschnitt „Repo-docker-compose“).
3. **Remote (Merge-Evidence):** grüne GitHub-Actions-Jobs **`backend`** und **`e2e-smoke`** zum PR-Head (Branch-Protection: [`docs/runbooks/github-branch-protection-backend.md`](../runbooks/github-branch-protection-backend.md)); PR-Kommentar mit Vorlage **§5a-pre** aus [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) (**HTTPS** Run-URL + SHA aus Run-Details). Bei gemischten Doku-/`src`-PRs **§5b** prüfen.
4. **Review:** fachlicher Review auf kritischen Pfaden (**Empfehlung**, keine Repo-Pflicht); Merge verlangt **keine** menschliche Steuer-/Datenschutz-Freigabe — optionaler Hintergrund: Stub [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md), Archiv [`docs/_archiv/checklisten-compliance-human-workflow/`](../../docs/_archiv/checklisten-compliance-human-workflow/).

5. **FIN-4 Mahn-API — Breaking- und Release-Notes:** Änderungen an [`docs/api-contract.yaml`](../../docs/api-contract.yaml) an `GET /finance/dunning-reminder-candidates`, `POST /finance/dunning-reminder-run` oder an `info.version` (z. B. neue **Pflichtfelder** wie `eligibilityContext`, `stageDeadlineIso` in Kandidaten- und `DRY_RUN.planned`-Payloads ab **1.25.x**) im PR oder in Release-Notes explizit nennen, damit externe Clients mit striktem OpenAPI-/JSON-Schema nachziehen können. **Technischer Abgleich:** Antwort-Header `x-erp-openapi-contract-version` (synchron zu `info.version` und [`src/domain/openapi-contract-version.ts`](../../src/domain/openapi-contract-version.ts)); Leitfaden [`docs/contracts/FIN4-external-client-integration.md`](../contracts/FIN4-external-client-integration.md) — insb. Abschnitt **„Strikte Response-Validierung (Client-seitig)“** bei Schema-Fehlern nach Deploy. **Cron/Monitoring:** [`docs/runbooks/dunning-cron-and-monitoring-inventory.md`](./dunning-cron-and-monitoring-inventory.md), `npm run check:dunning-inventory`; Produktions-Sign-off: [`docs/runbooks/dunning-production-infra-signoff.md`](./dunning-production-infra-signoff.md).

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

- **Postgres 16** als Service-Container auf Port **5432** (im Actions-Job: Host-Port 5432 → Container 5432).
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

**Prisma-Client-Ausgabe:** `generator client` in `prisma/schema.prisma` schreibt nach `../generated/prisma`. Der Ordner **`generated/`** ist in der Root-`.gitignore` — **nicht** committen. Lokal und in CI entsteht der Client durch **`npm install`** (`postinstall`: `prisma generate`) bzw. `npm run prisma:generate`.

1. **Migrationen:** nur versionierte SQL unter `prisma/migrations/` (kein blindes `db push` als Merge-Pfad).
2. Lokal oder in CI-äquivalenter Umgebung: **`npm run prisma:validate`**, **`npm run typecheck`**, **`npm test`**.
3. Mit Postgres: dieselbe Kette wie CI — **`PERSISTENCE_DB_TEST_URL`** und **`DATABASE_URL`** setzen, dann **`npm test`** (Persistenz-Suites ohne SKIP).
4. **FIN-2:** keine produktiven `/finance`- oder `/invoices`-Routen und kein **8.4**-Buchungsmotor, **solange** [`docs/tickets/FIN-2-START-GATE.md`](../../docs/tickets/FIN-2-START-GATE.md) **G1–G10** nicht alle **ja** sind (Gate pflegen **Team / Maintainer** nach dokumentiertem Schema).
5. **Audit / Transaktionen:** Ticket [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../../docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) und Abschnitt **„Audit-Gate-Eintrag“** dokumentieren **Risiko und empfohlene** Diskussionsgrundlage — in der **Entwicklungsphase** ist ein leerer Eintrag **kein** automatischer Merge-Stopper. **Empfehlung vor mandantenrealem Produktiv-Go:** Eintrag ausfüllen; Kommunizierter Sprint-Kontext: Snapshot z. B. [`PL-SYSTEM-ZUERST-2026-04-14.md`](../../docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md) *(Pfadname historisch)*; Vorlage [`PL-SYSTEM-ZUERST-VORLAGE.md`](../../docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md). Für PRs, die Audit-Verhalten **bewusst** ändern: weiterhin fokussierte Reviews, Tests **Memory ↔ Postgres** (`PERSISTENCE_DB_TEST_URL`), und **kein undiszipliniertes 2xx** bei vereinbarter Fail-Semantik — nur im **eigenen** PR; kein beiläufiges Abschwächen von `.catch`-Logik in fachfremden PRs.
6. **Nächster Persistenz-Slice** (Supplement **oder** FIN-1): **nur** mit schriftlichem **Team-/Ticket-Go** — nicht parallel ohne Auftrag starten.
7. **LV-Löschen / FKs:** keine heimliche `ON DELETE`- oder Schemaänderung — nur nach dokumentierter Domänen-/Maintainer-Regel, siehe [`docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md`](../../docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md).
