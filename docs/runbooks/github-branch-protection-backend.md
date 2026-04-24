# GitHub — Required Status Check `backend` (Phase A / QA §5a)

**Ziel:** Merge auf `main`/`master` nur bei **grünem** Workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), Job **`backend`** — technische Absicherung der in [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) beschriebenen Merge-Evidence.

## Vorgehen (Org-Admin / Repo-Admin)

1. Repository **Settings** → **Rules** → **Rulesets** (oder klassisch **Branches** → Branch protection rule für `main`).
2. **Target branches:** `main` (ggf. `master` analog).
3. **Require status checks to pass** aktivieren.
4. **Status checks** hinzufügen: den Check-Namen exakt wie in GitHub Actions angezeigt — typisch **`backend`** (Name des Jobs in `ci.yml`).
5. Optional (wenn das Team UI-Regressionen mit-merge-blockieren will): zweiten Check **`e2e-smoke`** hinzufügen (Playwright-Rauchtest aus demselben Workflow). Standard bleibt **nur `backend`** als Pflicht; `e2e-smoke` läuft dann dennoch nach jedem grünen `backend` und warnt sichtbar bei Rot.
6. Optional: **Require branches to be up to date before merging** (Team-Entscheidung).
7. Speichern; Test-PR mit absichtlich rotem Step → Merge sollte blockieren.

## Hinweise

- Zusätzliche Automatisierung (ohne Änderung der empfohlenen Pflichtchecks): **CodeQL** über GitHub **Default setup** (kein zweites Workflow-File nötig), **Dependency review** (nur PRs), **Dependabot** (`.github/dependabot.yml`) — bei Bedarf in den Repo-Einstellungen **Dependency graph** / Security Features prüfen.
- **CodeQL-PR-Check („CodeQL“ / GHAS):** Wenn dieser Check in den Rulesets als *required* eingetragen ist, blockiert er den Merge bei offenen Security-Alerts — unabhängig davon, ob die klassische REST-API `GET …/branches/main/protection` einen Eintrag liefert (z. B. 404, wenn nur Rulesets genutzt werden).
  - **Custom `codeql-config.yml`:** [`.github/codeql/codeql-config.yml`](../../.github/codeql/codeql-config.yml) (Ausschluss `js/missing-rate-limiting`; Begründung: globales `@fastify/rate-limit` in `buildApp`). `PATCH …/code-scanning/default-setup` setzt **keinen** Pfad zur Konfigdatei — entweder **Settings** → **Code security and analysis** → **Code scanning** → Custom configuration auf diese Datei, oder **Advanced setup** mit `github/codeql-action/init` und `config-file`.
  - **API ohne UI:** Default setup per `gh api repos/<org>/<repo>/code-scanning/default-setup -X PATCH` (JSON z. B. `state`, `query_suite`, `languages`). Offene Alerts einzeln per `PATCH …/code-scanning/alerts/{number}` mit `state: dismissed` schließen, falls nötig (false positive mit Verweis auf Runbook und Rate-Limit). Für **PR-spezifische** offene Findings: `GET …/code-scanning/alerts?state=open&ref=refs/pull/<nr>/head` prüfen — Dismissals gelten pro Alert-Nummer, aber der PR-Check kann auf Ref-Instanzen zeigen, bis sie geschlossen oder neu analysiert sind.
- Der sichtbare Check-Name kann je nach GitHub-UI leicht abweichen — in der **Actions**-Ansicht des grünen Runs den genauen Namen übernehmen.
- Ohne Org-Rechte: Ticket an Admin mit Verweis auf diese Datei und auf **QA**-Pflicht §5a in `qa-fin-0-gate-readiness.md`.

**Ersetzt nicht:** menschliche Code-Reviews oder PL-Gates (`FIN-2-START-GATE.md`).
