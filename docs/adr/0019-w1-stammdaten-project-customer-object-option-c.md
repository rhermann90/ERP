# ADR 0019 — W1 Stammdaten: Projekt, Kunde, Objekt (Option C)

**Status:** Angenommen — Umsetzung Spur B gestartet (Prisma/API/PWA)  
**Datum:** 2026-05-07  
**Kontext:** ERP §18.1 (Objekt/Baustelle, Projekt, Kontakte), W1 in Teil V; Ist-Backend nutzt `projectId`/`customerId` als UUIDs auf Aggregaten ohne Root-Modelle — siehe Ticket [`PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md`](../tickets/PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md).

## Problem

Die PWA kann XRechnung-Buyer/Seller und FIN-1-Zahlungsbedingungen lesend abbilden; **fachlich vollständige** Stammdaten (wiederverwendbares Objekt, Projekt als Verbinder, Kontakte) fehlen als mandanten-isolierte, versionierbare Domänenaggregate mit Traceability zur Kette LV → … → Rechnung.

## Entscheidung (Zielbild Option C)

1. **Objekt (Baustelle)** eigenes Stammtabellen-Modell (mandantenspezifisch), **ohne** exklusive 1:1-Bindung an einen Kunden (ERP §18.1).
2. **Kunde** eigenes Stammtabellen-Modell (mandantenspezifisch), getrennt von `CustomerEInvoiceParty` (FIN-5/XRechnung kann weiterhin Referenz/Profil sein; keine Vermischung von CRM-Stamm und reinem Rechnungs-Party-Snapshot ohne Klärung).
3. **Projekt** verbindet **Kunde(n) / Beteiligte** mit **Objekt**; Umsetzung **Option A (UUID-kompatibel):** Stammzeilen `crm_projects` / `crm_customers` nutzen **dieselbe UUID** wie die bestehenden `project_id` / `customer_id` auf Offers, Measurements und Invoices (Pilot- und Demo-Seeds). Keine parallele ID-Abbildungstabellen in Spur B.
4. **Kontakte / Projektbeteiligte** als eigenes Modell mit Rolle und Zuordnung zu Projekt und optional Kunde.

## Nicht-Ziele (dieses ADR)

- DMS / Objekt-Historie / Anhänge (§18.4) — eigene Inkremente.
- Material, Mobile, Reporting (§18.2–§18.3, §18.9ff.).

## Konsequenzen

- **Prisma:** neue Tabellen + Migrationen; Seeds müssen konsistente Projekt-/Kunden-/Objekt-Stämme liefern, die zu Demo-LVs/Offers passen.
- **API:** Listen/GET/PATCH (oder POST) mandanten-isoliert; OpenAPI und [`src/domain/openapi-contract-version.ts`](../../src/domain/openapi-contract-version.ts) bei Endpunkt-Änderungen.
- **SoT:** Schreibpfade, die heute über Dokument-Aktionen laufen, nur erweitern, wenn ERP-Prozess das verlangt — **keine** zweite Berechtigungslogik in der PWA.
- **PWA:** Nach API: geführte Listen/Detailformulare unter `#/stammdaten` bzw. eigene Routen; Wizard/Shell-Verknüpfungen zum bestehenden Pilot.

## Umsetzungsreihenfolge (empfohlen)

1. Domänen-Review mit ERP §3–§5 und §18.1 (Traceability) — strukturierte Vorab-Checkliste: [`docs/plans/w1-option-c-pre-migration-review.md`](../plans/w1-option-c-pre-migration-review.md).
2. Schema + Migration + Persistenz-Services + Tests (`verify:ci`).
3. OpenAPI + `api-client` + PWA (kleine PRs).

## Status Abgleich

Teil-Spur B (2026-05-07): Prisma-Tabellen, Seeds, `GET|POST|PATCH /crm/…`, PWA-Lesepfad unter `#/stammdaten`; Gap-Liste in [`pwa-backend-coverage-matrix.md`](../plans/pwa-backend-coverage-matrix.md) für verbleibende §18.1-Themen (Schreib-UX, Historie) angepasst. [`PWA-Entwicklungsreferenz.md`](../PWA-Entwicklungsreferenz.md) W1 bleibt **Teilweise** (Lesepfad, kein vollständiges Feld-Management).

