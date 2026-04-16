# PL — Nächste Runde **nur** aus Code-Reviewer-Rückmeldung

**Teamregel (Orchestrierung):** Ab diesem Beschluss bekommt die Projektleitung für die **Planung der nächsten vier Agenten-Prompts** **nur noch** die strukturierte **Rückmeldung an Projektleitung** vom **Senior Code Reviewer** — nicht mehr parallele „Prompt-Wünsche“ von Backend, Frontend oder QA als Eingang für dieselbe Planung (deren Arbeit bleibt über PR, §5a/§5b und Tracker nachweisbar).

**Verbindlich:** Die Projektleitung formuliert die **nächsten vier kopierbaren Prompts** (Backend → Frontend → QA (Testing) → Senior Code Review) **ausschließlich** aus der **„Rückmeldung an Projektleitung“** des **Code Reviewers** — wortgleiches **blocking** zum GitHub-Review, Pflichtzeilen siehe `docs/contracts/qa-fin-0-gate-readiness.md` und `prompts/FIN-0-rollenprompts.md`. **Nicht** Eingang für diese Planung: direkte Rückmeldungen von Backend, Frontend oder QA an die PL (Artefakte laufen über **PR**, **§5a/§5b**, **Tracker**).

**Orchestrierung:** `prompts/AGENTEN-PROMPT-LEITFADEN.md` §0 · **Playbook:** `prompts/README.md`

---

## 1) Was der Code Reviewer **kurz** liefern muss (Copy-Paste-Vorlage)

Der Reviewer sendet **ein** zusammenhängendes Textstück (Chat/Ticket). **Pflichtinhalt** (kann knapp sein):

```text
## Rückmeldung an Projektleitung (Kurzfassung für nächste Prompts)

### Ergebnis
(ein Satz: was wurde auf main / in welchem PR-Zustand reviewed?)

### blocking
(wortgleich zum GitHub-Review: z. B. „kein blocking“ oder eine Zeile Szenario A aus AGENTEN-PROMPT-LEITFADEN §5)

### Pflicht (Merge-Evidence / QA-Sicht)
- Grüner GitHub-Actions-Link für Merge auf main: ja/nein — <echte Run-URL oder „fehlt“>
- Merge auf main aus QA-Sicht blockiert: ja/nein — <eine Kurzbegründung>

### Nächster fokussierter Scope (Vorschlag für PL, max. 5 Aufzählungspunkte)
- …
```

**Ohne** diese Mindestfelder formuliert die PL **keine** neue Vier-Prompt-Runde (Nachforderung beim Reviewer).

**Verbindlich für die PL:** Zuerst **Aktueller Planungsstand** lesen und die nächste Vier-Prompt-Runde **nur** daraus ableiten. Alles unter **Archiv: Szenario A** ist **kein** aktueller Merge-Status auf `main` — nur Gate-Mechanik und Wortlaut-Vorlage für **künftige** PRs ohne vollständiges §5a.

### Aktueller Planungsstand (main nach squash-merge PR #1 — 2026-04-16)

PR #1 squash-merge auf `main`; HEAD `ffa8151745465249535b8e29c112026a21bdc7fb`. §5a war pre-merge vollständig; optional kann QA denselben §5a-Kern auf **5a)** mit Run auf `main` + diesem SHA nachziehen (`docs/contracts/qa-fin-0-gate-readiness.md`).

