# Codemap — Spine (technischer Schnelleinstieg)

**Tiefer:** Ticket-, FIN- und Compliance-Links → [`overview-deep-links.md`](./overview-deep-links.md). **Persistenz:** [`persistence-and-repository-mode.md`](./persistence-and-repository-mode.md). **Domänen-Fächer:** [`domain-strands.md`](./domain-strands.md). **Onboarding-Pfade:** [`../plans/developer-onboarding-ladder.md`](../plans/developer-onboarding-ladder.md).

Vollständige Karte inkl. API-/PWA-Detailtabelle: [`overview.md`](./overview.md).

---

## Prozess und App-Zusammenbau

| Pfad | Rolle |
|------|--------|
| [`src/index.ts`](../../src/index.ts) | Prozessstart, App bauen |
| [`src/api/app.ts`](../../src/api/app.ts) | Fastify-Plugins, Routen-Mount, **Repository-Modus**, Persistenz-Adapter |
| [`src/config/repository-mode.ts`](../../src/config/repository-mode.ts) | Memory vs. Postgres auflösen |
| [`src/config/http-listen.ts`](../../src/config/http-listen.ts) | Bind/Port |

---

## Schichten (`src/`)

| Schicht | Pfad | Rolle |
|---------|------|--------|
| API | `src/api/` | `*-routes.ts`, gemeinsame HTTP-Helfer |
| Domäne | `src/domain/` | Typen, Lebenszyklen, fachliche Regeln |
| Services | `src/services/` | Anwendungsfälle, Orchestrierung |
| Persistenz | `src/persistence/` | Prisma/DB-Zugriff, Write-Through |
| Auth | `src/auth/` | Token, Passwort-Konfiguration |
| Repositories | `src/repositories/in-memory-repositories.ts` | In-Memory-SoT |
| Seeds | `src/composition/` | Demo-/Seed-Daten |

---

## PWA (`apps/web/`)

| Pfad | Rolle |
|------|--------|
| [`apps/web/src/main.tsx`](../../apps/web/src/main.tsx) | Vite-Einstieg |
| [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) | Routing, Shells, Hash-Navigation |
| [`apps/web/src/lib/api-client.ts`](../../apps/web/src/lib/api-client.ts) | HTTP-Client |
| [`apps/web/src/components/offers/OfferSupplementWorkspacePage.tsx`](../../apps/web/src/components/offers/OfferSupplementWorkspacePage.tsx) | **`#/angebote-arbeitsflaeche`**: Projektlisten **`GET /projects/{projectId}/offers`** und **`GET /projects/{projectId}/supplements`** (über `ApiClient`) |

---

## Rechnungsbuch / DOM-8-6 (Kurz)

| Pfad | Rolle |
|------|--------|
| [`src/api/finance-invoice-routes.ts`](../../src/api/finance-invoice-routes.ts) | u. a. `POST /invoices/{id}/book` → `schlussrechnungMitigation` (ADR-0023), `schlussrechnungFollowUpDraft` (ADR-0024) |

---

## Verträge und Datenbank

| Pfad | Rolle |
|------|--------|
| [`prisma/schema.prisma`](../../prisma/schema.prisma), [`prisma/migrations/`](../../prisma/migrations/) | Schema; Merge-Pfad: Migrationen, kein `db push` als verbindlicher Produktionsersatz |
| [`docs/api-contract.yaml`](../api-contract.yaml) | OpenAPI |
| [`docs/contracts/`](../contracts/) | QA-Specs, Fehlercodes (`error-codes.json`) |
| [`src/domain/openapi-contract-version.ts`](../../src/domain/openapi-contract-version.ts) | Synchron zu `info.version` in OpenAPI |

---

## Tests (Kurz)

- Backend: `npm test` (Vitest).
- Web: `npm run test -w apps/web`.
- E2E: `npm run test:e2e`; Merge-Nähe: `npm run verify:pre-merge` (siehe [`AGENTS.md`](../../AGENTS.md)).
