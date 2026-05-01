# AGENTS — KI- und Agenten-Einstieg (ERP)

Kurzbriefing für automatisierte oder assistierte Arbeit am Repository. **Kernregeln (immer):** [`.cursor/rules/erp-multi-agent.mdc`](./.cursor/rules/erp-multi-agent.mdc). **Liefer-, Merge-, Review- und Ausgabeformat** bei Arbeit unter `src/`, `apps/web/`, `prisma/`, `README.md`, `Checklisten/`, `docs/contracts/`, `docs/api-contract.yaml`, `docs/adr/`, `docs/tickets/`, `docs/CODEMAPS/`: [`.cursor/rules/erp-delivery-review.mdc`](./.cursor/rules/erp-delivery-review.mdc). Ausführlicher Betrieb und Links: [`README.md`](./README.md). **Cursor Plan-Modus / TodoWrite vs. CreatePlan:** in der Multi-Agent-Regel festgelegt.

## 1. Lesereihenfolge (Kontext schichten)

1. **Diese Datei** — Wo liegt was, welche Befehle, welche Artefakte zuerst.
2. **[`docs/CODEMAPS/overview.md`](./docs/CODEMAPS/overview.md)** — Modul-Landkarte (`src/` vs. `apps/web/`), ohne Fachbuch.
3. **Fachliche Quelle** — [`docs/ERP-Systembeschreibung.md`](./docs/ERP-Systembeschreibung.md): nur die für die Aufgabe nötigen Teile (z. B. referenzierte §), nicht zwangsläufig das ganze Dokument.
4. **Technische Verträge** — [`docs/api-contract.yaml`](./docs/api-contract.yaml), [`docs/contracts/`](./docs/contracts/) (inkl. `error-codes.json`), relevante [`docs/adr/`](./docs/adr/).
5. **PWA / UI-UX** (bei Arbeit unter `apps/web/`) — Link-Hub [`docs/referenz-ui-ux.md`](./docs/referenz-ui-ux.md); [`docs/ui-ux-style-guide.md`](./docs/ui-ux-style-guide.md), [`docs/web-theming.md`](./docs/web-theming.md); Cursor-Rule **erp-web-ui** (`apps/web/**`).
6. **Produktiv-Go Finanz (fachlich, nicht nur CI)** — [`Checklisten/compliance-rechnung-finanz.md`](./Checklisten/compliance-rechnung-finanz.md) vor Mandanten-Go mit StB/DSB/PL abarbeiten.
7. **Arbeitsweise (Code/Doku, ohne Gate-Relax)** — [`docs/plans/workflow-code-first-ohne-qualitaetsverlust.md`](./docs/plans/workflow-code-first-ohne-qualitaetsverlust.md) (Kurzverweis auch unter [„Arbeitsweise“ in `docs/plans/nächste-schritte.md`](./docs/plans/nächste-schritte.md)).

Tickets und Gates (z. B. FIN-2, QA §5a) stehen in `docs/tickets/` und `docs/contracts/`; bei merge-kritischen Themen README und PR-Vorlage beachten. **QA/Review vor Merge:** Querschnitt in [`docs/runbook/ci-and-persistence-tests.md`](./docs/runbook/ci-and-persistence-tests.md) (Abschnitt „QA und Review vor Merge auf `main`“).

