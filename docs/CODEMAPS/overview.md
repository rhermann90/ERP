# Code map — ERP Repository

Kurzüberblick für Navigation in `src/` (Fastify-Backend) und `apps/web` (PWA). Detaillierte Fachlogik: [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) (**3.0 konsolidiert**, Teil I §1–§18, Teil V PWA-Roadmap). **PWA MVP und Ist-Stand:** [`docs/PWA-Entwicklungsreferenz.md`](../PWA-Entwicklungsreferenz.md). Architekturentscheidungen: [`docs/adr/`](../adr/).

## Einstiegspunkte

| Bereich | Pfad | Rolle |
|--------|------|--------|
| **Cursor — Projektregeln** | [`.cursor/rules/cursor-stack.mdc`](../../.cursor/rules/cursor-stack.mdc), [`.cursor/skills/`](../../.cursor/skills/) (`plan-ceo`, `ship`, …); `npm run validate:cursor-project-rules`; Refresh `npm run sync:cursor-stack-skills` **oder** manuell offline (Abschnitt „Geschlossene / offline Umgebungen“ in `cursor-stack.mdc`) | Eine aktive Regel (`alwaysApply`); `erp-*.mdc` nur Redirect-Stubs; Slash-Befehle ggf. Cursor-build-abhängig |
| **Reviews / Skill-Audits** | [`docs/reviews/projekt-skill-pruefung-2026-05-04.md`](../reviews/projekt-skill-pruefung-2026-05-04.md) | cursor-stack-Skill-Raster (Researcher → CEO/Eng → Review → QA → Ship → Retro); nicht CI-automatisiert |
| **Compliance (Stub + Archiv)** | [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md), [`docs/contracts/compliance-spec-traceability.md`](../contracts/compliance-spec-traceability.md) (Spez ↔ Tests/Gates), [`docs/_archiv/checklisten-compliance-human-workflow/README.md`](../docs/_archiv/checklisten-compliance-human-workflow/README.md) | Begleitblatt + Matrix — **Empfehlungen** und Merge ohne Pflichtfreigabe: [`README.md`](../../README.md); Finanz-Scope **Mandant→Endkunde** ([`docs/adr/0012-finance-scope-tenant-customer-invoices-only.md`](../adr/0012-finance-scope-tenant-customer-invoices-only.md)) |
| **Compliance Ledger (technisch)** | [`Checklisten/compliance-rechnung-finanz.ledger.md`](../../Checklisten/compliance-rechnung-finanz.ledger.md), [`Checklisten/compliance-rechnung-finanz-filled.md`](../../Checklisten/compliance-rechnung-finanz-filled.md) (Anlage), [`Checklisten/compliance-signoffs.schema.md`](../../Checklisten/compliance-signoffs.schema.md), [`Checklisten/compliance-freigabe-runbook.md`](../../Checklisten/compliance-freigabe-runbook.md) (Stub), `scripts/validate-compliance-signoffs.mjs`, `scripts/apply-compliance-signoffs.mjs` | **54** `chk-*` Marker; Validator/Apply für optionale JSON-Synchronisation |
| **M4 Slice 5c — Agenda** | [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](../runbooks/m4-slice-5c-pl-mandanten-go.md) | Massen-E-Mail: Agenda-Anker; operative Freigaben **außerhalb** des Repo-Prozesses |
| **Staging / Produktion — Env + Smoke** | [`docs/runbooks/phase-a-staging-prod-env-checklist.md`](../runbooks/phase-a-staging-prod-env-checklist.md) | Variablen, `migrate deploy`, `/health`, `/ready`; Verweis Gate §15 |
| **UAT — Nutzerabnahme (Handoff, Skript, Evidenz)** | [`docs/runbooks/uat-staging-handoff.md`](../runbooks/uat-staging-handoff.md), [`uat-one-pager-template.md`](../runbooks/uat-one-pager-template.md), [`uat-manual-test-script.md`](../runbooks/uat-manual-test-script.md), [`uat-evidence-protocol.md`](../runbooks/uat-evidence-protocol.md) | Staging-Übergabe an Tester, Zugangs-/UUID-Vorlage, manuelle PWA-Pfade, Abweichungsprotokoll |
| **FIN-2 nächste Teilprojekte (Gate)** | [`docs/tickets/FIN-2-NEXT-SUBPROJECT-GATE.md`](../tickets/FIN-2-NEXT-SUBPROJECT-GATE.md), [`FIN-2-BACKLOG-REST.md`](../tickets/FIN-2-BACKLOG-REST.md) | Reihenfolge 8.4-Motor / Pfad C / LV-Lesepfad ohne Parallel-Mix |
| **Pilot Go + LV→Rechnung** | [`docs/tickets/PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md`](../tickets/PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md), [`docs/adr/0018-pilot-lv-aufmass-invoice-convergence.md`](../adr/0018-pilot-lv-aufmass-invoice-convergence.md) | Kontrollierter Mandanten-Go; Adapter-Doku; kein Mix 8.4(2–6)/Pfad C ohne separates Gate |
| **FIN-3 / FIN-4 Rest** | [`FIN-3-BACKLOG-88-89.md`](../tickets/FIN-3-BACKLOG-88-89.md), [`FIN-4-BACKLOG-POST-WAVE3.md`](../tickets/FIN-4-BACKLOG-POST-WAVE3.md) | §8.8–8.9 bzw. M4-Follow-ups; kein PR-Mix mit 8.4/Pfad C |
| **FIN-6 §8.14 / §15** | [`docs/contracts/fin6-logging-privacy-814.md`](../contracts/fin6-logging-privacy-814.md), [`docs/contracts/qa-fin-mvp-gate-15-abnahme.md`](../contracts/qa-fin-mvp-gate-15-abnahme.md), [`docs/contracts/qa-fin6-section15-acceptance.md`](../contracts/qa-fin6-section15-acceptance.md) | Logging/Redaction + Gate-15-Skeleton + Team-Checkboxen |
| **FIN-5 — §8.16 Steuerregime** | [`docs/adr/0015-fin5-invoice-tax-regimes-816.md`](../adr/0015-fin5-invoice-tax-regimes-816.md), Routes [`src/api/finance-invoice-tax-routes.ts`](../../src/api/finance-invoice-tax-routes.ts) (`GET\|PATCH /finance/invoice-tax-profile`, `GET\|PUT\|DELETE /finance/invoice-tax-profile/projects/{projectId}` mit lokaler Rate-Limit-Konfig), Service [`src/services/invoice-tax-settings-service.ts`](../../src/services/invoice-tax-settings-service.ts), Persistenz [`src/persistence/invoice-tax-profile-persistence.ts`](../../src/persistence/invoice-tax-profile-persistence.ts), Domäne [`src/domain/invoice-tax-regime.ts`](../../src/domain/invoice-tax-regime.ts) + [`src/domain/invoice-tax-mandatory-notices.ts`](../../src/domain/invoice-tax-mandatory-notices.ts) + `src/domain/invoice-calculation.ts` (`computeInvoiceTotalsForTaxRegime`), Migration [`prisma/migrations/20260504143000_fin5_invoice_tax_regimes/`](../../prisma/migrations/20260504143000_fin5_invoice_tax_regimes/migration.sql) | Mandanten-Default + optional Projekt-Override (Resolver Override > Profile > Default, Audit auf Mutationen); Rechnungs-Snapshot mit `invoice_tax_regime` / `vat_rate_bps_effective` / `tax_reason_code`; Pflicht-Hinweiszeilen am Server; XRechnung [`POST /exports`](../api-contract.yaml): optional `xrechnungXml` (UBL) fuer die vier FIN-5-Regime; Mapping-Referenz [`docs/contracts/xrechnung-tax-regime-mapping.md`](../contracts/xrechnung-tax-regime-mapping.md); Stammdaten XRechnung [`src/persistence/e-invoice-party-persistence.ts`](../../src/persistence/e-invoice-party-persistence.ts) / Tabellen `tenant_e_invoice_parties` & `customer_e_invoice_parties` (Migration `20260505140000_e_invoice_party_profiles`); Profil-Dokument [`xrechnung-profile-scope-and-gaps.md`](../contracts/xrechnung-profile-scope-and-gaps.md); historisches Gate: [`FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md); Folge-Inkremente (Pakete **A–D** erledigt — PWA-Steuerprofil, Pflicht-Hinweise, XRechnung-Mapping, Drift-Recreate; siehe [`FIN-5-FOLLOWUP-INCREMENTS.md`](../tickets/FIN-5-FOLLOWUP-INCREMENTS.md)) |
| **Roadmap — Weg zur fertigen App** | [`docs/plans/roadmap-fertige-app.md`](../plans/roadmap-fertige-app.md) | Phasen A–E: CI/Lieferung, Option A, 5c-Go, FIN-5/6, Phase 2 LV separat |
| **Produkt-UI — Backend-Vollabdeckung (Programm)** | [`pwa-backend-coverage-matrix.md`](../plans/pwa-backend-coverage-matrix.md), [`pwa-information-architecture.md`](../plans/pwa-information-architecture.md), [`pwa-ux-patterns-end-user.md`](../plans/pwa-ux-patterns-end-user.md), [`pwa-domain-increment-roadmap.md`](../plans/pwa-domain-increment-roadmap.md), [`pwa-qa-quality-bar.md`](../plans/pwa-qa-quality-bar.md) | OpenAPI/`api-client`/PWA-Matrix; IA und Nav; UX-Muster; priorisierte Domänen-Inkremente; E2E/A11y/Verify-Leiste |
| HTTP-Server-Start | `src/index.ts` | Prozessstart, App bauen |
| App-Zusammenbau | `src/api/app.ts` | Fastify-Plugins, Routen-Mount, Repository-Modus |
| **FIN-4 / M4 Vorlagen + Footer** | `GET`/`PATCH` `/finance/dunning-reminder-templates`…, `GET`/`PATCH` `/finance/dunning-email-footer`, `src/services/dunning-reminder-template-service.ts`, `dunning-email-footer-service.ts`, `dunning-template-persistence.ts`, `dunning-email-footer-persistence.ts` | ADR-0010 (M4) |
| Konfiguration Listen/Repo | `src/config/http-listen.ts`, `src/config/repository-mode.ts` | Port, Postgres vs. Memory |

## API-Schicht (`src/api/`)

| Datei / Muster | Inhalt |
|----------------|--------|
| `*-routes.ts` | Ressourcen-Routen (LV, Aufmass, Angebot, Finanz, Auth, Nutzer, …); **`finance-invoice-tax-routes`** (`/finance/invoice-tax-profile…`); **`finance-e-invoice-party-routes`** (`/finance/e-invoice-parties…`, XRechnung Seller/Buyer); **`crm-stammdaten-routes`** (`/crm/…`, ADR-0019 CRM-Stamm Postgres); **`tenant-pwa-display-settings-routes`** (`GET|PATCH /tenant/pwa-display-settings`, Mandanten-Expertenmodus PWA); **`GET /users`** paginiert (`user-account-routes` / `user-account-service`); **`GET /lv/versions/{lvVersionId}`** Lesepfad §9 → `lv-service.getVersionSnapshot`; **`GET .../structure`** + **`GET .../nodes/{nodeId}`** + **`GET .../positions/{positionId}`** → `lv-hierarchy-service` (Projektion; ADR-0013) |

| `finance-payment-intake-log-helpers.ts` | FIN-6: redizierte Zahlungsreferenz für strukturierte Logs (`POST /finance/payments/intake`); siehe [`docs/contracts/fin6-logging-privacy-814.md`](../contracts/fin6-logging-privacy-814.md) |

| `http-response.ts`, `idempotency-header.ts` | Gemeinsame HTTP-Hilfen |

Neue Endpunkte: OpenAPI [`docs/api-contract.yaml`](../api-contract.yaml) und Fehlercodes [`docs/contracts/error-codes.json`](../contracts/error-codes.json) mitführen, wo verbindlich. **`info.version`** synchron zu [`src/domain/openapi-contract-version.ts`](../../src/domain/openapi-contract-version.ts); FIN-4-Integratoren: [`docs/contracts/FIN4-external-client-integration.md`](../contracts/FIN4-external-client-integration.md).

## Domäne (`src/domain/`)

Richtlinien und Typen (Lebenszyklen LV/Aufmass/Angebot, Messung, Rechnungslogik, Textstruktur). Änderungen hier wirken auf Traceability und buchhaltungsnahe Pfade — Systembeschreibung und ADRs prüfen.

## Services (`src/services/`)

Anwendungsfälle und Orchestrierung (z. B. `offer-service`, `lv-service`, `invoice-service`, `measurement-service`, `crm-stammdaten-service`, Export, Audit, Auth-Hilfen).

## Persistenz (`src/persistence/`)

Write-Through / DB-Zugriff je Aggregat; spiegelt Prisma-Schema unter `prisma/` (inkl. `crm_*` Tabellen ADR-0019). Siehe ADR-0006, 0007, 0008 u. a.

## Auth (`src/auth/`)

Token, Passwort-Login-Konfiguration; zugehörige Routen unter `src/api/auth-login-routes.ts`, `password-reset-routes.ts`.

## Repositories & Seeds

| Pfad | Rolle |
|------|--------|
| `src/repositories/in-memory-repositories.ts` | In-Memory-SoT im Prozess |
| `src/composition/seed.ts`, `seed-auth-prisma.ts`, `seed-crm-stammdaten-prisma.ts` | Startdaten / Auth-Seeds / CRM-Stamm (ADR-0019, Postgres) — u. a. `SEED_IDS.invoiceDraftSmallBusinessId` (ENTWURF SMALL_BUSINESS_19, Pflicht-Hinweise / E2E FIN-5 Paket B) |

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
| `src/main.tsx`, `src/App.tsx`, `src/components/HomeDashboard.tsx` | Einstieg, Routing: **`#/`** Start (Home + Schnellzugriff), **`#/dokument`** Dokument-/Diagnose-Shell; Shell **read-only** bei `entityType=INVOICE`: `GET /invoices/{id}` („Detail“ / GET), `GET …/payment-intakes`, `GET …/dunning-reminders` (Listen; `ApiClient`), `GET /finance/payment-terms?projectId=…` (aus Invoice), `GET /documents/{id}/allowed-actions?entityType=INVOICE` (Diagnose; `ApiClient`), bei gesetzter **`invoice.offerVersionId`** zusätzlich **`GET /documents/{offerVersionId}/allowed-actions?entityType=OFFER_VERSION`** (`shell-invoice-offer-version-allowed-actions-fetch`/`-json`); Trace-Zeilen `shell-invoice-trace-lv`, `shell-invoice-trace-measurement`, `shell-invoice-trace-offer-version`; **`GET /finance/e-invoice-parties/tenant`**, **`GET …/customers`**, **`GET …/customers/{customerId}`** (Buyer aus `invoice.customerId`; `shell-invoice-e-invoice-*-fetch`/`-json`), **`GET /finance/invoice-tax-profile`**, **`GET …/projects/{projectId}`** (`shell-invoice-invoice-tax-*-fetch`/`-json`), **`GET /lv/versions/{lvVersionId}`** aus `invoice.lvVersionId` (`shell-invoice-lv-version-fetch`/`-json`), **`GET /audit-events`** (Seite 1; `shell-invoice-audit-events-fetch`/`-json`); global FIN-4 Lesepfade ohne Dokument-Kontext: `GET /finance/dunning-reminder-config`, `GET /finance/dunning-reminder-templates`, `GET /finance/dunning-email-footer`, `GET /finance/dunning-reminder-automation`, `GET /finance/dunning-reminder-candidates` (`shell-dunning-candidates-fetch`/`-json`; `shell-dunning-config-panel`, `shell-fin4-extra-readonly-panel`); **`GET /tenant/pwa-display-settings`** (`shell-tenant-pwa-display-panel`); **`GET /lv/versions/{lvVersionId}`** für Entity **LV_VERSION** (Phase 2 LV Lesepfad §9) sowie **`GET …/structure`** (`shell-lv-structure-fetch`/`-json`, `ApiClient.getLvVersionStructure`); stabile E2E-`data-testid`: `shell-document-panel`, `shell-document-entity-type`, `shell-document-id`, `shell-document-detail-get`, `offer-shell-detail`, `lv-shell-detail`, `invoice-shell-detail`, `shell-invoice-readonly-subreads`, `shell-invoice-payment-terms-json`, `shell-invoice-allowed-actions-json`, `shell-invoice-offer-version-allowed-actions-json`, `supplement-shell-detail` |
| `src/components/DocumentTextPanels.tsx` | Aufmass-Shell nach `MEASUREMENT_VERSION`-GET; `data-testid="measurement-shell-detail"` |
| `src/lib/api-client.ts`, `api-error.ts` | API-Aufrufe und Fehler; Shell-`allowedActions` vs. dedizierte Finanz-SoT: [`docs/contracts/ui-action-executor-coverage.md`](../contracts/ui-action-executor-coverage.md) |
| `src/lib/tenant-session.ts`, `token-payload.ts` | Mandanten-Session |
| `src/lib/action-executor.ts`, `role-quick-actions.ts`, `v13-domain-role-mapping.ts` | Aktionen / Rollen |
| `src/components/*.tsx` | UI (Shell, Login, Dokument-Texte, …) |
| `src/lib/erp-doc-section-hashes.ts` | GitHub-Anker für ERP-Doku (z. B. §18.1); kombiniert mit `repoDocHref` in Stammdaten- und Hilfe-Hub |
| `src/lib/hash-route.ts`, `normalizeFinancePrepHashToCanon` in `App.tsx` | Finanz-Hash-Routing: Tab „Grundeinstellungen“ kanonisch `#/finanz-grundeinstellungen`; andere Tabs `#/finanz-vorbereitung?tab=…`; `?tab=grundeinstellungen` per `replaceState` vereinheitlicht; `FINANCE_PREP_*` Konstanten; Phase-2 Pilot: `GESCHAEFSPROZESS_HASH` (`#/geschaeftsprozess`), `LV_BEARBEITEN_HASH` (`#/lv-bearbeiten`); Domänen-Hubs: `STAMMDATEN_HASH`, `LV_AUFMASS_HUB_HASH`, `ANGEBOTE_NACHTRAEGE_HUB_HASH`, `EINSTELLUNGEN_HASH`, `HILFE_HASH`; weitere Pilot-Routen: `MEASUREMENT_PILOT_LIST_HASH`, `OFFER_WORKSPACE_HASH`, `FINANCE_WORKLIST_HASH`, `ADMIN_USERS_HASH` |
| `src/components/AppPrimaryNav.tsx`, `src/lib/pwa-primary-nav-visibility.ts`, `src/components/hubs/*HubPage.tsx`, `src/components/product-ui/ProductEmptyState.tsx` | Aufgabenorientierte Hauptnavigation (`primary-nav-*`) und Hub-Screens (`hub-*`); **`#/stammdaten`**: XRechnung Buyer-Liste/Detail (`?customerId=`), Mandanten-Verkäufer, FIN-1-Konditionen strukturiert, **CRM-Stamm** (`listCrm*` / `patchCrmProject` Pilot-Label bei Schreibrolle; OpenAPI `info.version` siehe `openapi-contract-version.ts`), Projekt→`#/dokument?entityType=PROJECT` — [`hash-route.ts`](../../apps/web/src/lib/hash-route.ts) (`stammdatenHashWithCustomerId`, …); Einstellungen-Link nur für Session + Rolle ADMIN/GF/BUCHHALTUNG (Anzeige) |
| `src/components/geschaeftsprozess/GeschaeftsprozessWizard.tsx` | Geführter Pilotpfad LV → Aufmass (`MEASUREMENT_CREATE` über PROJECT-SoT) → Angebot → Rechnungsentwurf (`ApiClient.createOffer`, `createInvoiceDraft`; ADR-0018); Integrations-Copy und Roh-JSON der Projekt-`allowedActions` nur bei Expertenmodus (`showIntegrationHints` aus `App.tsx`) |
| `src/components/measurements/MeasurementPilotListPage.tsx`, `src/components/offers/OfferSupplementWorkspacePage.tsx`, `src/components/finance/FinanceOperationalWorklistPage.tsx`, `src/components/admin/AdminUsersPage.tsx` | Pilot: Messungsliste/Detail (`#/aufmass-messungen`), Angebots-/Nachtrags-SoT (`#/angebote-arbeitsflaeche`), Mahn-Kandidaten (`#/finanz-arbeitsliste`), Nutzer-Admin (`#/admin/users`) |
| `src/components/lv-workbench/LvWorkbench.tsx`, `LvBearbeitenPage.tsx`, `LvVersionSotPanel.tsx`, `LvEntityTextSotPanel.tsx` | LV Abschnitt 9 Lesepfad (`GET /lv/versions/{id}`); SoT: Experten-`LvVersionSotPanel` + Pilot-`LvEntityTextSotPanel` (Text/Knotenposition); Sprung zu **Dokument und Details** (`#/dokument`) für `LV_VERSION`-Aktionen über `executeActionWithSotGuard` |
| `src/components/FinancePreparation.tsx`, `src/components/finance/FinancePreparation*Panel.tsx` | Finanz-Vorbereitung: Tabs inkl. Grundeinstellungen Mahnlauf; OFF/SEMI; OFF-1a (Batch-Buttons bei Server-OFF); SEMI-Kontext (ADR-0010 / ADR-0011) |
| `src/components/finance/preparation/*.tsx`, `finance-prep-helpers.ts`, `FinanceStructuredApiError.tsx`, `finance-preparation-meta.ts` (`FIN_PREP_ERROR_COPY`) | Step-UI (FIN-1/2/3, SoT-Explorer, Audit); `extractStructuredError` über `finNoticeFromUnknown`; konsistente strukturierte Fehler; A11y (`section`/`aria-labelledby`, `aria-live` Step-Status `finance-prep-step-status-{n}`); Meta/DOC_LINKS |
| `src/components/finance/RoleQuickNav.tsx`, `src/lib/role-quick-actions.ts` | Schnellzugriff-Kacheln; optional `aria-keyshortcuts` je Preset (semantisch) |
| `vite.config.ts` | Build/Dev |

## Verträge & Datenbank

- `prisma/schema.prisma`, `prisma/migrations/` — Schema und Migrationen (kein `db push` als Merge-Pfad; siehe README, Abschnitt **Mandanten-Produktivsystem — technische Mindestcheckliste**).
- `docs/api-contract.yaml` — OpenAPI.
- `docs/contracts/` — QA, Delta-Specs, Fehlercodes.

## Tests

- Backend: `vitest` am Root (`npm test`).
- Web: `npm run test -w apps/web`; E2E: `npm run test:e2e` (Playwright); Finanz-Rauchtest-Journey [`e2e/login-finance-smoke.spec.ts`](../../e2e/login-finance-smoke.spec.ts) (inkl. Phase-2 Pilot: Geschäftsprozess-Wizard + LV-Workbench, **Stammdaten-Hub Pilot W1**: `#/stammdaten` + FIN-1 strukturiert; Start-Kachel `home-tile-stammdaten-hub`) + FIN-5-Tail [`e2e/login-finance-smoke-fin5-tail.spec.ts`](../../e2e/login-finance-smoke-fin5-tail.spec.ts) (gemeinsame Konstanten [`e2e/login-finance-smoke-constants.ts`](../../e2e/login-finance-smoke-constants.ts)); `verify:pre-merge` startet zwei Playwright-Läufe (OOM-Schutz). Haupt-Shell read-only FIN-4: [`GET /finance/dunning-reminder-config`](../../docs/api-contract.yaml) (`shell-dunning-config-panel` / `shell-dunning-config-fetch`); zusätzlich die weiteren FIN-4-Lesepfade oben inkl. Kandidaten-GET (`shell-fin4-extra-readonly-panel`) in [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx).

## Optionale Spuren (eigene PRs)

- **Phase 2 LV (§9):** [`docs/tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](../tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md) — nicht mit Finanz-Welle 3 mischen.
- **Weitere Haupt-Shell-Lesepfade (`GET`):** nur nach stabiler Route in [`docs/api-contract.yaml`](../api-contract.yaml) und Erweiterung [`apps/web/src/lib/api-client.ts`](../../apps/web/src/lib/api-client.ts); Umsetzung in [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) strikt getrennt von Buchungs-/Batch-Schreibpfaden.

## Wartung dieser Datei

Bei neuem vertikalen Slice (neue Route + Service + Persistenz): eine Zeile unter der passenden Sektion ergänzen und ggf. ADR verlinken. Keine Zeilenweise Code-Dokumentation — nur Orientierung.