```text
## Rückmeldung an Projektleitung (Kurzfassung für nächste Prompts — nach Merge)

### Ergebnis
PR #1 squash-merge auf main abgeschlossen. Commit ffa8151745465249535b8e29c112026a21bdc7fb: CI grün (siehe Pflicht). FIN-0-konformität der gemergten Änderungen unverändert (Tenant, kein FIN-2-Produktivpfad, Mapping/error-codes konsistent wo berührt, kein Audit ohne PL-Eintrag).

### blocking
kein blocking

### Pflicht (Merge-Evidence / QA-Sicht)
- Grüner GitHub-Actions-Link für main nach Merge: ja — https://github.com/rhermann90/ERP/actions/runs/24538762870
- Merge auf main aus QA-Sicht blockiert: nein — vorbehaltlich keine neue Rotstelle / kein SHA-Widerspruch

### Nächster fokussierter Scope (Vorschlag für PL, max. 5 Aufzählungspunkte)
- Neue Feature-Branches von `main` (aktueller HEAD oben); keine Phantom-SHAs/Run-URLs in Prompts.
- Nächste Vier-Prompt-Runde (Backend → Frontend → QA → Review) aus **dieser** Rückmeldung ableiten (`AGENTEN-PROMPT-LEITFADEN.md` §7); blocking wortgleich GitHub-Review.
- QA optional: §5a-Kern im PR #1-Thread auf **5a)** mit HTTPS-Run auf `main` + SHA ffa8151745465249535b8e29c112026a21bdc7fb; optional Zeile „QA-Kern (Permalink)“.
- Code Review: absolute Repo-URLs in Kommentaren (`GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`).
- Weiter FIN-0/App-Inkremente; kein FIN-2 produktiv vor Gate; Audit nur mit PL-Eintrag FOLLOWUP.
```

### Archiv: Szenario A (Vorlage — PR #1 **vor** Merge; **nicht** als IST-Zustand verwenden)

**Warnung:** PR #1 ist **geschlossen und auf `main` gemerged**. Der folgende Abschnitt ist **Archiv**: Gate-Logik und Copy-Paste-Beispiel für **zukünftige** PRs, solange §5a im Ziel-PR fehlt. **Nicht** für die aktuelle PL-Runde übernehmen.

#### Gate-Mechanik für künftige PRs (Referenz — Rundenbezug `prompts/AGENTEN-RUNDE-2026-04-17-FIN0-fortsetzung-nach-gruenem-backend-ci.md`)

**PL-Vorspann (Review-Eingang):** Workspace Team-Clone; Remote `git@github.com:rhermann90/ERP.git`. Sprint: `docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md` · Index `docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md`. Nach Umsetzung Backend/Frontend/QA: **ein oder mehrere PRs** — **§5a** in einer Agent-Antwort **ohne** GitHub-Beleg nicht ausreichend (keine erfundenen URLs/SHAs). **Bei offenem PR ohne vollständiges §5a:** Code-Reviewer-Rückmeldung **Szenario A**; **blocking** wortgleich GitHub. **Keine** erfundenen Actions-URLs/SHAs. Domäne / Regeln: `ERP Systembeschreibung v1.3.md` · `.cursor/rules/erp-multi-agent.mdc`. FIN-2 nur nach `docs/tickets/FIN-2-START-GATE.md`. Merge-Evidence: `docs/contracts/qa-fin-0-gate-readiness.md` §5a / §5b.

**Harte Regel:** **Kein** Approve und **kein** Merge auf `main`, bis QA **§5a vollständig** im **jeweiligen Ziel-PR** nachgereicht hat (Run-URL + SHA + **eine** Zeile Team-Regel Evidence-SHA). Danach: **Files changed** erneut prüfen (FIN-0-Konsistenz, OpenAPI/Mapping/`error-codes.json` wo berührt, Tenant, kein FIN-2-Produktivpfad, kein Audit-Laufzeit-Change ohne PL-Eintrag in `docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`). Erst bei **Szenario B** (`prompts/AGENTEN-PROMPT-LEITFADEN.md` §5): **Approve**; anschließend **neue** „Rückmeldung an Projektleitung“ nach `prompts/FIN-0-rollenprompts.md` (Pflichtzeilen, **blocking** wortgleich GitHub) — **einziger** Eingang für die **nächste** planbare Vier-Prompt-Runde (`PL-NÄCHSTE-RUNDE-AUS-REVIEW.md` §1), sofern nicht erneut explizit anders beauftragt (`AGENTEN-PROMPT-LEITFADEN.md` §0). Review-Vorlage: `docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`.

`git pull origin main` im Team-Clone: vor jedem Review erneut ausführen. **§5a** nur mit **echten** Werten aus der GitHub-UI am PR.

