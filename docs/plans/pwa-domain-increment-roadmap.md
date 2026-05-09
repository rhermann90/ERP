# Domänen-Inkremente — Priorisierte Roadmap (UI/UX)

**Zweck:** Reihenfolge für **messbare** PWA-Inkremente entlang der Traceability-Kette und der bestehenden Ticket-Landschaft. Jedes Inkrement: wo möglich kleiner PR mit OpenAPI/`api-client`-Sync, Komponenten unter `apps/web/src/components/`, Smoke/E2E wenn Journey kritisch.

**Abgleich:** [`pwa-backend-coverage-matrix.md`](./pwa-backend-coverage-matrix.md), übergeordnet [`roadmap-fertige-app.md`](./roadmap-fertige-app.md), Pilot/Konvergenz [`docs/adr/0018-pilot-lv-aufmass-invoice-convergence.md`](../adr/0018-pilot-lv-aufmass-invoice-convergence.md).

---

## Reihenfolge (Bundled Increments)

| # | Bund | Ziel | Ticket-/ADR-Anker |
|---|------|------|---------------------|
| 1 | **Stammdaten / Einstiege** | Pilot: `#/stammdaten` (XRechnung/FIN-1); §18.1-vollständig: Option C nach ADR [`0019-w1-stammdaten-project-customer-object-option-c.md`](../adr/0019-w1-stammdaten-project-customer-object-option-c.md) | [`PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md`](../tickets/PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md) |
| 2 | **LV als Produkt** | Formulare für erlaubte `LV_*`-Aktionen (gleiche SoT wie `LvVersionSotPanel` / Shell), weniger Pflicht-Roh-JSON | Pilot-Charter [`PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md`](../tickets/PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md), ADR-0018 |
| 3 | **Aufmass** | Messungsliste/Detail neben `GeschaeftsprozessWizard` und Shell | ADR-0018, Phase-2-Docs unter `docs/tickets/PHASE-2-*` |
| 4 | **Angebote / Nachträge** | Arbeitsflächen analog Backend-Services (`offer-service`, `supplement-service`) | Kontrakt [`docs/api-contract.yaml`](../api-contract.yaml), Codemap `overview.md` |
| 5 | **Finanz (betrieblich)** | Arbeitslisten (offene Rechnungen, Mahnlauf), gebündelte Schritte über Vorbereitung hinaus — weiter SoT-first | [`roadmap-fertige-app.md`](./roadmap-fertige-app.md), [`FIN-4-BACKLOG-POST-WAVE3.md`](../tickets/FIN-4-BACKLOG-POST-WAVE3.md), [`NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) |
| 6 | **Admin / Mandant** | UI für `GET/POST/PATCH /users` (ADMIN), Mandanten-PWA-Einstellungen, Steuer-/XRechnung-Stammdaten wo API vorhanden | [`docs/contracts/ui-role-mapping-v1-3.md`](../contracts/ui-role-mapping-v1-3.md), FIN-5/FIN-6 Codemap-Einträge in [`overview.md`](../CODEMAPS/overview.md) |

---

## Explizit nicht ohne Gate / eigene Spur mischen

Schwere FIN-/Motor-/Pfad-C-Themen nur nach dokumentierten Gates — siehe [`FIN-2-NEXT-SUBPROJECT-GATE.md`](../tickets/FIN-2-NEXT-SUBPROJECT-GATE.md), [`roadmap-fertige-app.md`](./roadmap-fertige-app.md) („Explizit nicht ohne Gate“), B5/Audit-Tickets bei Delivery-Boundary.

---

## Pflege

Nach jedem größeren Domänen-PR: Matrix [`pwa-backend-coverage-matrix.md`](./pwa-backend-coverage-matrix.md) aktualisieren; bei neuen Ticket-IDs diese Tabelle ergänzen.
