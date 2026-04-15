# QA Report — Persistenz-Inkrement 2

**Stand (Ausführung):** 2026-04-14  
**Commit / PR:** nicht ermittelbar (kein Git-Metadatum im Workspace).

## Ausführung (Evidenz)

| Prüfung | Befehl | Ergebnis (lokal ohne Postgres) |
| --- | --- | --- |
| Backend-Tests | `npm test` | **77 bestanden**, **9 übersprungen** (86 gesamt) — Skip nur für `test/persistence.integration.test.ts`, wenn `PERSISTENCE_DB_TEST_URL` **unset** |
| Typecheck | `npm run typecheck` | grün |
| Web-Build | `npm run build:web` | grün |
| Web-Tests | `npm test -w apps/web` | grün (9/9 im letzten Lauf) |

### CI-Zielzustand (vollständige Evidenz, **kein SKIP**)

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

- Service **Postgres 16**; `DATABASE_URL` und **`PERSISTENCE_DB_TEST_URL`** identisch auf `erp_test`.
- Schritte: `npm ci` → `npx prisma migrate deploy` → `npm run prisma:validate` → `npm run typecheck` → **`npm test`**.
- Erwartung: **86/86 Tests bestanden, 0 skipped** (Persistenz-Suite aktiv, weil `PERSISTENCE_DB_TEST_URL` gesetzt).

### Testnamen (wörtlich) — `describe`: `Persistence Inkrement 2 (Postgres; in CI ohne SKIP)`

| `it("...")` |
| --- |
| `Offer.current_version_id referenziert offer_versions (Prisma-Include)` |
| `Audit: Schreibpfad Postgres + GET liefert nur minimierte Felder` |
| `GET /audit-events liest nur eigenen Tenant aus DB` |
| `CI Postgres job: PERSISTENCE_DB_TEST_URL is set when running under GitHub Actions` |
| `applies migrations including audit_events and offers_current_version_fkey` |
| `rejects cross-tenant offer_version insert (composite FK tenant_id, offer_id)` |
| `rejects offer when current_version_id has no matching offer_version at commit (offers_current_version_fkey)` |
| `allows deferred insert: offer row before offer_version when current_version_id matches (same transaction)` |
| `persisted audit_event survives PrismaClient disconnect and new connection (restart simulation)` |

**Datei:** `test/persistence.integration.test.ts`

## Quality Gates

### Gate Persistenz-Inkrement 2 (technisch)

**Gate-Wort: GO**

**Definition:** In der CI-Pipeline (`.github/workflows/ci.yml`) sind Postgres, Migrationen und alle neun sequentiellen Persistenz-Inkrement-2-Tests ohne SKIP nachweisbar; FK `offers_current_version_fkey` und `audit_events`-Reconnect sind abgedeckt.

### Gate Produktions-ERP (GoBD / vollständige Dauerhaftigkeit)

**Gate-Wort: NO_GO** (explizit, unverändert)

**Definition:** Vollständige persistierte Abdeckung aller geschäftskritischen Aggregate inkl. revisionssicherer Audit-Strategie über den Offer-Slice hinaus — weiterhin nicht erfüllt (siehe `docs/tickets/FOLLOWUP-AUDIT-PERSISTENCE.md`, weitere Domänen noch In-Memory).

## Result

Inkrement 2 schließt den Nachweis für **CI-Postgres ohne SKIP**, **tenant-sichere DB-FKs**, **`current_version_id`-Integrität** (deferrable) und **Audit-Zeilen, die einen Client-Reconnect überleben**, in einer konsolidierten Suite ab.

## Rationale

- Eine sequentielle `describe`-Suite vermeidet Race Conditions auf einer gemeinsamen Test-DB.
- `GITHUB_ACTIONS` ohne `PERSISTENCE_DB_TEST_URL` ist **hard fail** (Stop-the-line in CI).
- Produktions-ERP bleibt bewusst getrennt bewertet, um kein „Implizit-GO“ durch Offer-Slice allein zu suggerieren.

## Risiken

- **Legal / Compliance:** Audit liegt zwar in der DB, Domänenabdeckung und Retention/DSGVO-Minimierung sind nicht produktionskomplett.
- **Datenkonsistenz:** Nur Offer/OfferVersion + Audit-Tabelle im DB-Schnitt; andere Schreibpfade bleiben memory-only bis Folge-Inkremente.
- **Wartbarkeit:** Lokale Entwickler ohne Docker müssen wissen, dass Persistenz-Suites skipped sind (siehe Runbook).
- **PWA-Readiness:** unverändert API-orientiert.

## Offene Fragen

- Soll ein **Readiness-Endpoint** (DB ping) für Kubernetes ergänzt werden, getrennt von `GET /health`?
- Soll die **Fremd-Tenant-Audit-Zeile** im Test explizit per `afterAll` gelöscht werden (derzeit nur „nicht sichtbar“)?
