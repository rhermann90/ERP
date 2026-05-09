# Quality Gate §15 — MVP Finanz (Abnahme-Skeleton)

**Zweck:** Sammelnachweis für technische Abnahme der Finanz-MVP-Slices gemäß [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) §15 und [`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Teil 7.

## Pflicht-Kommandos (vor Release-Kandidat)

| Schritt | Befehl | Hinweis |
|---------|--------|---------|
| 1 | `npm run typecheck` | Root |
| 2 | `npm run verify:ci` | CI-Parität ohne lokale DB |
| 3 | `npm run verify:ci:local-db` | Postgres Host **15432** — [`docs/runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md) |
| 4 | `npm run verify:pre-merge` | Inkl. Playwright Smoke — [`AGENTS.md`](../../AGENTS.md) |
| 5 | `npm run test -w apps/web` | Bei PWA-Änderungen |

## Detail-Checklisten

- FIN-6 Felder/Logs: [`fin6-logging-privacy-814.md`](./fin6-logging-privacy-814.md)
- §15 Team-Tabelle: [`qa-fin6-section15-acceptance.md`](./qa-fin6-section15-acceptance.md)
- Merge-Evidenz Remote: [`qa-fin-0-gate-readiness.md`](./qa-fin-0-gate-readiness.md) §5a
- Staging/Prod vor Traffic: [`phase-a-staging-prod-env-checklist.md`](../runbooks/phase-a-staging-prod-env-checklist.md)

## Verbleibende Lücken (§16 / Tickets)

Explizit zurückgestellt laut Plan: vollständiger **8.4(2–6)**-Motor über B2-1a hinaus, **Pfad C**, **FIN-3** §8.8–8.9/Bankfile, **B5** formales Mahn-PDF, optionale **Audit-Transaktion** — jeweils eigene Tickets/ADRs; keine stillen Partial-Gos.
