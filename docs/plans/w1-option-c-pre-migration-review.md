# W1 Option C — Review vor erster Migration (PHASE-2)

**Zweck:** Checkliste **vor** Prisma-Migrationen und neuen Stammdaten-APIs gemäß [ADR 0019](../adr/0019-w1-stammdaten-project-customer-object-option-c.md). Kein Ersatz für Domänenfreigabe durch Produkt/Architecture — dokumentiert erwartete Vorarbeit.

**Abgrenzung:** Pilot-W1 (PWA `#/stammdaten`, FIN-5/FIN-1 Lesepfade) läuft **ohne** diese Migration weiter — siehe [PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md](../tickets/PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md).

## 1. Domänen-Review (Pflicht)

- [ ] ERP Teil I **§3–§5** und **§18.1** (Objekt/Baustelle, Projekt als Verbinder, Kontakte) mit Traceability-Kette LV → Aufmass → Angebot → Rechnung abgeglichen.
- [ ] Abgrenzung **CRM-Stamm** vs. **CustomerEInvoiceParty** (FIN-5/XRechnung-Profil): keine Vermischung von immutablem Systemtext und editierbarem Geschäftstext ohne Spez.
- [ ] **Mandantenisolation** für alle neuen Tabellen und Routen explizit im Threat Model der Implementierung.

## 2. Identitäten und Migration (ADR-Punkt 3)

- [ ] Entscheid dokumentiert: bestehende Fremdschlüssel-UUIDs **übernehmen** (Stammzeilen mit gleicher UUID als PK) vs. neue IDs + Abbildungstabellen.
- [ ] Seeds (`src/composition/seed.ts`) und Persistenz-Integrationstests anpassbar ohne Bruch der Pilot-Ketten.

## 3. API und Verträge

- [ ] OpenAPI [`docs/api-contract.yaml`](../api-contract.yaml), [`src/domain/openapi-contract-version.ts`](../../src/domain/openapi-contract-version.ts), Fehlercodes [`docs/contracts/error-codes.json`](../contracts/error-codes.json).
- [ ] Keine zweite Berechtigungslogik in der PWA — Schreibpfade über bestehende SoT wo vorgesehen.

## 4. PWA-Folge

- [ ] Nach API: `api-client`, Hub `#/stammdaten` oder ergänzende Routen; Matrix [`pwa-backend-coverage-matrix.md`](./pwa-backend-coverage-matrix.md) und [`PWA-Entwicklungsreferenz.md`](../PWA-Entwicklungsreferenz.md) aktualisieren.

## 5. Qualitätssicherung

- [ ] `npm run verify:ci` / bei DB-Touch `verify:ci:with-migrate` bzw. lokale Persistenz-Suite laut [`AGENTS.md`](../../AGENTS.md).

## Team-Gate (Spur B)

**Option-C-Go** ist im Ticket [`PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md`](../tickets/PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md) dokumentiert (Abschnitt „Option-C-Go“). Schema-, Migrations- und Stammdaten-API-Code setzen diese Checkliste voraus; fachliche Checkboxen dort bleiben Review-Pflicht vor Mandanten-Produktivität, sind aber **kein** technischer Merge-Blocker im Repo. Pilot-W1 (`#/stammdaten`) bleibt parallel nutzbar (XRechnung/FIN-1 Lesepfade).


