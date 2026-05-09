# FIN-6 — Technische Abnahme §15 (Checkliste, Team)

**Domänenreferenz:** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) Quality Gate 15.

Die Checkboxen sind **vom Team** nach Merge-/QA-Evidenz zu setzen — keine automatische Agent-Ausfüllung.

| # | Kriterium | Nachweis (Tests / Run / Dokument) | OK |
|---|-----------|-----------------------------------|-----|
| 1 | Tenant-Isolation auf Finanz-Lese-/Schreibpfaden | Persistenz-Suite, `verify:ci:local-db` | [ ] |
| 2 | Traceability Rechnung → Kette fail-closed | `TraceabilityService`, Stubs/Matrix | [ ] |
| 3 | Finanz-SoT (`allowedActions`) konsistent Shell + Finanz-Vorbereitung | E2E `e2e/login-finance-smoke.spec.ts`, [`ui-action-executor-coverage.md`](./ui-action-executor-coverage.md) | [ ] |
| 4 | Keine Phantom-Domain-Codes | OpenAPI + `error-codes.json` + Mapping | [ ] |
| 5 | Logging §8.14 Zahlungsfelder | [`fin6-logging-privacy-814.md`](./fin6-logging-privacy-814.md), Redaction-Tests | [ ] |

**Gesamt:** Siehe auch [`qa-fin-mvp-gate-15-abnahme.md`](./qa-fin-mvp-gate-15-abnahme.md).
