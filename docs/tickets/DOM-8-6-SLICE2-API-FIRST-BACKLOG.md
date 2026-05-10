# DOM-8-6 — Slice 2 (§8.6 Entwurf / Randfälle): API-first Backlog

**Status:** MVP-Block **abgeschlossen** (explizite Zuordnung, Lesepfade, Slice 2b); **Folge-Epic** §8.6-Randfälle gemäß ADR-0021  
**Stand:** 2026-05-10  
**Parent:** [`DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md`](./DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md)  
**Scope-ADR:** [`docs/adr/0021-difference-booking-slice2-draft-integration-scope.md`](../adr/0021-difference-booking-slice2-draft-integration-scope.md) (Accepted — verbleibende Randfälle nur Folge-Epic)  
**Gates:** [`FIN-2-NEXT-SUBPROJECT-GATE.md`](./FIN-2-NEXT-SUBPROJECT-GATE.md), [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md) bei finanzrelevanten API-Erweiterungen

## Umgesetzt (Randfall 1 — explizite Bezugsrechnung)

- **OpenAPI / Backend / PWA (read-only):** `GET /invoices/{invoiceId}/difference-bookings` liefert nur Zeilen mit `referenceInvoiceId === invoiceId` (kein Entwurfs-Merge, keine Client-Berechnung). PWA: Rechnungs-Shell Button „Differenzbuchungen Bezugsrechnung (GET)“ + Tabelle/JSON wie Projekt-Lesepfad.

## Umgesetzt (MVP-Block — explizite Zuordnung zum Entwurf, ADR-0022 / 0023)

- **Allocate / Deallocate:** `POST /invoices/{invoiceId}/difference-bookings/allocate` und `…/deallocate`; Statusmodell und Invarianten wie ADR-0022.
- **`GET /invoices/{id}`:** `allocatedDifferenceBookings` (serverseitig).
- **Konditions-Differenz (Slice 2b):** `POST /projects/{projectId}/difference-bookings/from-payment-terms` inkl. `billingKind` / Schlussrechnung-Mitigation nach ADR-0023.
- **PWA:** Schreibmasken für allocate/deallocate und Konditions-Differenz ohne separates Build-Flag ([`apps/web/README.md`](../../apps/web/README.md)); Lesepfade und Tabellen wie zuvor.

## Umgesetzt (Slice 2c — Auto-Folge-Entwurf, ADR-0024)

- **`POST /invoices/{invoiceId}/book`:** **`schlussrechnungFollowUpDraft`** — bei positivem Ausgleich nach früherer Schlussrechnung automatischer **FOLGERECHNUNG**-`ENTWURF`; **Gutschrift** ohne Auto-Entwurf (`GUTSCHRIFT_REQUIRES_MANUAL_DRAFT`). Idempotenz: **`mitigation_follow_up_source_invoice_id`**. ADR: [`docs/adr/0024-dom86-schluss-mitigation-auto-follow-up-draft.md`](../adr/0024-dom86-schluss-mitigation-auto-follow-up-draft.md).

## Regel

Keine PWA-Oberfläche, die suggeriert, eine Differenz sei „bereits im Rechnungsentwurf“, bevor das Backend ein belastbares Feld oder eine gebündelte Lesesicht liefert (ADR-0021). **Für den MVP-Block** liefert das Backend `allocatedDifferenceBookings` auf dem Beleg sowie allocate/deallocate; eine **gebündelte Lesesicht „offene Zeilen je Entwurf“ ohne vorherigen Rechnungs-GET** ist nicht Teil dieses Abschlusses.

## Slice 3 — §5.4 / §8.6 Rest („nächster Entwurf“ + Randfälle) — Akzeptanz

**Stand Umsetzung:** gebündelte Projekt-Lesesicht, Gutschrift-Entwurfspfad nach Mitigation (Minus), formale 8.6(b)-Referenz, W2-Traceability; **8.6(c)** Storno/Zahlungen und **8.4-Einpreisung** der Differenz in Entwurfssummen bleiben aus diesem Slice (eigene Gates).

| Phase | Akzeptanz (kurz) |
|-------|-------------------|
| **0** | Randfälle abgegrenzt: 8.6(b) = explizite Zuordnung (ADR-0022); 8.6(c) out of scope; „Ausgleichsposten mit Freigabe“ ohne eigenes Produktworkflow-Stück bis Workshop |
| **1** | `GET /projects/{projectId}/difference-bookings/summary` liefert `open[]` und `allocatedByDraft[]` ohne Client-Nachrechnung; Mandant strikt; FIN4-Header wie Projekt-Differenzpfad |
| **2** | `POST /invoices` mit `billingKind: GUTSCHRIFT` erzeugt Entwurf mit **negierten** LV-basierten Beträgen (Gutschrift-Semantik); optional `mitigationFollowUpSourceInvoiceId`; Buchung mit zugeordneten Differenzzeilen SETTLED wie regulär |
| **3** | PWA: Lesepfad zur Summary / Projekt-Differenzliste von LV-Aufmass-Hub und nachziehende Matrix-Zeile |
| **4** | Nur Dokumentation: Einpreisung Differenz → 8.4-Motor nach FIN-2-Gate (kein stiller Summen-Mix in diesem PR) |

## Erledigt (Slice 3 — Referenz)

- Gebündelte Lesesicht (`…/difference-bookings/summary`) — siehe OpenAPI und [`DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md`](./DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md).
- Gutschrift-Entwurf + Mitigations-Verknüpfung optional auf Entwurf.
- ADR-0022 Ergänzung §8.6(b); ADR-0025 (defer 8.4-Roll-in).

## Umsetzungsreihenfolge (Folge-PRs — bei Bedarf)

1. **Fachlichen Randfall** aus „Offen“ wählen (Akzeptanzkriterien).
2. **OpenAPI** [`docs/api-contract.yaml`](../api-contract.yaml) + ggf. [`docs/contracts/error-codes.json`](../contracts/error-codes.json).
3. **Domäne + Service + Persistenz** (`src/`, `prisma/`) mandantenisoliert, auditierbar; keine Mutation gebuchter Rechnungen.
4. **Tests:** Root-`npm test` / Persistenz wie [`docs/runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md) bei DB-Touch.
5. **PWA** nur read-only auf neue Lesepfade; `apps/web/src/lib/api-client.ts` synchron.

## Nicht-Ziele

- Clientseitige Differenzberechnung.  
- Parallele SoT-Logik in der UI.
