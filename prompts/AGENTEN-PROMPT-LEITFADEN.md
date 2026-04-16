# Leitfaden — Projektleitung: Agenten-Prompts (Orchestrierung)

**Zweck:** Einheitliche **Vorgaben** für alle künftigen Agenten-Runden — Arbeit **nur im Team-Clone**; abgeleitet aus Sprint-Rahmen, QA-Dokument und Review-Praxis (Git/Evidence/Tracker). **Projektleitung** nutzt dieses Dokument beim Formulieren der **nächsten kopierbaren Prompts** (Eingang: **ausschließlich** die **Code-Review-Rückmeldung**, §0) und beim Abgleich von **blocking** mit dem GitHub-Review.

**Verknüpfungen:** [`prompts/README.md`](./README.md) (Playbook, Team-Clone) · [`prompts/PL-NÄCHSTE-RUNDE-AUS-REVIEW.md`](./PL-NÄCHSTE-RUNDE-AUS-REVIEW.md) (**PL:** nächste vier Prompts nur aus Code-Reviewer-Kurzfassung + Skelett/Beispiel) · [`docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md`](../docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md) (Snapshot) · [`docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md`](../docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md) (Index) · [`ERP Systembeschreibung v1.3.md`](../ERP%20Systembeschreibung%20v1.3.md) (Domäne) · [`.cursor/rules/erp-multi-agent.mdc`](../.cursor/rules/erp-multi-agent.mdc) · [`docs/contracts/qa-fin-0-gate-readiness.md`](../docs/contracts/qa-fin-0-gate-readiness.md) · [`prompts/FIN-0-rollenprompts.md`](./FIN-0-rollenprompts.md) · [`docs/tickets/FIN-2-START-GATE.md`](../docs/tickets/FIN-2-START-GATE.md) (FIN-2 produktiv) · [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) (Audit **PL-Eintrag**) · [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](../docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md)

---

## 0) Team-Clone und Eingang für die **nächsten** Prompts

- **Nur Team-Clone:** Agenten-Umsetzung und Reviews nur im **geklonten** Repository mit `.git` und `origin` zum **kanonischen Team-Remote** (`git@github.com:rhermann90/ERP.git` per SSH oder `https://github.com/rhermann90/ERP.git` per HTTPS — siehe `prompts/README.md`). Keine Prompt-Runden mit Merge-/§5a-Ziel aus Arbeitsverzeichnissen **ohne** Git-Anbindung.  
- **Repo-Hygiene:** Private SSH-Schlüssel und andere Secrets **nicht** im Projektverzeichnis ablegen; nur `~/.ssh/` bzw. zugelassene Secret-Mechanismen. Versehentliche Dateien: aus dem Baum entfernen und bei Bedarf lokal `.git/info/exclude` (wird nicht gepusht).  
- **Nächste kopierbare Prompts (PL):** Die Projektleitung bezieht sich für die **Planung und den Text der nächsten Vier-Prompt-Runde** **ausschließlich** auf die **„Rückmeldung an Projektleitung“** des **Code Reviewers** — inhaltlich konsistent mit dem **GitHub-Review** (wortgleiches **blocking**, Szenario A / B / C). **Nicht** maßgeblich für diese Planung: strukturierte PL-Rückmeldungen von Backend, Frontend oder QA (deren Arbeit gilt über **PR**, **QA-§5a/§5b-Kommentar**, **Tracker**).  
- **Code Reviewer** liefert diese Rückmeldung **verbindlich** nach jeder Review-Runde (oder nach explizitem PL-Auftrag bei Sonderfall C).

---

## 1) Reihenfolge und Rhythmus

1. **PL-Vorspann** (ein Block) — Sprint, Domäne, Gates, **keine** erfundenen URLs/SHAs; Workspace = **Pfad des Team-Clones**.  
2. **Vier Prompts** in fester Reihenfolge: **Backend** → **Frontend** → **QA** → **Code Review**.  
3. **Rückmeldung an Projektleitung** im vereinheitlichten Format (**Pflicht**): **nur Code Reviewer** (siehe §0). Backend, Frontend, QA: Ergebnisse und Blocker im **PR**, im **QA-Kommentar** (§5a/§5b) bzw. **Tracker**; bei schwerer Eskalation kann PL zusätzlich informiert werden, ohne die Prompt-Folge zu ersetzen.

---

## 2) Lieferkette (aus Rückmeldungen verankert)

