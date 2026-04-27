# P1 — Finanz Welle 3 (Nacharbeit und nächste Schritte)

**Zweck:** Geordnete **P1**-Backlog-Reihe nach kleinen Releases (Skonto-PWA, Batch-E-Mail 5c) — **ohne** PL-Gates für Option **B** (8.4(2–6)) oder **C** (Zwischenstatus) zu überspringen. Kanonische Wellenrichtung: [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md).

**Stand P1-Wave-3-Abschluss (Doku, 2026-04-26):** Phase 0 (PL-/Doku-Sync 5c vs. 5b-Tabelle) und nachfolgende Phasen in diesem Dokument festgehalten. **Bindende PL-Bestätigung** der Protokollzeilen erfolgt durch **Projektleitung** (Link/Commit ersetzt Platzhalter in [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](./M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md) und [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md)).

## P1-Wave-3 — Abschlusskriterien (Definition)

| Bucket | „Erledigt für Wave 3“ bedeutet |
|--------|-------------------------------|
| **P1-1** | Bugfix-Pfad abgeschlossen und getestet. |
| **P1-2** | M4-/FIN-4-**Pflicht**scope für diese Welle im Repo (inkl. 5c separater Endpoint) **und** Doku-Sync mit PL-Tabelle (Zeile 12); verbleibendes **optionales** UX nur noch als Follow-up-Ticket(s), nicht als offener P1-2-Blocker. |
| **P1-3** | Kein Gesamt-Ende — **laufende** PR-Disziplin; optional Meilenstein siehe [`P1-3-DOCS-MILESTONE-WAVE3.md`](./P1-3-DOCS-MILESTONE-WAVE3.md). |
| **P1-4** | Querschnitts-**Protokoll** (Audit/B5/Liefergrenzen) schriftlich im Repo; **kein** Ersatz für Mandanten-Go oder StB-Freigabe. |

## P1-1 — PWA-Korrektheit (bugfix)

| ID | Thema | Ticket |
|----|--------|--------|
| P1-1a | `loadInvoice` nach Skonto-Recalc: keine stale `invoiceIdRead`-Closure — **erledigt** | [`BUG-PWA-FINANCE-LOAD-INVOICE-STALE-AFTER-SKONTO-RECALC.md`](./BUG-PWA-FINANCE-LOAD-INVOICE-STALE-AFTER-SKONTO-RECALC.md) |

**DoD:** Grüne Web-Tests + kurze PR-Notiz; kein API-Contract-Änderungspfad.

## P1-2 — M4 / FIN-4 (nur nach PL, Option A) — **Wave-3-Pflichtscope erledigt**

- **Erledigt (Repo + Doku-Sync 2026-04-26):** Mahnlauf **5b-0/5b-1**, API **1b**, **M4 Slice 5c** (`POST /finance/dunning-reminder-run/send-emails`) mit Spec [`M4-BATCH-DUNNING-EMAIL-SPEC.md`](./M4-BATCH-DUNNING-EMAIL-SPEC.md); Abgleich mit PL-Tabelle Zeile **12** in [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](./M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md); Statuszeile Priorität 2 in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md).
- **Optional / nächster UX-Strang (nicht P1-2-Blocker):** Tab-Umzug Grundeinstellungen — [`FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md`](./FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md).
- **Nicht** parallel: 8.4-Tiefenmotor oder Pfad C (siehe Non-Goals in NEXT-INCREMENT).

## P1-3 — Dokumentation und Integratoren