**P1-4 (B5 / Audit-Code):** Kein Implementierungs-PR für formelles Mahn-PDF (**B5**) oder Audit-**Verhaltens**-Änderungen (z. B. Option A) ohne dokumentierte Gates — [`docs/tickets/B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](./docs/tickets/B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md) (*Implementierungs-Gate*) und [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) (*PL-Eintrag* / *PL-Protokoll*).

**Agent nach finanz-relevantem Merge auf `main`:** Nächste freie Zeile in [`docs/tickets/P1-3-DOCS-MILESTONE-WAVE3.md`](./docs/tickets/P1-3-DOCS-MILESTONE-WAVE3.md) ausfüllen (Merge-Datum UTC, PR-URL) — siehe Abschnitt **„Pflege (Agent)“** dort. **PL-Sitzungsprotokoll** (Tabelle unter „PL-Protokoll“) in [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md): weiterhin **nur Projektleitung**, keine erfundenen Links durch den Agenten. **PL-Inbound** (Tabelle in [`docs/tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./docs/tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md)): **Team-Entscheid 2026-04-27** — **nur** was **ausschließlich in PL-Runden manuell** gehört, bleibt dort **ohne** Agent-Eintrag; der Agent **pflegt diese Markdown-Zellen nicht** und **erfindet** keine URLs. **Unverändert verbindlich** für den Agenten: `verify:ci` (und bei Bedarf `verify:ci:local-db`), grüne Merge-Checks wie dokumentiert, P1-3 bei qualifiziertem Merge, übrige Ticket-/Codemap-Pflege, die **ohne** PL-Protokoll-Fiktion möglich ist.

## 2. Repo-Layout (Kurz)

| Pfad | Inhalt |
|------|--------|
| `src/` | Fastify-Backend: API, Domäne, Services, Persistenz, Auth |
| `apps/web/` | Vite-PWA (`npm run dev -w apps/web`) |
| `prisma/` | Schema und versionierte Migrationen |
| `generated/` | Prisma-Client-Ausgabe (`generator client` → `generated/prisma`); in `.gitignore` — **nicht** committen; nach `npm install` (`postinstall`: `prisma generate`) bzw. `npm run prisma:generate` lokal vorhanden |
| `docs/` | Systembeschreibung, ADRs, OpenAPI, Verträge, Runbooks, **CODEMAPS** |
| `Checklisten/` | Abnahme-Checklisten (Compliance/Produktiv-Go), **ohne** Ersatz für StB/DSB |
| `.github/` | CI (`backend`-Job), PR-Vorlage, Workflows |
| `.cursor/rules/` | Cursor-Projektregeln (committen). **`/.cursor/settings.json`** ist in **`.gitignore`** — nur lokale Editor-/Plugin-Overrides, keine Team-Norm. |

## 3. Häufige Befehle

| Zweck | Befehl |
|-------|--------|
| CI-ähnliche Vorprüfung | `npm run verify:ci` |
| **Vor Merge auf `main` (lokal)** | `npm run verify:ci` (entspricht Erwartung GitHub-Job `backend`); bei Touch von `docs/api-contract.yaml` / `info.version` zusätzlich [`FIN4-external-client-integration.md`](./docs/contracts/FIN4-external-client-integration.md) und P1-3-Notiz in [`P1-3-DOCS-MILESTONE-WAVE3.md`](./docs/tickets/P1-3-DOCS-MILESTONE-WAVE3.md) prüfen |
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
| **[Checklisten/compliance-rechnung-finanz.md](./Checklisten/compliance-rechnung-finanz.md)** | Mandanten-Go Rechnung/Mahn/Massen-E-Mail: mit **StB / DSB / PL** vor Live-Schaltung abarbeiten (ergänzend zu README „Produktiv-Go“ und grünem CI). |

**PWA-UI:** Zusätzliche Cursor-Regel [`.cursor/rules/erp-web-ui.mdc`](./.cursor/rules/erp-web-ui.mdc) mit `globs: apps/web/**` — Style-Guide und Theming für Web-Änderungen.

## 6. Ausgabeformat

Vollständiges Schema, Ausnahmen für mechanische Änderungen und Review-Erwartungen: [`.cursor/rules/erp-delivery-review.mdc`](./.cursor/rules/erp-delivery-review.mdc) (wenn deine Änderungen die dortigen `globs` treffen; sonst Kurzform laut [`.cursor/rules/erp-multi-agent.mdc`](./.cursor/rules/erp-multi-agent.mdc)).
