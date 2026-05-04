# GitHub — Required Status Check `backend` (Phase A / QA §5a)

**Ziel:** Merge auf `main`/`master` nur bei **grünem** Workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), Job **`backend`** — technische Absicherung der in [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) beschriebenen Merge-Evidence.

## Vorgehen (Org-Admin / Repo-Admin)

1. Repository **Settings** → **Rules** → **Rulesets** (oder klassisch **Branches** → Branch protection rule für `main`).
2. **Target branches:** `main` (ggf. `master` analog).
3. **Require status checks to pass** aktivieren.
4. **Status checks** hinzufügen: den Check-Namen exakt wie in GitHub Actions angezeigt — typisch **`backend`** (Name des Jobs in `ci.yml`).
5. Optional bzw. Team-Entscheid: zweiten Check **`e2e-smoke`** (Playwright-Rauchtest, derselbe Workflow). **Stand Repo `rhermann90/ERP` (2026-04-25):** Ruleset verlangt **`backend`** und **`e2e-smoke`**. Vorher galt nur `backend` als Pflicht; `e2e-smoke` lief mit und warnte. **Nach Aktivierung als Pflicht:** Team/QA informieren; Status in [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md) Schritt 4 spiegeln.
6. Optional: **Require branches to be up to date before merging** (Team-Entscheidung).
7. Speichern; Test-PR mit absichtlich rotem Step → Merge sollte blockieren.

## Hinweise

- Zusätzliche Automatisierung (ohne Änderung der empfohlenen Pflichtchecks): **CodeQL** über GitHub **Default setup** (kein zweites Workflow-File nötig), **Dependency review** (nur PRs), **Dependabot** (`.github/dependabot.yml`) — bei Bedarf in den Repo-Einstellungen **Dependency graph** / Security Features prüfen.
- **CodeQL-PR-Check („CodeQL“ / GHAS):** Wenn dieser Check in den Rulesets als *required* eingetragen ist, blockiert er den Merge bei offenen Security-Alerts — unabhängig davon, ob die klassische REST-API `GET …/branches/main/protection` einen Eintrag liefert (z. B. 404, wenn nur Rulesets genutzt werden).
  - **Custom `codeql-config.yml`:** [`.github/codeql/codeql-config.yml`](../../.github/codeql/codeql-config.yml) (Ausschluss `js/missing-rate-limiting`; Begründung: globales `@fastify/rate-limit` in `buildApp`). `PATCH …/code-scanning/default-setup` setzt **keinen** Pfad zur Konfigdatei — entweder **Settings** → **Code security and analysis** → **Code scanning** → Custom configuration auf diese Datei, oder **Advanced setup** mit `github/codeql-action/init` und `config-file`.
  - **API ohne UI:** Default setup per `gh api repos/<org>/<repo>/code-scanning/default-setup -X PATCH` (JSON z. B. `state`, `query_suite`, `languages`). Offene Alerts einzeln per `PATCH …/code-scanning/alerts/{number}` mit `state: dismissed` schließen, falls nötig (false positive mit Verweis auf Runbook und Rate-Limit). Für **PR-spezifische** offene Findings: `GET …/code-scanning/alerts?state=open&ref=refs/pull/<nr>/head` prüfen — Dismissals gelten pro Alert-Nummer, aber der PR-Check kann auf Ref-Instanzen zeigen, bis sie geschlossen oder neu analysiert sind.
- Der sichtbare Check-Name kann je nach GitHub-UI leicht abweichen — in der **Actions**-Ansicht des grünen Runs den genauen Namen übernehmen.
- Ohne Org-Rechte: Ticket an Admin mit Verweis auf diese Datei und auf **QA**-Pflicht §5a in `qa-fin-0-gate-readiness.md`.

**Ersetzt nicht:** dokumentierte technische Gates im Repo (z. B. `FIN-2-START-GATE.md`). Ob zusätzliche Code-Reviews verlangt werden, ist **Organisationssache** und nicht Teil dieser technischen Absicherung.

## Team / QA: Nachweis zur Pflicht für `e2e-smoke`

**Aktuell (siehe Tabelle unten):** Merge auf Default-Branch ist nur bei grünem **`backend`** und grünem **`e2e-smoke`** möglich (Ruleset „branch protection“).

Wenn die Branch-Protection auf **zwei Pflicht-Checks** (`backend` + `e2e-smoke`) umgestellt **oder zurück** auf nur `backend` gestellt wird:

1. Datum und Kurzbegründung in Release-Notes, PR-Diskussion oder unten als eine Zeile eintragen.
2. QA explizit informieren: bei **Aktivierung** von `e2e-smoke` als Pflicht ist Merge ohne grünen E2E ausgeschlossen; bei **Rücknahme** auf nur `backend` das Gegenteil kommunizieren (Vorlage unten ggf. anpassen).
3. In [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md) (Schritt 4) den operativen Status kurz spiegeln, damit Plan und Runbook übereinstimmen.

| Datum      | `e2e-smoke` als Merge-Pflicht | Referenz (PR/Notiz) |
|------------|-------------------------------|---------------------|
| 2026-04-25 | ja                            | Ruleset `branch protection` (ID 15256596): `gh api repos/rhermann90/ERP/rulesets/15256596 -X PUT` mit `required_status_checks` für `backend` + `e2e-smoke` (GitHub Actions `integration_id` 15368). |

### Team / QA — Kurzmeldung (copy-paste)

```text
Merge auf main: ab sofort blockiert, wenn einer der beiden CI-Checks fehlschlägt:
• backend (wie bisher)
• e2e-smoke (Playwright „Login → Finanz“, u. a. Tab „Grundeinstellungen Mahnlauf“)
Details: docs/runbooks/github-branch-protection-backend.md
```

### GitHub CLI — Ruleset mit zwei Pflicht-Checks (Referenz)

Klassische `branches/main/protection` liefert bei Rulesets oft 404; stattdessen Ruleset per ID lesen/schreiben:

```bash
gh api repos/<org>/<repo>/rulesets --jq '.[] | {id, name}'
gh api repos/<org>/<repo>/rulesets/<RULESET_ID> | jq .
# PUT-Body: JSON mit rules[].type == required_status_checks und
# parameters.required_status_checks: [ { context, integration_id }, … ]
# integration_id 15368 = GitHub Actions (typisch für Workflow-Jobs).
```
