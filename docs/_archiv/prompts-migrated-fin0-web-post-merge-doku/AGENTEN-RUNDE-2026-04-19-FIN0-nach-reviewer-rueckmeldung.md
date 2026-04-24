> Archiviert unter `docs/_archiv/prompts-migrated-fin0-web-post-merge-doku/`: auf `main` existiert diese Datei unter `prompts/` nicht mehr (modify/delete beim Merge). Inhalt = Branch-`HEAD` vor dem Merge.

# Agenten-Runde — FIN-0 nach Code-Review „Rückmeldung an Projektleitung“

**Datum:** 2026-04-19  
**Eingang (verbindlich):** Strukturierte **Rückmeldung an Projektleitung** vom Senior Code Review — **blocking** wortgleich GitHub-Review: `kein blocking`. Merge-Evidence Squash PR #1: Run `https://github.com/rhermann90/ERP/actions/runs/24538762870`, SHA `ffa8151745465249535b8e29c112026a21bdc7fb`. Geschlossener PR: `https://github.com/rhermann90/ERP/pull/1`. Weiterleitung: nächste Vier-Prompt-Runde sinngemäß aus [`prompts/AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md`](./AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md) ableiten; **weiter FIN-0**; **kein FIN-2 produktiv** vor Gate; **Audit** nur mit PL-Eintrag in `docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`. **Offene Punkte Review:** offene PR(s) auf GitHub listen — vor Bearbeitung dieser Runde erneut prüfen (Stand kann sich ändern).

**Orchestrierung:** [`prompts/AGENTEN-PROMPT-LEITFADEN.md`](./AGENTEN-PROMPT-LEITFADEN.md) §0 / §7 · Sprint: [`docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md`](../docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md).

---

## Ergebnis / Begründung / Risiken (Runde 04-19)

