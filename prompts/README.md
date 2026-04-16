# Agenten — Playbook (Einstieg)

**Zweck:** Eine Seite für **kopierbare Prompts** und klare Regeln — ohne die übrigen Repo-Dokumente zusammensuchen zu müssen.

---

## Verbindliche Arbeitsumgebung

- **Nur Team-Clone:** Alle Agenten arbeiten **ausschließlich** im **geklonten Team-Repository** (lokaler Pfad eures Team-Clones), mit vorhandenem **`.git`** und **`origin`** auf das **kanonische Team-Remote**. **Keine** Orchestrierungs- oder Merge-Ziel-Runden aus isolierten Ordnern **ohne** Git.
- **Kanonisches Remote (dieses Repo):** `git@github.com:rhermann90/ERP.git` (SSH, empfohlen auf Entwickler-Rechnern) **oder** `https://github.com/rhermann90/ERP.git` (HTTPS mit PAT / `gh auth login`, z. B. in nicht-interaktiven Umgebungen). Befehle und §5a-Vorlagen: [`prompts/KOPIERBLOECKE-GIT-REMOTE-UND-PROMPTS.md`](./KOPIERBLOECKE-GIT-REMOTE-UND-PROMPTS.md).
- **Secrets / Schlüssel:** Private SSH-Schlüssel, Passwörter und API-Tokens **nie** im Projektbaum ablegen (nur unter `~/.ssh/` bzw. sichere Secret-Stores). `.env` und typische Key-Dateinamen sind per `.gitignore` ausgeschlossen — bei versehentlich erzeugten Dateien im Clone zusätzlich **lokal** `.git/info/exclude` nutzen und Dateien **aus dem Arbeitsbaum entfernen**, nicht nur ignorieren.
- **Branch** immer vom aktuellen `main` des Team-Remotes; PRs nur dorthin.

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
| 7 | [`prompts/KOPIERBLOECKE-GIT-REMOTE-UND-PROMPTS.md`](./KOPIERBLOECKE-GIT-REMOTE-UND-PROMPTS.md) | Remote setzen, SSH/HTTPS, Push, PL-/Agenten-Blöcke, §5a |
| 8 | [`prompts/AGENTEN-RUNDE-2026-04-16-FIN0-GROSSSCHRITT.md`](./AGENTEN-RUNDE-2026-04-16-FIN0-GROSSSCHRITT.md) | FIN-0-Großschritt (Historie / Referenz) |
| 9 | [`prompts/PL-NÄCHSTE-RUNDE-AUS-REVIEW.md`](./PL-NÄCHSTE-RUNDE-AUS-REVIEW.md) | **PL:** Nächste vier Prompts **nur** aus Code-Reviewer-Kurzfassung; Skelett + Beispiel |
| 10 | [`prompts/AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md`](./AGENTEN-RUNDE-2026-04-19-FIN0-nach-reviewer-rueckmeldung.md) | **Aktuelle Runde:** vier kopierbare Prompts aus Code-Review „Rückmeldung an PL“ (blocking wortgleich) |
| 11 | [`prompts/AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md`](./AGENTEN-RUNDE-2026-04-18-FIN0-nach-merge-pr1.md) | Vorherige Runde (post-merge PR #1 / Szenario B) — technische Aufgaben weiter referenzierbar |

---

## Ablauf pro Runde (für die Projektleitung)

1. **PL-Vorspann** + **vier** Copy-Paste-Prompts in fester Reihenfolge: **Backend** → **Frontend** → **QA** → **Code Review** (siehe [`AGENTEN-PROMPT-LEITFADEN.md`](./AGENTEN-PROMPT-LEITFADEN.md) §7).  
2. Umsetzung **nur im Team-Clone**; Artefakte: PR, QA-Kommentar §5a/§5b, Tracker-Links.  
3. **Nächste Prompt-Runde:** Die Projektleitung stützt sich **ausschließlich** auf die **„Rückmeldung an Projektleitung“** des **Code Reviewers** (identisch zu **blocking** im GitHub-Review). Konkrete Vorlage und Beispiel-Prompts: [`prompts/PL-NÄCHSTE-RUNDE-AUS-REVIEW.md`](./PL-NÄCHSTE-RUNDE-AUS-REVIEW.md). **Nicht** maßgeblich für die nächsten Prompts: strukturierte PL-Rückmeldungen von Backend, Frontend, QA — deren Ergebnisse gelten über PR/CI/Tracker.

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
