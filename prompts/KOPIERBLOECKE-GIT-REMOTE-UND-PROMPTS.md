# Kopierblöcke — Git-Remote, Push, Prompts, §5a (Vorlagen)

**Team-Remote (SSH, empfohlen):** `git@github.com:rhermann90/ERP.git`  
**Team-Remote (HTTPS):** `https://github.com/rhermann90/ERP.git`  
**Aktuellen Commit für Browser-Links:** `git rev-parse HEAD` (nicht raten; alte SHAs in dieser Datei veralten sonst).  
**Root-Import (historisch):** `0f12ea9c78a45328f0ec638d2e66a6b642b01738`  
**Workspace-Beispiel:** `/Users/romanhermann/Projekte/ERP` (jeder Team-Clone: eigener Pfad)

**Platzhalter:** In Abschnitt 5 weiterhin **`RUN_ID`** und **`SHA`** nur aus der echten GitHub-Actions-UI kopieren (nicht erfinden).

**Schlüssel:** Private Keys **nur** unter `~/.ssh/`, **nie** im Repo-Ordner; Standard-Keynamen sind in `.gitignore` ausgeschlossen.

---

## 0) PL-Preflight (vor jeder Orchestrierungs-Runde)

Im **Team-Clone** ausführen (`cd` auf euren Pfad):

```bash
git remote -v
# Erwartung: origin → git@github.com:rhermann90/ERP.git (oder HTTPS-URL aus prompts/README.md)

git status -sb
# Erwartung: bewusster Scope; keine Secrets / keine Private-Key-Dateien im Staging
```

**SSH zu GitHub prüfen** (welcher Key wird angeboten; „Never used“ in GitHub-Einstellungen verschwindet nach erfolgreicher Nutzung oft verzögert):

```bash
ssh -vT git@github.com 2>&1 | grep -E 'Offering public key|Hi |Authenticated to'
```

---

## 1) Remote setzen und `main` pushen (HTTPS)

```bash
cd /Users/romanhermann/Projekte/ERP

git remote add origin https://github.com/rhermann90/ERP.git
# Falls origin schon existiert:
# git remote set-url origin https://github.com/rhermann90/ERP.git

git branch -M main
git push -u origin main
```

**Nach erfolgreichem Push** (lokal: SSH-Agent mit GitHub-Key **oder** HTTPS mit PAT / `gh auth login`):

- Repo im Browser: `https://github.com/rhermann90/ERP`
- Aktueller Commit im Browser (lokal im Clone ausführen):  
  `echo "https://github.com/rhermann90/ERP/commit/$(git rev-parse HEAD)"`

---

## 2) Remote setzen (SSH) — falls Team SSH nutzt

```bash
cd /Users/romanhermann/Projekte/ERP

git remote add origin git@github.com:rhermann90/ERP.git
git branch -M main
git push -u origin main
```

---

## 3) PL-Vorspann (nächste Vier-Agenten-Runde, copy-paste)

```text
Workspace: /Users/romanhermann/Projekte/ERP
Remote-Ziel nach Push: https://github.com/rhermann90/ERP

PL / System — zuerst:
- Sprint: docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md | Index: docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md
- Playbook: prompts/README.md (nur Team-Clone; nächste Prompt-Runde nur aus Code-Review-Rückmeldung)
- Leitfaden: prompts/AGENTEN-PROMPT-LEITFADEN.md §0
- Domäne: ERP Systembeschreibung v1.3.md | .cursor/rules/erp-multi-agent.mdc
- Audit-Code nur mit vollständigem PL-Eintrag: docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md
- FIN-2 produktiv: docs/tickets/FIN-2-START-GATE.md

Diese Runde: Nach erstem Push — PR-Evidence vorbereiten; nächste Prompts erst nach Code-Review-Rückmeldung (blocking wortgleich).
```

---

## 4) Vier Agenten-Prompts (copy-paste, eine Runde „nach Initial-Push“)

### Backend

```text
Rolle: Senior Backend. Repo: /Users/romanhermann/Projekte/ERP, Remote https://github.com/rhermann90/ERP.git.

1) git pull origin main
2) Keine Audit-Laufzeit / keine OpenAPI- oder error-codes-Änderung ohne separates Gate.
3) npm run typecheck && npm test
4) Nächste Arbeit als kleiner PR gegen origin/main — kein PL-Rückmeldeformat (nur Code Reviewer liefert das für die nächste Prompt-Planung).
```

### Frontend

```text
Rolle: Senior Frontend apps/web. Repo: /Users/romanhermann/Projekte/ERP.

1) git pull origin main
2) npm run test -w apps/web && npm run build:web
3) Tracker-URLs nur echt aus GitHub/Jira — z. B. Issue-URL: https://github.com/rhermann90/ERP/issues/<NUMMER>
```

### QA

```text
Rolle: QA. Repo: /Users/romanhermann/Projekte/ERP.

1) Nach jedem Merge-PR auf main: Workflow https://github.com/rhermann90/ERP/blob/main/.github/workflows/ci.yml prüfen, Job backend grün.
2) §5a-Kommentar erst mit echter Run-URL (siehe Abschnitt 5 unten).
```

### Code Review

