# FIN-2 — Nächstes Teilprojekt (Reihenfolge ohne Parallel-Gates)

**Status:** beschlossen für Repo-Umsetzung (Micro-Schritte Finanz-MVP).  
**Zweck:** Vor Arbeit an **8.4(2–6)-Motor**, **Pfad C** (GEPRÜFT/FREIGEGEBEN) oder **LV→Rechnung-E2E** genau **ein** Teilprojekt prioritär fahren — keine Vermischung ohne dokumentiertes Gate ([`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md) Non-Goals).

## Festgelegte Reihenfolge

| Priorität | Teilprojekt | Begründung |
|-----------|-------------|------------|
| **1** | **LV→Rechnung Traceability Lesepfad / Nachweis** | Geringste Domänenrisiken: bestehende APIs (`GET /invoices/{id}`, Shell, E2E) um konsistente **lvVersionId**-/Ketten-Sichtbarkeit und Regressionstests erweitern — Vorbereitung für echte Phase-2-Einspeisung ohne neuen 8.4-Motor. |
| **2** | **8.4(2–6)-Motor** (über B2-1a/Skonto hinaus) | Nur nach Priorität 1 und separatem Scope/Gate; ADR-0007 Non-Goals beachten. |
| **3** | **Pfad C** — Zwischenstatus GEPRÜFT/FREIGEGEBEN | ADR-0007 §8 (Variante B); eigenes Gate und API-Automat — nicht parallel zu Priorität 2 mischen. |

## Ist-Stand Priorität 1 (Repo, Lesepfad / Nachweis)

Umgesetzt:

- PWA Rechnungs-Shell: Trace-Zeilen inkl. **lvVersionId**, **measurementId**, **offerVersionId** (`apps/web/src/App.tsx`; `data-testid`s `shell-invoice-trace-lv`, `shell-invoice-trace-measurement`, `shell-invoice-trace-offer-version`).
- PWA Rechnungs-Shell: read-only **`GET /documents/{offerVersionId}/allowed-actions?entityType=OFFER_VERSION`** wenn die Rechnung eine Angebotsversion trägt (`shell-invoice-offer-version-allowed-actions-fetch` / `-json`).
- Backend: `GET /invoices/{id}` gegen Seed-Traceability (`test/app.test.ts`).
- E2E: Trace-IDs, Seed-LV, Seed-Aufmass-ID, OFFER_VERSION-SoT-Panel (`e2e/login-finance-smoke.spec.ts`).

**Weiterhin offen** (Priorität 2–3 laut Tabelle oben): **8.4(2–6)**-Motor (über explizite MVP-Pipeline in `invoice-calculation.ts` hinaus), **Pfad C** — ADR Proposed [`docs/adr/0016-fin2-path-c-intermediate-status-proposed.md`](../adr/0016-fin2-path-c-intermediate-status-proposed.md), belastbarer produktiver Lesepfad aus Phase-2-LV — nicht ohne separates Gate / Scope mischen.

## Nächster Brocken (Repo-Default ohne Team-Abweichung)

- Solange diese Reihenfolge **nicht** per PR geändert wird und **Priorität 1** weiterhin als umgesetzt gilt, ist der **nächste große Finanz-Domänenschritt** tabellarisch **Priorität 2**: **8.4(2–6)-Motor** — nur mit **eigenem Scope/Gate** und konsistent zu [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md) (**Option B**).
- **Priorität 3** (**Pfad C**, Zwischenstatus) **danach**, ebenfalls **eigenes ADR/Gate** — nicht parallel zu Priorität 2 im selben Strang mischen.
- **Phase-2-LV** (Einspeisung / Lesepfade) bleibt **eigenes** Programm: [`PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](./PHASE-2-PRIORISIERUNG-INCREMENT-2.md), [`PHASE-2-STARTAUFTRAG.md`](./PHASE-2-STARTAUFTRAG.md) — **kein** Mischen mit 8.4(2–6) oder Pfad C ohne beschlossenes Gate.

## Zurückstellung DOM-8-6 (Differenz → Entwurfssummen)

Die **automatische Verrechnung** zugeordneter **DifferenceBooking**-Beträge in **`lvNetCents`** / **`totalGrossCents`** eines Rechnungsentwurfs gehört zum **8.4-Gesamtmotor** und ist bis auf Widerruf **nicht** implementiert — siehe ADR [`0025-dom86-deferred-difference-to-invoice-totals.md`](../adr/0025-dom86-deferred-difference-to-invoice-totals.md). Umsetzung nur zusammen mit Priorität **2** (8.4(2–6)-Motor) nach beschlossenem Scope/Gate.

## Review-Anker

- [`FIN-2-START-GATE.md`](./FIN-2-START-GATE.md) — relevante **G1–G10** je nach Teilprojekt.  
- [`MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Teil 7 Master-Tabelle FIN-2.

## Änderung der Reihenfolge

Nur durch Team-Beschluss und Aktualisierung **dieser** Datei (PR mit Begründung).

## Konvergenz Phase 2 (LV / Aufmass → Rechnung)

Die **Einspeisung belastbarer LV-Nettowerte** in Schritt **8.4(1)** läuft über den Phase-2-Strang — siehe [`PHASE-2-STARTAUFTRAG.md`](./PHASE-2-STARTAUFTRAG.md), [`PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](./PHASE-2-PRIORISIERUNG-INCREMENT-2.md).

- **Adapter / Grenzen (Pilot-Konvergenz):** [`docs/adr/0018-pilot-lv-aufmass-invoice-convergence.md`](../adr/0018-pilot-lv-aufmass-invoice-convergence.md) und Charter [`PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md`](./PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md). Damit ist die **dokumentierte** Einspeisung von LV-Netto in 8.4(1) mit Aufmass-Pflicht im Repo verankert; verbleibender Brocken für „Motor-Tiefe“ bleibt **Priorität 2** (8.4(2–6)), nicht parallel ohne Gate.
- **Keine** Vermischung mit 8.4(2–6)-Motor- oder Pfad-C-PRs ohne Gate; nachgelagerter **End-to-End-Nachweis** Rechnung ↔ LV-Kette ergänzt Priorität 1 (Lesepfad), sobald Phase-2-Daten produktiv angebunden sind.
