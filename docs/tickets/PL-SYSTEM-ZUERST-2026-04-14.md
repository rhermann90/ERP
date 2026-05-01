# PL / System — zuerst (Sprint-Koordination 2026-04-14)
> **Hinweis (Entwicklungsphase):** Begriffe „PL“, „Projektleitung“, „PL-Eintrag“ in diesem Snapshot sind **historisch**. Steuerung: Team/Maintainer — [AGENTS.md](../../AGENTS.md) Punkt 6. **Pfadname** `PL-SYSTEM-ZUERST-*` historisch.

**Status:** Prioritäts-Snapshot für diesen Koordinationszyklus (nicht Ersatz für den **Audit-/Architektur-Eintrag** im Audit-Ticket; siehe unten).  
**Vorlage:** [`PL-SYSTEM-ZUERST-VORLAGE.md`](./PL-SYSTEM-ZUERST-VORLAGE.md)

---

## PL / System — zuerst (Rahmen dieses Sprints)

**Datum:** 2026-04-14

**Referenz / Nachweisort:** **Dieses Dokument** ist der Sprint-Snapshot. Weitere Gates und Regeln im Repo: [`docs/tickets/FIN-2-START-GATE.md`](./FIN-2-START-GATE.md), [`docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md`](./PL-SYSTEM-ZUERST-VORLAGE.md) (Index + Kopierblock), [`README.md`](../../README.md) (Repo-Einstieg), [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) (Merge-Evidence §5a/§5b, **Rückmeldung ans Team / Review**; **nächste planbare Arbeit** nur aus **Code-Review-Rückmeldung**), [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (Merge-Evidence-Job `backend`), [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) (Abschnitt **„Audit-/Architektur-Eintrag“** bei Audit-Themen), [`.cursor/rules/erp-multi-agent.mdc`](../../.cursor/rules/erp-multi-agent.mdc), domänisch [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md); **Produktiv-Go Finanz (fachlich):** [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md).

**Priorität:**

1. FIN-0 / Verträge / CI- und Contract-Konsistenz stabil halten.
2. Phase-2-Traceability und Mandanten-Isolation bei jeder Änderung wahren.
3. Kein produktives FIN-2-Finanzvolumen vor formalem Gate G1–G10.
4. Audit-Verhalten (`AuditService`, Dual-Write, Transaktionsgrenze) **nicht** ändern, solange der **„Audit-/Architektur-Eintrag“** im FOLLOWUP-Audit-Ticket noch Platzhalter **`—`** hat — **Ausnahme** nur reine Doku ohne Laufzeitänderung, klar im PR benannt.

**Scope dieses Koordinationszyklus:** Inkrementelle, review-fähige PRs; keine stillen Architekturbrüche; keine Phantom-Fehlercodes; Merge-Evidence und QA-§5a/§5b wie in [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) — **Spezifikation §5a/§5b dort abgeschlossen**; je Merge weiterhin **operativer** Nachweis (Run + SHA + Team-Regelzeile) im PR; Agenten nur im **Team-Clone**; Lieferkette Git → PR → §5a → Tracker wie dort beschrieben; **Rückmeldung ans Team / Review** für die nächste Planungsrunde **nur** vom **Code Reviewer**; GitHub-Review nach [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](./GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md) bei gate- oder auditrelevanten PRs.

**Explizit nicht ohne separates Team-/Go-Beschluss (Produktiv):**

- Ausfüllung der vier Audit-**„Audit-/Architektur-Eintrag“**-Zellen (Option A–D, SLA) durch **Release-Owner / Team** (menschlich);
- produktive Finanz-/Mahn-Schreibpfade im Frontend;
- Änderungen an Audit-Dual-Write/Fail-Hard-Semantik.

**Eskalation:** Lücken oder Widersprüche in der **Rückmeldung ans Team / Review** nach [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) dokumentieren — Agenten ersetzen **keine** externen Protokolle durch Annahmen.

---

## Abgrenzung zum Audit-Ticket

[`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md): Für PRs, die **AuditService** / **Dual-Write** / **Transaktionsgrenze für Audit** ändern, ist die **Tabelle „Audit-/Architektur-Eintrag“** (vier Zellen ohne `—`) **empfohlene** technische Dokumentation vor Audit-Verhaltens-PRs — in der **Entwicklungsphase** kein automatischer Merge-Stopper ([AGENTS.md](../../AGENTS.md) Punkt 6). Dieser Sprint-Snapshot ersetzt die Tabelle nicht.
