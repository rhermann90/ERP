# Review-Checkliste — Finanz-PR (kurz)

**Wann:** Jeder PR, der Finanz-API, SoT, Prisma-Finanztabellen oder PWA-Finanzaktionen betrifft.

## FIN-1 / FIN-2 (Zahlungsbedingungen und Rechnung)

- **FIN-1:** `GET /finance/payment-terms`, `POST /finance/payment-terms/versions` — OpenAPI-Tag Finance (FIN-1), [`../../src/api/finance-payment-terms-routes.ts`](../../src/api/finance-payment-terms-routes.ts), [`../../src/services/payment-terms-service.ts`](../../src/services/payment-terms-service.ts); Regression: [`../../test/finance-fin0-stubs.test.ts`](../../test/finance-fin0-stubs.test.ts) (VIEWER lesen vs. Schreiben, `customerId`-Konsistenz, `paymentTermsVersionId` nur Projekt der Angebotsversion).
- **FIN-2:** Rechnungsentwurf/Buchung — ADR-0007, Traceability in [`../../src/services/invoice-service.ts`](../../src/services/invoice-service.ts); neue Felder oder Domänencodes: `error-codes.json`, `api-contract.yaml`, [`finance-fin0-openapi-mapping.md`](./finance-fin0-openapi-mapping.md).

## Technisch (Pflicht je PR)

1. **SoT / Erlaubnisliste:** Änderungen an [`../../src/services/authorization-service.ts`](../../src/services/authorization-service.ts) spiegeln in [`action-contracts.json`](./action-contracts.json) und im PWA-Executor [`../../apps/web/src/lib/action-executor.ts`](../../apps/web/src/lib/action-executor.ts) sowie — bei Finanz-Vorbereitung — direkte API-Nutzung in [`../../apps/web/src/components/FinancePreparation.tsx`](../../apps/web/src/components/FinancePreparation.tsx) / [`../../apps/web/src/lib/api-client.ts`](../../apps/web/src/lib/api-client.ts).
2. **Contract-Bündel (G8):** Bei neuen oder geänderten Domänencodes — [`error-codes.json`](./error-codes.json) + [`api-contract.yaml`](../api-contract.yaml) + Mapping in [`finance-fin0-openapi-mapping.md`](./finance-fin0-openapi-mapping.md) **im selben PR**, soweit betroffen.
3. **Mandanten-FK:** Neue Tabellen wie bei `payment_intakes` — Composite `(tenant_id, …)` wo vorgesehen (siehe ADR-0007).
4. **Tests:** `npm run verify:ci`; bei Persistenz/Migrationen zusätzlich lokale Spiegelung [`../runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md) (`verify:ci:local-db`).

## Misch-PR und QA-Gate

- **§5b:** PRs, die **Doku +** `src/` **oder** `prisma/` **ohne** klare Trennung mischen — Regeln in [`qa-fin-0-gate-readiness.md`](./qa-fin-0-gate-readiness.md) **§5b** beachten (PL/QA vor Merge).

## GoBD / Audit (Querschnitt, nicht jedes kleine PR)

- Transaktionsgrenze Audit vs. DB-Persistenz: Ticket [`../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) vor größeren GoBD-relevanten Releases mit PL terminieren.

## Freigabe — FIN-4 Mahn-Mandanten-Automation (OFF / SEMI, PWA)

1. **PL-Gate:** Weitere M4-UI-/Mail-Slices **nur** nach Abgleich mit [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](../tickets/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md) bzw. [`NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) — **kein** Parallelstart zu **8.4(2–6)** oder **Pfad C** (Rechnungs-Zwischenstatus) in derselben Lieferung.
2. **PL/Ticket:** Modi **OFF** und **SEMI** sowie SEMI-Kontext dokumentiert ([`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](../tickets/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md), [ADR-0011](../adr/0011-fin4-semi-dunning-context.md)); kein Hintergrund-Cron, kein Mandantenmodus **AUTO** im Produkt.
3. **QA Review:** Idempotenz (`Idempotency-Key`, Mahnlauf-Intents), Audit in DB-Transaktion wo vorgesehen (ADR-0009/0010/0011); Persistenz-Tests bei neuen Tabellen.
4. **CI:** `npm run verify:ci`; bei Persistenz/Migrationen `verify:ci:local-db` / CI-Postgres wie [`../runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md).
5. **Betrieb:** Cron-/AUTO-Mahnlauf ist dauerhaft entfernt; Infra-Checkliste und Sign-off: [`../runbooks/dunning-cron-and-monitoring-inventory.md`](../runbooks/dunning-cron-and-monitoring-inventory.md), [`../runbooks/dunning-production-infra-signoff.md`](../runbooks/dunning-production-infra-signoff.md) — ADR-0011.

## Nächstes Inkrement (Planung)

- Aktuell: [`../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) (Vorwelle: [`NEXT-INCREMENT-FINANCE-WAVE2.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE2.md)).
