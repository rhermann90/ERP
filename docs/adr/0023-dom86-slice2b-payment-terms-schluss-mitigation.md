# ADR 0023 — DOM-8-6 Slice 2b: Konditions-Differenz und Schlussrechnung-Mitigation

## Status

Accepted (implementiert mit OpenAPI **1.33.0-dom86-slice2b-terms-schluss-mitigation**).

## Kontext

Slice 2b ergänzt §8.6 um (a) einen **API-first** Pfad für **Konditions-Differenzen** nach gebuchter Referenz-Rechnung und (b) einen **Hinweis nach Buchung**, wenn zuvor eine **Schlussrechnung** auf dasselbe Aufmass gebucht war und mit der Buchung **zugeordnete Differenzzeilen** auf **SETTLED** gesetzt werden mit von null verschiedener Summe der Netto-Differenz (Folge: Plus → Folgerechnung, Minus → Gutschrift als empfohlene nächste `billingKind`).

## Entscheidung

- Persistiertes Feld **`billing_kind`** auf **`invoices`** (`REGULAR` | `SCHLUSSRECHNUNG` | `FOLGERECHNUNG` | `GUTSCHRIFT`), setzbar beim Entwurf, lesbar auf `GET /invoices/{id}`.
- **`POST /projects/{projectId}/difference-bookings/from-payment-terms`** ruft `DifferenceBookingService.createPaymentTermsDifferenceBooking` auf (validierte Domänenfehler inkl. Duplikat / Referenz-Konditions-Mismatch).
- **`POST /invoices/{id}/book`** liefert zusätzlich **`schlussrechnungMitigation`** (`buildSchlussrechnungMitigation` nach `settleAllocationsAfterInvoiceBooked`).
- **`DifferenceBookingReadRow`** spiegelt nullable Aufmassversions- und Konditionsversions-Felder je nach `kind`.

## Konsequenzen

- Integratoren und PWA müssen Contract **1.33.0+** erwarten (`SchlussrechnungMitigation`, `billingKind`, erweiterte Differenzzeile).
- Zwei aufeinanderfolgende Prisma-Migrationsordner mit ähnlichem Namen zu Slice-2-Allocation (`20260510120000_*` und `20260511130000_*`) können bei Neuaufsetzen der Historie bereinigt werden; Deploy-Ketten mit angewendeten Migrationen unverändert lassen.

## Verweise

- Ticket: `docs/tickets/DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md`
- Vorläufer: ADR-0021 / ADR-0022 (Zuordnung, Settlement)
