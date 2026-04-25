# AGENTS — KI- und Agenten-Einstieg (ERP)

Kurzbriefing für automatisierte oder assistierte Arbeit am Repository. Verbindliche Domänen- und Lieferregeln: [`.cursor/rules/erp-multi-agent.mdc`](./.cursor/rules/erp-multi-agent.mdc). Ausführlicher Betrieb und Links: [`README.md`](./README.md).

## 1. Lesereihenfolge (Kontext schichten)

1. **Diese Datei** — Wo liegt was, welche Befehle, welche Artefakte zuerst.
2. **[`docs/CODEMAPS/overview.md`](./docs/CODEMAPS/overview.md)** — Modul-Landkarte (`src/` vs. `apps/web/`), ohne Fachbuch.
3. **Fachliche Quelle** — [`docs/ERP-Systembeschreibung.md`](./docs/ERP-Systembeschreibung.md): nur die für die Aufgabe nötigen Teile (z. B. referenzierte §), nicht zwangsläufig das ganze Dokument.
4. **Technische Verträge** — [`docs/api-contract.yaml`](./docs/api-contract.yaml), [`docs/contracts/`](./docs/contracts/) (inkl. `error-codes.json`), relevante [`docs/adr/`](./docs/adr/).
5. **Produktiv-Go Finanz (fachlich, nicht nur CI)** — [`Checklisten/compliance-rechnung-finanz.md`](./Checklisten/compliance-rechnung-finanz.md) vor Mandanten-Go mit StB/DSB/PL abarbeiten.

Tickets und Gates (z. B. FIN-2, QA §5a) stehen in `docs/tickets/` und `docs/contracts/`; bei merge-kritischen Themen README und PR-Vorlage beachten. **QA/Review vor Merge:** Querschnitt in [`docs/runbook/ci-and-persistence-tests.md`](./docs/runbook/ci-and-persistence-tests.md) (Abschnitt „QA und Review vor Merge auf `main`“).

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

## 3. Häufige Befehle

| Zweck | Befehl |
|-------|--------|
| CI-ähnliche Vorprüfung | `npm run verify:ci` |
| Mit DB-Migration wie Deploy-Pfad | `npm run verify:ci:with-migrate` (lokal `DATABASE_URL` setzen) |
| Persistenz-Suite wie CI (lokal) | `npm run verify:ci:local-db` (siehe README) |
| Nur Backend-Tests | `npm test` |
| Web-Unit-Tests | `npm run test -w apps/web` |
| OpenAPI-Validierung | `npm run validate:api-contract-yaml` |

## 4. Codemap

Die pfadbezogene Orientierung liegt zentral unter **[`docs/CODEMAPS/`](./docs/CODEMAPS/)** ([`overview.md`](./docs/CODEMAPS/overview.md)). Bei neuen Features dort die betroffene Sektion um eine Zeile ergänzen (kein Ersatz für ADR oder OpenAPI).

## 5. Umsetzung und Wartung (wie dieses Paket gedacht ist)

| Baustein | Rolle |
|---------|--------|
| **`.cursor/rules/erp-multi-agent.mdc`** | Immer geladen: Domänen-Invarianten, Qualitäts- und Merge-Erwartungen, Verweis auf kanonische Systembeschreibung und diese Datei. |
| **`AGENTS.md`** | Session-Bootstrap: Schichtung, Befehle, Link zur Codemap — bewusst kurz, um Tokens zu sparen. |
| **`docs/CODEMAPS/overview.md`** | Strukturorientierung im Code; wird bei neuen vertikalen Slices oder größeren Verschiebungen aktualisiert. |
| **`docs/ERP-Systembeschreibung.md`** | Fachliche Wahrheit; bei Konflikt gewinnt Fachlogik gegen Implementierungsbequemlichkeit. |

**Optional später:** Zusätzliche Cursor-Regeln mit `globs` (z. B. nur `apps/web/**`) für UI-spezifische Hinweise — nur wenn die globale Rule zu unspezifisch wird.

## 6. Ausgabeformat

Wo die Projektregel „Every output must include: result, rationale, risks, open questions“ fordert, in Antworten an Menschen oder Review-Kommentaren kurz alle vier Punkte abdecken.
