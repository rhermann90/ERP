# PL / System — zuerst (Sprint-Koordination 2026-04-14)

**Status:** verbindlicher Rahmen für diesen Koordinationszyklus (nicht Ersatz für den **PL-Eintrag** im Audit-Ticket; siehe unten).  
**Vorlage:** [`PL-SYSTEM-ZUERST-VORLAGE.md`](./PL-SYSTEM-ZUERST-VORLAGE.md)

---

## PL / System — zuerst (Rahmen dieses Sprints)

**Datum:** 2026-04-14

**Referenz / Nachweisort:** **Dieses Dokument** ist der Sprint-Snapshot. Weitere Gates und Regeln im Repo: [`docs/tickets/FIN-2-START-GATE.md`](./FIN-2-START-GATE.md), [`docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md`](./PL-SYSTEM-ZUERST-VORLAGE.md) (Index + Kopierblock), [`README.md`](../../README.md) (Repo-Einstieg), [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) (Merge-Evidence §5a/§5b, **Rückmeldung an Projektleitung**; **nächste planbare Arbeit** nur aus **Code-Review-Rückmeldung**), [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (Merge-Evidence-Job `backend`), [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) (Abschnitt **„PL-Eintrag“** bei Audit-Themen), [`.cursor/rules/erp-multi-agent.mdc`](../../.cursor/rules/erp-multi-agent.mdc), domänisch [`ERP Systembeschreibung v1.3.md`](../../ERP%20Systembeschreibung%20v1.3.md).

**Priorität:**

1. FIN-0 / Verträge / CI- und Contract-Konsistenz stabil halten.
2. Phase-2-Traceability und Mandanten-Isolation bei jeder Änderung wahren.
3. Kein produktives FIN-2-Finanzvolumen vor formalem Gate G1–G10.
4. Audit-Verhalten (`AuditService`, Dual-Write, Transaktionsgrenze) **nicht** ändern, solange der **„PL-Eintrag“** im FOLLOWUP-Audit-Ticket noch Platzhalter **`—`** hat — **Ausnahme** nur reine Doku ohne Laufzeitänderung, klar im PR benannt.

**Scope dieses Koordinationszyklus:** Inkrementelle, review-fähige PRs; keine stillen Architekturbrüche; keine Phantom-Fehlercodes; Merge-Evidence und QA-§5a/§5b wie in [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md); Agenten nur im **Team-Clone**; Lieferkette Git → PR → §5a → Tracker wie dort beschrieben; **Rückmeldung an Projektleitung** für die nächste Planungsrunde **nur** vom **Code Reviewer**; GitHub-Review nach [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](./GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md) bei gate- oder auditrelevanten PRs.

**Explizit nicht ohne separates PL-Go:**

- Ausfüllung der vier Audit-**„PL-Eintrag“**-Zellen (Option A–D, SLA) durch die **menschliche** Projektleitung;
- produktive Finanz-/Mahn-Schreibpfade im Frontend;
- Änderungen an Audit-Dual-Write/Fail-Hard-Semantik.

**Eskalation:** Lücken oder Widersprüche in der **Rückmeldung an Projektleitung** nach [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) dokumentieren — Agenten ersetzen **keine** PL-Protokolle durch Annahmen.

---

## Abgrenzung zum Audit-Ticket

[`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md): Für Merge eines PRs, der **AuditService** / **Dual-Write** / **Transaktionsgrenze für Audit** ändert, bleibt die **Tabelle „PL-Eintrag“** (vier Zellen ohne `—`) **weiterhin** die verbindliche technische Freigabe — dieser Sprint-Rahmen ersetzt sie nicht.
