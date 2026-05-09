# ADR 0020 — Differenzbuchung (§5.4 / §8.6) Lesepfad-Slice: Aufmassversionspaar

**Status:** Accepted (Slice 1 — Lesepfad + Persistenzkern)  
**Datum:** 2026-05-11  
**Bezug:** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) §5.4, §8.6; Ticket [`DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md`](../tickets/DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md); Teil V Welle W2.

## Kontext

Die Domäne verlangt persistierte **Differenzbuchungen** mit auditierbarem Auslöser (u. a. Aufmassversionspaar) und LV-Netto-Delta, **ohne** gebuchte Rechnungen zu mutieren. Die PWA soll den Sachverhalt nachvollziehbar darstellen können.

## Entscheidung

1. **Tabelle `difference_bookings`** (Prisma `DifferenceBooking`) mit Mandanten-PK `(tenant_id, id)`, eindeutig je `subsequent_measurement_version_id` pro Mandant.
2. **Auslöser `MEASUREMENT_CORRECTION_AFTER_INVOICE`:** Wird angelegt, wenn nach **mindestens einer gebuchten** Rechnung (`GEBUCHT_VERSENDET` | `TEILBEZAHLT` | `BEZAHLT`) zur selben `measurement_id` eine **neue Aufmassversion** erstellt wird (`POST /measurements/version`). Betrag = Differenz der **8.4(1)-äquivalenten** LV-Nettosumme (nur NORMAL-Positionen, `round(Menge × unitPriceCents)`) zwischen Vorgänger- und Nachfolgeversion.
3. **Nachziehen bei Positionsänderung:** `POST /measurements/{subsequentVersionId}/positions` aktualisiert eine offene (`OPEN`) Zeile desselben `subsequent_measurement_version_id` neu.
4. **Lesepfad:** `GET /projects/{projectId}/difference-bookings` — gleiche Leserollen wie Rechnung (`assertCanReadInvoice`).
5. **Audit:** `DIFFERENCE_BOOKING_CREATED`, `DIFFERENCE_BOOKING_AMOUNT_RECALCULATED` mit `entityType` `DIFFERENCE_BOOKING`.

## Nicht-Ziele (explizit)

- Keine Mutation gebuchter Rechnungen oder Belegnummern.
- Keine clientseitige Berechnung des Differenzbetrags.
- Keine vollständige Abbildung sämtlicher **8.6**-Randfälle (mehrere offene Entwürfe, Schlussrechnung-Automatik, Konditionswechsel-Differenz) in diesem Slice — Folge-Inkremente mit eigenem Gate/ADR.

## Konsequenzen

- OpenAPI/`info.version`-Bump gebündelt mit Lesepfad; PWA-Shell optionaler Button.
- Postgres-Migration `20260511120000_difference_bookings_8_6`; Memory-Modus hält Daten nur im `InMemoryRepositories`-Spiegel (Persistenz-Port `noop` außerhalb Postgres).

## Alternativen (verworfen)

- **Nur Audit-JSON ohne Tabelle:** genügt nicht für belastbare GET-Liste und Mandanten-Reporting.
- **Differenz nur in Rechnungsentwurf speichern:** verletzt Anforderung „eigene Buchung“ vor Integration in den nächsten Entwurf.
