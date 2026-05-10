# AGENTS — KI- und Agenten-Einstieg (ERP)

Kurzbriefing für automatisierte oder assistierte Arbeit am Repository. **Kernregeln (immer):** [`.cursor/rules/erp-multi-agent.mdc`](./.cursor/rules/erp-multi-agent.mdc). **Liefer-, Merge-, Review- und Ausgabeformat** bei Arbeit unter `src/`, `apps/web/`, `prisma/`, `README.md`, `Checklisten/`, `docs/contracts/`, `docs/api-contract.yaml`, `docs/adr/`, `docs/tickets/`, `docs/CODEMAPS/`: [`.cursor/rules/erp-delivery-review.mdc`](./.cursor/rules/erp-delivery-review.mdc). Ausführlicher Betrieb und Links: [`README.md`](./README.md). **Cursor Plan-Modus / TodoWrite vs. CreatePlan:** in der Multi-Agent-Regel festgelegt.

**Pick your path:** [**Developer-Ladder**](docs/plans/developer-onboarding-ladder.md) (15 min / 1–2 h / Merge) → [**Codemap-Spine**](docs/CODEMAPS/overview-spine.md) → bei Domänenlogik: [`docs/ERP-Systembeschreibung.md`](docs/ERP-Systembeschreibung.md). Längere Agenten-Pflichten (Cursor-Gate, Tickets, P1-3/P1-4): [`docs/runbook/agent-session-rituals.md`](docs/runbook/agent-session-rituals.md).

## 1. Lesereihenfolge (Kontext schichten)

1. **Diese Datei** — Wo liegt was, welche Befehle, welche Artefakte zuerst.
2. **[`docs/CODEMAPS/overview-spine.md`](./docs/CODEMAPS/overview-spine.md)** — schlanker technischer Einstieg; danach bei Bedarf **[`docs/CODEMAPS/overview.md`](./docs/CODEMAPS/overview.md)** (volle API-/PWA-Tabelle). Persistenz: [`docs/CODEMAPS/persistence-and-repository-mode.md`](./docs/CODEMAPS/persistence-and-repository-mode.md).
3. **Fachliche Quelle** — [`docs/ERP-Systembeschreibung.md`](./docs/ERP-Systembeschreibung.md): nur die für die Aufgabe nötigen Teile (z. B. referenzierte §), nicht zwangsläufig das ganze Dokument.
4. **Technische Verträge** — [`docs/api-contract.yaml`](./docs/api-contract.yaml), [`docs/contracts/`](./docs/contracts/) (inkl. `error-codes.json`), [`docs/adr/README.md`](./docs/adr/README.md) / [`docs/adr/`](./docs/adr/).
5. **PWA / UI-UX** (bei Arbeit unter `apps/web/`) — MVP-Zielbild und Ist-Matrix: [`docs/PWA-Entwicklungsreferenz.md`](./docs/PWA-Entwicklungsreferenz.md); Link-Hub [`docs/referenz-ui-ux.md`](./docs/referenz-ui-ux.md); [`docs/ui-ux-style-guide.md`](./docs/ui-ux-style-guide.md), [`docs/web-theming.md`](./docs/web-theming.md); Cursor-Rule **erp-web-ui** (`apps/web/**`).
6. **Compliance / Produktiv-Go (Empfehlungen)** — Für **Merge und laufende Entwicklung** gelten die **CI-/Review-Erwartungen** des Repos; es gibt **keine** im Repo definierte **menschengestützte Pflichtfreigabe** als Merge-Voraussetzung. Für **Mandanten-Produktivität** empfohlen: [`Checklisten/README.md`](./Checklisten/README.md), [`Checklisten/compliance-rechnung-finanz.md`](./Checklisten/compliance-rechnung-finanz.md), Hybrid-Ledger/[`compliance-freigabe-runbook.md`](./Checklisten/compliance-freigabe-runbook.md) **inhaltlich durcharbeiten** und im Paket dokumentieren; **`npm run validate:compliance-artifacts`** / **`validate:compliance-signoffs`** in `verify:ci` prüfen nur **Datei-/Schema-Konsistenz**. Mahn-Massen-E-Mail (M4 5c): [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](./docs/runbooks/m4-slice-5c-pl-mandanten-go.md) *(historischer Pfad)*. Übersicht: [`README.md`](./README.md) („Compliance, Finanz-Go-Live und Merge-Disziplin (Empfehlungen)“).
7. **Arbeitsweise (Code/Doku)** — [`docs/plans/workflow-code-first-ohne-qualitaetsverlust.md`](./docs/plans/workflow-code-first-ohne-qualitaetsverlust.md) (Kurzverweis auch unter [„Arbeitsweise“ in `docs/plans/nächste-schritte.md`](./docs/plans/nächste-schritte.md)).

## 2. Repo-Layout (Kurz)

| Pfad | Inhalt |
|------|--------|
| `src/` | Fastify-Backend: API, Domäne, Services, Persistenz, Auth |
| `apps/web/` | Vite-PWA (`npm run dev -w apps/web`) |
| `prisma/` | Schema und versionierte Migrationen |
| `generated/` | Prisma-Client-Ausgabe (`generator client` → `generated/prisma`); in `.gitignore` — **nicht** committen; nach `npm install` (`postinstall`: `prisma generate`) bzw. `npm run prisma:generate` lokal vorhanden |
| `docs/` | Systembeschreibung, ADRs, OpenAPI, Verträge, Runbooks, **CODEMAPS** |
| `Checklisten/` | Compliance-/Produktiv-Go-Vorbereitung (inhaltlich vor Mandanten-Produktivität empfohlen; Vorlagen im Repo) |
| `.github/` | CI (`backend`-Job), PR-Vorlage, Workflows |
| `.cursor/rules/` | Cursor-Projektregeln (committen). **`/.cursor/settings.json`** ist in **`.gitignore`** — nur lokale Editor-/Plugin-Overrides, keine Team-Norm. |

