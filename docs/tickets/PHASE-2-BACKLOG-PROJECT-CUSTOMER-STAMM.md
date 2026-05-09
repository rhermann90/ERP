# PHASE-2-BACKLOG — Projekt-/Kunden-Stamm (Option C)

**Status:** W1-Pilot technisch abgeschlossen (CRM Opt-Lock, Audit, PWA-Parität); Spur B / Phase-2 weiter für fachliche Go-Items und §18.1-Zielbild.  
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


## DoD W1 Pilot (Repo — technische Abnahme)

- [x] **Optimistic Locking:** Alle CRM-PATCH-Endpunkte verlangen `versionNumber`; bei Konflikt HTTP **409** mit `CRM_STALE_VERSION`; erfolgreiches Update inkrementiert Version atomar (`updateMany` + `increment`).
- [x] **Audit fail-hard:** `CrmStammdatenService` schreibt Audit-Events für Create/Patch (Domänentypen `CRM_*`); Verhalten wie bestehende Finanz-Services bei Persistenzfehler.
- [x] **PWA-Parität:** `ApiClient` deckt CRM POST/PATCH/GET ab; `#/stammdaten` CRUD für Baustelle, CRM-Kunde, Projekt, Projektkontakt; Konfliktmeldung nutzerfreundlich.
- [x] **Tests:** `test/persistence.integration.test.ts` Nachweise Opt-Lock + Audit; Vitest Hub/Executor-Stubs.
- [ ] **Vor Mandanten-Produktivität (fachlich):** Domänen-Review Checkliste [`w1-option-c-pre-migration-review.md`](../plans/w1-option-c-pre-migration-review.md) Abschnitt 1; §18.1 Historie/DMS ausdrücklich **außerhalb** W1 (Roadmap W3).

## Verweise

- [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md)
- **Architektur-Leitplan Option C:** [`docs/adr/0019-w1-stammdaten-project-customer-object-option-c.md`](../adr/0019-w1-stammdaten-project-customer-object-option-c.md)
- [`docs/adr/0018-pilot-lv-aufmass-invoice-convergence.md`](../adr/0018-pilot-lv-aufmass-invoice-convergence.md)
- [`prisma/schema.prisma`](../../prisma/schema.prisma) (`crm_*` Stammtabellen ADR 0019; Root-Modelle `Project`/`Customer` weiterhin nicht als Ziel von Option C)
