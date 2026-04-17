# Agenten-Runde — FIN-0: zwei Remote-Branches → PR öffnen, reviewen, §5a

**Datum:** 2026-04-20  
**Eingang (konsolidiert aus Backend / Frontend / QA / Code-Review, Fortsetzung nach `AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md`):**

- **Schritt 0:** `gh` war in Teilen der Umgebung **nicht** installiert; anonyme GET `https://api.github.com/repos/rhermann90/ERP/pulls?state=open` lieferte `[]` — **trotzdem** https://github.com/rhermann90/ERP/pulls im Browser prüfen (Token/Privateinstellungen). Details und `curl`-Fallback: [`AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md`](./AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md) Abschnitt **Schritt 0**.
- **Backend (Remote):** Branch `feat/fin-0-runde-2026-04-19-openapi-mapping-parity` — nach Rebase auf `main` nur noch `docs/contracts/finance-fin0-openapi-mapping.md` (+1 Zeile Idempotency-Stub-Parität zu OpenAPI/Stubs); `npm run typecheck` && `npm test` grün laut Meldung; Tip-Meldung `d37397f` (nach Rebase; vor Push verifizieren).
- **Frontend (Remote):** Branch `feat/fin-0-web-ui-doku-2026-04-19` — DOC_LINKS, A11y `visually-hidden`, README; `npm run test -w apps/web` && `npm run build:web` grün; Tip-Meldung `8e28fca`.
- **QA:** Sonderfall **kein Merge-Gegenstand** solange kein offener PR — **Merge blockiert: nein** mit Begründung laut [`docs/contracts/qa-fin-0-gate-readiness.md`](../docs/contracts/qa-fin-0-gate-readiness.md); optional **5a)**-Text für geschlossenen PR #1 nur mit echten URLs/SHA (Run `24538762870`, Commit `ffa8151745465249535b8e29c112026a21bdc7fb`).
- **Code Review:** GitHub-/PL-Vorlagen und exakte **Szenario-A-blocking-Zeile** in [`AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md`](./AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md); Hinweis **gemischte PRs** bei Variante A.

**GitHub — PR anlegen (manuell, falls noch kein PR existiert):**

- Mapping: https://github.com/rhermann90/ERP/pull/new/feat/fin-0-runde-2026-04-19-openapi-mapping-parity  
- Web UI/Doku: https://github.com/rhermann90/ERP/pull/new/feat/fin-0-web-ui-doku-2026-04-19  

**Compare:**

- https://github.com/rhermann90/ERP/compare/main...feat/fin-0-runde-2026-04-19-openapi-mapping-parity  
- https://github.com/rhermann90/ERP/compare/main...feat/fin-0-web-ui-doku-2026-04-19  

**Orchestrierung:** [`AGENTEN-PROMPT-LEITFADEN.md`](./AGENTEN-PROMPT-LEITFADEN.md) §0 / §5 / §7 · Sprint: [`docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md`](../docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md).

---

## Sofort kopieren — alle Agenten (Chat)

**Reihenfolge:** 1) PL-Vorspann → 2) Backend → 3) Frontend → 4) QA → 5) Senior Code Review.  
**So kopieren:** Nur den **Inhalt** zwischen der öffnenden und schließenden Zeile des jeweiligen Kastens (drei Backticks, erste Zeile mit `text`).  
**Rohdatei:** https://raw.githubusercontent.com/rhermann90/ERP/main/prompts/AGENTEN-RUNDE-2026-04-20-FIN0-zwei-branches-pr-review.md  

### PL / System — Vorspann

```text
Workspace: <absoluter Pfad zum Team-Clone — mit .git und origin>
Remote: git@github.com:rhermann90/ERP.git (siehe prompts/README.md)

PL / System — zuerst:
- Sprint: docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md | Index: docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md
- Diese Runde: prompts/AGENTEN-RUNDE-2026-04-20-FIN0-zwei-branches-pr-review.md — Eingang: konsolidierte Rollen-Meldungen nach 04-19 (zwei FIN-0-Branches, PR auf GitHub öffnen/reviewen).
- Vorlagen: prompts/AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md (GitHub-Review pro PR, PL-Varianten A/B, Schritt 0 inkl. curl-Fallback).
- Domäne: ERP Systembeschreibung v1.3.md | .cursor/rules/erp-multi-agent.mdc
- FIN-2 produktiv: nein — docs/tickets/FIN-2-START-GATE.md G1–G10
- Audit: nur mit PL-Eintrag docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md

Ziel dieser Runde:
- Zwei PRs aus den Remote-Branches (Links in der Runden-Datei oben) auf GitHub anlegen oder bestehende PR-Nummern verlinken.
- Code Review je PR nach Vorlage 04-19; QA §5a nach grünem backend-Job auf PR-Head.
- Optional: alter Branch feat/fin-0-post-pr1-mapping-parity aufräumen, um Verwechslung mit feat/fin-0-runde-2026-04-19-openapi-mapping-parity zu vermeiden (PL/Team-Entscheid).
```

