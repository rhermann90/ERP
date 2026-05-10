# ADR 0024 — DOM-8-6 Slice 2c: Automatischer Folge-Rechnungsentwurf nach Schlussrechnungs-Mitigation

## Status

Accepted (implementiert mit OpenAPI-Erweiterung siehe `info.version` nach Merge).

## Kontext

[ADR 0023](0023-dom86-slice2b-payment-terms-schluss-mitigation.md) liefert nach `POST /invoices/{id}/book` nur `schlussrechnungMitigation` (Hinweis + `suggestedNextBillingKind`). Die Systembeschreibung (§5.4 / §8.6 Randfall a) verlangt bei positivem Ausgleich nach Schlussrechnung einen **neuen Beleg** (Folgerechnung); der FIN-2-Entwurfsmotor basiert weiterhin auf **positivem LV-Netto** aus Positionen ([`InvoiceService.createDraft`](../../src/services/invoice-service.ts)).

## Entscheidung

1. **Plus (Nachforderung):** Wenn `schlussrechnungMitigation.applies` und `suggestedNextBillingKind === FOLGERECHNUNG`, legt der Server **im selben Request** wie die erfolgreiche Buchung und das Settlement der zugeordneten Differenzzeilen einen **neuen Rechnungsentwurf** an: gleiche Traceability wie die **gerade gebuchte** Rechnung (`lvId`, `offerVersionId`, `measurementId`, `paymentTermsVersionId`, `skontoBps`), `billingKind: FOLGERECHNUNG`, mit optionalem Audit-Grundbezug auf die gebuchte Rechnungs-ID.
2. **Minus (Gutschrift):** **Kein** automatischer Entwurf über den unveränderten LV-positiven `createDraft`-Pfad — würde fachlich falsche positive Beträge vortäuschen. Der Server setzt `schlussrechnungFollowUpDraft.created: false` mit `skippedReason: GUTSCHRIFT_REQUIRES_MANUAL_DRAFT`; `schlussrechnungMitigation` bleibt unverändert informativ.
3. **Idempotenz:** Entwürfe, die bereits als automatischer Folge-Entwurf zu derselben **gebuchten** Ausgleichsrechnung existieren, werden nicht dupliziert (`mitigation_follow_up_source_invoice_id` auf `invoices`).
4. **Randfall 8.6(b):** Unverändert [ADR 0022](0022-difference-booking-slice2-allocation-settlement.md) — keine serverseitige Priorität bei mehreren Entwürfen; Zuordnung bleibt explizit.

## Konsequenzen

- Prisma-Migration: nullable `mitigation_follow_up_source_invoice_id` auf `invoices`.
- OpenAPI: `BookInvoiceResponse.schlussrechnungFollowUpDraft`; Contract-Version bump.
- PWA: Anzeige der neuen Entwurfs-ID bei `created: true`.

## Verweise

- [DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md](../tickets/DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md)
- [ADR 0023](0023-dom86-slice2b-payment-terms-schluss-mitigation.md)
