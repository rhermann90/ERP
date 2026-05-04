# FIN-5 — Team-Gate vor Implementierung (Abschnitt 8.16 vs. Fail-Closed)

**Status:** **geschlossen** — **2026-05-04** — gewählte Option **B — Fail-Closed** (MVP: kein produktiver 8.16-Sonderfall; verbindlich [`docs/adr/0014-fin5-mvp-tax-fail-closed.md`](../adr/0014-fin5-mvp-tax-fail-closed.md)).

**Zweck:** FIN-5 ([`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Teil 3, Meilenstein **M5**) — Entscheidung **8.16-Sonderfall (Option A)** vs. **Fail-Closed (Option B)** **schriftlich** hier und im ADR festhalten. *(Geschlossen unter Option **B** — siehe unten.)*

**Domänenquelle:** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) — Steuerlogik und EUR-Pfad (**8.16**), USt (**8.11**); ADR-0007 verweist auf späteres FIN-5-Flag ([`docs/tickets/FIN-2-START-GATE.md`](./FIN-2-START-GATE.md) Nachweis-Spalte zu **8.16**).

## Historische Repo-Haltung (vor Gate-Schließung)

Bis zur Ausfüllung der Entscheidungstabelle dokumentierte das Repository eine **technische Fail-Closed-Haltung** (entspricht Option **B**) in [`docs/adr/0014-fin5-mvp-tax-fail-closed.md`](../adr/0014-fin5-mvp-tax-fail-closed.md). **Jetzt:** Option **B** ist **verbindlich** bestätigt (siehe Tabelle unten); keine Pflicht zum Wechsel auf Implementierungsspur **B** ohne weiteren FIN-5-Code.

## Im Repo bereits geklärt (technisch)

- ADR [`0014-fin5-mvp-tax-fail-closed.md`](../adr/0014-fin5-mvp-tax-fail-closed.md) beschreibt die MVP-Fail-Closed-Haltung und verweist auf dieses Gate.
- Code-Hinweise verweisen auf ADR-0014 / Gate (z. B. Rechnungsberechnung).

## Erledigt mit Option B

- Meilenstein **M5** für das Finanz-MVP ist mit **Fail-Closed** erfüllt ([`MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) FIN-5): Standard-USt-Pfad bleibt alleiniger produktiver Steuerpfad bis zu einem **neuen** Gate + Implementierung für Option **A**.
- Es ist **keine** Pflicht, die Produktspur in [`nächste-schritte.md`](../plans/nächste-schritte.md) auf **B** zu stellen, solange kein zusätzlicher FIN-5-Implementierungs-PR ansteht; nächster empfohlener MVP-Schritt ist **FIN-6** ([`MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) M6), Spur **C** dort.


## Entscheidung (eine Option auswählen und begründen)

| Option | Bedeutung | Folge im Repo |
|--------|-----------|----------------|
| **A — Sonderfall aktiv (MVP-Subset)** | Genau **ein** ausgewählter Steuer-Sonderfall aus **8.16** soll produktiv werden | Feature-Flag + Domäne/OpenAPI/Tests laut MVP Teil 3; Export-Preflight ohne stillen Fallback auf Standard-USt |
| **B — Fail-Closed** | Kein produktiver Sonderfall bis zur nächsten expliziten Freigabe | Relevante Pfade bleiben **nicht aktivierbar** oder liefern dokumentiert **fail-closed**; Entscheidung im **ADR** festhalten |

**Gewählte Option (Team):** **B — Fail-Closed**

**Kurzbegründung / Risiko:** Das MVP soll **nur** den dokumentierten Standard-USt-Pfad (DE 19 %, Basispunkte) fahren; **8.16**-Sonderfälle (z. B. Kleinunternehmer, Reverse Charge, §13b-Bauleistung) sind für dieses Release **nicht** produktiv schaltbar. **Risiko / Scope:** Mandanten, für die ein 8.16-Sonderfall **zwingend** ist, sind auf diesem MVP-Stand **nicht** zulässig — Umstellung nur nach neuem Gate, ADR-Update und Implementierungs-PR (Option **A**).

**Referenz Protokoll oder ADR (URL oder Repo-Pfad, nur echte Einträge — keine Platzhalter-URLs durch Agenten):** [`docs/adr/0014-fin5-mvp-tax-fail-closed.md`](../adr/0014-fin5-mvp-tax-fail-closed.md); ergänzend dieses Ticket/Gate-Dokument (Stand **2026-05-04**).

## Nach der Entscheidung (Maintainer)

1. **Option B (wie hier):** [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md) auf FIN-5-Abschluss und nächsten Meilenstein (**FIN-6** / Spur **C**) ausrichten — **kein** erzwungener Wechsel auf Implementierungsspur **B**, wenn kein weiterer FIN-5-Code folgt.
2. Bei späterer Option **A:** Gate neu öffnen bzw. neues Gate-Dokument; Feature-Flag + Domäne/OpenAPI/Tests laut MVP Teil 3; Spur **B** für den Implementierungs-PR setzen.
3. Fail-Closed-Umfang: weiterhin [`docs/adr/0014-fin5-mvp-tax-fail-closed.md`](../adr/0014-fin5-mvp-tax-fail-closed.md) (bei Bedarf um konkrete API-/UI-Liste ergänzen).


## Verwandte Artefakte (ohne Misch-PR)

- Strategischer Kontext: [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md) — Abschnitt **„Große Meilensteine“** / FIN-5.
- Nach FIN-5: FIN-6 und Querschnitte nur als **eigene** Epochen — [`docs/plans/roadmap-fertige-app.md`](../plans/roadmap-fertige-app.md) Phase D, [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md), [`B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](./B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md).
