# QA Report — Persistenz-Inkrement 1

**Datum:** 2026-04-14  
**Commit / PR:** nicht ermittelbar (Workspace ohne Git-Metadatum; bei nächstem Push Referenz nachtragen).

## Ausführung (Evidenz)

| Prüfung | Befehl | Ergebnis (dieser Lauf) |
| --- | --- | --- |
| Backend inkl. Persistenz-Tests | `npm test` | **77 bestanden**, **9 übersprungen** (86 gesamt) — übersprungen nur wenn `PERSISTENCE_DB_TEST_URL` **unset** (gesamte `persistence.integration`-Suite) |
| Typecheck | `npm run typecheck` | grün |
| Web-Build | `npm run build:web` | grün |
| Web-Tests | `npm test -w apps/web` | **9/9** grün |

### Testnamen (wörtlich) — Persistenz & Policy

| Thema | `describe` / `it("...")` | Datei |
| --- | --- | --- |
| Schema reproduzierbar | `persistence increment 1 — schema & migrations reproducible (no live DB)` → `it('runs npm run prisma:validate (placeholder DATABASE_URL via scripts/prisma-env-placeholder.mjs)')` | `test/persistence-schema-repro.test.ts` |
| Migrate + Tabellen (optional DB) | `Persistence Inkrement 2 (Postgres; in CI ohne SKIP)` → `it("applies migrations including audit_events and offers_current_version_fkey")` | `test/persistence.integration.test.ts` |
| Tenant FK | dieselbe `describe` → `it("rejects cross-tenant offer_version insert (composite FK tenant_id, offer_id)")` | `test/persistence.integration.test.ts` |
| Fail-closed ohne DB | `repository-mode (ADR-0003 / Agent-1 fail-closed DB policy)` → `it("assertFailClosedProductionDatabase exits 1 when production without DATABASE_URL")` | `test/repository-mode.test.ts` |
| Fail-closed Integration-Deployment | dieselbe `describe` → `it("assertFailClosedProductionDatabase exits 1 when ERP_DEPLOYMENT=integration without DATABASE_URL")` | `test/repository-mode.test.ts` |

Manueller Vollnachweis für leere DB (entspricht README):  
`DATABASE_URL=… npx prisma migrate deploy`

## Quality Gates (getrennt)

### Gate Persistenz-Inkrement 1 (technisch)

**Gate-Wort: GO_MIT_AUFLAGEN**

**Definition:** Migrationsbundle ist validierbar und start-policy fail-closed ist testabgedeckt; **DB-Migrate + FK** sind implementiert und testbar, laufen in der Standard-Pipeline aber nur mit gesetztem `PERSISTENCE_DB_TEST_URL` (sonst SKIP, kein FAIL).

**Auflage:** Merge-/Release-Prozess soll mindestens einen Job mit Postgres + `PERSISTENCE_DB_TEST_URL` fahren, sodass PER-P0-02/03 **ohne Skip** grün sind.

### Gate Produktions-ERP (GoBD / vollständige Dauerhaftigkeit)

**Gate-Wort: NO_GO** (explizit, unverändert zur vorherigen Linie)

**Definition:** Produktions-ERP mit vollständiger Audit-Persistenz und allen Geschäftsaggregaten auf DB — weiterhin offen bis u. a. `docs/tickets/FOLLOWUP-AUDIT-PERSISTENCE.md` und Erweiterung über den Offer-Slice hinaus geklärt/umgesetzt sind.

## Result

Persistenz-Inkrement 1 ist **technisch nachweisbar tenant-sicher auf DB-Ebene** im migrierten Offer-Slice (FK) und **reproduzierbar** über versionierte Migrationen; der Integrationsnachweis ohne Live-Postgres ist durch `prisma:validate` abgedeckt. Vollständiger DB-Lauf ist eine **konfigurierte Auflage**, nicht optional für ein späteres Production-Gate.

## Rationale

- Composite Keys + FK `offer_versions → offers` auf `(tenant_id, offer_id)` setzen Cross-Tenant-Einfügen praktisch außer Kraft.
- `assertFailClosedProductionDatabase` verhindert stillen Produktionsstart ohne `DATABASE_URL`.
- API-Tests bleiben auf In-Memory (schnelle Regression); Persistenz wird orthogonal geprüft.

## Risiken

- **Legal / Compliance:** Ohne persistierte Audit-Tabelle kein vollständiger Compliance-Nachweis — bleibt Gate Produktions-ERP NO_GO.
- **Datenkonsistenz:** Nur Offer/OfferVersion sind DB-backed; andere Entitäten können inkonsistent wirken, wenn Betrieb fälschlich „fertig migriert“ meldet.
- **Wartbarkeit:** Zwei Modi (memory/postgres) erfordern klare Betriebsdoku (`README.md`, `.env.example`).
- **PWA-Readiness:** Unverändert; PWA hängt an API-Verfügbarkeit, nicht direkt an Prisma.

## Offene Fragen

- Soll `PERSISTENCE_DB_TEST_URL` dauerhaft in CI (z. B. Service-Container) Standard werden, um **GO** statt GO_MIT_AUFLAGEN zu erreichen?
- Soll `hydrateOffersIntoMemory` langfristig tenant-gefiltert werden (Performance/Least-Data), sobald Multi-Tenant-Betrieb auf einer DB-Instanz produktiv ist?
