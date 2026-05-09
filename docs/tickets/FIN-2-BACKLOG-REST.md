# FIN-2 — Rest-Backlog (nach Lesepfad / Gate)

**Zweck:** Kurz-Anker für alles, was **nicht** im FIN-2-Kern (Entwurf, Lesen, Buchung, Traceability-Lesepfad) steckt — ohne neue Gates zu erfinden.

**Kanone Reihenfolge:** [`FIN-2-NEXT-SUBPROJECT-GATE.md`](./FIN-2-NEXT-SUBPROJECT-GATE.md) (Prio 2: **8.4(2–6)-Motor**, Prio 3: **Pfad C**).

**Wellenkontext:** [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md) — Option **B** (8.4-Tiefenmotor) und Option **C** (Zwischenstatus) nur mit **eigenem ADR/Gate**, nicht parallel ohne Dokumentation mixen.

**Start-Gate / Grenzen:** [`FIN-2-START-GATE.md`](./FIN-2-START-GATE.md), [`docs/adr/0007-finance-persistence-and-invoice-boundaries.md`](../adr/0007-finance-persistence-and-invoice-boundaries.md).

**Domäne (8.4 Schritte 2–6):** Explizite MVP-Pipeline (`computeInvoiceNetPipeline84Through6Mvp`) in [`src/domain/invoice-calculation.ts`](../../src/domain/invoice-calculation.ts) — Schritt 2 = B2-1a Skonto; Schritte 3–6 noch Identität bis vollständiger Motor (Priorität 2).
