## Änderung (kurz)

<!-- Was wurde geändert und warum? -->

**Branch-Schutz (Repo-Admin):** Pflicht-Statuscheck **`backend`** — [`docs/runbooks/github-branch-protection-backend.md`](../docs/runbooks/github-branch-protection-backend.md).

### Abhängigkeiten vs. Produkt (Pflicht bei gemischtem Kontext)

- **Dependabot-Branches** (`dependabot/…`): nur Dependency-Updates mergen — **kein** Produkt-/Finanz-WIP darauf committen.
- **Feature-Branches** von `main` (`feat/…`, `fix/…`): Mandanten- und Finanz-Änderungen **nur** dort und in **eigenen** PRs gegen `main`, damit Rollback und Verantwortung klar bleiben.

### Schnell-Check (kleine PRs: Refactor, Typos, keine Finanz-/Contract-Änderung)

- [ ] `npm run verify:ci` lokal grün **oder** bewusst auf Remote-CI vertraut
- [ ] Keine Secrets / keine echten Kundendaten in Diff oder Fixtures
- [ ] Bei Touch von `src/` + Mandanten/Finanz: mindestens bestehende Tests für den Pfad mitbedacht
- [ ] **Sensibel (LV/FK/Audit):** Kein **heimlicher** Merge großer LV-`ON DELETE`-/FK- oder Audit-Transaktionsänderungen ohne Ticket-/Review-Bezug — [`docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md`](../docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md), [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md); Details [`docs/runbook/ci-and-persistence-tests.md`](../docs/runbook/ci-and-persistence-tests.md). *(Entwicklungsphase: kein Zwang auf ausgefülltes „Audit-Gate“ vor Merge.)*

**Finanz, Zahlungsfluss, Rechnung, OpenAPI, `error-codes.json`, `prisma/migrations`:** unten **Merge-Evidence §5a** vollständig; bei Unsicherheit Team/Review einbeziehen.

- [ ] **FIN-4 / OpenAPI:** Berührt der PR `docs/api-contract.yaml` (Mahn-Kandidaten, `dunning-reminder-run`, `info.version`)? Dann **Breaking-Note** in der PR-Beschreibung (neue Pflichtfelder, betroffene Integratoren) — siehe [`docs/contracts/FIN4-external-client-integration.md`](../docs/contracts/FIN4-external-client-integration.md) und [`docs/runbook/ci-and-persistence-tests.md`](../docs/runbook/ci-and-persistence-tests.md) (Querschnitt, Punkt 5).

**Compliance (optional in Entwicklungsphase):** Wenn der PR Rechnung/Steuer/Export/Aufbewahrung berührt und ihr die Begleitliste pflegen wollt — kurz verlinken oder „keine Doku-Änderung“. **Kein** stiller StB-/GoBD-Nachweis durch Merge; formale Abnahme erst vor Produktiv-Go.

**Kleine PWA-/UX-Releases (Stakeholder-Changelog):** Wenn der PR vor allem **Finanz-Vorbereitung (PWA)** betrifft und kein eigenes OpenAPI-Bündel braucht, **eine Zeile Release-Note** im PR-Text und Link auf das passende Ticket unter `docs/tickets/RELEASE-*.md` setzen — Beispiel: [`docs/tickets/RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md`](../docs/tickets/RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md). Wellen-Kontext: [`docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`](../docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) (Abschnitt „Stakeholder- / Release-Notizen“). **Finanz-Review-Anker:** dieselbe Erwartung steht in [`docs/contracts/review-checklist-finanz-pr.md`](../docs/contracts/review-checklist-finanz-pr.md) unter **Technisch → Punkt 5** (dort nur Verweis hierher — Inhalt zentral in diesem Absatz).

---

## Merge-Evidence (vor Merge auf `main` / `master`)

Siehe [`docs/contracts/qa-fin-0-gate-readiness.md`](docs/contracts/qa-fin-0-gate-readiness.md) — **§5a** (grün) bzw. **§5b** (blockiert).

- [ ] **Grüner GitHub Actions-Run** zum PR-Head: Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml), Job **`backend`** — Run-URL + SHA + eine Zeile **Team-Regel Evidence-SHA** im PR-Kommentar (Vorlage §5a-pre in der QA-Datei).
- [ ] Kein versteckter Scope: bei **reiner Doku** keine gemischten Änderungen an `src/` / `prisma/` / produktiven Routen ohne separates Gate (vgl. QA §3b).

**Minimal-Ablauf §5a (vor Merge):** GitHub → Actions → grünen `backend`-Run zum PR-Head öffnen → Run-URL und Commit-SHA aus der UI kopieren → PR-Kommentar mit **Vorlage §5a-pre** in der QA-Datei posten (inkl. **Team-Regel Evidence-SHA**; Standardzeile dort unter „Team-Bestätigung“). Ohne diesen Block keine Merge-Empfehlung aus QA-Sicht.

## Lokale Vorprüfung (optional, ersetzt nicht den Remote-Run)

**Empfohlen vor Merge (CI-Kette + E2E wie Job `e2e-smoke`):**

```bash
npm run verify:pre-merge
```

Enthält `npm run verify:ci` und anschließend Playwright für [`e2e/login-finance-smoke.spec.ts`](../e2e/login-finance-smoke.spec.ts) und [`e2e/app-shell-smoke.spec.ts`](../e2e/app-shell-smoke.spec.ts) (Ports **13000** / **15173** wie in [`playwright.config.ts`](../playwright.config.ts)).

Nur die schnelle Backend/Web-Unit-Kette ohne Playwright:

```bash
npm run verify:ci
```

**Persistenz / Migration / `prisma/` / finanzrelevante Integration:** zusätzlich oder stattdessen wie in CI:

```bash
npm run verify:ci:local-db
```

(Postgres Test-DB Host **127.0.0.1:15432** — [`docs/runbook/ci-and-persistence-tests.md`](../docs/runbook/ci-and-persistence-tests.md).)

Mit Datenbank (Migration deploy wie CI): `DATABASE_URL=…` setzen, dann `npm run verify:ci:with-migrate`. Vollständige Persistenz-Suite wie in CI: zusätzlich `PERSISTENCE_DB_TEST_URL` (gleiche URL wie `DATABASE_URL` möglich).
