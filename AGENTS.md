# AGENTS — KI- und Agenten-Einstieg (ERP)

Kurzbriefing für automatisierte oder assistierte Arbeit am Repository. **Projektregeln (immer) und cursor-stack:** [`.cursor/rules/cursor-stack.mdc`](./.cursor/rules/cursor-stack.mdc) — Domäne, Liefer-/Review-Format, Web-UI, Plan-Modus, Ship-Overrides; Slash-Workflows unter `.cursor/skills/` (`/plan-ceo`, `/plan-eng`, `/ship`, …). Ausführlicher Betrieb und Links: [`README.md`](./README.md).

## 1. Lesereihenfolge (Kontext schichten)

1. **Diese Datei** — Wo liegt was, welche Befehle, welche Artefakte zuerst.
2. **[`docs/CODEMAPS/overview.md`](./docs/CODEMAPS/overview.md)** — Modul-Landkarte (`src/` vs. `apps/web/`), ohne Fachbuch.
3. **Fachliche Quelle** — [`docs/ERP-Systembeschreibung.md`](./docs/ERP-Systembeschreibung.md): nur die für die Aufgabe nötigen Teile (z. B. referenzierte §), nicht zwangsläufig das ganze Dokument.
4. **Technische Verträge** — [`docs/api-contract.yaml`](./docs/api-contract.yaml), [`docs/contracts/`](./docs/contracts/) (inkl. `error-codes.json`), relevante [`docs/adr/`](./docs/adr/).
5. **PWA / UI-UX** (bei Arbeit unter `apps/web/`) — Link-Hub [`docs/referenz-ui-ux.md`](./docs/referenz-ui-ux.md); [`docs/ui-ux-style-guide.md`](./docs/ui-ux-style-guide.md), [`docs/web-theming.md`](./docs/web-theming.md); Web-UI-Abschnitt in [`.cursor/rules/cursor-stack.mdc`](./.cursor/rules/cursor-stack.mdc).
6. **Compliance / Produktiv-Go (extern, nicht Repo-Pflicht)** — Für laufende Entwicklung und Merge gibt es **keine** im Repository verankerten **verpflichtenden menschengestützten** Freigaben (Steuerberatung, Datenschutzrollen, formelles Release-GO). Compliance-Artefakte werden **nach bestem Wissen und eigener Recherche** optional mitgeführt; [`Checklisten/README.md`](./Checklisten/README.md), Stub unter [`compliance-rechnung-finanz.md`](./Checklisten/compliance-rechnung-finanz.md) sowie Archiv unter [`docs/_archiv/checklisten-compliance-human-workflow/`](./docs/_archiv/checklisten-compliance-human-workflow/) sind **Hintergrund**, keine Pflichtpipeline. **`npm run validate:compliance-artifacts`** / **`validate:compliance-signoffs`** in `verify:ci` prüfen nur **Datei-/Schema-Konsistenz**. Operative oder rechtliche Bewertung vor Mandantenbetrieb liegt **außerhalb** dieser Dokumentation. Runbook M4 5c *(historischer Pfad)*: [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](./docs/runbooks/m4-slice-5c-pl-mandanten-go.md).
7. **Arbeitsweise (Code/Doku)** — [`docs/plans/workflow-code-first-ohne-qualitaetsverlust.md`](./docs/plans/workflow-code-first-ohne-qualitaetsverlust.md) (Kurzverweis auch unter [„Arbeitsweise“ in `docs/plans/nächste-schritte.md`](./docs/plans/nächste-schritte.md)).

Tickets und Gates (z. B. FIN-2, QA §5a) stehen in `docs/tickets/` und `docs/contracts/`; bei merge-kritischen Themen README und PR-Vorlage beachten. **QA/Review vor Merge:** Querschnitt in [`docs/runbook/ci-and-persistence-tests.md`](./docs/runbook/ci-and-persistence-tests.md) (Abschnitt „QA und Review vor Merge auf `main`“).