```text
Rolle: Senior Code Review. Repo: /Users/romanhermann/Projekte/ERP.

1) Review nach docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md
2) Verbindlich: Rückmeldung an Projektleitung (Format prompts/FIN-0-rollenprompts.md), blocking wortgleich zum GitHub-Review — einziger Eingang für die nächsten vier Prompts (prompts/AGENTEN-PROMPT-LEITFADEN.md §0).
```

---

## 5) QA — Merge-Evidence §5a (nach **grünem** Actions-Lauf, Platzhalter ersetzen)

**Nur ausfüllen, wenn** ihr einen **echten** grünen Run auf GitHub habt (`RUN_ID` und `SHA` aus der Actions-UI kopieren — **nicht** erfinden).

```text
## QA — Merge-Evidence (main)

Actions (grün): https://github.com/rhermann90/ERP/actions/runs/RUN_ID — Commit SHA = Merge auf main — Job `backend`

Team-Regel Evidence-SHA (Pflicht: genau eine Zeile, vom Team bestätigt; QA ratet nicht): <z. B. „SHA = Squash-Merge-Commit auf main“ ODER „SHA = Merge-Commit (no squash)“>

Kontext FIN-0 / Gate: docs/contracts/qa-fin-0-gate-readiness.md | FIN-2-Start-Gate: docs/tickets/FIN-2-START-GATE.md
```

### 5a) FIN-0 — PR #1 (`feat/fin-0-web-finance-vorbereitung`) — **5a-pre)** vorbefüllt

**Merge-Ziel-PR:** https://github.com/rhermann90/ERP/pull/1  

**Hinweis:** `RUN_ID` und vollständiger `SHA` aus der **GitHub-UI** oder per **`curl|jq`** unten (öffentliche API). **Vor dem Posten am PR:** Run **success**; `head_sha` des Laufs = **PR-Head** (erstes `curl`). Fest eingetragene Beispiel-Zahlen im Repo **veralten** nach jedem Push — deshalb im Copy-Block unten **Platzhalter**; Werte immer frisch holen.

**Optional (Terminal, öffentliche API):** neuesten Run auf dem Branch — `head_sha` muss dem PR-Head entsprechen:

```bash
curl -sS "https://api.github.com/repos/rhermann90/ERP/pulls/1" | jq -r '"PR head: " + .head.sha'
curl -sS "https://api.github.com/repos/rhermann90/ERP/actions/runs?branch=feat/fin-0-web-finance-vorbereitung&per_page=1" \
  | jq -r '.workflow_runs[0] | "Neuester Run: " + (.id|tostring) + " conclusion=" + .conclusion + " head_sha=" + .head_sha'
```

*Orientierungsbeispiel (nach Push oft falsch — nur gegenprüfen): Run `24536117032`, Head `3b9b8f00e5a5a724596f1f8c80a4db9e37fe74e7`, `success`.*

```text
## QA — Merge-Evidence (PR — pre-merge)

Actions (grün): https://github.com/rhermann90/ERP/actions/runs/<RUN_ID> — Commit <SHA_AUS_RUN_DETAIL_PR_HEAD> — geprüfter PR-Head, Job `backend`

Team-Regel Evidence-SHA (Pflicht: genau eine Zeile, vom PL/Team bestätigt; QA ratet nicht): SHA = Commit aus Run-Detail (PR-Head); Merge auf main erst nach Approve unter dieser Evidence.

QA-Kern (Permalink) — optional (Team empfohlen): <nach dem Posten: Kommentar-Zeitstempel in GitHub anklicken, HTTPS-URL der Seite kopieren>

Kontext FIN-0 / Gate: docs/contracts/qa-fin-0-gate-readiness.md | FIN-2-Start-Gate: docs/tickets/FIN-2-START-GATE.md
```

Optional **darunter** (gleicher Kommentar, laut `qa-fin-0-gate-readiness.md` §5c): Stub-Matrix / manuelle Stichproben — **kein** Ersatz für den grünen `backend`-Run.

**Direktlink Root-Import** (nach Push):

`https://github.com/rhermann90/ERP/commit/0f12ea9c78a45328f0ec638d2e66a6b642b01738`

---

## 6) Code Reviewer — Rückmeldung an Projektleitung (Rumpf, nach Review)

```text
## Rückmeldung an Projektleitung

### Ergebnis
(kurz)

### Begründung
(1–3 Sätze)

### Risiken
- (max. 3)

### Offene Punkte / PL-Entscheidung nötig
- Blockiert: ja / nein
- …

**Pflicht (Merge-Evidence / QA-Sicht — immer ausfüllen):**
- **Grüner GitHub-Actions-Link für Merge auf `main` vorhanden (PR-Evidence):** ja / nein — …
- **Merge auf `main` aus QA-Sicht blockiert:** ja / nein — …

### blocking
(wortgleich zum GitHub-Review — oder: kein blocking)

### Evidence
- **QA:** …
- **Backend:** PR-Link https://github.com/rhermann90/ERP/pull/NUMMER
- …
```

---

## 7) Hinweis: Anderer GitHub-Account

Konfiguriertes Team-Remote ist **`rhermann90/ERP`**. Ein anderes Konto (z. B. anderer Benutzername auf dem Mac) ändert nichts an der URL — nur pushen, wer auf GitHub Schreibrechte für dieses Repo hat.
