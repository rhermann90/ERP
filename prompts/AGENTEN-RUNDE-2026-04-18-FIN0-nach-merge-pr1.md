# Agenten-Runde — FIN-0 nach Merge PR #1 (Vier Prompts aus Code-Review-Eingang)

**Datum:** 2026-04-18  
**Eingang (verbindlich):** Strukturierte **„Rückmeldung an Projektleitung“** — **Aktueller Planungsstand** in [`prompts/PL-NÄCHSTE-RUNDE-AUS-REVIEW.md`](./PL-NÄCHSTE-RUNDE-AUS-REVIEW.md) (Abschnitt nach Merge PR #1; **blocking:** `kein blocking`; Merge-Evidence für Squash `ffa8151745465249535b8e29c112026a21bdc7fb` und grüner Run `https://github.com/rhermann90/ERP/actions/runs/24538762870` — nur aus GitHub übernehmen, nicht erfinden).

**Orchestrierung:** [`prompts/AGENTEN-PROMPT-LEITFADEN.md`](./AGENTEN-PROMPT-LEITFADEN.md) §0 / §7 · Sprint: [`docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md`](../docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md) · Domäne: `ERP Systembeschreibung v1.3.md` · `.cursor/rules/erp-multi-agent.mdc`.

**Nicht neu erfinden:** GitHub-Actions-URLs oder SHAs; bei abweichendem `main`-Tip immer zuerst `git pull origin main` und für **neue** PRs aktuelle Run-IDs aus der UI.

---

## Für den Chat (Copy-Paste)

**So kopieren:** Es folgen **fünf** getrennte Codeblöcke (Sprachmarke: `text`). Pro Rolle nur den **Inhalt innerhalb** des Blocks kopieren — nicht die umschließenden Markdown-Zeilen mit drei Backticks (Vorspann einmal in die Session, danach Backend, Frontend, QA, Review in die passenden Chats).

**Alternative (Browser):** Rohdatei öffnen und dort markieren:  
https://raw.githubusercontent.com/rhermann90/ERP/main/prompts/AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md

---

## PL / System — Vorspann (ein Block, zuerst in die Session)

```text
Workspace: <absoluter Pfad zum Team-Clone — mit .git und origin>
Remote: git@github.com:rhermann90/ERP.git (siehe prompts/README.md)

PL / System — zuerst:
- Sprint: docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md | Index: docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md
- Diese Runde: prompts/AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md — FIN-0 weiterführen nach squash-merge PR #1 auf main; nächste Prompts danach wieder aus Code-Review-Rückmeldung (blocking wortgleich GitHub).
- Review-Eingang: PL-NÄCHSTE-RUNDE-AUS-REVIEW.md — Aktueller Planungsstand (blocking: kein blocking; Pflicht: grüner Run auf main für Squash-Commit des PR #1-Inhalts).
- Domäne: ERP Systembeschreibung v1.3.md | .cursor/rules/erp-multi-agent.mdc
- FIN-2 produktiv / 8.4-Motor: nein — erst docs/tickets/FIN-2-START-GATE.md G1–G10
- AuditService / Dual-Write / Transaktionsgrenze Audit: keine Änderung ohne vollständigen PL-Eintrag in docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md

Regeln für Agenten:
- Einstieg: prompts/README.md — nur Team-Clone; keine Secrets im Projektbaum.
- §5a / §5b: docs/contracts/qa-fin-0-gate-readiness.md — Evidence nur mit echten Werten aus GitHub.
- GitHub-Review: absolute Repo-URLs (docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md).
```

---

## 1) Backend

```text
Rolle: Senior Backend (Node/TypeScript, bestehende src/api-Patterns, FIN-0-Stubs).

Eingang (Code-Reviewer — Kurzfassung, sinngemäß):
PR #1 ist auf main gemerged; FIN-0-Konformität der gemergten Änderungen soll unverändert bleiben; nächste Arbeit aus Feature-Branches von aktuellem main; weiter FIN-0/Inkremente ohne FIN-2-Produktivpfad; blocking: kein blocking.

Deine Aufgaben (nummeriert, max. 7):
1) git fetch && git pull origin main (aktueller Tip); Feature-Branch von main; keine Phantom-SHAs in Commits oder PR-Text.
2) FIN-0: Nach Merge minimale Nachzieher nur bei messbarer Inkonsistenz oder Review-Follow-up — Abgleich `docs/api-contract.yaml` ↔ `src/api/finance-fin0-stubs.ts` ↔ `docs/contracts/finance-fin0-openapi-mapping.md` ↔ `docs/contracts/error-codes.json`. Liegt kein sinnvoller Code-Diff vor, mit PL/Team abstimmen (Leer-PR vermeiden); ggf. Review-Kommentar statt PR.
3) Mandanten-Isolation und fail-closed-Verhalten der FIN-0-Stubs unverändert wahren; keine neuen Phantom-error-Codes.
4) Keine neuen Prisma-Modelle für produktive Rechnung/Zahlung; kein Audit-Laufzeit-Change.

Out of Scope: Produktive FIN-2-/8.4-Logik; FIN-4 Mahn; Audit ohne PL-Eintrag.

Qualität: npm run typecheck && npm test — grün vor Push.

Output: PR gegen origin/main mit Scope-Zeile (FIN-0, post-merge PR #1); im PR keine erfundenen Actions-URLs — §5a erledigt QA mit echten Werten nach grünem Lauf auf dem PR-Head.
```

---

## 2) Frontend (apps/web)

```text
Rolle: Senior Frontend apps/web (React, Shell, allowedActions, Finanz-Vorbereitung read-only).

Eingang (Code-Reviewer — Kurzfassung, sinngemäß):
Weiter FIN-0/App-Inkremente; keine Buchungs-/Zahlungs-UI für FIN-2; Feature-Branches von main nach Pull; blocking: kein blocking.

Deine Aufgaben (nummeriert, max. 7):
1) git fetch && git pull origin main; Feature-Branch von main.
2) Finanz (Vorbereitung): nur read-only/Links/Doku vertiefen, passend zu FIN-0 (z. B. `apps/web/README.md` kurz „Stand nach Merge PR #1“ + Verweis Stub-Matrix / Mapping — 2–5 Sätze); keine neuen Schreibpfade an Finanz-APIs.
3) Wenn Backend in derselben Runde Contract oder Client-Signaturen anpasst: minimal nachziehen; sonst keine künstlichen Client-Änderungen.
4) DOC_LINKS / repoDocHref: fehlende sinnvolle Verknüpfungen nur, wenn sie die Review-Rückmeldung (Doku/Transparenz FIN-0) unterstützen.

Out of Scope: Mahn-/Zahlungsbuchung UI; Umgehung allowedActions; FIN-2 produktiv; Tenant-Leaks.

Qualität: npm run test -w apps/web && npm run build:web — grün.

Output: PR gegen origin/main mit Scope-Zeile „FIN-0 UI/Doku post-merge; kein FIN-2.“
```

---

## 3) QA (Testing / Evidence)

```text
Rolle: QA Engineer (Testing, Merge-Evidence, Gate-Lesart).

Eingang (Code-Reviewer — Kurzfassung, sinngemäß):
Merge auf main aus QA-Sicht nicht blockiert (vorbehaltlich keine neue Rotstelle); optional §5a-Kern im PR-#1-Thread auf 5a) mit HTTPS-Run auf main + Squash-SHA des PR-Inhalts; weiter FIN-0; blocking: kein blocking.

Deine Aufgaben (nummeriert, max. 7):
1) docs/contracts/qa-fin-0-gate-readiness.md (§5a / optional 5a) post-merge) lesen; bei optionaler Nachreichung am **gemergten** PR #1 nur echte Run-URL + SHA aus GitHub (Run success, head_sha passend).
2) Für **neue** PRs dieser Runde: nach grünem Actions-Lauf auf dem PR-Head vollständiges §5a im PR-Kommentar (HTTPS, SHA, Team-Regelzeile Evidence-SHA) — keine Platzhalter.
3) docs/contracts/qa-fin-0-stub-test-matrix.md ↔ test/finance-fin0-stubs.test.ts bei Backend-Änderungen konsistent halten.
4) docs/tickets/FIN-2-START-GATE.md: keine Spalte „erfüllt“ ohne PL/Prozess setzen.

Out of Scope: Gate G1–G10 eigenmächtig auf „ja“; erfundene Tracker-URLs.

Qualität: Wenn du Tests/Doku änderst: relevante npm test grün; Doku-only gemäß §3b kennzeichnen.

Output: GitHub-Kommentar(e) mit nachvollziehbarer Evidence — oder explizit „kein neuer Merge-Kandidat in dieser Runde“.
```

---

## 4) Senior Code Review

```text
Rolle: Senior Code Review (FIN-0 / FIN-2-Gate-Vorlage).

Eingang (Code-Reviewer — Kurzfassung, sinngemäß):
Nächste Vier-Prompt-Runde aus derselben Rückmeldung ableiten; blocking wortgleich GitHub-Review; im GitHub-Review absolute Repo-URLs; weiter FIN-0; kein FIN-2 produktiv vor Gate; Audit nur mit PL-Eintrag FOLLOWUP.

Deine Aufgaben (nummeriert, max. 6):
1) Offene PR(s) nach docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md reviewen — FIN-0-Scope, Tenant, OpenAPI/Mapping/error-codes wo berührt, kein FIN-2-Produktivpfad, kein Audit-Risiko ohne PL-Eintrag.
2) Im GitHub-Review durchgehend vollständige `https://github.com/rhermann90/ERP/...`-Links zu Dateien/Commits verwenden (keine relativen Pfade als einzige Referenz).
3) blocking-Zeile im Review so setzen, dass sie wortgleich in der nächsten „Rückmeldung an Projektleitung“ übernommen werden kann (Szenario A oder B nach AGENTEN-PROMPT-LEITFADEN §5).
4) Nach Abschluss: strukturierte **Rückmeldung an Projektleitung** nach prompts/FIN-0-rollenprompts.md inkl. Pflichtzeilen (Actions-Link + Merge blockiert ja/nein) und **blocking** wortgleich GitHub.

Out of Scope: Approve bei fehlendem §5a für den konkreten Merge-PR; FIN-2-Implementationsfreigabe.

Qualität: Review-Kommentar reproduzierbar (Screenshots/Links optional); keine erfundenen Run-IDs.

Output: GitHub-Review(s) + PL-Rückmeldung als **einziger** Eingang für die übernächste Vier-Prompt-Planung (PL-NÄCHSTE-RUNDE-AUS-REVIEW.md §2).
```
