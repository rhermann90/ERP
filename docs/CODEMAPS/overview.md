# Code map — ERP Repository

Kurzüberblick für Navigation in `src/` (Fastify-Backend) und `apps/web` (PWA). Detaillierte Fachlogik: [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md). Architekturentscheidungen: [`docs/adr/`](../adr/).

## Einstiegspunkte

| Bereich | Pfad | Rolle |
|--------|------|--------|
| **Cursor — Projektregeln** | [`.cursor/rules/cursor-stack.mdc`](../../.cursor/rules/cursor-stack.mdc), [`.cursor/skills/`](../../.cursor/skills/) (`plan-ceo`, `ship`, …); `npm run validate:cursor-project-rules`; Refresh `npm run sync:cursor-stack-skills` **oder** manuell offline (Abschnitt „Geschlossene / offline Umgebungen“ in `cursor-stack.mdc`) | Eine aktive Regel (`alwaysApply`); `erp-*.mdc` nur Redirect-Stubs; Slash-Befehle ggf. Cursor-build-abhängig |
| **Reviews / Skill-Audits** | [`docs/reviews/projekt-skill-pruefung-2026-05-04.md`](../reviews/projekt-skill-pruefung-2026-05-04.md) | cursor-stack-Skill-Raster (Researcher → CEO/Eng → Review → QA → Ship → Retro); nicht CI-automatisiert |
| **Compliance (Stub + Archiv)** | [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md), [`docs/_archiv/checklisten-compliance-human-workflow/README.md`](../docs/_archiv/checklisten-compliance-human-workflow/README.md) | Stub im Repo; ausführlicher Text archiviert — **keine** Repo-Pflicht für menschliche Freigaben; Finanz-Scope **Mandant→Endkunde** ([`docs/adr/0012-finance-scope-tenant-customer-invoices-only.md`](../adr/0012-finance-scope-tenant-customer-invoices-only.md)) |
| **Compliance Ledger (technisch)** | [`Checklisten/compliance-rechnung-finanz.ledger.md`](../../Checklisten/compliance-rechnung-finanz.ledger.md), [`Checklisten/compliance-rechnung-finanz-filled.md`](../../Checklisten/compliance-rechnung-finanz-filled.md) (Anlage), [`Checklisten/compliance-signoffs.schema.md`](../../Checklisten/compliance-signoffs.schema.md), [`Checklisten/compliance-freigabe-runbook.md`](../../Checklisten/compliance-freigabe-runbook.md) (Stub), `scripts/validate-compliance-signoffs.mjs`, `scripts/apply-compliance-signoffs.mjs` | **54** `chk-*` Marker; Validator/Apply für optionale JSON-Synchronisation |
| **M4 Slice 5c — Agenda** | [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](../runbooks/m4-slice-5c-pl-mandanten-go.md) | Massen-E-Mail: Agenda-Anker; operative Freigaben **außerhalb** des Repo-Prozesses |
| **FIN-2 nächste Teilprojekte (Gate)** | [`docs/tickets/FIN-2-NEXT-SUBPROJECT-GATE.md`](../tickets/FIN-2-NEXT-SUBPROJECT-GATE.md) | Reihenfolge 8.4-Motor / Pfad C / LV-Lesepfad ohne Parallel-Mix |
| **FIN-5 — Gate (M5)** | [`docs/tickets/FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md) | **Geschlossen 2026-05-04:** Option **B** Fail-Closed; ADR [`0014-fin5-mvp-tax-fail-closed.md`](../adr/0014-fin5-mvp-tax-fail-closed.md); nächster MVP-Schritt typisch **FIN-6** ([`nächste-schritte.md`](../plans/nächste-schritte.md) Spur **C**) |

| **Roadmap — Weg zur fertigen App** | [`docs/plans/roadmap-fertige-app.md`](../plans/roadmap-fertige-app.md) | Phasen A–E: CI/Lieferung, Option A, 5c-Go, FIN-5/6, Phase 2 LV separat |
| HTTP-Server-Start | `src/index.ts` | Prozessstart, App bauen |
| App-Zusammenbau | `src/api/app.ts` | Fastify-Plugins, Routen-Mount, Repository-Modus |
| **FIN-4 / M4 Vorlagen + Footer** | `GET`/`PATCH` `/finance/dunning-reminder-templates`…, `GET`/`PATCH` `/finance/dunning-email-footer`, `src/services/dunning-reminder-template-service.ts`, `dunning-email-footer-service.ts`, `dunning-template-persistence.ts`, `dunning-email-footer-persistence.ts` | ADR-0010 (M4) |
| Konfiguration Listen/Repo | `src/config/http-listen.ts`, `src/config/repository-mode.ts` | Port, Postgres vs. Memory |

## API-Schicht (`src/api/`)

| Datei / Muster | Inhalt |
|----------------|--------|
| `*-routes.ts` | Ressourcen-Routen (LV, Aufmass, Angebot, Finanz, Auth, Nutzer, …); **`finance-invoice-tax-routes`** (`/finance/invoice-tax-profile…`); **`GET /users`** paginiert (`user-account-routes` / `user-account-service`); **`GET /lv/versions/{lvVersionId}`** Lesepfad §9 → `lv-service.getVersionSnapshot`; **`GET .../structure`** + **`GET .../nodes/{nodeId}`** + **`GET .../positions/{positionId}`** → `lv-hierarchy-service` (Projektion; ADR-0013) |

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
| `src/main.tsx`, `src/App.tsx` | Einstieg, Routing-Oberfläche; Shell **read-only** bei `entityType=INVOICE`: `GET /invoices/{id}` („Detail“ / GET), `GET …/payment-intakes`, `GET …/dunning-reminders` (Listen; `ApiClient`), `GET /finance/payment-terms?projectId=…` (aus Invoice), `GET /documents/{id}/allowed-actions?entityType=INVOICE` (Diagnose; `ApiClient`); global FIN-4 Lesepfade ohne Dokument-Kontext: `GET /finance/dunning-reminder-config`, `GET /finance/dunning-reminder-templates`, `GET /finance/dunning-email-footer`, `GET /finance/dunning-reminder-automation` (`shell-dunning-config-panel`, `shell-fin4-extra-readonly-panel`); **`GET /lv/versions/{lvVersionId}`** für Entity **LV_VERSION** (Phase 2 LV Lesepfad §9); stabile E2E-`data-testid`: `shell-document-panel`, `shell-document-entity-type`, `shell-document-id`, `shell-document-detail-get`, `offer-shell-detail`, `lv-shell-detail`, `invoice-shell-detail`, `shell-invoice-readonly-subreads`, `shell-invoice-payment-terms-json`, `shell-invoice-allowed-actions-json`, `supplement-shell-detail` |
| `src/components/DocumentTextPanels.tsx` | Aufmass-Shell nach `MEASUREMENT_VERSION`-GET; `data-testid="measurement-shell-detail"` |
| `src/lib/api-client.ts`, `api-error.ts` | API-Aufrufe und Fehler |
| `src/lib/tenant-session.ts`, `token-payload.ts` | Mandanten-Session |
| `src/lib/action-executor.ts`, `role-quick-actions.ts`, `v13-domain-role-mapping.ts` | Aktionen / Rollen |
| `src/components/*.tsx` | UI (Shell, Login, Dokument-Texte, …) |
| `src/lib/hash-route.ts`, `normalizeFinancePrepHashToCanon` in `App.tsx` | Finanz-Hash-Routing: Tab „Grundeinstellungen“ kanonisch `#/finanz-grundeinstellungen`; andere Tabs `#/finanz-vorbereitung?tab=…`; `?tab=grundeinstellungen` per `replaceState` vereinheitlicht; `FINANCE_PREP_*` Konstanten |
| `src/components/FinancePreparation.tsx`, `src/components/finance/FinancePreparation*Panel.tsx` | Finanz-Vorbereitung: Tabs inkl. Grundeinstellungen Mahnlauf; OFF/SEMI; OFF-1a (Batch-Buttons bei Server-OFF); SEMI-Kontext (ADR-0010 / ADR-0011) |
| `src/components/finance/preparation/*.tsx`, `finance-prep-helpers.ts`, `FinanceStructuredApiError.tsx`, `finance-preparation-meta.ts` (`FIN_PREP_ERROR_COPY`) | Step-UI (FIN-1/2/3, SoT-Explorer, Audit); `extractStructuredError` über `finNoticeFromUnknown`; konsistente strukturierte Fehler; A11y (`section`/`aria-labelledby`, `aria-live` Step-Status `finance-prep-step-status-{n}`); Meta/DOC_LINKS |
| `src/components/finance/RoleQuickNav.tsx`, `src/lib/role-quick-actions.ts` | Schnellzugriff-Kacheln; optional `aria-keyshortcuts` je Preset (semantisch) |
| `vite.config.ts` | Build/Dev |

## Verträge & Datenbank

- `prisma/schema.prisma`, `prisma/migrations/` — Schema und Migrationen (kein `db push` als Merge-Pfad; siehe README).
- `docs/api-contract.yaml` — OpenAPI.
- `docs/contracts/` — QA, Delta-Specs, Fehlercodes.

## Tests

- Backend: `vitest` am Root (`npm test`).
- Web: `npm run test -w apps/web`; E2E: `npm run test:e2e` (Playwright); Finanz-Rauchtest-Journey [`e2e/login-finance-smoke.spec.ts`](../../e2e/login-finance-smoke.spec.ts) (Tabs Rechnung, Grundeinstellungen/Mahn inkl. Kandidaten-Region nach GET, Mahnwesen, Fortgeschritten — UI-/Lesepfade gemäß bestehenden Buttons). Haupt-Shell read-only FIN-4: [`GET /finance/dunning-reminder-config`](../../docs/api-contract.yaml) (`shell-dunning-config-panel` / `shell-dunning-config-fetch`); zusätzlich die drei weiteren FIN-4-Lesepfade oben (`shell-fin4-extra-readonly-panel`) in [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx).

## Optionale Spuren (eigene PRs)

- **Phase 2 LV (§9):** [`docs/tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](../tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md) — nicht mit Finanz-Welle 3 mischen.
- **Weitere Haupt-Shell-Lesepfade (`GET`):** nur nach stabiler Route in [`docs/api-contract.yaml`](../api-contract.yaml) und Erweiterung [`apps/web/src/lib/api-client.ts`](../../apps/web/src/lib/api-client.ts); Umsetzung in [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) strikt getrennt von Buchungs-/Batch-Schreibpfaden.

## Wartung dieser Datei

Bei neuem vertikalen Slice (neue Route + Service + Persistenz): eine Zeile unter der passenden Sektion ergänzen und ggf. ADR verlinken. Keine Zeilenweise Code-Dokumentation — nur Orientierung.
