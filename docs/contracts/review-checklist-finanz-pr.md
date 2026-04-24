# Review-Checkliste — Finanz-PR (kurz)

**Wann:** Jeder PR, der Finanz-API, SoT, Prisma-Finanztabellen oder PWA-Finanzaktionen betrifft.

## Technisch (Pflicht je PR)

1. **SoT / Erlaubnisliste:** Änderungen an [`../../src/services/authorization-service.ts`](../../src/services/authorization-service.ts) spiegeln in [`action-contracts.json`](./action-contracts.json) und im PWA-Executor [`../../apps/web/src/lib/action-executor.ts`](../../apps/web/src/lib/action-executor.ts) sowie — bei Finanz-Vorbereitung — direkte API-Nutzung in [`../../apps/web/src/components/FinancePreparation.tsx`](../../apps/web/src/components/FinancePreparation.tsx) / [`../../apps/web/src/lib/api-client.ts`](../../apps/web/src/lib/api-client.ts).
2. **Contract-Bündel (G8):** Bei neuen oder geänderten Domänencodes — [`error-codes.json`](./error-codes.json) + [`api-contract.yaml`](../api-contract.yaml) + Mapping in [`finance-fin0-openapi-mapping.md`](./finance-fin0-openapi-mapping.md) **im selben PR**, soweit betroffen.
3. **Mandanten-FK:** Neue Tabellen wie bei `payment_intakes` — Composite `(tenant_id, …)` wo vorgesehen (siehe ADR-0007).
4. **Tests:** `npm run verify:ci`; bei Persistenz/Migrationen zusätzlich lokale Spiegelung [`../runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md) (`verify:ci:local-db`).

## Misch-PR und QA-Gate

- **§5b:** PRs, die **Doku +** `src/` **oder** `prisma/` **ohne** klare Trennung mischen — Regeln in [`qa-fin-0-gate-readiness.md`](./qa-fin-0-gate-readiness.md) **§5b** beachten (PL/QA vor Merge).

## GoBD / Audit (Querschnitt, nicht jedes kleine PR)

- Transaktionsgrenze Audit vs. DB-Persistenz: Ticket [`../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) vor größeren GoBD-relevanten Releases mit PL terminieren.

## Freigabe — Mahnlauf Mandanten-Automation (nach Lieferung 5b + PWA)

1. **PL/Ticket:** Modi OFF/SEMI/AUTO und UI-Ort dokumentiert ([`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](../tickets/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md)); AUTO ohne Batch-E-Mail klar kommuniziert.
2. **CI:** `npm run verify:ci`; bei Persistenz/Migrationen `verify:ci:local-db` / CI-Postgres wie [`../runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md).
3. **Betrieb (nur wenn AUTO genutzt wird):** Runbook [`../runbooks/dunning-automation-cron.md`](../runbooks/dunning-automation-cron.md) — `ERP_INTERNAL_DUNNING_CRON_SECRET`, kein Leak in Logs/PRs.

## Nächstes Inkrement (Planung)

- Aktuell: [`../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) (Vorwelle: [`NEXT-INCREMENT-FINANCE-WAVE2.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE2.md)).