**Beispiel abgeschlossener PR (nur Referenz):** https://github.com/rhermann90/ERP/pull/1 — squash auf `main`, Commit `ffa8151745465249535b8e29c112026a21bdc7fb`. **5a-pre)**-Vorlage + `curl|jq`-Hilfe: [`prompts/KOPIERBLOECKE-GIT-REMOTE-UND-PROMPTS.md`](./KOPIERBLOECKE-GIT-REMOTE-UND-PROMPTS.md). Für **neue** PRs: Abschnitt und PR-Nummer im Repo/Chat anpassen. **Vor dem Posten am PR:** `RUN_ID` und `SHA` aus der GitHub-UI oder per `jq` einsetzen (Run **success**, `head_sha` = PR-Head).

```text
## Rückmeldung an Projektleitung (Kurzfassung für nächste Prompts)

(ARCHIV-VORLAGE — PR #1 pre-merge; nicht aktueller Status auf main)

**Vorspann (Senior Code Review):** Runde prompts/AGENTEN-RUNDE-2026-04-17-FIN0-fortsetzung-nach-gruenem-backend-ci.md; Team-Clone <absoluter Pfad>; Remote git@github.com:rhermann90/ERP.git. Nach Umsetzung Backend/Frontend/QA: ein oder mehrere PRs — §5a in dieser Agent-Antwort nicht an GitHub belegt (keine erfundenen URLs/SHAs). blocking wortgleich GitHub-Review (Szenario A).

### Ergebnis
FIN-0-Vertiefung (Contract/Web/QA/Review) laut Rundenauftrag; Merge auf main aus Review-Sicht nicht freigegeben, bis §5a am Ziel-PR vollständig und Files changed erneut gegen Gate-Vorlage geprüft sind. Nächste planbare Vier-Prompt-Runde: ausschließlich aus dieser Rückmeldung + wortgleichem blocking (PL-NÄCHSTE-RUNDE-AUS-REVIEW.md §1), sofern nicht erneut explizit anders beauftragt (AGENTEN-PROMPT-LEITFADEN.md §0).

### blocking
Merge-Evidence laut qa-fin-0-gate-readiness.md §5a im PR noch nicht vollständig (grüner Actions-Link + SHA + Team-Regel Evidence-SHA) — kein Approve bis zur Nachreichung.

### Pflicht (Merge-Evidence / QA-Sicht)
- Grüner GitHub-Actions-Link für Merge auf main: nein — fehlt (in dieser Antwort nicht verifiziert; am PR eintragen, keine erfundene URL)
- Merge auf main aus QA-Sicht blockiert: ja — §5a für den konkreten Merge unvollständig / nicht hier belegt

### Begründung (kurz)
§5a ist verbindliche Merge-Evidence (docs/contracts/qa-fin-0-gate-readiness.md); ohne vollständige, plausible Zuordnung Run/SHA/Merge-Commit bleibt Szenario A.

### Risiken (max. 3)
- Lokaler git status weicht von GitHub-PR ab (nicht gepushte Änderungen).
- Jeder Push invalidiert die letzte CI-/Evidence-Annahme.

### Offene Punkte / PL-Entscheidung nötig
- QA: §5a **im GitHub-PR** nachreichen (Kommentar/Beschreibung): Vorlage + Platzhalter aus `prompts/KOPIERBLOECKE-GIT-REMOTE-UND-PROMPTS.md` — `<RUN_ID>` / `<SHA…>` mit UI oder `curl|jq` ersetzen, Run **success**, `head_sha` = PR-Head.

### Nächster fokussierter Scope (Vorschlag für PL, max. 5 Aufzählungspunkte)
- QA: Vollständiges §5a am Ziel-PR (HTTPS Run-URL + SHA des PR-Head-Runs + eine Zeile Team-Regel Evidence-SHA); Vorlage 5a-pre in qa-fin-0-gate-readiness.md §5.
- Code Review: Nach §5a erneut Files changed + GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md — erst dann Approve (Szenario B) und neue Rückmeldung an PL.
- Backend/Frontend: Kein neuer Umfang, der §5a erschwert, bis Evidence steht; kein Audit ohne PL-Eintrag; kein FIN-2 produktiv.
- PL/Team: Merge-Ziel-PR und Branch ein Satz im PR/Chat fixieren.
- Tracker: echte Issue-URLs ins PR, keine Platzhalter.

### Evidence (kurz)
- QA: Run-URL + SHA + Team-Regelzeile am PR einfügen (nicht in Agent-Chat erfinden).
- Backend/Frontend: PR-Link(s) vom Team.
- Code Review: Changes requested (Szenario A) bis §5a; danach ggf. Approve Szenario B.
```

