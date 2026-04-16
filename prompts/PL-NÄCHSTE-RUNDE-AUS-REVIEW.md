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

### Lieferung Code-Review (aktuelle Runde — Branch `feat/fin-0-web-finance-vorbereitung` vs `origin/main`)

`git pull origin main` im Team-Clone: **Already up to date.** Review ohne GitHub-PR-Nummer (kein `gh`); Diff lokal `origin/main..HEAD`.

```text
## Rückmeldung an Projektleitung (Kurzfassung für nächste Prompts)

### Ergebnis
Ein zusammenhängender Branch enthält FIN-0-Frontend (read-only „Finanz (Vorbereitung)“, Hash-Route, `getInvoice` nur GET), QA-Artefakte (`docs/contracts/qa-fin-0-stub-test-matrix.md`, Ergänzungen in `qa-fin-0-gate-readiness.md`), kleine Backend-Anpassungen (Kommentar `finance-fin0-stubs.ts`, zusätzlicher Stub-Test 401) sowie `prompts/*` und eine Zeile `docs/ENTWICKLUNGSPHASEN-MVP-V1.3.md`. Keine Phantom-Domain-Codes im Diff; `getInvoice` nutzt dieselbe Tenant/Bearer-Header-Kette wie `requestJson`. Kein produktives FIN-2-UI.

### blocking
Merge-Evidence laut `qa-fin-0-gate-readiness.md` **§5a** im PR noch nicht vollständig (grüner Actions-Link + SHA + Team-Regel Evidence-SHA) — **kein Approve** bis zur Nachreichung.

### Pflicht (Merge-Evidence / QA-Sicht)
- Grüner GitHub-Actions-Link für Merge auf main: nein — fehlt (in dieser Review-Sitzung kein Run verlinkt; keine erfundene URL)
- Merge auf main aus QA-Sicht blockiert: ja — §5a für den konkreten Merge unvollständig

### Nächster fokussierter Scope (Vorschlag für PL, max. 5 Aufzählungspunkte)
- QA: Nach grünem CI vollständiges §5a im PR (Run-URL + SHA + eine Zeile Team-Regel Evidence-SHA); bei mehreren offenen PRs klären, welcher Run den Merge auf `main` belegt.
- PL/Team: PR-Beschreibung/Scope-Zeile — ob bewusst **ein** Bundle-PR (Frontend+QA+kleine Backend-Stub-Ergänzung) oder Aufteilung nach Wunsch; bei getrennter Kommunikation „nur Frontend/QA“ follow-up für Transparenz.
- Frontend: Nach Merge — Stichprobe `apps/web` gegen Gate-Vorlage (keine Schreibaktionen auf Finanz-Vorbereitungsseite; weiterhin nur `allowed-actions`-SoT für Mutationen).
- Backend: In dieser Runde nur Stub-Test/Kommentar mitreviewt; kein Audit-Laufzeit-Change.
- Kein FIN-2 produktiv; Audit nur mit PL-Eintrag FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md.
```

**GitHub-Review am PR:** Markdown mit Vorbedingung PL, Umfang „Files changed“, Kurz-8-Punkte, Frontend/QA/Backend-Stichprobe — Abschnitt **blocking** wortgleich der Zeile unter „### blocking“ oben (Szenario A laut `prompts/AGENTEN-PROMPT-LEITFADEN.md` §5).

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

## 4) Beispiel: **Kurze** Review-Rückmeldung (fiktiv, Run-ID Platzhalter)

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
