# Checklisten

**Repo:** Für Merge und laufende Arbeit gibt es **keine** verpflichtenden menschlichen Fachfreigaben (Steuerberatung, Datenschutz, formelles Release-GO). Optional können Themen **nach bestem Wissen** mitgeführt werden; operative Bewertung vor Mandantenbetrieb liegt **außerhalb** des Repo-Prozesses. **Kanonisch:** [`AGENTS.md`](../AGENTS.md) Punkt 6.

**Archiv (historisch):** Ausführliche Begleittexte mit Rollenbezug: [`docs/_archiv/checklisten-compliance-human-workflow/README.md`](../docs/_archiv/checklisten-compliance-human-workflow/README.md).

**CI:** `npm run validate:compliance-artifacts` und `npm run validate:compliance-signoffs` prüfen Dateipfade und Marker-Konsistenz — **keine** Unterschriften.

| Datei | Zweck |
|--------|--------|
| [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md) | Stub mit Verweis ins Archiv |
| [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md) | Technische `compliance-line`-Marker für Validator/Apply |
| [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md) | Markdown mit einleitenden Abschnitten; **Anlage** mit denselben Markern wie Ledger |
| [`prompts-agents-compliance-abarbeitung.md`](./prompts-agents-compliance-abarbeitung.md) | Stub → Archiv |
| [`compliance-signoffs.schema.md`](./compliance-signoffs.schema.md) | Schema-Doku zu `compliance-signoffs.json` |
| [`compliance-freigabe-runbook.md`](./compliance-freigabe-runbook.md) | Stub → Archiv |

**RTF (`compliance-rechnung-finanz-ausgefüllt.rtf`):** wird nicht von Compliance-Skripten gepflegt; bei Bedarf manuell oder über [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md) abstimmen.