- Bei jedem Contract-Bump: [`FIN4-external-client-integration.md`](../contracts/FIN4-external-client-integration.md) + PR-Beschreibung (siehe [`.github/pull_request_template.md`](../../.github/pull_request_template.md)).
- Kleine **PWA-only**-Releases: `docs/tickets/RELEASE-*.md` verlinken (Stakeholder-Tracking); Review-Anker: [`review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md) Punkt **5**.
- **Meilenstein-Tracking:** [`P1-3-DOCS-MILESTONE-WAVE3.md`](./P1-3-DOCS-MILESTONE-WAVE3.md).

## P1-4 — Querschnitt (PL-Termin, kein Sofort-Coding) — **Protokoll eingetragen**

- **Audit / Transaktionsgrenzen:** [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) — Abschnitt *Querschnitt Finanz Welle 3* um **Protokoll P1-Abschluss** ergänzt (2026-04-26).
- **Formales Mahn-PDF (B5):** [`B5-FORMAL-DUNNING-PDF.md`](./B5-FORMAL-DUNNING-PDF.md) / [`B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](./B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md) — Abschnitt *P1-Wave-3 Querschnitt* ergänzt.
- **Hinweis:** Die **verbindliche** PL-Tabelle in FOLLOWUP („PL-Eintrag“, vier Zellen) wird **nicht** durch Entwicklung ausgefüllt; separates PL-Meeting / Commit bleibt Pflicht für Audit-**Verhaltens**-Änderungen.
- **Repo-Abnahme (Agent, 2026-04-26):** Umsetzungs-PRs **B5** / Audit-**Verhaltens**-Änderungen nur nach dokumentierten Gates — [`B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](./B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md) (*Implementierungs-Gate*) und [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md); siehe auch [`AGENTS.md`](../../AGENTS.md).
- **Ersten Umsetzungs-PR planen (Agent-Tracking, 2026-04-26):** Nach PL-Freigabe und erfüllten Gates **B5** (formales Mahn-PDF) oder Audit **Option A** in **getrennten** PRs umsetzen; **kein** Merge von Audit-Transaktions-/Dual-Write-Änderungen ohne ausgefüllte PL-Tabelle in FOLLOWUP (Merge-Sperre im Ticket).

## Reihenfolge (Empfehlung)

1. ~~**P1-1a**~~ (erledigt).  
2. ~~**P1-2**~~ (Wave-3-Pflichtscope erledigt; optional UX → Follow-up-Ticket).  
3. **P1-3** laufend bei PRs (+ Meilenstein-Datei).  
4. **P1-4** Protokoll eingetragen; Umsetzung B5 / Audit Option **A** nur nach PL wie in den verlinkten Tickets.

## Mandanten-/Produktiv-Go (Checkliste)

Vor produktivem Rechnungs-/Mahn-Go (inkl. Massen-E-Mail 5c): [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) mit **StB / DSB / PL** abarbeiten — ergänzend zu grünem CI (`backend`-Job), kein Ersatz für Mandanten-Freigabe.

**Repo-Abnahme (Agent, 2026-04-26):** Verweiskette README → [`AGENTS.md`](../../AGENTS.md) (Lesepunkt 6 + Tabelle §5) → diese Sektion → Checkliste ist konsistent; **fachliches** Durcharbeiten der Checklistenpunkte bleibt **StB / DSB / PL** (nicht automatisierbar).

**Team-Nachweis (nach Workshop StB/DSB/PL):** Ergebnis, Datum und Verweis (internes Protokoll/Wiki — **keine** erfundenen URLs im Repo) dort dokumentieren, wo das Team Arbeitsnachweise führt; die Checkliste selbst bleibt die fachliche Vorlage ([`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) Abschnitt *Team-Dokumentation*).

**Wave3-10-Tool-Todos (Agent, 2026-04-27):** Workshop mit **StB / DSB / PL** und Durcharbeiten der Checkliste **nicht** durch Agent-Session ersetzbar; Repo bleibt bei Verweisen und *Team-Dokumentation*-Abschnitt der Checkliste; Ergebnis ausschließlich im Team-Wiki/Protokoll nachhalten.

**Wave3-11-Tool-Todos (Agent, 2026-04-27):** Mandanten-/Produktiv-Go und Workshop-Pflicht unverändert; vollständige Wave3-11-Operativliste siehe [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) (*Agent-Abnahme*). **PL-Inbound**-Tabelle dort: **nur PL-Runden** / kein Agent-Eintrag (Team-Entscheid 2026-04-27); **alle** übrigen automatisierbaren Agent-Pflichten **weiterhin** erledigen.

**Wave3-12-Tool-Todos (Agent, 2026-04-27):** **Wave3-12** kanonisch unter *Agent-Abnahme* in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md); **PL-Inbound** nur PL-Runden (kein Agent-Eintrag).
