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
- [ ] **Follow-up-Tickets (PL-Pflicht):** Kein stiller Merge von LV-`ON DELETE`-/FK-Änderungen oder Audit-Transaktionsänderungen ohne abgeschlossenes PL-Gate — [`docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md`](../docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md), [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md); siehe [`docs/runbook/ci-and-persistence-tests.md`](../docs/runbook/ci-and-persistence-tests.md) PR-Checkliste.

**Finanz, Zahlungsfluss, Rechnung, OpenAPI, `error-codes.json`, `prisma/migrations`:** unten **Merge-Evidence §5a** vollständig; bei Unsicherheit PL/Review einbeziehen.

- [ ] **FIN-4 / OpenAPI:** Berührt der PR `docs/api-contract.yaml` (Mahn-Kandidaten, `dunning-reminder-run`, `info.version`)? Dann **Breaking-Note** in der PR-Beschreibung (neue Pflichtfelder, betroffene Integratoren) — siehe [`docs/contracts/FIN4-external-client-integration.md`](../docs/contracts/FIN4-external-client-integration.md) und [`docs/runbook/ci-and-persistence-tests.md`](../docs/runbook/ci-and-persistence-tests.md) (Querschnitt, Punkt 5).

**Rechts-/Produktiv-Go (nur wenn PR Rechnung, Steuerausweis, E-Rechnung-Export, Aufbewahrung oder vergleichbare Compliance-Relevanz hat):** Verweis, ob [`Checklisten/compliance-rechnung-finanz.md`](../Checklisten/compliance-rechnung-finanz.md) im Ticket/Release-Note aktualisiert oder bewusst „keine Änderung“ — kein stiller GoBD-/StB-Nachweis durch Merge allein.

**Kleine PWA-/UX-Releases (Stakeholder-Changelog):** Wenn der PR vor allem **Finanz-Vorbereitung (PWA)** betrifft und kein eigenes OpenAPI-Bündel braucht, **eine Zeile Release-Note** im PR-Text und Link auf das passende Ticket unter `docs/tickets/RELEASE-*.md` setzen — Beispiel: [`docs/tickets/RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md`](../docs/tickets/RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md). Wellen-Kontext: [`docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`](../docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) (Abschnitt „Stakeholder- / Release-Notizen“). **Finanz-Review-Anker:** dieselbe Erwartung steht in [`docs/contracts/review-checklist-finanz-pr.md`](../docs/contracts/review-checklist-finanz-pr.md) unter **Technisch → Punkt 5** (dort nur Verweis hierher — Inhalt zentral in diesem Absatz).

---

## Merge-Evidence (vor Merge auf `main` / `master`)

Siehe [`docs/contracts/qa-fin-0-gate-readiness.md`](docs/contracts/qa-fin-0-gate-readiness.md) — **§5a** (grün) bzw. **§5b** (blockiert).

- [ ] **Grüner GitHub Actions-Run** zum PR-Head: Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml), Job **`backend`** — Run-URL + SHA + eine Zeile **Team-Regel Evidence-SHA** im PR-Kommentar (Vorlage §5a-pre in der QA-Datei).
- [ ] Kein versteckter Scope: bei **reiner Doku** keine gemischten Änderungen an `src/` / `prisma/` / produktiven Routen ohne separates Gate (vgl. QA §3b).

**Minimal-Ablauf §5a (vor Merge):** GitHub → Actions → grünen `backend`-Run zum PR-Head öffnen → Run-URL und Commit-SHA aus der UI kopieren → PR-Kommentar mit **Vorlage §5a-pre** in der QA-Datei posten (inkl. **Team-Regel Evidence-SHA**; Standardzeile dort unter „PL-Bestätigung“). Ohne diesen Block keine Merge-Empfehlung aus QA-Sicht.

## Lokale Vorprüfung (optional, ersetzt nicht den Remote-Run)

```bash
npm run verify:ci
```

Mit Datenbank (Migration deploy wie CI): `DATABASE_URL=…` setzen, dann `npm run verify:ci:with-migrate`. Vollständige Persistenz-Suite wie in CI: zusätzlich `PERSISTENCE_DB_TEST_URL` (gleiche URL wie `DATABASE_URL` möglich).