**GitHub-Review am PR:** Markdown nach `docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md` — Abschnitt **blocking** wortgleich der Zeile unter „### blocking“ im Review zum **jeweiligen** PR (Szenario A oder B).

---

## 2) Was die PL daraus macht (Arbeitsregel)

1. **Kurz prüfen:** `blocking` und GitHub-Review identisch? Pflichtzeilen vollständig?  
2. **PL-Vorspann** einmal formulieren (Workspace, Sprint-Links, Gates, **keine** erfundenen SHAs/Run-URLs).  
3. **Vier Prompts** in fester Reihenfolge erzeugen — jeder Prompt **muss** enthalten:  
   - **Rolle** (eine der vier)  
   - **Eingang / Kontext** (nur aus der Review-Rückmeldung zitieren oder paraphrasieren, ohne neue Ziele erfinden)  
   - **Konkrete Aufgaben** (nummeriert, max. 5–8 Punkte)  
   - **Explizit verboten / Out-of-Scope** (FIN-2, Audit ohne PL-Eintrag, Phantom-Codes, …)  
   - **Qualitätsbefehl** (z. B. `npm run typecheck && npm test`, Web-Build, …)  
   - **Output** (PR-Link, §5a-Kommentar, Review auf PR X — **keine** erfundenen URLs)

---

## 3) Skelett: Vier Agenten-Prompts (Platzhalter)

### 3a) Backend

```text
Rolle: Senior Backend.

Eingang (Code-Reviewer, wörtlich oder Auszug):
<REVIEWER_RUECKMELDUNG_AUSZUG>

Deine Aufgaben:
1) …
2) …
Out of Scope: …
Qualität: npm run typecheck && npm test
Output: Ein PR gegen origin/main mit Scope-Zeile im PR-Text; kein FIN-2 produktiv ohne Gate.
```

### 3b) Frontend

```text
Rolle: Senior Frontend apps/web.

Eingang (Code-Reviewer):
<REVIEWER_RUECKMELDUNG_AUSZUG>

Deine Aufgaben:
1) …
Out of Scope: …
Qualität: npm run test -w apps/web && npm run build:web (oder Repo-Standard)
Output: PR gegen origin/main; keine Buchungs-/Zahlungs-UI für FIN-2.
```

### 3c) QA (Testing)

```text
Rolle: QA Engineer (Testing / Evidence).

Eingang (Code-Reviewer):
<REVIEWER_RUECKMELDUNG_AUSZUG>

Deine Aufgaben:
1) …
Out of Scope: …
Qualität: relevante npm test / Doku-PR kennzeichnen
Output: §5a-Vorbereitung nur mit echten Actions-URLs nach grünem Lauf; FIN-2-Start-Gate nicht ohne PL befüllen.
```

### 3d) Senior Code Review

```text
Rolle: Senior Code Review.

Eingang (Code-Reviewer vorherige Runde + offene PRs):
<REVIEWER_RUECKMELDUNG_AUSZUG>

Deine Aufgaben:
1) Review nach docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md für PR(s) …
2) Nach Abschluss wieder **Rückmeldung an Projektleitung** nach prompts/FIN-0-rollenprompts.md (Pflichtzeilen, blocking wortgleich GitHub).

Output: GitHub-Review + strukturierte PL-Rückmeldung für die **übernächste** Prompt-Planung.
```

---

## 4) Beispiel: **Kurze** Review-Rückmeldung (**nur** Lehrtext — **nicht** mit Platzhalter-Run-ID in echte PRs kopieren)

