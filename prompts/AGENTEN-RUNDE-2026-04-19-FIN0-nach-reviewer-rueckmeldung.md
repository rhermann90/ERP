# Agenten-Runde — FIN-0 nach Code-Review „Rückmeldung an Projektleitung“

**Datum:** 2026-04-19  
**Eingang (verbindlich):** Strukturierte **Rückmeldung an Projektleitung** vom Senior Code Review — **blocking** wortgleich GitHub-Review: `kein blocking`. Merge-Evidence Squash PR #1: Run `https://github.com/rhermann90/ERP/actions/runs/24538762870`, SHA `ffa8151745465249535b8e29c112026a21bdc7fb`. Geschlossener PR: `https://github.com/rhermann90/ERP/pull/1`. Weiterleitung: nächste Vier-Prompt-Runde sinngemäß aus [`prompts/AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md`](./AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md) ableiten; **weiter FIN-0**; **kein FIN-2 produktiv** vor Gate; **Audit** nur mit PL-Eintrag in `docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`. **Offene Punkte Review:** offene PR(s) auf GitHub listen — vor Bearbeitung dieser Runde erneut prüfen (Stand kann sich ändern).

**Orchestrierung:** [`prompts/AGENTEN-PROMPT-LEITFADEN.md`](./AGENTEN-PROMPT-LEITFADEN.md) §0 / §7 · Sprint: [`docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md`](../docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md).

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
- Erster Arbeitsschritt gemeinsam: **offene PRs** auf GitHub listen (UI oder gh pr list); wenn keine offenen PRs: nächsten FIN-0-PR mit klarer Scope-Zeile eröffnen (kein Leer-PR ohne PL-Koordination).
```

---

## 1) Backend

```text
Rolle: Senior Backend (Node/TypeScript, FIN-0-Stubs, bestehende src/api-Patterns).

Eingang (Code-Review — Rückmeldung an Projektleitung, sinngemäß):
PR #1 squash auf main; CI-Evidence und SHA wie in PL-/Review-Dokumentation; blocking: kein blocking; weiter FIN-0; kein FIN-2 produktiv; Audit nur mit PL-Eintrag FOLLOWUP. Offene PRs auf GitHub listen.

Deine Aufgaben (nummeriert, max. 7):
1) git fetch && git pull origin main. Offene PRs unter https://github.com/rhermann90/ERP/pulls prüfen (oder gh pr list); Befund in PR-Beschreibung oder Team-Chat ein Satz.
2) Wenn **kein** offener Backend-/Fullstack-PR: Feature-Branch von main; **einen** neuen PR mit FIN-0-Scope eröffnen — inhaltlich wie prompts/AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md §1 Backend (Contract/OpenAPI ↔ Stubs ↔ Mapping ↔ error-codes), ohne neues strategisches Ziel jenseits FIN-0.
3) Wenn offene PRs existieren: zuerst diese gemäß Review-Kommentaren schließen oder rebasen; keinen zweiten parallelen PR ohne Absprache.
4) Mandanten-Isolation und fail-closed beibehalten; keine Phantom-error-Codes; kein Audit-Laufzeit-Change ohne PL-Eintrag.

Out of Scope: Produktive FIN-2-/8.4-Logik; FIN-4 Mahn.

Qualität: npm run typecheck && npm test — grün vor Push.

Output: PR-Link(e) gegen origin/main; im PR keine erfundenen Actions-URLs — §5a durch QA nach grünem Lauf auf PR-Head.
```

---

## 2) Frontend (apps/web)

```text
Rolle: Senior Frontend apps/web (React, Shell, allowedActions, Finanz-Vorbereitung read-only).

Eingang (Code-Review — sinngemäß):
Weiter FIN-0/App-Inkremente; blocking: kein blocking; absolute GitHub-URLs in Reviews (Vorbild); offene PRs listen.

