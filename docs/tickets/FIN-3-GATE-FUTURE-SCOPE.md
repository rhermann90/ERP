# FIN-3 — Gate: Erweiterung §8.8 / §8.9 / Bankfile (zukünftig)

**Ist (MVP):** Intake, Idempotenz §8.7, Status **TEILBEZAHLT** / **BEZAHLT** — siehe [`FIN-3-BACKLOG-88-89.md`](./FIN-3-BACKLOG-88-89.md).

## Vorbedingungen für einen Implementierungs-PR

1. Fachliche Priorisierung (Splitting, Mehrfachbelege, Clearing-Produkte) schriftlich.
2. OpenAPI + `error-codes.json` + [`finance-fin0-openapi-mapping.md`](../contracts/finance-fin0-openapi-mapping.md) vor Merge grün.
3. Persistenz-Suite (`verify:ci:local-db`) für neue Tabellen/Constraints.
4. Kein Mix mit **8.4(2–6)** oder **Pfad C** ohne separates Gate ([`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md)).

## Akzeptanz (Draft)

- Erweiterte Zuordnung bleibt tenant-isoliert und auditierbar.
- Bankfile-/PSP-Import: technischer Duplikat-Schlüssel weiterhin §8.7-konform dokumentiert.
