# B5 — Formelles Mahn-PDF: Spezifikation und Liefergrenze (Wave-3-Vorbereitung)

> **Hinweis (Entwicklungsphase):** „PL“/„Projektleitung“/„PL-Gate“ hier **historisch**; Steuerung: Team/Maintainer, ADRs, CI — kanonisch [AGENTS.md](../../AGENTS.md) Punkt 6.


**Status:** Spezifikations-Anker nur (kein Implementierungs-PR in diesem Batch). **Hauptticket:** [`B5-FORMAL-DUNNING-PDF.md`](./B5-FORMAL-DUNNING-PDF.md). **Domänen-Anker (technisch):** [`src/domain/dunning-formal-notice-spec.ts`](../../src/domain/dunning-formal-notice-spec.ts). **Kontext SEMI/B3:** [`docs/adr/0011-fin4-semi-dunning-context.md`](../adr/0011-fin4-semi-dunning-context.md).

## Liefergrenze (explizit)

- **Getrennt von** M4 Slice **5c** (Batch-E-Mail): kein gemeinsamer PR, der PDF-Generierung und Batch-SMTP mischt.
- **Getrennt von** [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) **Option A** (Audit in derselben DB-Transaktion wie Domäne): B5-PDF darf Audit-/Transaktions-Semantik nicht „nebenbei“ ändern; Audit-/Architektur-Eintrag in der FOLLOWUP-Tabelle wird **empfohlen** vor Audit-Verhaltens-PRs (kein automatischer Merge-Stopper in der Entwicklungsphase; siehe [AGENTS.md](../../AGENTS.md) Punkt 6).

## P1-Wave-3 Querschnitt (Protokoll, projektintern 2026-04-26)

**Kein** Ersatz für StB-/Release-Freigabe der späteren B5-Lieferung (Produktiv-Go).

- **Liefergrenze zu 5c:** B5 bleibt **eigenes** Lieferobjekt; kein Mix mit Batch-E-Mail-PRs ([`P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md`](./P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md) P1-4).
- **Nächster Schritt:** Nach **schriftlicher** Team-Priorisierung eigenes Umsetzungsticket/ADR (OpenAPI-Skeleton, QA-Gate) — siehe unten *Nächster technischer Schritt*.


## Implementierungs-Gate (P1-4)

**Entwicklungsphase:** Kein automatischer Merge-Stopper durch leere FOLLOWUP-Zellen ([AGENTS.md](../../AGENTS.md) Punkt 6).

**Empfehlung:** Implementierungs-PRs für B5 (PDF-Erzeugung, Speicher, Auslieferung) **nach** dokumentiertem Audit-/Architektur-Kontext in [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) (Tabelle **Architektur-/Release-Protokoll** und vier Zellen für Audit-**Verhaltens**-PRs — Platzhalter **`—`** nach Möglichkeit vor PR füllen). Ausnahmen nur mit **Team/Maintainer**-Entscheid (Ticket/ADR). Vgl. [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md) und P1-4 in [`P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md`](./P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md).

## Pflichtinhalt der späteren B5-Spezifikation (Checkliste für Team / Architektur)

1. **Pflichtfelder** des PDF (Verweis auf `dunning-formal-notice-spec.ts` + StB-Freigabetext getrennt von technischen IDs).
2. **Archiv / Nachweis:** Speicherort, Hash/Version, immutable Artefakt-Kette; Bezug zu Mahn-Ereignis / Rechnung / Mandant.
3. **Kanal:** Druck vs. E-Mail-Anhang; kein Ersatz für formellen Mahnlauf ohne rechtliche Freigabe ([`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md)).
4. **Schnittstelle zu E-Mail:** optionaler Anhang-Pfad vs. reiner Druck — explizit entscheiden.

## Nächster technischer Schritt (nach Team-Priorität)

Eigenes Ticket/ADR mit OpenAPI-Skeleton und QA-Gate — erst nach schriftlicher Priorisierung gegenüber weiteren FIN-4-Restpunkten.

## Erster Umsetzungs-PR nach Gates (Schnitt; kein Mix)

- **B5 (formelles Mahn-PDF):** eigener PR — nur PDF/Spec/OpenAPI/Tests im B5-Umfang; **nicht** kombinieren mit M4 Slice **5c** (Batch-E-Mail) oder mit Audit-**Option A**.
- **Audit Option A** (Transaktion Domäne + Audit): eigener PR — **empfohlen** nach dokumentiertem **Audit-/Architektur-Eintrag** (vier Zellen) in [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md); **nicht** im selben PR wie B5.
- **Reihenfolge:** durch **Team/Maintainer** festlegen; Default bleibt getrennte Lieferobjekte wie in [`P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md`](./P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md) P1-4.