```text
## Rückmeldung an Projektleitung (Kurzfassung für nächste Prompts)

### Ergebnis
Backend-FIN-0-Stubs auf main sind reviewed; keine Abweichung OpenAPI/Mapping festgestellt.

### blocking
kein blocking

### Pflicht (Merge-Evidence / QA-Sicht)
- Grüner GitHub-Actions-Link für Merge auf main: ja — https://github.com/rhermann90/ERP/actions/runs/RUN_ID_PLATZHALTER
- Merge auf main aus QA-Sicht blockiert: nein — kein offener §5a-Mangel für den zuletzt gemergten Backend-Commit.

### Nächster fokussierter Scope (Vorschlag für PL, max. 5 Aufzählungspunkte)
- Frontend: Route „Finanz (Vorbereitung)“ read-only + README-Abschnitt Finanz.
- QA: FIN-0-Stub-Testmatrix + Verweis §5a-Felder nach nächstem Merge.
- Backend: in dieser Runde **kein** weiterer Umfang außer Review-Followups aus GitHub.
- Kein FIN-2 Implementierungsstart; Audit unverändert.
```

**Hinweis:** `RUN_ID_PLATZHALTER` im echten Betrieb durch die **echte** Run-ID aus der GitHub-UI ersetzen.

---

## 5) Beispiel: **Nächste vier kopierbaren Prompts** (PL-Ableitung aus §4)

*PL-Vorspann (vor den vier Blöcken, einmal in die Session):*

```text
Workspace: <Team-Clone-Pfad>
Remote: git@github.com:rhermann90/ERP.git

PL / System — zuerst:
- Sprint: docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md | Index: docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md
- Eingang dieser Runde: ausschließlich Code-Reviewer-Kurzfassung (siehe prompts/PL-NÄCHSTE-RUNDE-AUS-REVIEW.md §4 Beispiel).
- Domäne: ERP Systembeschreibung v1.3.md | .cursor/rules/erp-multi-agent.mdc
- FIN-2 nur nach docs/tickets/FIN-2-START-GATE.md

Regeln: prompts/README.md | Merge-Evidence: docs/contracts/qa-fin-0-gate-readiness.md §5a
```

### Prompt 1 — Backend

```text
Rolle: Senior Backend.

Eingang (Code-Reviewer): Backend-FIN-0-Stubs auf main reviewed; blocking kein blocking; kein weiterer Backend-Umfang in dieser Runde außer **expliziten** GitHub-Review-Followups (Changes requested).

Deine Aufgaben:
1) git pull origin main
2) Prüfe offene Review-Kommentare zu PR(s), die FIN-0-Stubs betreffen; falls **keine** offenen Changes requested: in dieser Runde **keinen** neuen Feature-PR öffnen — optional Mini-PR nur bei konkretem Review-Finding (im PR verlinken).
3) Kein AuditService-/Dual-Write-Change ohne PL-Eintrag FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md
Qualität: npm run typecheck && npm test vor jedem Push
Output: Entweder kein PR nötig (kurz im Team kommunizieren) oder kleiner Followup-PR mit Referenz auf GitHub-Review-Kommentar-ID.
```

### Prompt 2 — Frontend

```text
Rolle: Senior Frontend apps/web.

Eingang (Code-Reviewer): Nächster Fokus Frontend — Route „Finanz (Vorbereitung)“ read-only + README-Abschnitt Finanz.

Deine Aufgaben:
1) git pull origin main
2) Route oder Seite „Finanz (Vorbereitung)“: nur Lesen/Information, Links zu docs/adr/0007-finance-persistence-and-invoice-boundaries.md, docs/tickets/FIN-2-START-GATE.md, docs/contracts/finance-fin0-openapi-mapping.md (Navigation wie im bestehenden Web-Stack).
3) apps/web/README.md: Abschnitt „Finanz“ (3–5 Sätze, FIN-0 vs FIN-4/FIN-6, Offline 8.14 nur dokumentieren).
Out of Scope: Buchungs-, Zahlungs-, Mahn-UI; allowedActions nicht umgehen.
Qualität: npm run test -w apps/web && npm run build:web
Output: Ein PR gegen origin/main, Scope-Zeile „FIN-0 UI-Vorbereitung only; kein FIN-2.“
```

### Prompt 3 — QA (Testing)