**Ergebnis:** Diese Datei fixiert **blocking:** `kein blocking` und **Evidence** (Run `24538762870`, SHA `ffa8151745465249535b8e29c112026a21bdc7fb`, PR #1) — **nicht neu erfinden**. **Offene PRs** listet eine isolierte Agent-Umgebung **nicht** zuverlässig live; verbindlicher erster Schritt bleibt **Schritt 0** (`gh pr list` oder Browser).

**Begründung:** Runde 04-19 knüpft an die **Reviewer-Rückmeldung an die Projektleitung** an; technische Arbeit **parallel** zu [`AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md`](./AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md), bis ein neuer PR aus jener Linie **gemerged** ist — danach nur noch GitHub-Review-Follow-ups.

**Risiken:** Reviews ohne frische PR-Liste gegen **falschen** Stand; neuer Push ohne neue **§5a** am Ziel-PR.

**Offene Punkte:** Nach jedem Review **blocking** in der **Rückmeldung an Projektleitung** **wortgleich** zum letzten GitHub-Review übernehmen (keine Vermischung von Szenario A/B).

**Parallele Themen pro Rolle:** Wo fachlich vertretbar, **mehrere** FIN-0-Themen pro Prompt in **einem** Durchlauf bündeln (**max. ca. 8** nummerierte Aufgaben je Rolle), ohne Gate (`FIN-2-START-GATE`, Audit-PL-Eintrag) zu brechen — `npm run typecheck`, `npm test`, Web-Build **vor** Push/PR wie bisher.

---

## Schritt 0 — Offene PRs (gemeinsam, vor Review / vor neuer PR-Arbeit)

```bash
gh pr list --repo rhermann90/ERP --state open
```

Alternativ: https://github.com/rhermann90/ERP/pulls — nur PRs mit **FIN-0-relevantem** Scope (Titel/Beschreibung/Labels).

---

## GitHub-Review — Vorlage (pro FIN-0-relevantem PR; nur absolute Repo-URLs)

Inhalt unten **1:1** in den GitHub-Kommentar/Review einfügen — `<NUMMER>` durch echte PR-Nummer ersetzen. Für **jeden** weiteren offenen FIN-0-PR den Block duplizieren; **blocking** je PR separat setzen.

```markdown
## Senior Code Review — FIN-0 / FIN-2-Gate
**Workspace:** `<absoluter Pfad zum Team-Clone — mit .git und origin>` · **Remote:** `git@github.com:rhermann90/ERP.git` · **Playbook:** https://github.com/rhermann90/ERP/blob/main/prompts/README.md
**PL / System — zuerst:** https://github.com/rhermann90/ERP/blob/main/docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md · https://github.com/rhermann90/ERP/blob/main/docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md · **Diese Runde:** https://github.com/rhermann90/ERP/blob/main/prompts/AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md · **Vorlage:** https://github.com/rhermann90/ERP/blob/main/docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md · **§5a/§5b:** https://github.com/rhermann90/ERP/blob/main/docs/contracts/qa-fin-0-gate-readiness.md · **Szenarien:** https://github.com/rhermann90/ERP/blob/main/prompts/AGENTEN-PROMPT-LEITFADEN.md · **Domäne:** https://github.com/rhermann90/ERP/blob/main/ERP%20Systembeschreibung%20v1.3.md · **Regeln:** https://github.com/rhermann90/ERP/blob/main/.cursor/rules/erp-multi-agent.mdc
**FIN-2:** nein bis https://github.com/rhermann90/ERP/blob/main/docs/tickets/FIN-2-START-GATE.md (G1–G10) · **Audit-Laufzeit:** nur mit PL-Eintrag https://github.com/rhermann90/ERP/blob/main/docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md
**PR:** https://github.com/rhermann90/ERP/pull/<NUMMER>
### 1) Files changed
- [ ] FIN-0-Scope; kein FIN-2-Produktivpfad / 8.4-Motor
- [ ] Tenant / Traceability (wo berührt)
- [ ] Keine Phantom-error-codes — wo berührt: https://github.com/rhermann90/ERP/blob/main/docs/api-contract.yaml · https://github.com/rhermann90/ERP/blob/main/docs/contracts/finance-fin0-openapi-mapping.md · https://github.com/rhermann90/ERP/blob/main/docs/contracts/error-codes.json
- [ ] Kein Audit-Laufzeit-Change ohne PL-Eintrag (siehe FOLLOWUP-Link)
### 2) §5a / §5b *(https://github.com/rhermann90/ERP/blob/main/prompts/AGENTEN-PROMPT-LEITFADEN.md §5)*
- **Szenario B** nur bei vollständiger §5a am **diesem** PR (HTTPS Run + SHA PR-Head + eine Zeile Team-Regel Evidence-SHA), plausibel zum Merge-Commit.
- Sonst **Szenario A** und **blocking** = eine Zeile aus Leitfaden §5 (§5a unvollständig — kein Approve bis Nachreichung).
### blocking
`<genau eine Zeile: entweder Szenario-A-Satz ODER: kein blocking>`
### PR-Entscheidung
`<Changes requested | Approve nur Szenario B>`
**Merge-Kommentar (bei Approve, Pflicht):**  
FIN-2-Implementierung (Domäne, produktive API, 8.4) erst nach Schließen von G1–G10 in https://github.com/rhermann90/ERP/blob/main/docs/tickets/FIN-2-START-GATE.md
**Out of Scope:** Approve ohne vollständiges §5a am Ziel-PR; FIN-2-Freigabe.
```

---

## GitHub-Review — falls keine offenen FIN-0-PRs

```markdown
## Senior Code Review — FIN-0 / FIN-2-Gate
**Hinweis:** Unter https://github.com/rhermann90/ERP/pulls derzeit **keine** offenen FIN-0-relevanten PRs — kein Files-changed-Review in diesem Schritt.
**Nächster Schritt (mit PL):** nächsten FIN-0-PR mit klarer Scope-Zeile eröffnen (kein Leer-PR ohne Koordination). Technische Liste sinngemäß weiter: https://github.com/rhermann90/ERP/blob/main/prompts/AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md
### blocking
- kein blocking
### PR-Entscheidung
n. a. (kein PR-Gegenstand)
```

---

## Rückmeldung an Projektleitung — Vorlagen (`prompts/FIN-0-rollenprompts.md`)

**blocking** muss **wortgleich** dem letzten GitHub-Review sein. Platzhalter `<…>` vor dem Senden ersetzen.

### Variante A — mind. ein offener PR reviewed; blocking = `kein blocking` (Szenario B je PR)

```text
## Rückmeldung an Projektleitung
**Vorspann (Senior Code Review):** Runde https://github.com/rhermann90/ERP/blob/main/prompts/AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md · Workspace `<Team-Clone>` · Remote wie README. **blocking** wortgleich GitHub-Review.
### Ergebnis
Offene PR(s) geprüft: <kurz: PR-Nummern, Approve/Changes je PR>. Merge-Evidence Squash PR #1 unverändert Archiv (siehe unten). Weiter FIN-0; kein FIN-2 produktiv vor Gate; Audit nur mit PL-Eintrag FOLLOWUP.
### Begründung
Reviews nach GITHUB-REVIEW-Vorlage; §5a nur Szenario B mit echter Evidence je PR.
### Risiken
- Neue Pushes ohne neue §5a.
### Offene Punkte / PL-Entscheidung nötig
- <Follow-ups aus GitHub Review-Kommentaren>
**Pflicht (Merge-Evidence / QA-Sicht):**
- **Grüner GitHub-Actions-Link (Archiv Squash PR #1):** ja — https://github.com/rhermann90/ERP/actions/runs/24538762870
- **Merge auf main aus QA-Sicht blockiert:** nein — *für den dokumentierten Squash-Stand; für **neue** PRs jeweils neu prüfen*
### blocking *(wortgleich GitHub-Review — hier: kein blocking)*
- kein blocking
### Evidence
- **QA (Archiv PR #1):** https://github.com/rhermann90/ERP/actions/runs/24538762870 · Commit https://github.com/rhermann90/ERP/commit/ffa8151745465249535b8e29c112026a21bdc7fb
- **Offene PRs:** <Links https://github.com/rhermann90/ERP/pull/N>
- **Code Review:** <Approve / Changes requested>
```

### Variante B — kein offener FIN-0-PR

```text
## Rückmeldung an Projektleitung
**Vorspann (Senior Code Review):** wie Variante A.
### Ergebnis
Unter https://github.com/rhermann90/ERP/pulls derzeit **0** offene FIN-0-relevante PRs (laut Schritt 0). Weiter FIN-0 nach PL-Koordination; Squash PR #1 Evidence siehe Pflicht.
### Begründung
Kein Files-changed-Review ohne PR-Gegenstand; nächster Schritt = neuen FIN-0-PR eröffnen (sinngemäß AGENTEN-RUNDE-2026-04-18).
### Risiken
- Drift, falls zwischenzeitlich PRs eröffnet werden und nicht erneut gelistet.
### Offene Punkte / PL-Entscheidung nötig
- PL bestätigt nächstes FIN-0-Ziel für ersten neuen PR.
**Pflicht (Merge-Evidence / QA-Sicht):**
- **Grüner GitHub-Actions-Link für neuen Merge-PR:** nein — fehlt / kein anstehender Merge-PR
- **Merge auf main aus QA-Sicht blockiert:** nein — kein anstehender Merge-Gegenstand ohne §5a *(sofern kein offener Merge-PR mit fehlendem §5a; sonst §5a/§5b nachsteuern)*
### blocking
- kein blocking
### Evidence
- **Archiv PR #1:** https://github.com/rhermann90/ERP/actions/runs/24538762870 · https://github.com/rhermann90/ERP/commit/ffa8151745465249535b8e29c112026a21bdc7fb · https://github.com/rhermann90/ERP/pull/1
```

---

## Eingang für `PL-NÄCHSTE-RUNDE-AUS-REVIEW.md` §2 / nächste Runden-Datei

Strukturierter Stichpunktblock für die **Projektleitung** (kein Ersatz für die vollständige Reviewer-Rückmeldung aus den Vorlagen oben):

- **blocking** (wortgleich letztem GitHub-Review): `kein blocking` **oder** eine Zeile Szenario A — **nicht mischen**.
- **Offene PRs:** <Liste `https://github.com/rhermann90/ERP/pull/N` oder „keine“>
- **Archiv-Evidence Squash PR #1 (nicht erfinden):** Run `https://github.com/rhermann90/ERP/actions/runs/24538762870` · SHA `ffa8151745465249535b8e29c112026a21bdc7fb` · PR `https://github.com/rhermann90/ERP/pull/1`
- **Nächste Vier-Prompts:** aus https://github.com/rhermann90/ERP/blob/main/prompts/AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md + sinngemäß https://github.com/rhermann90/ERP/blob/main/prompts/AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md, bis neuer PR aus 04-18 gemerged ist — danach nur GitHub-Review-Follow-ups.
- **Reviews:** nur absolute `https://github.com/rhermann90/ERP/...`-URLs (`GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE`).

---

## Kurzfassung Review → PL (Archivzeile, nicht erfinden)

```text
### blocking (wortgleich GitHub-Review)
kein blocking

### Pflicht (Merge-Evidence / QA-Sicht — Squash PR #1)
- Grüner GitHub-Actions-Link (Evidence): ja — https://github.com/rhermann90/ERP/actions/runs/24538762870
- Merge auf main aus QA-Sicht blockiert: nein — vorbehaltlich keine neue Rotstelle / kein SHA-Widerspruch zum dokumentierten Squash-Commit

### Evidence (Auszug)
- QA: Run https://github.com/rhermann90/ERP/actions/runs/24538762870 · SHA ffa8151745465249535b8e29c112026a21bdc7fb
- Backend/Frontend: geschlossener PR https://github.com/rhermann90/ERP/pull/1
```

---

## Für den Chat (Copy-Paste)

**So kopieren:** Fünf Codeblöcke (`text`) unten — pro Rolle nur den **Inhalt** des jeweiligen Blocks (ohne die umschließenden Markdown-Backticks) in den Chat kopieren.

**Rohdatei:** https://raw.githubusercontent.com/rhermann90/ERP/main/prompts/AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md

---

## PL / System — Vorspann (ein Block, zuerst in die Session)

```text
Workspace: <absoluter Pfad zum Team-Clone — mit .git und origin>
Remote: git@github.com:rhermann90/ERP.git (siehe prompts/README.md)

PL / System — zuerst:
- Sprint: docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md | Index: docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md
- Diese Runde: prompts/AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md — Eingang: Code-Review „Rückmeldung an Projektleitung“ (blocking: kein blocking; Evidence Run/SHA wie in dieser Datei oben; weiter FIN-0).
- Sinngemäße technische Aufgabenliste: weiterhin prompts/AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md (Backend/Frontend/QA/Review §1–4), sofern noch kein neuer PR aus jener Runde gemerged ist — sonst nur noch offene Review-Follow-ups aus GitHub.
- Domäne: ERP Systembeschreibung v1.3.md | .cursor/rules/erp-multi-agent.mdc
- FIN-2 produktiv / 8.4-Motor: nein — erst docs/tickets/FIN-2-START-GATE.md G1–G10
- AuditService / Dual-Write / Transaktionsgrenze Audit: keine Änderung ohne vollständigen PL-Eintrag in docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md

Regeln für Agenten:
- Einstieg: prompts/README.md — nur Team-Clone; keine Secrets im Projektbaum.
- §5a / §5b: docs/contracts/qa-fin-0-gate-readiness.md — für jeden **neuen** Merge-PR echte Run-URL + SHA + Team-Regelzeile; keine erfundenen Werte.
- GitHub: in Reviews und Kommentaren **absolute** https://github.com/rhermann90/ERP/...-URLs (docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md).
- Erster Arbeitsschritt gemeinsam: **Schritt 0** in dieser Datei (`gh pr list` / PR-Liste); wenn keine offenen FIN-0-PRs: nächsten FIN-0-PR mit klarer Scope-Zeile eröffnen (kein Leer-PR ohne PL-Koordination).
- **Senior Code Review:** GitHub-Vorlagen und PL-Rückmeldung-Vorlagen **in dieser Datei** (Abschnitte „GitHub-Review — Vorlage“ / „Rückmeldung an Projektleitung — Vorlagen“) verwenden.
```

---

## 1) Backend

```text
Rolle: Senior Backend (Node/TypeScript, FIN-0-Stubs, bestehende src/api-Patterns).

Eingang (Code-Review — Rückmeldung an Projektleitung, sinngemäß):
PR #1 squash auf main; CI-Evidence und SHA wie in dieser Datei; blocking: kein blocking; weiter FIN-0; kein FIN-2 produktiv; Audit nur mit PL-Eintrag FOLLOWUP. Schritt 0 (offene PRs) vor allen Punkten.

Deine Aufgaben (nummeriert, max. 8 — Themen bündeln wo möglich):
1) Schritt 0: `gh pr list --repo rhermann90/ERP --state open` oder https://github.com/rhermann90/ERP/pulls — Befund ein Satz (PR-Nummern oder „keine FIN-0-PRs“).
2) git fetch && git pull origin main; Feature-Branch nur nach klarem Scope (mit PL bei Unklarheit).
3) Wenn offene FIN-0-PRs: zuerst Review-Kommentare abarbeiten / Rebase; kein zweiter paralleler PR ohne Absprache.
4) Wenn kein offener Backend-PR: einen neuen PR wie prompts/AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md §1 Backend — Abgleich docs/api-contract.yaml ↔ src/api/finance-fin0-stubs.ts ↔ docs/contracts/finance-fin0-openapi-mapping.md ↔ docs/contracts/error-codes.json in **einem** PR bündeln, falls mehrere kleine Abweichungen sichtbar sind.
5) test/finance-fin0-stubs.test.ts und docs/contracts/qa-fin-0-stub-test-matrix.md bei Änderungen an Stubs/Codes gemeinsam prüfen (keine Phantom-Codes).
6) src/api/app.ts und Auth/Tenant-Header-Muster nur anfassen, wenn FIN-0-Routen oder Tests es erfordern — Regression auf bestehende Routen vermeiden.
7) Kurz prüfen: keine unbeabsichtigten Änderungen an AuditService / Dual-Write / Transaktionsgrenze (ohne PL-Eintrag FOLLOWUP tabu).
8) PR-Beschreibung: Scope-Zeile FIN-0, Verweis FIN-2-START-GATE.md; keine erfundenen Actions-URLs.

Out of Scope: Produktive FIN-2-/8.4-Logik; FIN-4 Mahn; neue Prisma-Finanztabellen.

Qualität: npm run typecheck && npm test — grün vor Push.

Output: PR-Link(e) gegen origin/main; §5a durch QA nach grünem Lauf auf PR-Head.
```

---

## 2) Frontend (apps/web)

```text
Rolle: Senior Frontend apps/web (React, Shell, allowedActions, Finanz-Vorbereitung read-only).

Eingang (Code-Review — sinngemäß):
Weiter FIN-0/App-Inkremente; blocking: kein blocking; absolute GitHub-URLs; Schritt 0 vor Arbeit.

Deine Aufgaben (nummeriert, max. 8):
1) Schritt 0: offene PRs listen; mit Backend abstimmen, wer welchen PR führt.
2) git fetch && git pull origin main; Feature-Branch.
3) apps/web: FinancePreparation + DOC_LINKs wie AGENTEN-RUNDE-2026-04-18 §2 — README-Abschnitt „Stand / FIN-0 vs FIN-2“ und Stub-Matrix-Link in einem Rutsch, wenn noch offen.
4) api-client / getInvoice: nur bei Backend-Contract-Änderung derselben Runde minimal anpassen; sonst unverändert lassen.
5) Kleine A11y/Lesbarkeit (Überschriften, Fokus) an der Finanz-Vorbereitungsseite — ohne neue Schreibaktionen an Finanz-APIs.
6) apps/web/README.md + ggf. prompts-relevante Verweise konsistent zu prompts/README.md halten (reine Doku, klar kennzeichnen).
7) allowedActions / Tenant-Navigation: keine Umgehung; keine neuen Hash-Routen außerhalb des vereinbarten FIN-0-Umfangs.
8) PR-Beschreibung: Scope „FIN-0 UI/Doku; kein FIN-2“.

Out of Scope: FIN-2 produktiv; Mahn-/Zahlungsbuchung; Tenant-Leaks.

Qualität: npm run test -w apps/web && npm run build:web — grün.

Output: PR-Link gegen origin/main.
```

---

## 3) QA (Testing / Evidence)

```text
Rolle: QA Engineer (Testing, Merge-Evidence).

Eingang (Code-Review — sinngemäß):
Evidence Squash PR #1 wie dokumentiert; optional §5a) post-merge PR #1; neue PRs mit vollem §5a; blocking: kein blocking; Schritt 0 zuerst.

Deine Aufgaben (nummeriert, max. 8):
1) Schritt 0: offene PRs listen und Merge-Kandidaten benennen.
2) docs/contracts/qa-fin-0-gate-readiness.md (§5a, §5b, §3b, Sonderfall „kein PR“) lesen.
3) Optional PR #1: §5a auf 5a) mit HTTPS-Run auf main + Squash-SHA — nur echte GitHub-Werte.
4) Pro neuem Merge-PR: nach grünem Actions-Lauf auf PR-Head vollständiges §5a (HTTPS, SHA, Team-Regel Evidence-SHA); §5b bei rotem Run oder Widerspruch.
5) docs/contracts/qa-fin-0-stub-test-matrix.md ↔ test/finance-fin0-stubs.test.ts bei Backend-Änderungen gemeinsam mit Backend-Rolle abstimmen und anpassen.
6) .github/workflows/ci.yml grob prüfen, ob sich Jobs für den PR geändert haben (kein Merge ohne passenden grünen Check laut Team-Regel).
7) FIN-2-START-GATE.md: keine „erfüllt“-Spalten ohne PL; nur Lesen/Stichprobe Nachweise, wenn PL Spalten setzt.
8) Sonderfall: kein Merge-Ziel in der Runde → Merge blockiert = nein mit Begründung laut qa-fin-0-gate-readiness.md.

Out of Scope: Gate-Spalten eigenmächtig; erfundene Tracker-URLs.

Qualität: npm test wo angefasst; Doku-only §3b kennzeichnen.

Output: GitHub-Kommentar(e) mit Evidence oder dokumentierter Sonderfall C.
```

---

## 4) Senior Code Review

```text
Rolle: Senior Code Review (FIN-0 / GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE).

Eingang (Code-Review — sinngemäß):
blocking wortgleich GitHub; nur absolute Repo-URLs; weiter FIN-0; kein FIN-2 produktiv vor Gate; Audit nur mit PL-Eintrag FOLLOWUP.

Deine Aufgaben (nummeriert, max. 8):
1) Schritt 0 ausführen; Ergebnis im Review-Thread oder in PL-Rückmeldung festhalten.
2) Für **jeden** offenen FIN-0-relevanten PR: Markdown-Vorlage **„GitHub-Review — Vorlage (pro FIN-0-relevantem PR)“** aus dieser Datei kopieren, `<NUMMER>` setzen, Files-changed + §5a/Szenario prüfen.
3) Wenn **keine** offenen FIN-0-PRs: Vorlage **„GitHub-Review — falls keine offenen FIN-0-PRs“** posten (z. B. Diskussion/Team) und PL-Rückmeldung **Variante B** verwenden.
4) blocking je PR **eine** wahre Zeile (Szenario A aus AGENTEN-PROMPT-LEITFADEN §5 **oder** `kein blocking` bei Szenario B) — wortgleich in die **Rückmeldung an Projektleitung** übernehmen.
5) Alle Datei-/Commit-Verweise nur als vollständige https://github.com/rhermann90/ERP/blob/...-URLs.
6) Nach jedem Review-Zyklus: **Rückmeldung an Projektleitung** aus dieser Datei (**Variante A** oder **B**) fertigstellen; Pflichtzeilen Actions + Merge blockiert nie vergessen.
7) **Eingang für PL-NÄCHSTE-RUNDE-AUS-REVIEW.md §2** (Stichpunktblock in dieser Datei) an die PL durchreichen / verlinken.
8) Merge-Kommentar bei Approve: FIN-2-Gate-Pflichtzeile wie in der GitHub-Vorlage.

Out of Scope: Approve ohne vollständiges §5a am Ziel-PR; FIN-2-Freigabe.

Qualität: Reproduzierbare Review-Kommentare; keine erfundenen Run-IDs.

Output: GitHub-Review(s) + PL-Rückmeldung + §2-Stichpunkte für nächste Runden-Datei.
```
