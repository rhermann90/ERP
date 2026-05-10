# ADR 0021 — Differenzbuchung Slice 2: Einbindung in Rechnungsentwurf / §8.6-Randfälle (Scope-Entwurf)

**Status:** Accepted (Scope für Folge-PRs; MVP-Teilmenge umgesetzt — siehe „Umsetzungsstand“; verbleibende Randfälle ohne Spec-Drift)  
**Datum:** 2026-05-11  
**Bezug:** [`docs/adr/0020-difference-booking-measurement-8-6-slice.md`](./0020-difference-booking-measurement-8-6-slice.md); [`docs/tickets/DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md`](../tickets/DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md); [`docs/tickets/FIN-2-NEXT-SUBPROJECT-GATE.md`](../tickets/FIN-2-NEXT-SUBPROJECT-GATE.md); [`docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md).

## Kontext

Slice 1 liefert persistierte `difference_bookings`, Lesepfad `GET /projects/{projectId}/difference-bookings` und PWA-read-only ohne Client-Berechnung. Die Systembeschreibung (§8.6) verlangt zusätzlich die **Einbindung in den nächsten Rechnungsentwurf** sowie Randfälle (mehrere Entwürfe, Schlussrechnung, Vorzeichen-Automatik, Konditionswechsel).

## Umsetzungsstand (Slice-2-MVP im Repo)

**Erledigt:** explizite Zuordnung allocate/deallocate, `allocatedDifferenceBookings` auf `GET /invoices/{id}`, Lesepfad Bezugsrechnung, Konditions-Differenz (ADR-0023), Schluss-Mitigation inkl. optionalem Auto-Folge-Entwurf (ADR-0024); PWA-Schreibmasken ohne separates Vite-Flag ([`apps/web/README.md`](../../apps/web/README.md)).

**Slice 3 (Rest §5.4/§8.6):** `GET /projects/{projectId}/difference-bookings/summary` (gebündelte Lesesicht OPEN + zu ENTWÜRFEN zugeordnet); Gutschrift-Entwurf über negierte LV-Beträge bei `billingKind: GUTSCHRIFT` ([`DOM-8-6-SLICE2-API-FIRST-BACKLOG.md`](../tickets/DOM-8-6-SLICE2-API-FIRST-BACKLOG.md)); **keine** automatische Einpreisung in 8.4-Summen — [`0025-dom86-deferred-difference-to-invoice-totals.md`](./0025-dom86-deferred-difference-to-invoice-totals.md).

## Entscheidung (Scope)

1. Slice 2 wird **eigenes** Inkrement mit OpenAPI-/FIN-Abgleich; kein stiller UI-Hinweis „Differenz im Entwurf“, bevor die API ein belastbares Feld oder eine serverseitig gebündelte Lesesicht liefert.
2. Reihenfolge-Vorschlag zur Ausarbeitung: (a) Datenmodell/API für **Sichtbarkeit offener Differenzzeilen je Entwurf** oder **explizite Zuordnung**; (b) Schlussrechnung / Vorzeichen nur nach Domänenworkshop; (c) Konditions-Differenz getrennt von Aufmassversionspaar.
3. **Gates:** FIN-2-Subprojekt-Gate und Wave3-Backlog vor Motor-Erweiterungen; gebuchte Rechnungen bleiben unverändert (wie ADR-0020).

## Nicht-Ziele

- Keine partielle Implementierung nur in der PWA.
- Keine clientseitige Differenzberechnung.

## Konsequenzen

Nach Annahme dieses ADRs: Ticket-Split oder Erweiterung DOM-8-6 mit Akzeptanzkriterien pro Randfall; CI mit `verify:ci` und bei Persistenz `verify:ci:local-db`.

## Alternativen

- **Nur UI-Platzhalter:** verworfen (Spec-Drift-Risiko).