| Schritt | Verantwortung | Erfolgskriterium |
| --- | --- | --- |
| **Git** | PL / Team | **Team-Clone** mit `.git` und `origin` auf das **kanonische** Team-Remote — **Pflicht** für alle vier Prompts; sonst **kein** PR, **keine** §5a-Evidence. |
| **PR** | Backend / Dev | Branch + PR mit klarer **Scope-Zeile** (Doku vs. Code); bei Doku-PR: nur erlaubte Pfade (siehe §3b in `qa-fin-0-gate-readiness.md`). |
| **§5a** | QA + Team | Grüner Actions-Link + SHA + **eine** Zeile Team-Regel Evidence-SHA **im PR** (oder ein nachvollziehbar verknüpfter QA-Kommentar). |
| **Tracker** | PL / Team / Frontend | Backend-Issue-URL **echt** aus Tracker — Agenten **erfinden** keine URLs. |
| **Review** | Code Review | **Kein Approve** ohne GitHub **Files changed**-Abgleich **und** erfüllter §5a für denselben Merge (siehe Szenario A/B unten). |

---

## 3) Pflichtzeilen „Rückmeldung an Projektleitung“ (vereinheitlicht)

- **Actions-Link für Merge auf `main`:** `ja` / `nein` — bei `nein`: `fehlt` \| `rot` \| `SHA unklar` (kurz). **Niemals** erfundene Run-URLs oder SHAs.  
- **Merge auf `main` aus QA-Sicht blockiert:** `ja` / `nein`  
  - **Sonderfall — kein PR / kein Merge-Gegenstand:** immer **`nein`** mit Begründung *„kein anstehender Merge“* — §5a/§5b gelten erst bei **existierendem** PR. **Nicht** „blockiert: ja“, nur weil Git oder Tracker fehlt; solche Themen unter **Offene Punkte / PL-Entscheidung**.  
  - **`ja`** nur, wenn ein **konkreter** PR/Merge **ohne** vollständige §5a, mit **roter** CI, **SHA-Unklarheit** oder anderem §5b-Grund **für diesen Merge** vorliegt.  
  *(Norm: `docs/contracts/qa-fin-0-gate-readiness.md` — Abschnitt Rückmeldung + Sonderfall.)*

---

## 4) Doku-PR „Rollenprompts / Koordination“

- Regel **`§3b`** in `qa-fin-0-gate-readiness.md`: erlaubter Umfang typisch `prompts/*` + ggf. **explizit** im PR genannte `docs/…` — **kein** stiller Misch-PR mit `src/`, `apps/`, `prisma/`, OpenAPI, `error-codes.json` ohne separates Gate.  
- **Audit-Laufzeit** (`AuditService`, Dual-Write, Transaktionsgrenze): nur mit vollständigem **PL-Eintrag** in `FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md` — sonst **blocking**.

---

## 5) Code-Review: Szenarien A / B + Sonderfall „kein PR“ (copy-paste-tauglich)

**Szenario A — PR existiert, §5a noch nicht vollständig**

- **blocking (Review + PL-Rückmeldung wortgleich):** eine Zeile: Merge-Evidence laut `qa-fin-0-gate-readiness.md` **§5a** im PR noch nicht vollständig (grüner Actions-Link + SHA + Team-Regel Evidence-SHA) — **kein Approve** bis zur Nachreichung.  
- **PR-Entscheidung:** **Changes requested** (nicht Approve).  
- **Pflichtzeilen PL-Rückmeldung:** Actions-Link **nein** (fehlt/unvollständig); **Merge blockiert: ja** — Grund: §5a für diesen **konkreten** Merge unvollständig (nicht mit „kein Git“ verwechseln — das gehört unter **Offene Punkte**).

**Szenario B — Diff = reine Doku wie deklariert, §5a vollständig im PR geprüft**

- **blocking:** `kein blocking`  
- **PR-Entscheidung:** **Approve** (Merge-Kommentar zu FIN-2-START-GATE wie in Review-Vorlage).  
- **Pflichtzeilen PL-Rückmeldung:** Actions-Link **ja** nur mit **echtem** Run aus GitHub (URL + SHA wörtlich übernehmen — **nicht** erfinden); **Merge blockiert: nein** — vorbehaltlich keine neue Rotstelle / kein SHA-Widerspruch.

**Sonderfall C — kein PR / kein Merge-Gegenstand** *(lokal koordiniert, Workspace ohne PR, nur Doku-Sync)*

- **GitHub-Review:** Es liegt **kein** zu bewertender PR vor — **kein** „Files changed“-Review in diesem Schritt. **blocking:** `kein blocking`.  
- **Pflichtzeilen PL-Rückmeldung:** Actions-Link **nein** — `fehlt` *(kein PR)*; **Merge blockiert: nein** — Begründung: *kein anstehender Merge* (§5a/§5b erst bei existierendem PR; vgl. `qa-fin-0-gate-readiness.md` Sonderfall). Fehlendes **Git/Remote** oder **Tracker-URL** nur unter **Offene Punkte / PL-Entscheidung**, **nicht** als „Merge blockiert: ja“ substituieren.  
- **blocking (Review + PL-Rückmeldung wortgleich):** `kein blocking`

### Copy-Paste — Sonderfall C (Review)

```text
## Senior Code Review — FIN-0 / FIN-2-Gate
**Hinweis:** Es liegt kein zu bewertender PR vor — kein GitHub-„Files changed“-Review in diesem Schritt.
### blocking
- kein blocking
```

