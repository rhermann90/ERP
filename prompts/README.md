# Agenten — Playbook (Einstieg)

**Zweck:** Eine Seite für **kopierbare Prompts** und klare Regeln — ohne die übrigen Repo-Dokumente zusammensuchen zu müssen.

---

## Verbindliche Arbeitsumgebung

- **Nur Team-Clone:** Alle Agenten arbeiten **ausschließlich** im **geklonten Team-Repository** (lokaler Pfad eures Team-Clones), mit vorhandenem **`.git`** und **`origin`** auf das **kanonische Remote** (z. B. GitHub-Organisation). **Keine** Orchestrierungs- oder Merge-Ziel-Runden aus isolierten Ordnern **ohne** Git.
- **Branch** immer vom aktuellen `main`/`master` des Team-Remotes; PRs nur dorthin.

---

## Dokumente (Reihenfolge zum Lesen)

| # | Datei | Wofür |
|---|--------|--------|
| 1 | [`.cursor/rules/erp-multi-agent.mdc`](../.cursor/rules/erp-multi-agent.mdc) | Kernregeln (Domäne, Tenant, Gates) |
| 2 | [`docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md`](../docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md) | Aktuellen Sprint-Snapshot verlinkt |
| 3 | [`prompts/AGENTEN-PROMPT-LEITFADEN.md`](./AGENTEN-PROMPT-LEITFADEN.md) | PL: Lieferkette, Pflichtzeilen, Review A/B/C, **Eingang nächste Prompts** |
| 4 | [`prompts/FIN-0-rollenprompts.md`](./FIN-0-rollenprompts.md) | Rollenbeschreibungen + **Rückmeldeformat** |
| 5 | [`docs/contracts/qa-fin-0-gate-readiness.md`](../docs/contracts/qa-fin-0-gate-readiness.md) | §5a/§5b, §3b Doku-PR, Sonderfall „kein PR“ |
| 6 | [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](../docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md) | Review-Checkliste (Code Reviewer) |

---

## Ablauf pro Runde (für die Projektleitung)

1. **PL-Vorspann** + **vier** Copy-Paste-Prompts in fester Reihenfolge: **Backend** → **Frontend** → **QA** → **Code Review** (siehe [`AGENTEN-PROMPT-LEITFADEN.md`](./AGENTEN-PROMPT-LEITFADEN.md) §7).  
2. Umsetzung **nur im Team-Clone**; Artefakte: PR, QA-Kommentar §5a/§5b, Tracker-Links.  
3. **Nächste Prompt-Runde:** Die Projektleitung stützt sich **ausschließlich** auf die **„Rückmeldung an Projektleitung“** des **Code Reviewers** (identisch zu **blocking** im GitHub-Review). **Nicht** maßgeblich für die nächsten Prompts: strukturierte PL-Rückmeldungen von Backend, Frontend, QA — deren Ergebnisse gelten über PR/CI/Tracker.

---

## Kurzprompts pro Rolle

- [`projektleiter.md`](./projektleiter.md)  
- [`backend.md`](./backend.md)  
- [`frontend.md`](./frontend.md)  
- [`qa.md`](./qa.md)  
- [`reviewer.md`](./reviewer.md)  

---

## Merge auf `main`

Kanonisch: grüner GitHub Actions-Run + SHA + Team-Regel Evidence-SHA — siehe `docs/contracts/qa-fin-0-gate-readiness.md` **§5a**.
