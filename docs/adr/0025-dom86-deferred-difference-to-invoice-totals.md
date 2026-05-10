# ADR 0025 — DOM-8-6: Differenzbuchung und 8.4-Rechnungs-Summen (bewusst zurückgestellt)

## Status

Accepted (Dokumentations-ADR — kein Motor-Mix mit Slice 3)

## Kontext

ADR-0022 ordnet Differenzzeilen einem Rechnungsentwurf zu und settled bei Buchung, **ohne** `lvNetCents` / `totalGrossCents` des Entwurfs automatisch anzupassen. Die Systembeschreibung (8.4) sieht „enthaltene Differenzbuchungen“ auf dem Rechnungsinhalt vor — das erfordert einen erweiterten Berechnungsmotor oder klare Ausweiszeilen, nicht nur Transparenzfelder.

## Entscheidung

**Slice 3 und Folge-Inkremente bis auf Widerruf:** Keine automatische Einpreisung zugeordneter Differenzbeträge in die FIN-2-Entwurfs-Summenfelder. Operative Ausgleiche laufen über Zuordnung + Settlement + Lesepfade (`allocatedDifferenceBookings`, Projekt-Summary).

Die **echte** 8.4-Anbindung (Summen-/Positionslogik, Export, Mahnsaldo) erfolgt nur nach **[FIN-2-NEXT-SUBPROJECT-GATE.md](../tickets/FIN-2-NEXT-SUBPROJECT-GATE.md)** mit eigenem ADR/Ticket — nicht zusammen mit gebündelter Lesesicht oder Gutschrift-Entwurfspfad.

## Konsequenzen

- UI und Integratoren dürfen Differenz und Rechnungs-Endbetrag **nicht** ohne weiteres addieren — Server liefert getrennte Felder.
- Vermeidung von Doppelzählung und Spec-Drift bis der Motor einheitlich ist.

## Verweise

- [ADR 0022](0022-difference-booking-slice2-allocation-settlement.md)
- [DOM-8-6-SLICE2-API-FIRST-BACKLOG.md](../tickets/DOM-8-6-SLICE2-API-FIRST-BACKLOG.md)
