# FIN-3 — Backlog §8.8 / §8.9 (jenseits Intake-Slice)

**Stand Repo:** **M3 Intake** (`POST /finance/payments/intake`, `GET /invoices/{id}/payment-intakes`, Idempotenz §8.7) ist umgesetzt — siehe [`docs/adr/0007-finance-persistence-and-invoice-boundaries.md`](../adr/0007-finance-persistence-and-invoice-boundaries.md), [`docs/contracts/finance-fin0-openapi-mapping.md`](../contracts/finance-fin0-openapi-mapping.md), [`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) (FIN-3 / Meilenstein M3).

**Gate / späterer Scope:** [`FIN-3-GATE-FUTURE-SCOPE.md`](./FIN-3-GATE-FUTURE-SCOPE.md).

**Ausdrücklich backlog / out of scope MVP:**

- **§8.8** erweiterte Zahlungszuordnung (Mehrfachbelege, komplexe Splits über den aktuellen Intake hinaus).
- **§8.9** vollständige Statuslogik jenseits der aus Intakes ableitbaren **TEILBEZAHLT** / **BEZAHLT**-Übergänge.
- **Bankfile-/PSP-Anbindung**, Chargebacks — separates Inkrement mit Gate.

**Querschnitt:** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) (Abschnitte 8.8, 8.9).