Deine Aufgaben (nummeriert, max. 7):
1) git fetch && git pull origin main. Offene PRs unter https://github.com/rhermann90/ERP/pulls prüfen.
2) Wenn kein offener Frontend-PR und Backend in dieser Runde keinen PR öffnet: eigenen kleinen FIN-0-Doku/UI-PR wie prompts/AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md §2 Frontend (README/DOC_LINKS, read-only Finanz-Vorbereitung).
3) Wenn Backend-PR Contract/Client ändert: minimal nachziehen; keine Buchungs-/Zahlungs-UI.

Out of Scope: FIN-2 produktiv; Mahn-/Zahlungsbuchung; Tenant-Leaks.

Qualität: npm run test -w apps/web && npm run build:web — grün.

Output: PR-Link gegen origin/main mit Scope-Zeile „FIN-0; kein FIN-2.“
```

---

## 3) QA (Testing / Evidence)

```text
Rolle: QA Engineer (Testing, Merge-Evidence).

Eingang (Code-Review — sinngemäß):
Merge auf main aus QA-Sicht nicht blockiert (vorbehaltlich keine neue Rotstelle); Evidence Squash PR #1 mit Run/SHA wie dokumentiert; optional §5a) post-merge am PR-#1-Thread; für neue PRs §5a vollständig; blocking: kein blocking.

Deine Aufgaben (nummeriert, max. 7):
1) docs/contracts/qa-fin-0-gate-readiness.md lesen. Optional: am geschlossenen PR https://github.com/rhermann90/ERP/pull/1 §5a auf **5a)** mit HTTPS-Run auf main + Squash-SHA nachziehen — nur echte Werte aus GitHub.
2) Offene PRs listen; für jeden neuen Merge-Kandidaten nach grünem Actions-Lauf auf **PR-Head** vollständiges §5a im PR (HTTPS, SHA, Team-Regel Evidence-SHA).
3) Bei Backend-Änderungen: docs/contracts/qa-fin-0-stub-test-matrix.md ↔ test/finance-fin0-stubs.test.ts konsistent halten.
4) docs/tickets/FIN-2-START-GATE.md: keine „erfüllt“-Spalten ohne PL.

Out of Scope: Erfundene Tracker-URLs; Gate ohne PL setzen.

Qualität: npm test wo angefasst; Doku-only §3b kennzeichnen.

Output: GitHub-Kommentar(e) mit Evidence oder klar „kein neuer Merge-Kandidat“.
```

---

## 4) Senior Code Review

```text
Rolle: Senior Code Review (FIN-0 / GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE).

Eingang (Code-Review — sinngemäß):
Nächste Vier-Prompt-Runde aus Rückmeldung ableiten; blocking wortgleich GitHub; nur absolute https://github.com/rhermann90/ERP/...-URLs in Kommentaren; weiter FIN-0; kein FIN-2 produktiv vor Gate; Audit nur mit PL-Eintrag FOLLOWUP.

Deine Aufgaben (nummeriert, max. 6):
1) Offene PRs unter https://github.com/rhermann90/ERP/pulls prüfen und jeden FIN-0-relevanten PR nach docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md reviewen.
2) Alle Verweise auf Dateien/Commits im GitHub-UI als **vollständige** Repo-URLs schreiben (keine relativen Pfade als einzige Referenz).
3) blocking im Review so formulieren, dass es wortgleich in die nächste „Rückmeldung an Projektleitung“ übernommen werden kann.
4) Nach Abschluss: neue **Rückmeldung an Projektleitung** nach prompts/FIN-0-rollenprompts.md inkl. Pflichtzeilen (Actions-Link + Merge blockiert ja/nein) und blocking wortgleich GitHub.

Out of Scope: Approve ohne vollständiges §5a am Ziel-PR; FIN-2-Freigabe.

Qualität: Reproduzierbare Review-Kommentare; keine erfundenen Run-IDs.

Output: GitHub-Review(s) + PL-Rückmeldung als Eingang für prompts/PL-NÄCHSTE-RUNDE-AUS-REVIEW.md §2 / nächste Runden-Datei.
```
