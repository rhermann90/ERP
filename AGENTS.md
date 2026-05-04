# AGENTS — KI- und Agenten-Einstieg (ERP)

Kurzbriefing für automatisierte oder assistierte Arbeit am Repository. **Kernregeln (immer):** [`.cursor/rules/erp-multi-agent.mdc`](./.cursor/rules/erp-multi-agent.mdc). **Liefer-, Merge-, Review- und Ausgabeformat** bei Arbeit unter `src/`, `apps/web/`, `prisma/`, `README.md`, `Checklisten/`, `docs/contracts/`, `docs/api-contract.yaml`, `docs/adr/`, `docs/tickets/`, `docs/CODEMAPS/`: [`.cursor/rules/erp-delivery-review.mdc`](./.cursor/rules/erp-delivery-review.mdc). Ausführlicher Betrieb und Links: [`README.md`](./README.md). **Cursor Plan-Modus / TodoWrite vs. CreatePlan:** in der Multi-Agent-Regel festgelegt.

## 1. Lesereihenfolge (Kontext schichten)

1. **Diese Datei** — Wo liegt was, welche Befehle, welche Artefakte zuerst.
2. **[`docs/CODEMAPS/overview.md`](./docs/CODEMAPS/overview.md)** — Modul-Landkarte (`src/` vs. `apps/web/`), ohne Fachbuch.
3. **Fachliche Quelle** — [`docs/ERP-Systembeschreibung.md`](./docs/ERP-Systembeschreibung.md): nur die für die Aufgabe nötigen Teile (z. B. referenzierte §), nicht zwangsläufig das ganze Dokument.
4. **Technische Verträge** — [`docs/api-contract.yaml`](./docs/api-contract.yaml), [`docs/contracts/`](./docs/contracts/) (inkl. `error-codes.json`), relevante [`docs/adr/`](./docs/adr/).
5. **PWA / UI-UX** (bei Arbeit unter `apps/web/`) — Link-Hub [`docs/referenz-ui-ux.md`](./docs/referenz-ui-ux.md); [`docs/ui-ux-style-guide.md`](./docs/ui-ux-style-guide.md), [`docs/web-theming.md`](./docs/web-theming.md); Cursor-Rule **erp-web-ui** (`apps/web/**`).
6. **Compliance / Produktiv-Go (zeitlich nachgelagert)** — Bis zur geplanten **echten** Mandanten-Produktivnahme gibt es **keine** verpflichtenden **menschengestützten** Freigaben (StB/DSB/formales Release-GO) für laufende Entwicklung oder Merge. Compliance-Artefakte werden **nach bestem Wissen und eigener Recherche** gepflegt; [`Checklisten/README.md`](./Checklisten/README.md), [`Checklisten/compliance-rechnung-finanz.md`](./Checklisten/compliance-rechnung-finanz.md), Hybrid-Ledger/[`compliance-freigabe-runbook.md`](./Checklisten/compliance-freigabe-runbook.md) dienen der **Vorbereitung** und werden **vor Go-Live** mit echten Fachrollen abgeschlossen. **`npm run validate:compliance-artifacts`** / **`validate:compliance-signoffs`** in `verify:ci` prüfen nur **Datei-/Schema-Konsistenz** (kein Ersatz für Unterschriften). Runbook M4 5c *(historischer Pfad)*: [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](./docs/runbooks/m4-slice-5c-pl-mandanten-go.md).
7. **Arbeitsweise (Code/Doku)** — [`docs/plans/workflow-code-first-ohne-qualitaetsverlust.md`](./docs/plans/workflow-code-first-ohne-qualitaetsverlust.md) (Kurzverweis auch unter [„Arbeitsweise“ in `docs/plans/nächste-schritte.md`](./docs/plans/nächste-schritte.md)).

Tickets und Gates (z. B. FIN-2, QA §5a) stehen in `docs/tickets/` und `docs/contracts/`; bei merge-kritischen Themen README und PR-Vorlage beachten. **QA/Review vor Merge:** Querschnitt in [`docs/runbook/ci-and-persistence-tests.md`](./docs/runbook/ci-and-persistence-tests.md) (Abschnitt „QA und Review vor Merge auf `main`“).

**P1-4 (B5 / Audit-Code):** Tickets [`B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](./docs/tickets/B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md) und [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) dokumentieren **Risiken und empfohlene** Vorgehensweise — sie sind **kein** Merge-Blocker durch „wartende menschliche Freigabe“ in der Entwicklungsphase; vor **mandantenrealem Produktiv-Go** sind Auswirkungen erneut mit Fach/Release zu bewerten.

**Agent nach finanz-relevantem Merge auf `main`:** Nächste freie Zeile in [`docs/tickets/P1-3-DOCS-MILESTONE-WAVE3.md`](./docs/tickets/P1-3-DOCS-MILESTONE-WAVE3.md) ausfüllen (Merge-Datum UTC, PR-URL) — siehe Abschnitt **„Pflege (Agent)“** dort. **Review-Protokoll** (Tabelle in [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md)): **keine erfundenen URLs** durch den Agenten — echte Links nur von Menschen mit Zugriff auf das externe Protokoll. Koordinations-Tabelle in [`docs/tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./docs/tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) *(Dateiname historisch)*: der Agent **pflegt manuelle Fremd-Protokoll-Zellen nicht** und **erfindet** keine URLs. **Verbindlich** für den Agenten: `verify:ci` (und bei Bedarf `verify:ci:local-db`), grüne Merge-Checks wie dokumentiert, P1-3 bei qualifiziertem Merge, übrige Ticket-/Codemap-Pflege ohne fingierte Nachweise.

## 2. Repo-Layout (Kurz)

