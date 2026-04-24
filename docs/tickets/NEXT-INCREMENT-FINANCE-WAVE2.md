# Nächstes Produktinkrement — Finanz Welle 2 (Team-Default)

**Stand:** 2026-04-22  
**Kontext:** FIN-1/2/3 umgesetzt; SoT **BOOK_INVOICE**; FIN-4 **Lesepfad** + `dunning_reminders` ([ADR-0009](../adr/0009-fin4-mahnwesen-slice.md)); **8.4(2–6)** fachlich noch B2-0 (`netCentsAfterStep84_6Mvp`, [ADR-0007](../adr/0007-finance-persistence-and-invoice-boundaries.md)).

## Entscheidung (Default für die nächste abgrenzbare Umsetzung)

**Pfad B — FIN-4 Schreibpfad minimal** (ein kontrollierter **POST** zum Anlegen eines **DunningReminder**, inkl. Mandanten-FK, Audit, Lesepfad-Konsistenz; **kein** E-Mail-/Massenversand M4). **Umsetzung (Repo):** `POST /invoices/{invoiceId}/dunning-reminders`, SoT **`RECORD_DUNNING_REMINDER`**, ADR-0009 Slice 2.

**Begründung:** Vertikaler Abschluss des FIN-4-Stubs vor weiterer Ausbreitung der **8.4**-Teilregeln; Risiko begrenzbar gegenüber vollständigem Mahnlauf oder großem Rechnungs-Zwischenstatus-Workflow.

## Nicht-Ziele (explizit aus diesem Inkrement)

- **Kein** produktiver Mahnlauf, Vorlagen-Engine, E-Mail-Footer oder Massenversand (**8.10** Vollbild bleibt FIN-4 M4).
- **Kein** Pfad C (Zwischenstatus GEPRUEFT/FREIGEGEBEN) ohne separates ADR/PL-Gate.
- **Kein** vollständiges **8.4 B2-1**-Paket (Nachlass/Skonto/Einbehalt) im selben PR wie FIN-4-Schreibpfad — **G8** / §5b: getrennte PRs bevorzugt.

## Alternative (nächster Sprint danach oder parallel nach PL-Veto)

**Pfad A — 8.4 „B2-1“:** genau **eine** Teilregel aus Spez 8.4(2–6) + ADR-0007-Update; Domäne `invoice-calculation` / Service.

**Pfad C — Rechnungs-Workflow:** nur nach ADR + `allowedInvoiceActionsByStatus`-Abstimmung.

## Referenzen

- Plan-Spiegel (nicht editieren): Cursor-Plan „Nächste Schritte BE/FE/QA/Review“.
- Review: [`docs/contracts/review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md).
