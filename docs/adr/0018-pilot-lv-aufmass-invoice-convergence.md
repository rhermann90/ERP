# ADR 0018: Pilot-Konvergenz LV / Aufmass → Rechnung (8.4(1))

## Status

Accepted

## Kontext

Das Projekt verpflichtet **End-to-End-Nachvollziehbarkeit** und verbietet „Schein-Rechnungen“ ohne dokumentierte Quellenpfade ([`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md), Teil 5). Phase‑2 liefert **Aufmass-Lebenszyklus** und **LV‑Hierarchie/Sektion 9** als fachliche Basis ([`adr/0004-measurement-lifecycle-phase2-inc1.md`](./0004-measurement-lifecycle-phase2-inc1.md), [`adr/0005-lv-hierarchy-phase2-inc2.md`](./0005-lv-hierarchy-phase2-inc2.md), [`adr/0013-lv-section9-hierarchy-and-text-separation.md`](./0013-lv-section9-hierarchy-and-text-separation.md)).

Ein kontrollierter **Pilot-Produktiv-Go** soll denselben Kernpfad wie die MVP-Pipeline nutzen, ohne 8.4(2–6) oder Pfad C vorzuverlegen ([Pilot-Charter](../tickets/PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md)).

## Entscheidung

1. **Rechnungsentwurf (`POST /invoices`)** wird nur gebildet, wenn die **Traceability-Kette** zur LV‑Version und zum Projekt/Kunden konsistent ist und mindestens ein **Aufmass** für diese Kombination existiert (Implementierung: `InvoiceService.createDraft`, Gate **G5** und Aufmass-Lookup).

2. Der **Nettobetrag aus LV‑Positionen** für den MVP-Schritt **8.4(1)** wird aus der gebuchten LV‑Version ermittelt (`listLvPositionsForVersion`, Aggregation `sumLvNetCentsStep84_1`). **Partial-Daten** oder fehlende LV‑Positionen führen zu abweichenden/fehlenden Summen und sind über Seed/Datenqualität bzw. spätere Validierung zu steuern — der Pilot verpflichtet sich nicht zu „alle LV-Zustände“, sondern zu **diesem** dokumentierten Adapter.

3. **Weitere 8.4-Schritte** bis **8.4(6)** im MVP sind weiterhin über die bestehende Pipeline gekoppelt (Skonto, Rundung etc.) gemäß Domänenimplementierung; **8.4(2–6)** als eigenständiger Motor bleibt aus diesem ADR **ausgeschlossen** (siehe FIN‑2‑NEXT).

## Konsequenzen

- Positive Nachweise: Persistenz-Integration mit Demo-Seed (`POST /invoices` … `lvNetCents`/`totalGrossCents`, Buchung; siehe FIN-1 M1 `it` in [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts)) und Stub-/HTTP-Tests für FIN‑Gate-Kanten.
- Aufmass-Pflicht (Negativ): [`test/invoice-service-pilot-convergence.test.ts`](../../test/invoice-service-pilot-convergence.test.ts).
- Negative Kanten (gebrochene Traceability beim Export): weiterhin `TRACEABILITY_*` Fehlercodes wie dokumentiert.
- OpenAPI bleibt unverändert, solange nur Domänenlogik/Doku betroffen sind.

## Referenzen

- [`adr/0007-finance-persistence-and-invoice-boundaries.md`](./0007-finance-persistence-and-invoice-boundaries.md)
- [`docs/tickets/FIN-2-NEXT-SUBPROJECT-GATE.md`](../tickets/FIN-2-NEXT-SUBPROJECT-GATE.md)
- Implementierung: [`src/services/invoice-service.ts`](../../src/services/invoice-service.ts)
