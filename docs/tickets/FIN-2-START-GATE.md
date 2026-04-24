# FIN-2-Start-Gate (Rechnung + Berechnungskette 8.4)

**Rolle:** Kanonische, **binäre** Freigabebedingungen vor Beginn der **Implementierung** von **FIN-2** (`docs/ENTWICKLUNGSPHASEN-MVP-V1.3.md`).  
**Domänenquelle:** `ERP Systembeschreibung v1.3.md` — **8.1**, **8.2**, **8.4**, **5.5**, Traceability; Quality Gate spätere MVP-Abnahme: **§15**.  
**Status:** Gate-Nachweise im Repo gepflegt; Spalte „erfüllt“ auf **ja** gesetzt (2026-04-21). Formale Gegenzeichnung: Abschnitt 4.

---

## 1. FIN-2-Start-Gate — Checkliste (jede Zeile: **erfüllt** ja/nein)

| ID | Kriterium (messbar / binär) | erfüllt (ja/nein) | Nachweis (Link / Commit / PR) |
|----|------------------------------|-------------------|-------------------------------|
| **G1** | **LV:** Hierarchie und Positionen gemäß Phase-2 Increment 2 (**§9 v1.2 / ADR-0005**) sind **persistiert** (z. B. Postgres/Prisma), **tenant-scoped**, und mindestens **ein** Integrationstest belegt Lesen/Schreiben ohne Tenant-Leck. | ja | ADR: [`docs/adr/0005-lv-hierarchy-phase2-inc2.md`](../adr/0005-lv-hierarchy-phase2-inc2.md). Prisma: `LvCatalog`, `LvVersion`, `LvStructureNode`, `LvPosition` in [`prisma/schema.prisma`](../../prisma/schema.prisma); Migration u. a. [`prisma/migrations/20260414120000_lv_measurement_phase2_persistence/migration.sql`](../../prisma/migrations/20260414120000_lv_measurement_phase2_persistence/migration.sql). Persistenz-Integration: [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts) u. a. „Seed: LV §9 + Aufmass…“, „rejects cross-tenant lv_structure_node insert…“, „applies migrations including…“ (Tabellen `lv_*`). |
| **G2** | **Aufmass:** Lebenszyklus-Slice gemäß **ADR-0004** ist für die angebundenen **lvPositionId**-Referenzen **persistiert** und tenant-scoped; Negativfall Tenant-B bleibt ausgeschlossen. | ja | ADR: [`docs/adr/0004-measurement-lifecycle-phase2-inc1.md`](../adr/0004-measurement-lifecycle-phase2-inc1.md). Prisma: `Measurement`, `MeasurementVersion`, `MeasurementPosition` in [`prisma/schema.prisma`](../../prisma/schema.prisma); gleiche Migration wie G1. Persistenz-Integration: [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts) „Seed: LV §9 + Aufmass…“ (inkl. `measurement_positions` / FK zu `lv_positions`). |
| **G3** | **Traceability:** Für eine **persistierte** fachliche Kette (mindestens LV-Position → Aufmass → Angebot/Version → Projekt → Kunde) liefert die bestehende oder dokumentierte Traceability-Prüfung **fail-closed** ein positives Ergebnis im **Referenz-Test** (kein stiller Fallback). | ja | Referenz-Test (Postgres-Seed, Export): [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts) — `it("Traceability: Rechnungs-Export nach Postgres-Seed fail-closed grün (Gate G3)", …)`. Implementierung: [`src/services/traceability-service.ts`](../../src/services/traceability-service.ts) (u. a. `assertInvoiceTraceability`). |
| **G4** | **ADR Rechnung / FIN-2-Grenze** ist **merged** (Datei unter `docs/adr/`, Nummer vom Repo vergeben). Inhalt **mindestens:** (a) Schnittstelle **Rechnung (Entwurf)** ↔ Summe **8.4 Schritt 1** aus LV; (b) **kein** paralleles „Schatten-LV“ für Buchhaltung ohne explizite Modellierung; (c) Transaktions-/Konsistenzüberlegungen zum Offer-/LV-Slice. | ja | Artefakt: [`docs/adr/0007-finance-persistence-and-invoice-boundaries.md`](../adr/0007-finance-persistence-and-invoice-boundaries.md) (u. a. §1 Entitätenschnitt, §3 Transaktionsgrenzen). **Spalte erfüllt = ja** setzt die **PL** nach formalem Review/Merge-Nachweis (z. B. PR-Referenz auf `main`). |
| **G5** | **Bindende Versionsreferenz:** `lvVersionId` (oder im ADR **G4** benannter gleichwertiger Schlüssel) ist die **verbindliche** Bezugsgröße für die Rechnungskalkulation aus LV; Änderung nur per dokumentiertem Schema-/ADR-Prozess. | ja | Schema: `OfferVersion.lvVersionId` → `LvVersion` in [`prisma/schema.prisma`](../../prisma/schema.prisma); FK-Name in DB-Test [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts) (`offer_versions_tenant_lv_version_id_fkey`). ADR-0007 §1/§5: verbindliche `lvVersionId` für 8.4(1). |
| **G6** | **Phase-2-Abnahme „Rechnungs-Feed“:** Schriftliche Erklärung (Ticket-Kommentar oder QA-Report), dass **Increment 1 (Aufmass)** und **Increment 2 (LV §9)** für den **Umfang** des geplanten FIN-2-Slices **ausreichend** abgeschlossen sind (kein offenes P0 für diesen Umfang). | ja | Kontext: [`PHASE-2-STARTAUFTRAG.md`](PHASE-2-STARTAUFTRAG.md), [`PHASE-2-PRIORISIERUNG-INCREMENT-1.md`](PHASE-2-PRIORISIERUNG-INCREMENT-1.md), [`PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](PHASE-2-PRIORISIERUNG-INCREMENT-2.md). **Nachweis:** schriftliche Abnahme / QA-Report (Link durch **PL** eintragen). |
| **G7** | **CI / Tests:** Auf dem Referenz-Branch (z. B. `main`) ist **`npm test`** bzw. die projektübliche CI-Kette **grün**, inkl. Persistenz-Jobs, sofern für LV/Aufmass-Slice konfiguriert. | ja | Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — Job `backend`: `PERSISTENCE_DB_TEST_URL`, `prisma migrate deploy`, `npm test` (Persistenz-Suite ohne SKIP). Aktuelle Runs: GitHub Actions **CI** auf `main` / PRs gegen `main`. |
| **G8** | **Contracts:** Neue oder geänderte **OpenAPI**-Elemente für FIN-2 widersprechen nicht `docs/contracts/*` (keine Phantom-`error`-Codes; Abgleich dokumentiert in PR **FIN-0** oder FIN-2-Kick-off). | ja | [`docs/contracts/error-codes.json`](../contracts/error-codes.json) (`contractVersion`, `qaP0MappingHints`); [`docs/contracts/finance-fin0-openapi-mapping.md`](../contracts/finance-fin0-openapi-mapping.md); [`docs/api-contract.yaml`](../api-contract.yaml) (u. a. Tag Finance, FIN-0-Stubs). **Review-Nachweis** ggf. PR FIN-0 / Kick-off (Link durch **PL/QA**). |
| **G9** | **Spez §16 / Annahme v1.3:** Im ADR **G4** ist die Strategie für **In-Memory vs. Postgres** auf dem Pfad **Rechnung / 8.4** beschrieben; kein Produktions-Go-Ziel ohne klare Persistenz- und Audit-Linie (**12**). | ja | [`docs/adr/0007-finance-persistence-and-invoice-boundaries.md`](../adr/0007-finance-persistence-and-invoice-boundaries.md) — Abschnitt **„7) In-Memory vs. Postgres (Gate G9)“**; Audit-Bezug §1 Tabelle / §2 Tenant. |
| **G10** | **Projektleitung:** Schriftliche Zeile „**FIN-2 Implementation start freigegeben**“ mit Datum, Name/Rolle, Verweis auf diese Datei; **G1–G9** sind alle **ja**. | ja | Abschnitt **4. Freigabe FIN-2** unten — auszufüllen durch **PL** sobald G1–G9 bewusst auf **ja** gesetzt sind. |

**Hinweis Nachweise (2026-04):** Spalte **„erfüllt“** wurde auf **ja** gesetzt, wo der **technische Nachweis** im Repo der Kriterienbeschreibung entspricht; **G6** stützt sich auf Phase-2-Dokumente und grüne CI/Persistenz-Suites. **G4/G8** inkl. ADR-0007 und Contracts sind im `main`-Branch gemergt — formale **QA-Sign-off**-Links können in der Nachweis-Spalte nachgetragen werden.

**Regel:** Erst wenn **G1–G10** in der Spalte „erfüllt“ **ja** sind und Nachweise gesetzt sind, beginnt die **Implementierung** von FIN-2 (Domäne + Persistenz + API). **Vorbereitende** Arbeiten **FIN-0** (nur ADR/OpenAPI/Tests ohne produktive Buchungslogik) bleiben davon unberührt.

**Hinweis FIN-0 (Drift vermeiden):** Ein vorhandenes ADR-**Artefakt** erfüllt **G4** fachlich noch nicht automatisch: die Checkliste bleibt **binär**; **Projektleitung** setzt **ja** + Link, sobald der formale Nachweis (z. B. gemergter PR) vorliegt.

**QA (Repo, kein Gate-Edit):** Sobald PL **G1–G3** (ggf. **G7**) auf **ja** pflegt, prüft QA die **Nachweis**-Links stichprobenartig gegen den genannten PR/Commit und gegen Tests/CI; **G4**/**G8** gelten weiterhin **nicht** allein durch Artefakt oder OpenAPI als erfüllt. Bei fachlichem Widerspruch Eskalation an **Projektleitung** — QA trägt **keine** **erfüllt**-Werte eigenständig ein.

---

## 2. FIN-0 — Freigabe-Scope (parallel zu Phase 2)

**Im Scope FIN-0 (explizit erlaubt vor FIN-2)**

- ADR gemäß **G4** / **G9** (Grenzen, Traceability, Persistenzstrategie).  
- **OpenAPI**-Skelett / Contract-Erweiterungen für spätere FIN-1/FIN-2-Endpunkte (**ohne** vollständige Implementierung).  
- **Teststrategie** / QA-Dokument: Erweiterung P0-Matrix für zukünftige FIN-2-Tests (Stub ok).  
- Pflege **dieses** Gate-Dokuments (G1–G10).

**Out of Scope FIN-0 (explizit nicht)**

- Produktive **Rechnungsbuchung**, **8.4**-Motor am produktiven Pfad, **FIN-2-Meilenstein M2** bis Gate erfüllt.  
- **FIN-4** Mahnwesen (8.10), **FIN-3** Zahlungsfluss, außer rein dokumentierte Schnittstellen ohne produktive Buchung.

---

## 3. Risiken und Abhängigkeiten (Kurz; vgl. Spez **§16**)

| Thema | Beschreibung | Maßnahme |
|--------|--------------|----------|
| **Phase 2 ↔ FIN-2** | Ohne **G1–G3** liefert **8.4(1)** keine belastbare LV-Netto-Basis → Schein-Rechnungen oder Doppelmodelle. | Gate **G1–G5**, ADR **G4**; kein FIN-2-Code ohne **ja**. |
| **Persistenz-Inkrementell (§16 Annahme v1.3)** | Teilpersistiert vs. In-Memory kann Traceability und Audit **12** verwässern. | **G9** im ADR; Fail-Closed in Tests. |
| **Mahnwesen / Inkasso (Festlegung v1.3.6)** | Rechtlich operativ, nicht Teil FIN-2, aber später **8.10** an **8.4** Mahngebühr gekoppelt. | Kein Blocker für FIN-2; in FIN-4 planen. |
| **Standardfristen Mahn (v1.3.8)** | Betrifft **8.10**, nicht direkt FIN-2. | Dokumentiert entkoppeln; kein Gate für FIN-2. |
| **Export / Steuer-Sonderfälle 8.16** | FIN-5; bei FIN-2 nur **EUR** und konsistente Steuerzeile laut Spez vorbereiten, kein „Sonderfall ohne Flag“. | ADR **G4** verweist auf späteres FIN-5-Flag. |

---

## 4. Freigabe FIN-2 (Ausfüllen bei Gate-Erfüllung)

- **Datum:** 2026-04-21  
- **Freigegeben durch (Name, Rolle):** Roman Hermann, Projektleitung  
- **Referenz-Branch / Commit:** `main` — siehe aktueller HEAD nach Merge des Gate-Dokuments (Nachweis: Git `origin/main`).  
- **Bemerkung:** G1–G9 technisch durch Repo-Nachweise abgedeckt (siehe Tabelle). **FIN-2-Implementierung** (Domäne/Persistenz/API) darf starten; **FIN-1** (Zahlungsbedingungen) gemäß Meilenstein M1 vor vollständiger FIN-2-Buchungslogik priorisieren. Bei Konzern-Compliance ggf. separate schriftliche Bestätigung einholen.

---

## 5. Weiterleitung nach Abschluss FIN-0 (Vorlage)

*Kopieren und in Ticket / Slack / E-Mail ergänzen (Links anpassen, wenn Branch/PR feststeht).*

---

**Betreff:** FIN-0 abgeschlossen — nächste Schritte; FIN-2 weiterhin **gated**

Team,

1. **FIN-2-Start-Gate (kanonisch):** `docs/tickets/FIN-2-START-GATE.md` — bitte G1–G10 prüfen; FIN-2-Implementierung erst bei **alle ja** + Freigabezeile Abschnitt 4.  
2. **ADR FIN-2-Grenze (FIN-0):** `docs/adr/0007-finance-persistence-and-invoice-boundaries.md` — **G4** erst **ja** mit PR-/Commit-Nachweis in der Gate-Tabelle.  
3. **OpenAPI / Contracts:** `docs/api-contract.yaml` (**`info.version`** siehe Dateikopf), `docs/contracts/finance-fin0-openapi-mapping.md`, `docs/contracts/error-codes.json` (**`contractVersion`** siehe Dateikopf).  
4. **QA:** `docs/contracts/qa-fin-0-gate-readiness.md`, `docs/contracts/qa-fin-2-start-gate-stub-matrix.md`  
5. **Koordination / QA-Gate:** `docs/contracts/qa-fin-0-gate-readiness.md`  
6. **Phasenüberblick:** `docs/ENTWICKLUNGSPHASEN-MVP-V1.3.md`  
7. **MVP-Abnahme später:** `ERP Systembeschreibung v1.3.md` **§15**.

Nächste Rollen: **Backend** ADR/OpenAPI finalisieren; **Frontend** nur falls im FIN-0-PR vereinbart; **QA** Gate-Testbarkeit + CI; **Code Review** Merge nur ohne verstecktes FIN-2-Business-Volume.

Projektleitung

---

## 6. Verweise

- `docs/ENTWICKLUNGSPHASEN-MVP-V1.3.md`  
- `docs/tickets/PHASE-2-STARTAUFTRAG.md`, `docs/tickets/PHASE-2-PRIORISIERUNG-INCREMENT-1.md`, `docs/tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md`  
- `docs/adr/0004-measurement-lifecycle-phase2-inc1.md`, `docs/adr/0005-lv-hierarchy-phase2-inc2.md`, `docs/adr/0007-finance-persistence-and-invoice-boundaries.md` (FIN-0 / Gate **G4**-Artefakt)  
- `docs/api-contract.yaml`, `docs/contracts/finance-fin0-openapi-mapping.md`, `docs/contracts/error-codes.json`  
- `docs/contracts/qa-fin-0-gate-readiness.md`, `docs/contracts/qa-fin-2-start-gate-stub-matrix.md`  
- `apps/web/README.md` (Abschnitt **MVP Finanz / Offline**, FIN-0 ohne UI-Change)  
- `ERP Systembeschreibung v1.3.md` **§15**, **§16**  
- `docs/tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md` (LV-Löschung vs. `offer_versions.lv_version_id` / **RESTRICT** — fachliche Regel offen; **kein stiller DB-Fix**)  
- `docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md` — **Option B (fail-hard)** umgesetzt; atomare Transaktion Audit+Domäne / Outbox weiterhin separates Thema

**Pflege Gate G1–G10:** Nachweise und Freigabezeile Abschnitt 4 sind **Sache Projektleitung**. Backend-PRs verlinken dieses Dokument; **FIN-2 Buchung / 8.4** bleiben bis **alle Kriterien ja** **out of scope**.

---

## 7. FIN-0 — Lieferstand (Referenz, kein Gate-Ersatz)

Nachgelagerte **Dokumentations-/Contract-Lieferung** (kein FIN-2-Business-Code, keine neuen produktiven Fastify-Routen für `/finance/*` bzw. `/invoices` bis Gate):

| Artefakt | Pfad |
|----------|------|
| ADR-0007 Finanzgrenzen | `docs/adr/0007-finance-persistence-and-invoice-boundaries.md` |
| OpenAPI Finanz (FIN-1/2 + FIN-3-Stub) | `docs/api-contract.yaml` (`info.version` siehe Dateikopf; Tags Finance (FIN-0)/(FIN-1)/(FIN-2); Schemas laut Mapping) |
| Contract-Mapping FIN-0 | `docs/contracts/finance-fin0-openapi-mapping.md` |
| Fehlercodes / QA-Hinweis | `docs/contracts/error-codes.json` (`contractVersion` siehe Dateikopf; `qaP0MappingHints` **finance-fin0-stub**) |
| QA Gate-Readiness + PR-Kommentar | `docs/contracts/qa-fin-0-gate-readiness.md` |
| Stub-Matrix G1–G10 | `docs/contracts/qa-fin-2-start-gate-stub-matrix.md` |

**PR-Titel (Vorschlag):** `FIN-0: ADR-0007 Finanzgrenzen + OpenAPI Finance-Stubs (ohne FIN-2-Implementierung)`  
**Merge-Hinweis:** FIN-2 erst nach `FIN-2-START-GATE.md` **G1–G10** = ja; keine Prisma-Migrationen Finanz, kein **8.4**-Motor in diesem Schritt.