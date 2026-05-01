# Wave 3 — FIN-4 Phase 3: Mahn-Konfig Lesepfad (MVP Read-Stub)

**Status:** Umgesetzt (Repo-Stand 2026-04-22)  
**ADR:** [`docs/adr/0009-fin4-mahnwesen-slice.md`](../adr/0009-fin4-mahnwesen-slice.md) — Abschnitt **Slice 3**  
**Wellendoku:** [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md) § Phase 3

## Ziel

Vor M4 (E-Mail, Vorlagen, persistierte Mandantenkonfiguration) einen **reinen Lesepfad** bereitstellen, damit UI und Integrationen Stufenmetadaten **ohne** Rechnungskontext laden können — **ohne** Schreibpfad und **ohne** Versand.

## Lieferumfang (Ist)

| Artefakt | Beschreibung |
|----------|--------------|
| **HTTP** | `GET /finance/dunning-reminder-config` — Antwort `{ data: { configSource: "MVP_STATIC_DEFAULTS", tenantId, stages[1..9] } }` |
| **Code** | [`src/domain/dunning-reminder-config-defaults.ts`](../../src/domain/dunning-reminder-config-defaults.ts), [`src/api/finance-dunning-config-routes.ts`](../../src/api/finance-dunning-config-routes.ts), Registrierung in [`src/api/app.ts`](../../src/api/app.ts) |
| **Auth** | `assertCanReadInvoice` (wie `GET /invoices/{id}` / Mahn-Liste) |
| **OpenAPI** | `finDunningReminderConfigGet`, Version `1.11.0-fin4-dunning-config-read` |
| **Tests** | [`test/finance-fin0-stubs.test.ts`](../../test/finance-fin0-stubs.test.ts) — Happy + VIEWER + Tenant-Mismatch |
| **PWA** | [`apps/web/src/components/FinancePreparation.tsx`](../../apps/web/src/components/FinancePreparation.tsx) lädt Defaults per `api.getDunningReminderConfig()`; Anzeige im Mahn-Panel |
| **Matrix / Mapping** | [`docs/contracts/qa-fin-0-stub-test-matrix.md`](../contracts/qa-fin-0-stub-test-matrix.md), [`docs/contracts/finance-fin0-openapi-mapping.md`](../contracts/finance-fin0-openapi-mapping.md) |

## Non-Goals (explizit)

- Keine neue Datenbanktabelle in diesem Slice.
- Kein Schreibpfad, kein Admin-UI für Gebühren/Fristen.
- Keine Änderung an `RECORD_DUNNING_REMINDER` / `POST …/dunning-reminders`.

## Nächste sinnvolle Schritte (Backlog, PL priorisiert)

1. **Persistierte Konfiguration** (`dunning_stage_config` o. ä.) pro Mandant, append-only Versionierung optional (§8.10 / ADR-Folge).
2. **Read** aus DB mit Fallback auf MVP-Defaults für leere Mandanten.
3. **M4:** Vorlagen, E-Mail-Footer, Vorschau — weiterhin **separates** Inkrement laut MVP-FINANZ Teil 4 FIN-4.

## QA-Kurzcheck

- `npm run typecheck`
- `npm test` (inkl. `test/finance-fin0-stubs.test.ts`)
- `npm run build -w apps/web && npm run test -w apps/web`
