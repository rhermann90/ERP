# Domänen-Inkremente — Priorisierte Roadmap (UI/UX)

**Zweck:** Reihenfolge für **messbare** PWA-Inkremente entlang der Traceability-Kette und der bestehenden Ticket-Landschaft. Jedes Inkrement: wo möglich kleiner PR mit OpenAPI/`api-client`-Sync, Komponenten unter `apps/web/src/components/`, Smoke/E2E wenn Journey kritisch.

**Abgleich:** [`pwa-backend-coverage-matrix.md`](./pwa-backend-coverage-matrix.md), übergeordnet [`roadmap-fertige-app.md`](./roadmap-fertige-app.md), Pilot/Konvergenz [`docs/adr/0018-pilot-lv-aufmass-invoice-convergence.md`](../adr/0018-pilot-lv-aufmass-invoice-convergence.md).

---

## Reihenfolge (Bundled Increments)

| # | Bund | Ziel | Ticket-/ADR-Anker |
|---|------|------|---------------------|
| 1 | **Stammdaten / Einstiege** | Pilot: `#/stammdaten` (XRechnung/FIN-1); §18.1-vollständig: Option C nach ADR [`0019-w1-stammdaten-project-customer-object-option-c.md`](../adr/0019-w1-stammdaten-project-customer-object-option-c.md) | [`PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md`](../tickets/PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md) |
| 2 | **LV als Produkt** | **Erledigt (W2):** Lesepfad `LvWorkbench` mit Strukturzusammenfassung; SoT-Panel `LvVersionSotPanel` für alle Nutzer lesbar (Liste erlaubter Aktionen, JSON nur eingeklappt), Ausführung pilotierter `LV_*` nur mit Expertenmodus/Shell. **Feinschliff / Pflege:** neue Flächen und Copy gegen [`w2-pwa-ux-backend-exposure-inventory.md`](./w2-pwa-ux-backend-exposure-inventory.md) abgleichen (Kern: Finanz, Shell, Pilot-Routen) | Pilot-Charter [`PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md`](../tickets/PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md), ADR-0018 |
| 3 | **Aufmass** | **Ist (Pilot):** `#/geschaeftsprozess` (`GeschaeftsprozessWizard`), `#/aufmass-messungen` (`MeasurementPilotListPage` mit Link zum Wizard), Shell `MEASUREMENT_VERSION` (`DocumentTextPanels` unter `#/dokument`) — Abgleich mit Phase-2-Priorisierung [`PHASE-2-PRIORISIERUNG-INCREMENT-1.md`](../tickets/PHASE-2-PRIORISIERUNG-INCREMENT-1.md) / [`PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](../tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md). **Offen:** vertiefte Detail-UX / weitere Messungs-API je Backlog | ADR-0018, Phase-2-Docs unter `docs/tickets/PHASE-2-*` |
| 4 | **Angebote / Nachträge** | Arbeitsflächen analog Backend-Services (`offer-service`, `supplement-service`) | Kontrakt [`docs/api-contract.yaml`](../api-contract.yaml), Codemap `overview.md` |
| 5 | **Finanz (betrieblich)** | Arbeitslisten (offene Rechnungen, Mahnlauf), gebündelte Schritte über Vorbereitung hinaus — weiter SoT-first | [`roadmap-fertige-app.md`](./roadmap-fertige-app.md), [`FIN-4-BACKLOG-POST-WAVE3.md`](../tickets/FIN-4-BACKLOG-POST-WAVE3.md), [`NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) |
| 6 | **Admin / Mandant** | UI für `GET/POST/PATCH /users` (ADMIN), Mandanten-PWA-Einstellungen, Steuer-/XRechnung-Stammdaten wo API vorhanden | [`docs/contracts/ui-role-mapping-v1-3.md`](../contracts/ui-role-mapping-v1-3.md), FIN-5/FIN-6 Codemap-Einträge in [`overview.md`](../CODEMAPS/overview.md) |

---

## Explizit nicht ohne Gate / eigene Spur mischen

Schwere FIN-/Motor-/Pfad-C-Themen nur nach dokumentierten Gates — siehe [`FIN-2-NEXT-SUBPROJECT-GATE.md`](../tickets/FIN-2-NEXT-SUBPROJECT-GATE.md), [`roadmap-fertige-app.md`](./roadmap-fertige-app.md) („Explizit nicht ohne Gate“), B5/Audit-Tickets bei Delivery-Boundary.

---

## Nächster gewählter Schwerpunkt

**Stand:** 2026-05-10 — **Bund 4 Angebote/Nachträge (Pilot):** **`GET /projects/{projectId}/offers`** und **`GET /projects/{projectId}/supplements`** (Lesepfad wie Aufmass/Rechnung); PWA **`#/angebote-arbeitsflaeche`** (`OfferSupplementWorkspacePage`: Projekt-Listen laden, Tabellen, Deep-Link `?offerVersionId=` / `supplementVersionId=`). **Offen:** Wizard-/Shell-Konvergenz und UX-Tiefe gegen Phase-2-Priorisierung ([`PHASE-2-PRIORISIERUNG-INCREMENT-1.md`](../tickets/PHASE-2-PRIORISIERUNG-INCREMENT-1.md), [`PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](../tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md)); Pilot ADR [`0018`](../adr/0018-pilot-lv-aufmass-invoice-convergence.md). **Bund 3 Aufmass (parallel weiter nutzbar):** **`#/aufmass-messungen`**, **`#/geschaeftsprozess`**, Shell **`MEASUREMENT_VERSION`** — UX-Hinweis Wizard→Messungsversion→Pilotliste unverändert relevant.

**Kürzlich abgeschlossen (Referenz):** DOM-8-6 **Slice-2-MVP** — explizite Zuordnung (ADR-0022), Lesepfade, Slice 2b (ADR-0023), Mitigation/Folge-Entwurf (ADR-0024); PWA-Schreibmasken ohne separates Vite-Flag ([`apps/web/README.md`](../../apps/web/README.md)). Shell/Hub/Finanz-Vorbereitung: [`PaymentTermsDifferenceBookingPanel`](../../apps/web/src/components/finance/PaymentTermsDifferenceBookingPanel.tsx), [`InvoiceDraftDifferenceAllocatePanel`](../../apps/web/src/components/finance/InvoiceDraftDifferenceAllocatePanel.tsx). **Folge-Epic:** gebündelte Entwurfs-Sicht / übrige §8.6(a) — ADR [`0021`](../adr/0021-difference-booking-slice2-draft-integration-scope.md); Ticket [`DOM-8-6-SLICE2-API-FIRST-BACKLOG.md`](../tickets/DOM-8-6-SLICE2-API-FIRST-BACKLOG.md) Abschnitt „Offen“.

*(Alternative nächste Bunds ohne gleichzeitige Pflicht: FIN betrieblich Bund 5, Admin Bund 6 — siehe Tabelle oben.)*

---

## Pflege

Nach jedem größeren Domänen-PR: Matrix [`pwa-backend-coverage-matrix.md`](./pwa-backend-coverage-matrix.md) aktualisieren; bei neuen Ticket-IDs diese Tabelle ergänzen.

**W2-UX (Roh-JSON / API-Jargon):** Inventar und Priorität unter [`w2-pwa-ux-backend-exposure-inventory.md`](./w2-pwa-ux-backend-exposure-inventory.md).