| Pfad | Inhalt |
|------|--------|
| `src/` | Fastify-Backend: API, Domäne, Services, Persistenz, Auth |
| `apps/web/` | Vite-PWA (`npm run dev -w apps/web`) |
| `prisma/` | Schema und versionierte Migrationen |
| `generated/` | Prisma-Client-Ausgabe (`generator client` → `generated/prisma`); in `.gitignore` — **nicht** committen; nach `npm install` (`postinstall`: `prisma generate`) bzw. `npm run prisma:generate` lokal vorhanden |
| `docs/` | Systembeschreibung, ADRs, OpenAPI, Verträge, Runbooks, **CODEMAPS** |
| `Checklisten/` | Compliance-/Produktiv-Go-Vorbereitung (formale Abnahme vor Live nachziehen); **kein** Ersatz für StB/DSB |
| `.github/` | CI (`backend`-Job), PR-Vorlage, Workflows |
| `.cursor/rules/` | Cursor-Projektregeln (committen). **`/.cursor/settings.json`** ist in **`.gitignore`** — nur lokale Editor-/Plugin-Overrides, keine Team-Norm. |

## 3. Häufige Befehle

| Zweck | Befehl |
|-------|--------|
| CI-ähnliche Vorprüfung | `npm run verify:ci` |
| **Vor Merge auf `main` (lokal, inkl. E2E wie Job `e2e-smoke`)** | `npm run verify:pre-merge` (= `verify:ci` + Playwright [`e2e/login-finance-smoke.spec.ts`](./e2e/login-finance-smoke.spec.ts) und [`e2e/app-shell-smoke.spec.ts`](./e2e/app-shell-smoke.spec.ts)) |
| **Vor Merge auf `main` (lokal)** | `npm run verify:ci` (entspricht Erwartung GitHub-Job `backend`); bei Touch von `docs/api-contract.yaml` / `info.version`: [`FIN4-external-client-integration.md`](./docs/contracts/FIN4-external-client-integration.md), [`src/domain/openapi-contract-version.ts`](./src/domain/openapi-contract-version.ts) synchron zu `info.version`, P1-3-Notiz in [`P1-3-DOCS-MILESTONE-WAVE3.md`](./docs/tickets/P1-3-DOCS-MILESTONE-WAVE3.md) prüfen |
| Mit DB-Migration wie Deploy-Pfad | `npm run verify:ci:with-migrate` (lokal `DATABASE_URL` setzen) |
| Persistenz-Suite wie CI (lokal) | `npm run verify:ci:local-db` (siehe README) |
| Nur Backend-Tests | `npm test` |
| Web-Unit-Tests | `npm run test -w apps/web` |
| OpenAPI-Validierung | `npm run validate:api-contract-yaml` |

**Editor:** VS Code / Cursor können Workspace-Empfehlungen aus [`.vscode/extensions.json`](./.vscode/extensions.json) installieren (Prisma, YAML, Playwright, Docker, deutsches Sprachpaket). **ESLint / Prettier / Biome:** zugehörige Editor-Extensions erst ergänzen, wenn das Team die passenden npm-DevDependencies und Konfiguration im Repo eingeführt hat — sonst leere oder irreführende Hinweise im Editor.

## 4. Codemap

Die pfadbezogene Orientierung liegt zentral unter **[`docs/CODEMAPS/`](./docs/CODEMAPS/)** ([`overview.md`](./docs/CODEMAPS/overview.md)). Bei neuen Features dort die betroffene Sektion um eine Zeile ergänzen (kein Ersatz für ADR oder OpenAPI).

## 5. Umsetzung und Wartung (wie dieses Paket gedacht ist)

| Baustein | Rolle |
|---------|--------|
| **`.cursor/rules/erp-multi-agent.mdc`** | Immer geladen: Domänen-Invarianten, Plan-Modus (TodoWrite + CreatePlan), Verweis auf Lieferregeln und kanonische Systembeschreibung. |
| **`.cursor/rules/erp-delivery-review.mdc`** | Bei relevanten Pfaden: Merge-/Compliance-Erwartungen, Antwortschema, Review-Regeln (siehe Dateikopf `globs`). |
| **`AGENTS.md`** | Session-Bootstrap: Schichtung, Befehle, Link zur Codemap — bewusst kurz, um Tokens zu sparen. |
| **`docs/CODEMAPS/overview.md`** | Strukturorientierung im Code; wird bei neuen vertikalen Slices oder größeren Verschiebungen aktualisiert. |
| **`docs/ERP-Systembeschreibung.md`** | Fachliche Wahrheit; bei Konflikt gewinnt Fachlogik gegen Implementierungsbequemlichkeit. |
| **[Checklisten/README.md](./Checklisten/README.md)** | Compliance-Paket (Begleitblatt, Ledger, Hybrid-Signoffs, Prompts): **Einstieg** vor Mandanten-Go; Begleitblatt mit **StB / DSB / Release-Verantwortliche** — ergänzend zu README „Produktiv-Go“ und grünem CI. |

**PWA-UI:** Zusätzliche Cursor-Regel [`.cursor/rules/erp-web-ui.mdc`](./.cursor/rules/erp-web-ui.mdc) mit `globs: apps/web/**` — Style-Guide und Theming für Web-Änderungen.

## 6. Ausgabeformat

Vollständiges Schema, Ausnahmen für mechanische Änderungen und Review-Erwartungen: [`.cursor/rules/erp-delivery-review.mdc`](./.cursor/rules/erp-delivery-review.mdc) (wenn deine Änderungen die dortigen `globs` treffen; sonst Kurzform laut [`.cursor/rules/erp-multi-agent.mdc`](./.cursor/rules/erp-multi-agent.mdc)).
