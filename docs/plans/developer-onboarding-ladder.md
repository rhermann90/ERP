# Developer-Onboarding — gestufte Lesepfade

Diese Seite bündelt **drei typische Einstiege**. Sie ersetzt keine Domänenregeln ([`.cursor/rules/erp-multi-agent.mdc`](../../.cursor/rules/erp-multi-agent.mdc)), schwächt keine CI-Gates und ändert nichts an Merge-Evidence (QA §5a).

**Kurznavigation:** [Codemap-Spine](../CODEMAPS/overview-spine.md) · [Persistenz & SoT](../CODEMAPS/persistence-and-repository-mode.md) · [Domänen-Stränge](../CODEMAPS/domain-strands.md) · [Deep-Links (Tickets, FIN, Compliance)](../CODEMAPS/overview-deep-links.md) — *einzige Pflegestelle für die großen Querverweis-Tabellen; Kopf der Datei lesen* · [ADR-Index](../adr/README.md)

---

## Musst du oft nicht (vor dem ersten Merge)

- **Ganze** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) — nur die Abschnitte, die zu eurer Aufgabe passen.
- [`Checklisten/`](../../Checklisten/) und inhaltliche Compliance-Bearbeitung — **vor Mandanten-Produktivität** relevant; nicht für jeden UI-Typo oder reinen Refactor in nicht-finanzkritischen Pfaden.
- Alle Tickets unter `docs/tickets/` — nur bei Finanz-/LV-/Persistenz-Themen gezielt öffnen.

---

## Pfad A — 15–20 Minuten (Checkout, kleiner Fix, UI ohne API-Vertrag)

1. Repo klonen, `npm install` im Root (generiert Prisma-Client per `postinstall`).
2. Mindest-Env aus [`.env.example`](../../.env.example): z. B. `AUTH_TOKEN_SECRET` (lokal); für **Memory-Demo** ohne Postgres: `DATABASE_URL` weglassen oder `ERP_REPOSITORY=memory` **ohne** gesetzte DB-URL (Details: [Persistenz & SoT](../CODEMAPS/persistence-and-repository-mode.md)).
3. API: `npm run dev` (Port 3000). PWA: `npm run dev:web` oder `npm run dev:all`.
4. **Checks:** Für Änderungen nur unter `apps/web/` oft ausreichend: `npm run test -w apps/web` für den betroffenen Bereich; vor PR dennoch [`AGENTS.md`](../../AGENTS.md) beachten (kleine PRs: oft `npm run verify:ci`).

---

## Pfad B — 1–2 Stunden (erster API-/Persistenz-/OpenAPI-PR)

1. Pfad A erledigen.
2. [Codemap-Spine](../CODEMAPS/overview-spine.md) und [Domänen-Stränge](../CODEMAPS/domain-strands.md) lesen — **wo** Routen, Services und Persistenz hängen.
3. [Persistenz & SoT](../CODEMAPS/persistence-and-repository-mode.md) — Memory vs. Postgres, Write-Through, typische „warum sehe ich das nicht in der DB?“-Fälle.
4. Postgres lokal wie CI: [`docs/runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md) — z. B. `npm run ensure:local-test-db` und `npm run verify:ci:local-db` bei Schema/Migration/`prisma`-Touches.
5. Neue oder geänderte HTTP-Oberfläche: [`docs/api-contract.yaml`](../api-contract.yaml), [`docs/contracts/error-codes.json`](../contracts/error-codes.json); passende ADRs im [ADR-Index](../adr/README.md).

---

## Pfad C — Merge-Tag (Verantwortung für `main`)

1. Lokal: `npm run verify:pre-merge` (siehe [`AGENTS.md`](../../AGENTS.md) und Root-[`README.md`](../../README.md)) — **ersetzt nicht** den grünen Remote-Job `backend`, wenn ihr §5a mit Run-URL dokumentiert.
2. Merge-Evidence und §5a: [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md).
3. PR-Vorlage: [`.github/pull_request_template.md`](../../.github/pull_request_template.md) vollständig für Finanz-/Contract-/Migrations-PRs.

---

## Befehle — Kurzreferenz

| Situation | Befehl |
|-----------|--------|
| CI-ähnlich (Merge-Erwartung Job `backend`) | `npm run verify:ci` |
| Merge-lokal inkl. Playwright (wie dokumentiert) | `npm run verify:pre-merge` |
| Persistenz-Suite mit lokaler Test-DB | `npm run verify:ci:local-db` |
| Nur Backend-Unit-Tests | `npm test` |
| Nur Web-Unit-Tests | `npm run test -w apps/web` |

Weitere Details und Agenten-Bootstrap: [`AGENTS.md`](../../AGENTS.md).