### Backend

```text
Rolle: Senior Backend.

Eingang: Branch feat/fin-0-runde-2026-04-19-openapi-mapping-parity — Mapping-Doku FIN-0 (Idempotency-Stub-Parität); PR auf GitHub öffnen oder bestehenden PR-Nummer in Chat/Tracker setzen.

Deine Aufgaben (max. 8):
1) Schritt 0: curl oder UI — offene PRs; prüfen, ob bereits ein PR für diesen Branch existiert.
2) Falls noch kein PR: PR mit der vorbereiteten Beschreibung (Scope FIN-0, Schritt 0, FIN-2-Gate-Verweis, §5a-Hinweis) anlegen — Links in prompts/AGENTEN-RUNDE-2026-04-20-FIN0-zwei-branches-pr-review.md.
3) Nach PR-Erstellung: auf Review-Kommentare reagieren; bei Push §5a durch QA neu stellen lassen.
4) Keine Stub-/Code-Änderung ohne fachliche Notwendigkeit (laut letzter Meldung nur Mapping-Zeile).
5) feat/fin-0-post-pr1-mapping-parity: mit PL klären, ob Remote-Branch geschlossen/gelöscht werden soll (Doppelpfad vermeiden).
6) npm run typecheck && npm test vor jedem Push grün halten.
7) Evidence: keine erfundenen Actions-URLs in PR-Text.
8) Nach Merge auf main: kurze Notiz an QA für §5a auf dem Merge-PR-Head.

Out of Scope: FIN-2 produktiv; Audit ohne PL.

Qualität: npm run typecheck && npm test

Output: PR-URL https://github.com/rhermann90/ERP/pull/<N>
```

### Frontend

```text
Rolle: Senior Frontend apps/web.

Eingang: Branch feat/fin-0-web-ui-doku-2026-04-19 — DOC_LINKS, A11y, README FIN-0; PR manuell anlegen falls fehlend.

Deine Aufgaben (max. 8):
1) Schritt 0 wie Backend.
2) PR mit Scope „FIN-0 UI/Doku; kein FIN-2“ anlegen (Link in Runden-Datei).
3) Review-Follow-ups; kein api-client-Change ohne Backend-Contract-Änderung.
4) Nach PR-Erstellung: grüner CI → QA §5a einplanen.
5) Keine neuen Finanz-Schreibpfade.
6) npm run test -w apps/web && npm run build:web vor Push.
7) Merge-Konflikte mit main früh per Rebase lösen.
8) Nach Merge: QA informieren.

Out of Scope: FIN-2 UI produktiv.

Qualität: npm run test -w apps/web && npm run build:web

Output: PR-URL https://github.com/rhermann90/ERP/pull/<N>
```

### QA

```text
Rolle: QA Engineer.

Eingang: Sobald PR(s) existieren und Actions grün: §5a vollständig auf dem **jeweiligen** PR; Archiv PR #1 optional 5a) mit echten Werten (Run 24538762870, SHA ffa8151745465249535b8e29c112026a21bdc7fb — nicht erfinden).

Deine Aufgaben (max. 8):
1) Schritt 0 wiederholen kurz vor §5a-Post.
2) Für jeden neuen Merge-Kandidaten: nach grünem backend-Run auf PR-Head §5a (HTTPS, SHA, Team-Regel Evidence-SHA) in denselben PR.
3) Solange kein PR offen: Sonderfall C — Merge blockiert nein mit korrekter Begründung (qa-fin-0-gate-readiness.md).
4) Stub-Matrix bei Backend-Merge auf mapping-PR prüfen.
5) FIN-2-START-GATE.md nicht ohne PL pflegen.
6) Keine Phantom-URLs.
7) Optional PR #1: vorbereiteter 5a)-Block aus Team-Chat nur mit UI-verifizierten Werten posten.
8) Nach jedem Merge: Evidence-Zeile für **diesen** Merge-PR dokumentieren.

Qualität: npm test wenn du Doku/Tests änderst.

Output: GitHub-Kommentar(e) §5a / optional 5a) PR #1
```

