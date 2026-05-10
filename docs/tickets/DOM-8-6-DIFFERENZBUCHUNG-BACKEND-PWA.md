# DOM — §5.4 / §8.6 Differenzbuchung (Backend vor PWA-Tiefe)

**Status:** Slice-2-MVP **abgeschlossen**; Domäne §8.6 **Folge-Inkremente** (ADR-0021 „Offen“) weiter Backlog  
**Stand:** 2026-05-10 (Slice-2-Backlog + PWA-Doku abgeglichen); **Slice 3** gebündelte Summary + Gutschrift-Entwurf siehe [`DOM-8-6-SLICE2-API-FIRST-BACKLOG.md`](./DOM-8-6-SLICE2-API-FIRST-BACKLOG.md).  
**Bezug:** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) (v3.0 — Aufmasskorrekturen nach Rechnung, Differenzbuchung, nächster Entwurf; nach Schlussrechnung Plus/Minus-Automatik), Teil IV Lieferplan Zeile „Aufmass–Rechnung–Differenz“, Teil V Welle W2.

## Ist (Slice 1 — Persistenz / Liste) — im Repository

Slice 1 liefert **Persistenz und Projekt-Lesepfad** (`GET /projects/{projectId}/difference-bookings`); die **PWA** hat sich seit dem ersten Lesepfad erweitert — siehe nachfolgend **„Ist (Stand nach Shell/Hub-Parität)“**.

- **Prisma + Migration:** Modell `DifferenceBooking` (mandantenisoliert), siehe ADR [`0020-difference-booking-measurement-8-6-slice.md`](../adr/0020-difference-booking-measurement-8-6-slice.md).  
- **API + OpenAPI:** `GET /projects/{projectId}/difference-bookings` mit typisierten Zeilen (`DifferenceBookingReadRow` / `DifferenceBookingListResponse` in `docs/api-contract.yaml`).  
- **PWA (Slice-1-Umfang):** In der Rechnungs-Shell weiterhin Tabelle und Roh-JSON für die **Projekt**-Differenzbuchungen (Lesepfad); keine clientseitige Neuberechnung der Beträge.

## Ist (Stand nach Shell/Hub-Parität, PWA)

Abgestimmt mit [`pwa-domain-increment-roadmap.md`](../plans/pwa-domain-increment-roadmap.md) (Stand 2026-05-10): **Finanz-Vorbereitung**, **Rechnungs-Shell** (`#/dokument`, Dokumenttyp INVOICE) und **`#/lv-aufmass`**-Hub nutzen dieselben Komponenten für Zahlungsbedingungs-Differenzbuchung und Entwurfs-Zuordnung:

- [`PaymentTermsDifferenceBookingPanel`](../../apps/web/src/components/finance/PaymentTermsDifferenceBookingPanel.tsx) — gebuchte Rechnung / PT-Differenz (Lesepfad-Schicht).  
- [`InvoiceDraftDifferenceAllocatePanel`](../../apps/web/src/components/finance/InvoiceDraftDifferenceAllocatePanel.tsx) — Entwurf: allocate/deallocate über die dokumentierten API-Pfade.

Der Hub spiegelt zudem die Shell bei **Bezugsrechnung** (`GET` zum Bezugsbeleg) und der Anzeige von **`allocatedDifferenceBookings`** auf dem geladenen Beleg. **PWA-Navigation (2026-05-10):** kurze Deep-Link-Zeilen (`*-dom86-cross-links`) zwischen Finanz-Vorbereitung Schritt 3, Shell INVOICE und Hub. **Slice 2c (ADR-0024):** `POST /invoices/{id}/book` kann bei positivem Schluss-Mitigations-Ausgleich einen **FOLGERECHNUNG**-Entwurf anlegen (`schlussrechnungFollowUpDraft`); die Finanz-Vorbereitung kann auf die neue Entwurfs-ID umschalten — siehe [`0024-dom86-schluss-mitigation-auto-follow-up-draft.md`](../adr/0024-dom86-schluss-mitigation-auto-follow-up-draft.md). **Bewusst Folge-Epic (ADR-0021):** gebündelte Entwurfs-Sicht und übrige §8.6-Randfälle — Ticket [`DOM-8-6-SLICE2-API-FIRST-BACKLOG.md`](./DOM-8-6-SLICE2-API-FIRST-BACKLOG.md) (MVP-Block erledigt; Abschnitt „Offen“).

- **UX (W2):** Schreib-UI für **allocate/deallocate** und **Konditions-Differenz** ist in der PWA eingebunden (Belegstatus/API); Mandanten- und Domänenregeln bleiben serverseitig. Die allgemeine PWA-UX-Welle „Ent-Backend-en“ ([`w2-pwa-ux-backend-exposure-inventory.md`](../plans/w2-pwa-ux-backend-exposure-inventory.md)) betrifft nicht die fachliche Vollständigkeit von §8.6 außerhalb des abgeschlossenen MVP-Blocks.

## Problem (verbleibende Lücken jenseits Slice-2-MVP)

Der **MVP-Block** Slice 2 (explizite Zuordnung, Settlement bei Buchung, Lesepfade, Slice 2b Konditions-Pfad) ist in Ticket [`DOM-8-6-SLICE2-API-FIRST-BACKLOG.md`](./DOM-8-6-SLICE2-API-FIRST-BACKLOG.md) als abgeschlossen dokumentiert. Die normative Domäne (§8.6) verlangt **zusätzlich** noch **Auslöser- und Entwurfslogik** in Randfällen (u. a. gebündelte Entwurfs-Sicht, Schlussrechnung/Vorzeichen jenseits der ADR-0023-Mitigation), die bewusst **nicht** in diesem Block lagen — ADR [`0021`](../adr/0021-difference-booking-slice2-draft-integration-scope.md), Folge-Tickets nach Priorisierung.

## Ziel

1. Domänenmodell + Migration + Service (mandantenisoliert, auditierbar).  
2. OpenAPI + Contract-Tests + ADR (Non-Goals vs. gebuchte Rechnung unverändert).  
3. PWA: Rechnungs-Shell oder Projektansicht um **Differenz-/Auslöser-Metadaten** erweitern (read-only zuerst).

## Nicht-Ziele

- Gebuchte Rechnungen mutieren.  
- Clientseitige Berechnung von Differenzbeträgen.

## Verweise

- Slice 2 — API-first Backlog (Reihenfolge vor Entwurf-UI): [`DOM-8-6-SLICE2-API-FIRST-BACKLOG.md`](./DOM-8-6-SLICE2-API-FIRST-BACKLOG.md).  
- Slice 2 (Entwurfseinbindung, FIN-gegatelter Scope): [`docs/adr/0021-difference-booking-slice2-draft-integration-scope.md`](../adr/0021-difference-booking-slice2-draft-integration-scope.md).
- [`docs/PWA-Entwicklungsreferenz.md`](../PWA-Entwicklungsreferenz.md) — Ist-Matrix Traceability / FIN.  
- [`docs/plans/pwa-backend-coverage-matrix.md`](../plans/pwa-backend-coverage-matrix.md).
