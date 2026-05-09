# FOLLOWUP — Audit Option A (Domäne + Audit in einer DB-Transaktion)

**Status:** Stub für späteren PR — **nicht** mit B5-PDF oder FIN-6-Logging-Redaction mischen.

**Hintergrund:** [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) beschreibt Option **B** (fail-hard) als umgesetzt; Option **A** = atomare Transaktion Domänenmutation + `audit_events.insert`.

## Umsetzungs-Checkliste (wenn priorisiert)

1. Maintainer-Eintrag im Audit-Gate-Abschnitt des FOLLOWUP-Tickets (vier Zellen).
2. Prisma-Transaktionsgrenze pro Use-Case (Offer, Invoice, PaymentIntake, …) einzeln bewerten — kein Big-Bang.
3. Tests: bei absichtlichem Audit-Fehler **Rollback** der Domänenmutation im gleichen Request.
4. ADR-Update oder neues ADR nach erstem erfolgreichen Slice.
