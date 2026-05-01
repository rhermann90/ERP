# Checklisten

**Entwicklungsphase (aktuell):** Für laufende Implementierung gibt es **keine** verpflichtenden **echten** menschlichen Freigaben (StB/DSB/formales Release-GO). Themen aus diesen Listen werden **nach bestem Wissen und eigener Recherche** mitgeführt; **vor Mandanten-Produktiv-Go** sind formale Abnahme und Fachrollen **nachzuholen**. **Kanonische Policy** (Single Source): [`AGENTS.md`](../AGENTS.md) Punkt 6.

Arbeits- und Abnahme-Checklisten **ohne** Codepflicht. Später: inhaltliche Wahrheit und rechtliche Bewertung bei Fachrollen (Steuer, Recht, Release); die Punkte dienen der **Lückenerkennung** vor Produktiv-Go.

**Dual-Kanon Finanz-Compliance:** Das **druckbare Begleitblatt** [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md) ist für die **spätere** tabellarische Abnahme durch Fachrollen vorgesehen und wird von den Apply-Skripten **nicht** überschrieben. **Hybrid-Freigaben / CI** laufen über [`compliance-signoffs.json`](./compliance-signoffs.json), [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md) und die Marker-Anlage in [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md) — Details [`compliance-freigabe-runbook.md`](./compliance-freigabe-runbook.md).

| Datei | Zweck |
|--------|--------|
| [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md) | Druckbares Begleitblatt (Scope Finanz: **nur Rechnungen Mandant→Endkunden** im ERP; siehe **ADR 0012**): UStG, HGB, AO, GoBD, E-Rechnung, DSGVO — ergänzend zum Software-Stand (`README.md`, ADRs, QA-Gates). |
| [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md) | Technische Parallel-Datei mit `compliance-line`-Markern für `validate`/`apply` (Hybrid-Freigabe). |
| [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md) | Ausgefüllte UTF-8-Markdown-Fassung (gleicher inhaltlicher Stand wie optional RTF) **inkl. Anlage:** dieselben `compliance-line`-Checkboxen wie [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md); `npm run apply:compliance-signoffs:apply` aktualisiert **beide**. |
| [`prompts-agents-compliance-abarbeitung.md`](./prompts-agents-compliance-abarbeitung.md) | Kopierbare Agenten-Prompts (StB/DSB/Release), Risiko-Prefixe, Orchestrierung — **kein** Ersatz für Fachfreigaben. |
| [`compliance-signoffs.schema.md`](./compliance-signoffs.schema.md) | Hybrid-Freigabe: Ledger (`compliance-signoffs.json`), Allowlist, `chk-*` `lineId`-Mappings (kanonisch im Shared-Skript), Skripte. |
| [`compliance-freigabe-runbook.md`](./compliance-freigabe-runbook.md) | Ablauf: Rollen, `evidenceRef`, `validate` / `apply`. |

**RTF-Fassung (`compliance-rechnung-finanz-ausgefüllt.rtf`):** wird **nicht** von den Compliance-Skripten gepflegt. Bei Glossar-/Policy-Änderungen (z. B. „PL“ = Ledger-Kürzel Release-Owner) **manuell** angleichen oder nur [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md) als Referenz nutzen.