**P1-4 (B5 / Audit-Code):** Tickets [`B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](./docs/tickets/B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md) und [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) dokumentieren **Risiken und empfohlene** Vorgehensweise — sie sind **kein** Merge-Blocker durch wartende menschliche Freigabe; operative Bewertung bei Produktivbetrieb ist **nicht** Bestandteil des Repo-Prozesses.

**Agent nach finanz-relevantem Merge auf `main`:** Nächste freie Zeile in [`docs/tickets/P1-3-DOCS-MILESTONE-WAVE3.md`](./docs/tickets/P1-3-DOCS-MILESTONE-WAVE3.md) ausfüllen (Merge-Datum UTC, PR-URL) — siehe Abschnitt **„Pflege (Agent)“** dort. **Review-Protokoll** (Tabelle in [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md)): **keine erfundenen URLs** durch den Agenten — echte Links nur von Menschen mit Zugriff auf das externe Protokoll. Koordinations-Tabelle in [`docs/tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./docs/tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) *(Dateiname historisch)*: der Agent **pflegt manuelle Fremd-Protokoll-Zellen nicht** und **erfindet** keine URLs. **Verbindlich** für den Agenten: `verify:ci` (und bei Bedarf `verify:ci:local-db`), grüne Merge-Checks wie dokumentiert, P1-3 bei qualifiziertem Merge, übrige Ticket-/Codemap-Pflege ohne fingierte Nachweise.

## 2. Repo-Layout (Kurz)

| Pfad | Inhalt |
|------|--------|
| `src/` | Fastify-Backend: API, Domäne, Services, Persistenz, Auth |
| `apps/web/` | Vite-PWA (`npm run dev -w apps/web`) |
| `prisma/` | Schema und versionierte Migrationen |
| `generated/` | Prisma-Client-Ausgabe (`generator client` → `generated/prisma`); in `.gitignore` — **nicht** committen; nach `npm install` (`postinstall`: `prisma generate`) bzw. `npm run prisma:generate` lokal vorhanden |
| `docs/` | Systembeschreibung, ADRs, OpenAPI, Verträge, Runbooks, **CODEMAPS** |
| `Checklisten/` | Optionale Compliance-Stubs und CI-Artefakte; ausführlicher historischer Inhalt unter `docs/_archiv/checklisten-compliance-human-workflow/` |
| `.github/` | CI (`backend`-Job), PR-Vorlage, Workflows |
| `.cursor/rules/` | Projektregel [cursor-stack.mdc](./.cursor/rules/cursor-stack.mdc) (committen). **`/.cursor/settings.json`** ist in **`.gitignore`** — nur lokale Editor-/Plugin-Overrides, keine Team-Norm. |
| `.cursor/skills/` | cursor-stack Slash-Workflows (`plan-ceo`, `ship`, …); committen für Team-Konsistenz. |

## 3. Häufige Befehle

| Zweck | Befehl |
|-------|--------|
| CI-ähnliche Vorprüfung | `npm run verify:ci` |
| **Vor Merge auf `main` (lokal, inkl. Finanz-E2E wie `e2e-smoke`)** | `npm run verify:pre-merge` (= `verify:ci` + Playwright [`e2e/login-finance-smoke.spec.ts`](./e2e/login-finance-smoke.spec.ts)) |
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
| **`.cursor/rules/cursor-stack.mdc`** | Immer geladen: Domänen-Invarianten, Liefer-/Merge-/Review-Format, Web-UI, Plan-Modus, cursor-stack Ship-Overrides; Skills unter `.cursor/skills/`. |
| **`AGENTS.md`** | Session-Bootstrap: Schichtung, Befehle, Link zur Codemap — bewusst kurz, um Tokens zu sparen. |
| **`docs/CODEMAPS/overview.md`** | Strukturorientierung im Code; wird bei neuen vertikalen Slices oder größeren Verschiebungen aktualisiert. |
| **`docs/ERP-Systembeschreibung.md`** | Fachliche Wahrheit; bei Konflikt gewinnt Fachlogik gegen Implementierungsbequemlichkeit. |
| **[Checklisten/README.md](./Checklisten/README.md)** | Kurze Orientierung zu Compliance-Stubs, CI-Checks und Archiv — **keine** verpflichtende menschliche Freigabe-Pipeline im Repo. |

**PWA-UI:** Abschnitt „PWA / apps/web“ in [`.cursor/rules/cursor-stack.mdc`](./.cursor/rules/cursor-stack.mdc).

## 6. Ausgabeformat

Vollständiges Schema, Ausnahmen für mechanische Änderungen und Review-Erwartungen: [`.cursor/rules/cursor-stack.mdc`](./.cursor/rules/cursor-stack.mdc) (Abschnitte „Delivery paths“ und „Review rules“).
