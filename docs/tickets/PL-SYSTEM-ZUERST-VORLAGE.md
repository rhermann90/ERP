# Vorlage — „PL / System — zuerst“ (kommunizierter Rahmen)

**Zweck:** Einmal ausfüllen und als **Referenz** in Team-Tickets, PR-Beschreibungen, Merge-Kommentaren oder Eskalation einfügen. Damit liegt der von **Projektleitung / System** kommunizierte Rahmen **schriftlich** vor (Voraussetzung in [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) §0 und in [`prompts/FIN-0-rollenprompts.md`](../../prompts/FIN-0-rollenprompts.md)).

**Eingetragene Sprint-Instanz (Beispiel / aktuell):** [`PL-SYSTEM-ZUERST-2026-04-14.md`](./PL-SYSTEM-ZUERST-2026-04-14.md) — verbindlicher **„PL / System — zuerst“**-Rahmen vom **2026-04-14**; neuere Sprints als eigene Datei `PL-SYSTEM-ZUERST-<Datum>.md` anlegen und hier verlinken.

**Ersetzt nicht:** den verbindlichen **PL-Eintrag** (vier Inhaltszellen ohne Platzhalter `—`) in [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md), wenn ein PR **AuditService**, **Dual-Write** oder die **Transaktionsgrenze für Audit** ändert — dort nur die Tabelle im Ticket, nicht diese Vorlage.

---

## Aktueller Rahmen — PL / System — zuerst (dieser Koordinationszyklus)

**Kanonisch (ein Snapshot pro Zyklus — vermeidet Drift):** Volltext und Prioritäten stehen **nur** in der datierten Datei, z. B. [`PL-SYSTEM-ZUERST-2026-04-14.md`](./PL-SYSTEM-ZUERST-2026-04-14.md). Diese Vorlage enthält **keinen** zweiten Volltext mehr.

**Wartung durch PL:** Neuen Zyklus = neue Datei `docs/tickets/PL-SYSTEM-ZUERST-<YYYY-MM-DD>.md` (Inhalt aus dem Abschnitt **Kopierblock** ableiten), oben unter **Eingetragene Sprint-Instanz** verlinken und in [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) §0 das Datum / den Pfad anpassen.

---

## Kopierblock (Vorlage für künftige Zyklen — von PL/System ausfüllen; Platzhalter ersetzen)

```text
## PL / System — zuerst (verbindlicher Rahmen)

**Datum:** <YYYY-MM-DD>
**Referenz / Nachweisort:** <Link oder Kurzverweis auf Protokoll, Ticket, E-Mail-Anhang>

**Priorität / Scope (1–5 Zeilen):**
- …

**Gates / Merge-Regeln (kurz):**
- FIN-2 / produktive Finanz-API: erst nach Schließen G1–G10 in docs/tickets/FIN-2-START-GATE.md
- PR mit Audit-Verhalten (AuditService / Dual-Write / Transaktionsgrenze Audit): erst nach vollständigem „PL-Eintrag“ in docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md (alle vier Zellen ohne —)

**Optional — Branch-Schutz / CI:** <z. B. Required Check „backend“ auf main — ja/nein/offen>

**Bei Abweichung oder fehlender Nachvollziehbarkeit:** Rückmeldung an PL nach Format in docs/contracts/qa-fin-0-gate-readiness.md
```

---

## Verknüpfungen (Repo)

| Thema | Dokument |
| --- | --- |
| Sprint-Rahmen PL/System (Instanz) | [`PL-SYSTEM-ZUERST-2026-04-14.md`](./PL-SYSTEM-ZUERST-2026-04-14.md) |
| FIN-2-Start-Gate | [`FIN-2-START-GATE.md`](./FIN-2-START-GATE.md) |
| Audit Dual-Write / Merge-Sperre | [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) |
| QA Merge-Evidence, §5a/§5b | [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) |
| CI-Workflow (`backend`) | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |
| Persistenz-CI / Runbook | [`docs/runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md) |
| Rollenprompts + Agenten-Rückmeldungen | [`prompts/FIN-0-rollenprompts.md`](../../prompts/FIN-0-rollenprompts.md) |
| Agenten-Playbook (Team-Clone, Ablauf) | [`prompts/README.md`](../../prompts/README.md) |
| Agenten-Orchestrierung (Pflichtzeilen, Lieferkette, Review A/B/C, Eingang nächste Prompts) | [`prompts/AGENTEN-PROMPT-LEITFADEN.md`](../../prompts/AGENTEN-PROMPT-LEITFADEN.md) |
| GitHub-Review-Vorlage (Gate) | [`GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](./GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md) |
| Multi-Agent-Kernregeln | [`.cursor/rules/erp-multi-agent.mdc`](../../.cursor/rules/erp-multi-agent.mdc) |
| Domänenquelle MVP | [`ERP Systembeschreibung v1.3.md`](../../ERP%20Systembeschreibung%20v1.3.md) |
