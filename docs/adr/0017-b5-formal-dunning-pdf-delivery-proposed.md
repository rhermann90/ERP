# ADR 0017 — B5: Formales Mahn-PDF (Liefergrenze, Proposed)

## Status

**Proposed** — Lieferung nur nach Gate [`docs/tickets/B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](../tickets/B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md); nicht mit FIN-6-Logging-PR oder Audit-Transaktions-PR mischen.

## Kontext

Mahnwesen **8.10** / M4 liefern E-Mail und Konfiguration; formales **PDF** als eigener B5-Slice — Spezifikation [`docs/tickets/B5-FORMAL-DUNNING-PDF.md`](../tickets/B5-FORMAL-DUNNING-PDF.md).

## Entscheidung (Zielbild)

1. PDF-Generierung serverseitig; Rendering aus denselben Platzhalter-/Whitelist-Regeln wie E-Mail (ADR-0010).
2. PWA: Anzeige/Download nur über dokumentierte Lesepfade — keine parallele Berechnung von Mahngebühr.
3. Audit: Mahn-PDF-Erstellung als eigenes Ereignis; **nicht** im selben PR wie `AuditService`-Transaktionsumbau ([`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md)).

## Verweise

- Domänen-Anker (falls vorhanden): `src/domain/dunning-formal-notice-spec.ts`