### Copy-Paste — Sonderfall C (Rückmeldung an Projektleitung, blocking wortgleich)

```text
## Rückmeldung an Projektleitung
### Ergebnis
Kein PR in dieser Runde bewertet.
### Begründung
§5a/§5b gelten erst bei existierendem PR; Git/Remote/Tracker sind Lieferketten-Themen unter „Offene Punkte“, keine Ersatz-„Merge blockiert“-Begründung.
**Pflicht:**
- **Grüner GitHub-Actions-Link für Merge auf `main` vorhanden (PR-Evidence):** nein — fehlt (kein PR)
- **Merge auf `main` aus QA-Sicht blockiert:** nein — kein anstehender Merge
### blocking
- kein blocking
### Evidence
- **Backend:** kein PR
- **QA:** n. a. bis PR existiert
```

---

## 6) PL-Checkliste vor jeder neuen Prompt-Runde

- [ ] Aktueller Sprint-Snapshot gelesen (Link in `PL-SYSTEM-ZUERST-VORLAGE.md` oben).  
- [ ] Dieser Leitfaden (`prompts/AGENTEN-PROMPT-LEITFADEN.md`) bei Orchestrierungs-Themen mitgelesen.  
- [ ] `git remote -v`: **`origin`** zeigt auf das **kanonische** Team-Remote (siehe `prompts/README.md`); bei Wechsel von HTTPS zu SSH: `git remote set-url origin git@github.com:rhermann90/ERP.git`.  
- [ ] `git status`: **keine** versehentlichen Secrets/Key-Dateien im Commit-Umfang; Arbeitsbaum für die Runde **Scope-klar** (offene Änderungen benannt oder weggeräumt).  
- [ ] Ziel der Runde **ein Satz** (Doku-PR / Bugfix / Feature — und ob **Git** vorhanden).  
- [ ] Pro Rolle: **max. 5–8 nummerierte** Aufgaben, ein **Output**, ein **Qualitätsbefehl** (`typecheck` / `test` / Web-Build).  
- [ ] Explizit: **kein** Audit-Code ohne PL-Eintrag; **kein** produktives FIN-2 vor Gate.  
- [ ] Nach Rundenende: **Code-Review-Rückmeldung** an PL auf **Pflichtzeilen** und **blocking**-Konsistenz mit dem GitHub-Review prüfen (einziger Eingang für die **nächsten** Prompts).

---

## 7) Vorspann-Vorlage für PL (an neue Zyklen anpassen)

```text
Workspace: <absoluter Pfad zum Team-Clone — mit .git und origin>

PL / System — zuerst:
- Sprint-Snapshot: docs/tickets/PL-SYSTEM-ZUERST-<DATUM>.md (aktueller Link aus PL-SYSTEM-ZUERST-VORLAGE.md)
- Domäne: ERP Systembeschreibung v1.3.md | .cursor/rules/erp-multi-agent.mdc
- Audit-Code: nur mit vollständigem PL-Eintrag in docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md
- FIN-2 produktiv: nur nach docs/tickets/FIN-2-START-GATE.md (G1–G10)

Diese Runde: <ein Satz Ziel>

Regeln für Agenten:
- Einstieg: `prompts/README.md` — **nur Team-Clone**; kanonisches Remote `rhermann90/ERP`; kein Merge-Ziel aus Verzeichnissen ohne Git; keine Secrets/SSH-Privatekeys im Projektbaum.
- Orchestrierung & Zukunft: `prompts/AGENTEN-PROMPT-LEITFADEN.md` (Lieferkette, Pflichtzeilen, Review Szenario A/B + Sonderfall C „kein PR“; **nächste Prompts** nur aus **Code-Review-Rückmeldung**).
- Keine erfundenen GitHub-Actions-URLs oder SHAs.
- Rückmeldung an Projektleitung nach `prompts/FIN-0-rollenprompts.md` inkl. Pflichtzeilen (Sonderfall „kein PR“: `docs/contracts/qa-fin-0-gate-readiness.md` — Merge blockiert = **nein**, wenn kein Merge-Gegenstand).
- blocking im Review und in der PL-Rückmeldung wortgleich.
```

---

## 8) Wartung

Neuer Koordinationszyklus: neue Datei `docs/tickets/PL-SYSTEM-ZUERST-<YYYY-MM-DD>.md`, Verlinkung in `PL-SYSTEM-ZUERST-VORLAGE.md`, **§0** in `qa-fin-0-gate-readiness.md` anpassen — siehe Wartungshinweis in der Vorlage.

**Prozessänderungen:** Pflichtzeilen / Sonderfall „kein PR“ **immer** in `qa-fin-0-gate-readiness.md` **und** hier in §3 / §5 (A/B/C) **gemeinsam** anpassen, damit keine parallelen „Wahrheiten“ entstehen.
