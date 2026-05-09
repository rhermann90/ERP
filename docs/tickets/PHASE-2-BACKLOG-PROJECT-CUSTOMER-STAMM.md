# PHASE-2-BACKLOG — Projekt-/Kunden-Stamm (Option C)

**Status:** In Umsetzung (Spur B — Schema, APIs, PWA-Lesepfade gemäß ADR 0019).  
**Auslöser:** Offene Punkt „Projekt/Kunden-CRUD" — vgl. Charter [`PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md`](./PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md) und Klärung: aktuell nur UUIDs auf Aggregaten, **keine** Prisma-Root-Modelle `Project` / `Customer`.

**Umsetzungsentscheid (W1):** Pilot-Inkremente (PWA `#/stammdaten`, Lesepfade FIN-5/FIN-1) bleiben parallel nutzbar. Vor Merge der ersten Stammdaten-Migration: Checkliste [`docs/plans/w1-option-c-pre-migration-review.md`](../plans/w1-option-c-pre-migration-review.md) fachlich abarbeiten.

## Option-C-Go (Team-Gate — dokumentiert 2026-05-07)

- **Entscheid:** Option C (ADR 0019) wird im Repo umgesetzt: dedizierte CRM-Stammtabellen (Objekt, CRM-Kunde, Projekt, Projektkontakte), mandanten-isolierte REST-APIs, Seeds konsistent zum Pilot-Seed.
- **UUID-Strategie (PK = Pilot-UUID, kein zweites ID-System):** `crm_projects.id` und `crm_customers.id` verwenden **dieselben UUIDs** wie `project_id` / `customer_id` auf Angebot, Aufmass und Rechnung (`SEED_IDS.projectId`, `SEED_IDS.customerId`). Neue Entitäten ohne bestehende Aggregat-Referenz (z. B. Baustelle) erhalten **eigene** stabile Demo-UUIDs im Seed (`SEED_IDS.crmConstructionSiteId`). Projektkontakte: eigene UUIDs pro Zeile.
- **Nachweis:** Dieses Ticket ist die kanonische Gate-Notiz (kein externes Planungs-Tool-Link erforderlich).

## Ziel (wenn Team Option C beschließt)

- Fachlich konsistente Stammdaten für Projekt und Kunde (Systembeschreibung / Traceability).
- APIs (`POST`/`GET`/…) und Mandanten-Isolation; keine „UUID-Registry" ohne Domänenmodell.

## Nicht-Ziele

- Schnelle Endpunkte, die nur UUIDs speichern, ohne ADR und ohne Bezug zur ERP-Systembeschreibung.

## Vorgehen (Groborientierung)

1. Domänenklärung + ADR (Schema, Lebenszyklus, Bezug zu LV/Aufmass/Angebot/Rechnung).
2. Prisma-Migration + Persistenz-Ports + Seeds-Anpassung.
3. OpenAPI + `action-contracts` / SoT wo nötig.
4. PWA: Auswahl/Anlage im Wizard oder Shell — weiterhin **keine** parallele AuthZ.

## Verweise

- [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md)
- **Architektur-Leitplan Option C:** [`docs/adr/0019-w1-stammdaten-project-customer-object-option-c.md`](../adr/0019-w1-stammdaten-project-customer-object-option-c.md)
- [`docs/adr/0018-pilot-lv-aufmass-invoice-convergence.md`](../adr/0018-pilot-lv-aufmass-invoice-convergence.md)
- [`prisma/schema.prisma`](../../prisma/schema.prisma) (Ist: keine dedizierten Stammtabellen für Projekt/Kunde als Root)
