# Code map — ERP Repository

Kurzüberblick für Navigation in `src/` (Fastify-Backend) und `apps/web` (PWA). Detaillierte Fachlogik: [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) (**3.0 konsolidiert**, Teil I §1–§18, Teil V PWA-Roadmap). **PWA MVP und Ist-Stand:** [`docs/PWA-Entwicklungsreferenz.md`](../PWA-Entwicklungsreferenz.md). Architekturentscheidungen: [**ADR-Index**](../adr/README.md) und [`docs/adr/`](../adr/).

## Schnelle Orientierung (Spine vs. Detail)

- **Technischer Schnelleinstieg (empfohlen zuerst):** [`overview-spine.md`](./overview-spine.md)
- **Persistenz Memory/Postgres und SoT:** [`persistence-and-repository-mode.md`](./persistence-and-repository-mode.md)
- **Domänen-Stränge auf einer Seite:** [`domain-strands.md`](./domain-strands.md)
- **Tickets, FIN, Compliance, Cursor (lange Tabellen):** [`overview-deep-links.md`](./overview-deep-links.md)
- **Gestufte Lesepfade (Onboarding):** [`../plans/developer-onboarding-ladder.md`](../plans/developer-onboarding-ladder.md)

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
| `src/main.tsx`, `src/App.tsx`, `src/components/shell/InvoiceShellReadonlyPanel.tsx`, `src/components/HomeDashboard.tsx` | Einstieg, Routing: **`#/`** Start (Home + Schnellzugriff), **`#/dokument`** Dokument-/Diagnose-Shell; Shell **read-only** bei `entityType=INVOICE`: `GET /invoices/{id}` („Detail“ / GET), `GET …/payment-intakes`, `GET …/dunning-reminders` (Listen; Roh-JSON nur Experte; `ApiClient`), `GET /finance/payment-terms?projectId=…` (aus Invoice), `GET /documents/{id}/allowed-actions?entityType=INVOICE` (Diagnose; `ApiClient`), bei gesetzter **`invoice.offerVersionId`** zusätzlich **`GET /documents/{offerVersionId}/allowed-actions?entityType=OFFER_VERSION`** (`shell-invoice-offer-version-allowed-actions-fetch`/`-json`); Trace-Zeilen `shell-invoice-trace-lv`, `shell-invoice-trace-measurement`, `shell-invoice-trace-offer-version`; **`GET /finance/e-invoice-parties/tenant`**, **`GET …/customers`**, **`GET …/customers/{customerId}`** (Buyer aus `invoice.customerId`; `shell-invoice-e-invoice-*-fetch`/`-json`), **`GET /finance/invoice-tax-profile`**, **`GET …/projects/{projectId}`** (`shell-invoice-invoice-tax-*-fetch`/`-json`), **`GET /lv/versions/{lvVersionId}`** aus `invoice.lvVersionId` (`shell-invoice-lv-version-fetch`/`-json`), **`GET /audit-events`** (Seite 1; `shell-invoice-audit-events-fetch`/`-json`); global FIN-4 Lesepfade ohne Dokument-Kontext: `GET /finance/dunning-reminder-config`, `GET /finance/dunning-reminder-templates`, `GET /finance/dunning-email-footer`, `GET /finance/dunning-reminder-automation`, `GET /finance/dunning-reminder-candidates` (`shell-dunning-candidates-fetch`/`-json`; `shell-dunning-config-panel`, `shell-fin4-extra-readonly-panel`); **`GET /tenant/pwa-display-settings`** (`shell-tenant-pwa-display-panel`); **`GET /lv/versions/{lvVersionId}`** für Entity **LV_VERSION** (Phase 2 LV Lesepfad §9) sowie **`GET …/structure`** (`shell-lv-structure-fetch`/`-json`, `ApiClient.getLvVersionStructure`); stabile E2E-`data-testid`: `shell-document-panel`, `shell-document-entity-type`, `shell-document-id`, `shell-document-detail-get`, `offer-shell-detail`, `lv-shell-detail`, `invoice-shell-detail`, `shell-invoice-readonly-subreads`, `shell-invoice-payment-intakes-json`, `shell-invoice-dunning-reminders-json`, `shell-invoice-payment-terms-json`, `shell-invoice-allowed-actions-json`, `shell-invoice-offer-version-allowed-actions-json`, `supplement-shell-detail` |
| `src/components/DocumentTextPanels.tsx` | Aufmass-Shell nach `MEASUREMENT_VERSION`-GET; `data-testid="measurement-shell-detail"` |
| `src/lib/api-client.ts`, `api-error.ts` | API-Aufrufe und Fehler; Shell-`allowedActions` vs. dedizierte Finanz-SoT: [`docs/contracts/ui-action-executor-coverage.md`](../contracts/ui-action-executor-coverage.md) |
| `src/lib/tenant-session.ts`, `token-payload.ts` | Mandanten-Session |
| `src/lib/action-executor.ts`, `role-quick-actions.ts`, `v13-domain-role-mapping.ts` | Aktionen / Rollen |
| `src/components/*.tsx` | UI (Shell, Login, Dokument-Texte, …) |
| `src/lib/erp-doc-section-hashes.ts` | GitHub-Anker für ERP-Doku (z. B. §18.1); kombiniert mit `repoDocHref` in Stammdaten- und Hilfe-Hub |
| `src/lib/hash-route.ts`, `normalizeFinancePrepHashToCanon` in `App.tsx` | Finanz-Hash-Routing: Tab „Grundeinstellungen“ kanonisch `#/finanz-grundeinstellungen`; andere Tabs `#/finanz-vorbereitung?tab=…`; `?tab=grundeinstellungen` per `replaceState` vereinheitlicht; `FINANCE_PREP_*` Konstanten; Phase-2 Pilot: `GESCHAEFSPROZESS_HASH` (`#/geschaeftsprozess`), `LV_BEARBEITEN_HASH` (`#/lv-bearbeiten`); Domänen-Hubs: `STAMMDATEN_HASH`, `LV_AUFMASS_HUB_HASH`, `ANGEBOTE_NACHTRAEGE_HUB_HASH`, `EINSTELLUNGEN_HASH`, `HILFE_HASH`; weitere Pilot-Routen: `MEASUREMENT_PILOT_LIST_HASH`, `OFFER_WORKSPACE_HASH`, `FINANCE_WORKLIST_HASH`, `ADMIN_USERS_HASH` |
| `src/components/AppPrimaryNav.tsx`, `src/lib/pwa-primary-nav-visibility.ts`, `src/components/hubs/*HubPage.tsx`, `src/components/product-ui/ProductEmptyState.tsx` | Aufgabenorientierte Hauptnavigation (`primary-nav-*`) und Hub-Screens (`hub-*`); **`#/stammdaten`**: XRechnung Buyer-Liste/Detail (`?customerId=`), Mandanten-Verkäufer, FIN-1-Konditionen strukturiert, **CRM-Stamm** (vollständiger `ApiClient`-CRUD inkl. Opt-Lock; OpenAPI `info.version` siehe `openapi-contract-version.ts`), Projekt→`#/dokument?entityType=PROJECT` — [`hash-route.ts`](../../apps/web/src/lib/hash-route.ts) (`stammdatenHashWithCustomerId`, …); Einstellungen-Link nur für Session + Rolle ADMIN/GF/BUCHHALTUNG (Anzeige) |
| `src/components/geschaeftsprozess/GeschaeftsprozessWizard.tsx` | Geführter Pilotpfad LV → Aufmass (`MEASUREMENT_CREATE` über PROJECT-SoT) → Angebot → Rechnungsentwurf (`ApiClient.createOffer`, `createInvoiceDraft`; ADR-0018); Integrations-Copy und Roh-JSON der Projekt-`allowedActions` nur bei Expertenmodus (`showIntegrationHints` aus `App.tsx`) |
| `src/components/measurements/MeasurementPilotListPage.tsx`, `src/components/offers/OfferSupplementWorkspacePage.tsx`, `src/components/finance/FinanceOperationalWorklistPage.tsx`, `src/components/admin/AdminUsersPage.tsx` | Pilot: Messungsliste/Detail (`#/aufmass-messungen`), Angebots-/Nachtrags-Arbeitsfläche (`#/angebote-arbeitsflaeche`) mit **`GET /projects/{projectId}/offers`** / **`…/supplements`** und Deep-Link `?offerVersionId=` / `supplementVersionId=`, Mahn-Kandidaten (`#/finanz-arbeitsliste`), Nutzer-Admin (`#/admin/users`) |
| `src/components/lv-workbench/LvWorkbench.tsx`, `LvBearbeitenPage.tsx`, `LvVersionSotPanel.tsx`, `LvEntityTextSotPanel.tsx` | LV Abschnitt 9 Lesepfad (`GET /lv/versions/{id}`); SoT: Experten-`LvVersionSotPanel` + Pilot-`LvEntityTextSotPanel` (Text/Knotenposition); Sprung zu **Dokument und Details** (`#/dokument`) für `LV_VERSION`-Aktionen über `executeActionWithSotGuard` |
| `src/components/FinancePreparation.tsx`, `src/components/finance/FinancePreparation*Panel.tsx`, `finance/preparation/FinancePrepStepInvoice.tsx` (inkl. Konditions-Differenz \`POST …/difference-bookings/from-payment-terms\` bei gebuchter Rechnung) | Finanz-Vorbereitung: Tabs inkl. Grundeinstellungen Mahnlauf; OFF/SEMI; OFF-1a (Batch-Buttons bei Server-OFF); SEMI-Kontext (ADR-0010 / ADR-0011); Roh-JSON nur `showIntegrationHints` (Mandanten-Experte/Vite-Dev) |
| `src/components/finance/preparation/*.tsx`, `finance-prep-helpers.ts`, `FinanceStructuredApiError.tsx`, `finance-preparation-meta.ts` (`FIN_PREP_ERROR_COPY`) | Step-UI (FIN-1/2/3, SoT-Explorer, Audit); `extractStructuredError` über `finNoticeFromUnknown`; konsistente strukturierte Fehler; A11y (`section`/`aria-labelledby`, `aria-live` Step-Status `finance-prep-step-status-{n}`); Meta/DOC_LINKS |
| `src/components/finance/RoleQuickNav.tsx`, `src/lib/role-quick-actions.ts` | Schnellzugriff-Kacheln; optional `aria-keyshortcuts` je Preset (semantisch) |
| `vite.config.ts` | Build/Dev |

## Verträge & Datenbank

- `prisma/schema.prisma`, `prisma/migrations/` — Schema und Migrationen (kein `db push` als Merge-Pfad; siehe README, Abschnitt **Mandanten-Produktivsystem — technische Mindestcheckliste**).
- `docs/api-contract.yaml` — OpenAPI.
- `docs/contracts/` — QA, Delta-Specs, Fehlercodes.

## Tests

- Backend: `vitest` am Root (`npm test`).
- Web: `npm run test -w apps/web`; E2E: `npm run test:e2e` (Playwright); Finanz-Rauchtest-Journey [`e2e/login-finance-smoke.spec.ts`](../../e2e/login-finance-smoke.spec.ts) (inkl. Phase-2 Pilot: Geschäftsprozess-Wizard + LV-Workbench, **Differenzbuchungen (W2):** `GET /projects/{projectId}/difference-bookings`, `GET /invoices/{invoiceId}/difference-bookings` (Bezugsrechnung), `POST …/difference-bookings/allocate|deallocate`, `POST /projects/{projectId}/difference-bookings/from-payment-terms` (Slice 2b Konditions-Differenz), `billingKind` + `schlussrechnungMitigation` (Slice 2b Schlussrechnung), `schlussrechnungFollowUpDraft` (Slice 2c ADR-0024 Auto-Folge-ENTWURF), Feld `allocatedDifferenceBookings` auf `GET /invoices/{id}` (ADR-0022), `DifferenceBookingService` / `difference_bookings` (ADR-0020; PWA: [`PaymentTermsDifferenceBookingPanel`](../../apps/web/src/components/finance/PaymentTermsDifferenceBookingPanel.tsx), [`InvoiceDraftDifferenceAllocatePanel`](../../apps/web/src/components/finance/InvoiceDraftDifferenceAllocatePanel.tsx) — Finanz-Vorbereitung Schritt 3, Rechnungs-Shell INVOICE, `#/lv-aufmass`-Hub; Projekt-Lesepfad im Hub weiter `DifferenceBookingReadTable`). **Stammdaten-Hub Pilot W1**: `#/stammdaten` + FIN-1 strukturiert; Start-Kachel `home-tile-stammdaten-hub`) + FIN-5-Tail [`e2e/login-finance-smoke-fin5-tail.spec.ts`](../../e2e/login-finance-smoke-fin5-tail.spec.ts) (gemeinsame Konstanten [`e2e/login-finance-smoke-constants.ts`](../../e2e/login-finance-smoke-constants.ts)); `verify:pre-merge` startet zwei Playwright-Läufe (OOM-Schutz). Haupt-Shell read-only FIN-4: [`GET /finance/dunning-reminder-config`](../../docs/api-contract.yaml) (`shell-dunning-config-panel` / `shell-dunning-config-fetch`); zusätzlich die weiteren FIN-4-Lesepfade oben inkl. Kandidaten-GET (`shell-fin4-extra-readonly-panel`) in [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx).

## Optionale Spuren (eigene PRs)

- **Phase 2 LV (§9):** [`docs/tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](../tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md) — nicht mit Finanz-Welle 3 mischen.
- **Weitere Haupt-Shell-Lesepfade (`GET`):** nur nach stabiler Route in [`docs/api-contract.yaml`](../api-contract.yaml) und Erweiterung [`apps/web/src/lib/api-client.ts`](../../apps/web/src/lib/api-client.ts); Umsetzung in [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) strikt getrennt von Buchungs-/Batch-Schreibpfaden.

## Wartung dieser Datei

Bei neuem vertikalen Slice (neue Route + Service + Persistenz): eine Zeile unter der passenden Sektion ergänzen und ggf. ADR verlinken. Lange **Ticket-/FIN-/Compliance**-Zeilen **ausschließlich** in [`overview-deep-links.md`](./overview-deep-links.md) pflegen (dort steht die Drift-Regel im Kopf) — nicht zusätzlich in dieser Datei spiegeln. Keine zeilenweise Code-Dokumentation — nur Orientierung.
