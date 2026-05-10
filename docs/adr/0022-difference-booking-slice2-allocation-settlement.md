# ADR 0022 — Differenzbuchung Slice 2: Zuordnung zum Rechnungsentwurf und Settlement bei Buchung

**Status:** Accepted  
**Datum:** 2026-05-10  
**Bezug:** [`docs/adr/0020-difference-booking-measurement-8-6-slice.md`](./0020-difference-booking-measurement-8-6-slice.md), [`docs/adr/0021-difference-booking-slice2-draft-integration-scope.md`](./0021-difference-booking-slice2-draft-integration-scope.md); [`docs/tickets/FIN-2-NEXT-SUBPROJECT-GATE.md`](../tickets/FIN-2-NEXT-SUBPROJECT-GATE.md); ERP §8.6 Randfall (b).

## Kontext

Slice 1 und Lesepfad „Bezugsrechnung“ sind umgesetzt. Für die Einbindung in die **nächste zu erstellende Rechnung** (Entwurf) braucht es eine serverseitige, auditierbare Zuordnung ohne Spekulations-UI und ohne Mutation gebuchter Rechnungen.

## Entscheidung

1. **Explizite Zuordnung:** Nur über API (`POST` allocate / deallocate). Keine automatische Verteilung auf einen von mehreren Entwürfen (§8.6(b): Mehrere Entwürfe — **Default:** Mandant/Buchhaltung ordnet explizit zu; keine Prioritäts-Heuristik im MVP-Slice).
2. **Statusmodell:** `OPEN` → `ALLOCATED_TO_DRAFT` (Feld `allocatedInvoiceId` zeigt auf Rechnung im Status `ENTWURF`) → `SETTLED` beim erfolgreichen `BOOK_INVOICE` dieser Rechnung. `SETTLED` behält `allocatedInvoiceId` zur Nachverfolgung.
3. **Invarianten Zuordnung:** Gleiche `tenantId`, `projectId` und `measurementId` wie die Ziel-Rechnung; Ziel nur `ENTWURF`; Buchung nur mit bestehenden FIN-2-Guards.
4. **Betragszeile:** Zuordnung ändert **nicht** automatisch `lvNetCents`/`totalGrossCents` des Entwurfs (kein stiller 8.4-Motor); die zugeordneten Differenzzeilen sind **Transparenz** für Ausgleich und spätere 8.4-Anbindung.
5. **FIN-2-Reihenfolge:** Dieser Block ist **kein** Ersatz für 8.4(2–6)-Motor; er ist ein **eigenständiger DOM-8-6-Schritt**, konsistent zu [`FIN-2-NEXT-SUBPROJECT-GATE.md`](../tickets/FIN-2-NEXT-SUBPROJECT-GATE.md) (keine Vermischung mit Pfad C / Motor in einem PR).

## Nicht-Ziele

- §8.6(a) Schlussrechnung / Vorzeichen-Automatik (Folge-Epic).
- Konditionswechsel-Differenz als zweiter Auslöser (Folge-Epic).
- Clientseitige Differenzberechnung.

## Konsequenzen

- Migration `difference_bookings`: `allocated_invoice_id`, `allocated_at`, `settled_at`; FK `(tenant_id, allocated_invoice_id)` → `invoices`.
- OpenAPI-Erweiterung `DifferenceBookingReadRow` + `InvoiceGetResponse.allocatedDifferenceBookings`; neue POST-Endpunkte allocate/deallocate.
- Nachgelagerte Arbeit: Summen-/Zeilenlogik Entwurf ↔ Differenzbetrag (8.4-Anbindung) bei eigenem Gate.

## Normative Zuordnung ERP §8.6 Randfall (b)

Die Systembeschreibung verlangt bei mehreren offenen Entwürfen eine **Prioritätsregel** oder einen Default (**ein aktiver Entwurf**). **Produktentscheidung dieses Repos (Slice 2–3):** Es gibt **keine** serverseitige automatische Priorität — Zuordnung erfolgt **ausschließlich** über `allocate`/`deallocate`. Mehrere ENTWÜRFE im gleichen Kontext sind zulässig; Buchhaltung wählt den Zielentwurf explizit. Eine spätere Heuristik oder ein „Single-Active-Draft“-Erzwingung wäre eigenes ADR/Ticket.