## 3. Häufige Befehle

| Zweck | Befehl |
|-------|--------|
| CI-ähnliche Vorprüfung | `npm run verify:ci` |
| **Vor Merge auf `main` (lokal, inkl. E2E wie Job `e2e-smoke`)** | `npm run verify:pre-merge` (= `verify:ci` + Playwright [`e2e/login-finance-smoke.spec.ts`](./e2e/login-finance-smoke.spec.ts) und [`e2e/app-shell-smoke.spec.ts`](./e2e/app-shell-smoke.spec.ts); lokal weiter **Memory-API**). CI-Job **`e2e-smoke`**: Postgres-Service + `migrate deploy` + `E2E_USE_POSTGRES=1`; Playwright nur `app-shell-smoke` + `login-finance-smoke` (ohne `login-finance-smoke-fin5-tail` — dort Memory-`page.route`-Mocks). Optional lokal: `npm run test:e2e:postgres` nach `ensure:local-test-db`. `verify:pre-merge` unverändert inkl. **Fin5-Tail** mit Memory-API. |
| **Vor Merge auf `main` (lokal)** | `npm run verify:ci` (entspricht Erwartung GitHub-Job `backend`); bei Touch von `docs/api-contract.yaml` / `info.version`: [`FIN4-external-client-integration.md`](./docs/contracts/FIN4-external-client-integration.md), [`src/domain/openapi-contract-version.ts`](./src/domain/openapi-contract-version.ts) synchron zu `info.version`, P1-3-Notiz in [`P1-3-DOCS-MILESTONE-WAVE3.md`](./docs/tickets/P1-3-DOCS-MILESTONE-WAVE3.md) prüfen |
| Mit DB-Migration wie Deploy-Pfad | `npm run verify:ci:with-migrate` (lokal `DATABASE_URL` setzen) |
| Persistenz-Suite wie CI (lokal) | `npm run verify:ci:local-db` (siehe README) |
| Nur Backend-Tests | `npm test` |
| Web-Unit-Tests | `npm run test -w apps/web` |
| OpenAPI-Validierung | `npm run validate:api-contract-yaml` |

**Editor:** VS Code / Cursor können Workspace-Empfehlungen aus [`.vscode/extensions.json`](./.vscode/extensions.json) installieren (Prisma, YAML, Playwright, Docker, deutsches Sprachpaket). **ESLint / Prettier / Biome:** zugehörige Editor-Extensions erst ergänzen, wenn das Team die passenden npm-DevDependencies und Konfiguration im Repo eingeführt hat — sonst leere oder irreführende Hinweise im Editor.

## 4. Codemap

Die pfadbezogene Orientierung liegt unter **[`docs/CODEMAPS/`](./docs/CODEMAPS/)** — Einstieg [**Spine**](./docs/CODEMAPS/overview-spine.md), Details [**overview.md**](./docs/CODEMAPS/overview.md), FIN/Compliance-Tabellen [**overview-deep-links.md**](./docs/CODEMAPS/overview-deep-links.md). Bei neuen Features die betroffene Sektion um eine Zeile ergänzen (kein Ersatz für ADR oder OpenAPI).

## 5. Umsetzung und Wartung (wie dieses Paket gedacht ist)

| Baustein | Rolle |
|---------|--------|
| **`.cursor/rules/erp-multi-agent.mdc`** | Immer geladen: Domänen-Invarianten, Plan-Modus (TodoWrite + CreatePlan), Verweis auf Lieferregeln und kanonische Systembeschreibung. |
| **`.cursor/rules/erp-delivery-review.mdc`** | Bei relevanten Pfaden: Merge-/Compliance-Erwartungen, Antwortschema, Review-Regeln (siehe Dateikopf `globs`). |
| **`AGENTS.md`** | Session-Bootstrap: Schichtung, Befehle, Link zur Codemap — bewusst kurz, um Tokens zu sparen. |
| **`docs/CODEMAPS/overview-spine.md` / `overview.md` / `overview-deep-links.md`** | Strukturorientierung (Spine → Vollcodemap → Deep-Links); bei neuen vertikalen Slices oder größeren Verschiebungen aktualisieren. |
| **`docs/ERP-Systembeschreibung.md`** | Fachliche Wahrheit; bei Konflikt gewinnt Fachlogik gegen Implementierungsbequemlichkeit. |
| **[Checklisten/README.md](./Checklisten/README.md)** | Compliance-Paket (Begleitblatt, Ledger, Hybrid-Signoffs, Prompts): **Einstieg** empfohlen vor Mandanten-Produktivität; Vorlagen können Rollenfelder enthalten — ergänzend zu README und grünem CI. |

**PWA-UI:** Zusätzliche Cursor-Regel [`.cursor/rules/erp-web-ui.mdc`](./.cursor/rules/erp-web-ui.mdc) mit `globs: apps/web/**` — Style-Guide und Theming für Web-Änderungen.

## 6. Ausgabeformat

Vollständiges Schema, Ausnahmen für mechanische Änderungen und Review-Erwartungen: [`.cursor/rules/erp-delivery-review.mdc`](./.cursor/rules/erp-delivery-review.mdc) (wenn deine Änderungen die dortigen `globs` treffen; sonst Kurzform laut [`.cursor/rules/erp-multi-agent.mdc`](./.cursor/rules/erp-multi-agent.mdc)).
