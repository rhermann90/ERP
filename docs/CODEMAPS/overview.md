# Code map — ERP Repository

Kurzüberblick für Navigation in `src/` (Fastify-Backend) und `apps/web` (PWA). Detaillierte Fachlogik: [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md). Architekturentscheidungen: [`docs/adr/`](../adr/).

## Einstiegspunkte

| Bereich | Pfad | Rolle |
|--------|------|--------|
| **Produktiv-Go Finanz (fachlich)** | [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) | UStG/GoBD/E-Rechnung/DSGVO — Abnahme neben Code/CI |
| HTTP-Server-Start | `src/index.ts` | Prozessstart, App bauen |
| App-Zusammenbau | `src/api/app.ts` | Fastify-Plugins, Routen-Mount, Repository-Modus |
| **FIN-4 / M4 Vorlagen + Footer** | `GET`/`PATCH` `/finance/dunning-reminder-templates`…, `GET`/`PATCH` `/finance/dunning-email-footer`, `src/services/dunning-reminder-template-service.ts`, `dunning-email-footer-service.ts`, `dunning-template-persistence.ts`, `dunning-email-footer-persistence.ts` | ADR-0010 (M4) |
| Konfiguration Listen/Repo | `src/config/http-listen.ts`, `src/config/repository-mode.ts` | Port, Postgres vs. Memory |

## API-Schicht (`src/api/`)

| Datei / Muster | Inhalt |
|----------------|--------|
| `*-routes.ts` | Ressourcen-Routen (LV, Aufmass, Angebot, Finanz, Auth, Nutzer, …) |
| `http-response.ts`, `idempotency-header.ts` | Gemeinsame HTTP-Hilfen |

Neue Endpunkte: OpenAPI [`docs/api-contract.yaml`](../api-contract.yaml) und Fehlercodes [`docs/contracts/error-codes.json`](../contracts/error-codes.json) mitführen, wo verbindlich. **`info.version`** synchron zu [`src/domain/openapi-contract-version.ts`](../../src/domain/openapi-contract-version.ts); FIN-4-Integratoren: [`docs/contracts/FIN4-external-client-integration.md`](../contracts/FIN4-external-client-integration.md).

## Domäne (`src/domain/`)

Richtlinien und Typen (Lebenszyklen LV/Aufmass/Angebot, Messung, Rechnungslogik, Textstruktur). Änderungen hier wirken auf Traceability und buchhaltungsnahe Pfade — Systembeschreibung und ADRs prüfen.

## Services (`src/services/`)

Anwendungsfälle und Orchestrierung (z. B. `offer-service`, `lv-service`, `invoice-service`, `measurement-service`, Export, Audit, Auth-Hilfen).

## Persistenz (`src/persistence/`)

Write-Through / DB-Zugriff je Aggregat; spiegelt Prisma-Schema unter `prisma/`. Siehe ADR-0006, 0007, 0008 u. a.

## Auth (`src/auth/`)

Token, Passwort-Login-Konfiguration; zugehörige Routen unter `src/api/auth-login-routes.ts`, `password-reset-routes.ts`.

## Repositories & Seeds

| Pfad | Rolle |
|------|--------|
| `src/repositories/in-memory-repositories.ts` | In-Memory-SoT im Prozess |
| `src/composition/seed.ts`, `seed-auth-prisma.ts` | Startdaten / Auth-Seeds |

## Sonstiges Backend

| Pfad | Rolle |
|------|--------|
| `src/http/pwa-http-layer.ts` | PWA-relevante HTTP-Schicht |
| `src/mail/smtp-send.ts` | Mailversand |
| `src/validation/schemas.ts` | Zod-Schemas |
| `src/errors/domain-error.ts` | Domänenfehler |

## PWA (`apps/web/`)

UI/UX-Leitfaden und Darstellungsmodi: [`docs/ui-ux-style-guide.md`](../ui-ux-style-guide.md); Tokens und Theming: [`docs/web-theming.md`](../web-theming.md); **Referenz (Links):** [`docs/referenz-ui-ux.md`](../referenz-ui-ux.md).

| Pfad | Rolle |
|------|--------|
| `src/main.tsx`, `src/App.tsx` | Einstieg, Routing-Oberfläche; Shell **read-only** bei `entityType=INVOICE`: `GET /invoices/{id}` („Detail“ / GET), `GET …/payment-intakes`, `GET …/dunning-reminders` (Listen; `ApiClient`) |
| `src/lib/api-client.ts`, `api-error.ts` | API-Aufrufe und Fehler |
| `src/lib/tenant-session.ts`, `token-payload.ts` | Mandanten-Session |
| `src/lib/action-executor.ts`, `role-quick-actions.ts`, `v13-domain-role-mapping.ts` | Aktionen / Rollen |
| `src/components/*.tsx` | UI (Shell, Login, Dokument-Texte, …) |
| `src/lib/hash-route.ts`, `normalizeFinancePrepHashToCanon` in `App.tsx` | Finanz-Hash-Routing: Kanon `#/finanz-vorbereitung?tab=…`, Alias `#/finanz-grundeinstellungen` → einmalige Normalisierung per `replaceState`; `FINANCE_PREP_*` Konstanten |
| `src/components/FinancePreparation.tsx`, `src/components/finance/FinancePreparation*Panel.tsx` | Finanz-Vorbereitung: Tabs inkl. Grundeinstellungen Mahnlauf; OFF/SEMI; OFF-1a (Batch-Buttons bei Server-OFF); SEMI-Kontext (ADR-0010 / ADR-0011) |
| `vite.config.ts` | Build/Dev |

## Verträge & Datenbank

- `prisma/schema.prisma`, `prisma/migrations/` — Schema und Migrationen (kein `db push` als Merge-Pfad; siehe README).
- `docs/api-contract.yaml` — OpenAPI.
- `docs/contracts/` — QA, Delta-Specs, Fehlercodes.

## Tests

- Backend: `vitest` am Root (`npm test`).
- Web: `npm run test -w apps/web`; E2E: `npm run test:e2e` (Playwright); Finanz-Rauchtest-Journey [`e2e/login-finance-smoke.spec.ts`](../../e2e/login-finance-smoke.spec.ts) (Tabs Rechnung, Grundeinstellungen/Mahn, Mahnwesen, Fortgeschritten — UI-/Lesepfade gemäß bestehenden Buttons).

## Wartung dieser Datei

Bei neuem vertikalen Slice (neue Route + Service + Persistenz): eine Zeile unter der passenden Sektion ergänzen und ggf. ADR verlinken. Keine Zeilenweise Code-Dokumentation — nur Orientierung.