### Senior Code Review

```text
Rolle: Senior Code Review.

Eingang: Zwei FIN-0-PRs (Mapping + Web) — Vorlagen und blocking-Regeln in prompts/AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md; gemischte PRs nicht zu einem falschen Sammel-blocking vermischen.

Deine Aufgaben (max. 8):
1) Schritt 0; PR-Nummern für beide Branches in GitHub verifizieren.
2) Pro PR: GitHub-Review-Vorlage aus 04-19 mit echter PR-Nummer; Files changed; §5a Szenario A oder B.
3) blocking je PR **eine** Zeile — wortgleich in Rückmeldung an Projektleitung.
4) Nur absolute https://github.com/rhermann90/ERP/...-URLs.
5) Nach Reviews: Variante A oder B aus 04-19 für PL ausfüllen (bei zwei PRs mit unterschiedlichem blocking: Hinweis „gemischte PRs“ beachten).
6) Eingang §2 für PL-NÄCHSTE-RUNDE-AUS-REVIEW.md aktualisieren (PR-Links, blocking, Evidence je Merge).
7) Merge-Kommentar FIN-2-Gate bei Approve.
8) Kein Approve ohne Szenario B §5a.

Output: GitHub-Reviews + strukturierte Rückmeldung an Projektleitung (blocking wortgleich)
```

---

## Konsolidierte Rückmeldung an Projektleitung (Copy-Paste)

```text
## Rückmeldung an Projektleitung
**Vorspann:** Fortsetzung nach prompts/AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md · Details in prompts/AGENTEN-RUNDE-2026-04-20-FIN0-zwei-branches-pr-review.md · **blocking** wortgleich unten.
### Ergebnis
Schritt 0 (API/curl): keine offenen PRs in der Abfrage; zwei FIN-0-Remote-Branches zur PR-Erstellung: feat/fin-0-runde-2026-04-19-openapi-mapping-parity (Mapping), feat/fin-0-web-ui-doku-2026-04-19 (Web). Backend/Frontend melden grüne Checks lokal vor Push. Code-Review-Vorlagen in 04-19-Doku.
### Begründung
Nächster Schritt ist GitHub-PR + Review + §5a auf PR-Head — kein FIN-2, kein Audit ohne PL.
### Risiken
API vs. UI; paralleler Branch feat/fin-0-post-pr1-mapping-parity — Verwechslung.
### Offene Punkte
PRs anlegen (Links in AGENTEN-RUNDE-2026-04-20-…); optional Branch-Cleanup mit PL.
**Pflicht (neuer Merge-PR):**
- Grüner Actions-Link für **anstehenden** Merge-PR: nein — PR noch zu eröffnen bzw. CI auf PR-Head ausstehend
- Merge auf main aus QA-Sicht blockiert: nein — kein Merge-Gegenstand ohne §5a (Sonderfall C)
**Pflicht (Archiv PR #1):**
- ja — https://github.com/rhermann90/ERP/actions/runs/24538762870 · SHA ffa8151745465249535b8e29c112026a21bdc7fb
### blocking
- kein blocking
### Evidence
- Compare: https://github.com/rhermann90/ERP/compare/main...feat/fin-0-runde-2026-04-19-openapi-mapping-parity · https://github.com/rhermann90/ERP/compare/main...feat/fin-0-web-ui-doku-2026-04-19
- PR-Nummern: <nach Anlage eintragen>
```

---

## Eingang für `PL-NÄCHSTE-RUNDE-AUS-REVIEW.md` §2

- **blocking:** `kein blocking` (Koordinationsstand: noch kein gemergter neuer PR; PRs aus Branches zu öffnen)
- **Offene PRs (Ziel):** nach Anlage `https://github.com/rhermann90/ERP/pull/<N>` ×2 oder Status „in Arbeit“
- **Archiv PR #1:** Run `https://github.com/rhermann90/ERP/actions/runs/24538762870` · SHA `ffa8151745465249535b8e29c112026a21bdc7fb`
- **Nächste Vier-Prompts:** aus dieser Datei + Vorlagen `AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md`; nach erstem Merge Reviewer-Rückmeldung mit **echtem** CI auf PR-Head neu ziehen
