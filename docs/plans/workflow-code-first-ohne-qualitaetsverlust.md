# Arbeitsweise: mehr Programmierung bei gleichbleibender Doku-, Sicherheits- und Qualitätslage

Dieses Dokument **ersetzt** keine Verträge, Checklisten oder Regeln im Repo. Es **staffelt** Dokumentationsaufwand und schärft Arbeitsrituale, damit Implementierung und Tests wieder Volumen gewinnen — ohne die verbindlichen Erwartungen zu verwässern.

---

## 1. Nicht verhandelbare Minimums (unverändert)

- **Merge:** `npm run verify:ci` bleibt die kanonische lokale Vorprüfung; GitHub-Job **`backend`** liefert die Merge-Evidence (siehe [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), [AGENTS.md](../../AGENTS.md)).
- **Finanz- und Mandantenthemen:** keine Lockerung bei **Mandantenisolation**, **Versionierung** geschäftskritischer Zustände (kein destruktives Überschreiben), **Traceability** entlang der Kette Rechnung → Messung → LV → Angebot → Projekt → Kunde (siehe [`.cursor/rules/erp-multi-agent.mdc`](../../.cursor/rules/erp-multi-agent.mdc)).
- **Produktiv-Go** Rechnung, Mahn, Massen-E-Mail: die Checkliste [Checklisten/compliance-rechnung-finanz.md](../../Checklisten/compliance-rechnung-finanz.md) bleibt der **fachliche** Abnahme-Pfad mit StB/DSB/PL — kein Ersatz für Rechtsberatung, aber **nicht** durch „weniger schreiben“ im Alltag ersetzbar.
- **QA und Gates:** bei merge- oder phase-kritischen Themen die bestehenden Verweise in [docs/contracts/qa-fin-0-gate-readiness.md](../contracts/qa-fin-0-gate-readiness.md) und zugehörige Artefakte einhalten.
- **Orientierung im Code:** bei neuen vertikalen Slices oder größeren Verschiebungen [docs/CODEMAPS/overview.md](../CODEMAPS/overview.md) wie in [AGENTS.md](../../AGENTS.md) beschrieben pflegen.

---

## 2. Drei Doku-Stufen (Staffelung statt „alles sofort“)

### Stufe A — PR-pflichtig (im selben PR wie der Code, soweit möglich)

Alles, was **Vertrag**, **CI**, **Security** oder **Cross-Team-Integration** bricht, z. B.:

- relevante Änderungen an [docs/api-contract.yaml](../api-contract.yaml) bzw. OpenAPI-Erwartungen;
- neue oder geänderte Fehlercodes / dokumentierte API-Oberflächen;
- neue vertikale Slices: **CODEMAP**-Ergänzung;
- Touch von Auth, Mandantenkontext, produktiver Finanz-API: **kurze, fachlich korrekte** Beschreibung im PR (und ADR nur wenn Entscheidung neu oder nicht offensichtlich).

### Stufe B — zeitnah (z. B. gleiche Woche oder gleicher Release-Zug)

Runbooks, erweiterte QA-Matrix-Einträge, längere Ticket-Prosa — **nur**, wenn ohne sie das Team **operativ blind** wäre oder On-Call nicht handeln kann.

### Stufe C — bewusst verschiebbar oder streichen

Wiederholungen, ausufernde Narrative, „Schönreden“. Bevorzugt: in **bestehende** Docs integrieren (ein Absatz statt neuer Datei) oder weglassen, wenn der PR-Kommentar + Verweis reicht.

---

## 3. Arbeitsrituale (konkret)

- **Slice-Definition:** Akzeptanzkriterien in **3–7** Stichpunkten; danach Umsetzung. Wo die Codebasis es vorsieht: mit **failing test** starten oder minimalen Test-Stub — ohne die bestehende Testkultur (Backend, Web, E2E) zu schwächen.
- **Zeitbudget:** pro Iteration überwiegend **Implementierung + Tests**; Stufe-A-Doku **im PR**; Stufe B/C **bündeln** (z. B. festes Zeitfenster am Ende der Woche), statt bei jeder Kleinigkeit neue Markdown-Dateien.
- **PR-Disziplin:** ein PR = **eine fachliche Einheit**; Doku-Diff auf das **Nötige** begrenzen. Die [PR-Vorlage](../../.github/pull_request_template.md) dient der **Vollständigkeit**, nicht maximaler Textlänge.
- **Agenten / KI:** Agent-Modus primär für **Code und Tests**; ausufernde Markdown-Erstellung vermeiden, wenn derselbe Informationsgehalt in **PR-Beschreibung** + ggf. **kurzer ADR** oder Ticket-Notiz steckt.

---

## 4. Qualität und Sicherheit explizit „mitdenken“

- **Security:** keine Lockerung bei Auth, Mandantengrenzen, sensiblen Pfaden. Bei Unklarheit: **kurze** Risiko-Notiz im PR statt vielseitiges generisches Doc.
- **Tests:** fehlende Tests für **kritische** Pfade gelten weiterhin als unvollständig (Projektregel in `.cursor/rules/erp-multi-agent.mdc`). Dieses Dokument erfindet **keine** neue Schwellen-Policy.
- **PWA / Web-UI:** bei Änderungen unter `apps/web/` weiterhin [AGENTS.md](../../AGENTS.md) (Link-Hub UI/UX, Theming) beachten; Dokumentation ersetzt **keinen** gezielten UX-/A11y-Check, wo das Produkt es braucht.

---

## 5. Erfolgsmessung (leichtgewichtig)

Optional, z. B. pro Sprint oder pro Release-Zug:

- Anzahl gemergter PRs mit **substanziellem** Code-/Test-Anteil vs. reine **Doc-only**-PRs;
- **CI-Grünrate** unverändert (kein „schneller merge“ zulasten von `verify:ci`);
- Review-Frage: *„Hätte diese Doku auch als PR-Kommentar plus wenige Zeilen ADR gereicht?“*

---

## Abgrenzung und Risiken

- **Kein** Wegfall von Pflicht-Artefakten für **API-Version**, **Migrations-Deploy-Pfad** oder **mandantenrelevante** Änderungen — das widerspräche Repo-Regeln und Merge-Erwartungen.
- **Risiko** bei übermäßiger Kürzung von Stufe A: Integrationsfehler, Nachvollziehbarkeit für Audits/On-Call leidet — daher Stufe A **nicht** mit Stufe C verwechseln.