```text
Rolle: QA Engineer (Testing / Evidence).

Eingang (Code-Reviewer): QA soll FIN-0-Stub-Testmatrix und §5a-Felder für nächsten Merge vorbereiten; Merge aktuell nicht QA-blockiert.

Deine Aufgaben:
1) git pull origin main
2) FIN-0-Stub-Testmatrix (Happy/Edge/Negative) dokumentieren oder erweitern — erwartete Codes laut docs/contracts/finance-fin0-openapi-mapping.md; Backend-Tests test/finance-fin0-stubs.test.ts referenzieren statt duplizieren wo möglich.
3) In docs/contracts/qa-fin-0-gate-readiness.md oder verlinktem Artefakt: welche §5a-Zeilen nach **nächstem** relevanten Merge auszufüllen sind (RUN_ID/SHA nur nach echtem grünen Lauf).
Out of Scope: FIN-2-START-GATE.md Spalte „erfüllt“ nicht ohne PL setzen.
Qualität: Falls Tests ergänzt: npm test; sonst Doku-PR klar kennzeichnen (§3b).
Output: PR mit QA-Artefakt; keine erfundenen Actions-URLs.
```

### Prompt 4 — Senior Code Review

```text
Rolle: Senior Code Review.

Eingang (Code-Reviewer): Vorherige Runde abgeschlossen; nächste Reviews für Frontend-/QA-PRs erwartet.

Deine Aufgaben:
1) git pull origin main
2) Review der neuen PRs (Frontend FIN-0 UI, QA Doku/Tests) nach docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md — Tenant, keine FIN-2-Produktivpfade, keine Phantom-error-codes.
3) Nach jedem Review: **Rückmeldung an Projektleitung** nach prompts/FIN-0-rollenprompts.md inkl. Pflichtzeilen und **blocking** wortgleich GitHub — das ist der **einzige** Eingang für die **übernächste** Vier-Prompt-Runde.

Output: GitHub-Reviews + PL-Rückmeldungstext für PL-NÄCHSTE-RUNDE-AUS-REVIEW.md §1.
```

---

## 6) Wartung

Änderungen an Pflichtzeilen oder Review-Format: **gemeinsam** `docs/contracts/qa-fin-0-gate-readiness.md`, `prompts/FIN-0-rollenprompts.md`, `prompts/AGENTEN-PROMPT-LEITFADEN.md` und **dieses** Dokument anpassen, damit keine parallelen Wahrheiten entstehen.

---

## 7) GitHub PR — Evidence-Abschnitt **„Backend“** (feste Links; **keine** erfundene PR-/Actions-URL)

Diesen Block in die **GitHub-PR-Beschreibung** übernehmen (oder als ersten strukturierten Kommentar), wenn die **PR-Nummer** noch unbekannt ist — die Links sind **ohne Platzhalter** gültig. **§5a** (grüner Actions-Run + SHA + Team-Regelzeile) trägt **QA** nach grünem Lauf **im PR** nach (`docs/contracts/qa-fin-0-gate-readiness.md` §5a); Backend erfindet **keine** Run-IDs/SHAs.

```markdown
### Backend (Evidence)

- **Remote:** `git@github.com:rhermann90/ERP.git`
- **Repository:** https://github.com/rhermann90/ERP
- **Branch:** https://github.com/rhermann90/ERP/tree/feat/fin-0-web-finance-vorbereitung
- **Diff vs. `main`:** https://github.com/rhermann90/ERP/compare/main...feat/fin-0-web-finance-vorbereitung?expand=1

**Scope-Zeile:** FIN-0 (HTTP-Stubs / Web-Vorbereitung / Tests & Doku im Bundle-Branch); **FIN-2 produktiv out of scope** bis `docs/tickets/FIN-2-START-GATE.md`; keine Audit-Laufzeitänderung ohne PL-Eintrag in `docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`.

**§5a (Merge-Evidence):** QA ergänzt nach **grünem** Workflow (`.github/workflows/ci.yml`, Job `backend`) im **selben** PR: HTTPS-Run-URL, Commit-SHA des Runs, eine Zeile Team-Regel Evidence-SHA — bis dahin **Merge QA-blockiert** (Szenario A).
```
