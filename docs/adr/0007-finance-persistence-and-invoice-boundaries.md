# ADR 0007 — Finanz-Persistenz, Rechnungsgrenze (FIN-2) und Traceability-Anbindung

## Status

Accepted. **Ergänzung 2026-04-22:** Erste **FIN-2-Buchung** implementiert (`POST /invoices/{invoiceId}/book`: **ENTWURF → GEBUCHT_VERSENDET**, Traceability vor Buchung, mandantenweite Rechnungsnummer, Unique `(tenant_id, invoice_number)` in Postgres, Audit). **SoT Shell:** kanonische Aktion **`BOOK_INVOICE`** in `GET /documents/{invoiceId}/allowed-actions?entityType=INVOICE` für Status **ENTWURF** und Rollen ADMIN / GESCHAEFTSFUEHRUNG / BUCHHALTUNG — `docs/contracts/action-contracts.json`. **Ergänzung FIN-3 (Zahlungseingang 8.7):** `POST /finance/payments/intake` mit Tabelle **`payment_intakes`**, Idempotenz `(tenant_id, idempotency_key)`, Rechnungsstatus **TEILBEZAHLT** / **BEZAHLT**; Lesepfad `GET /invoices/{invoiceId}/payment-intakes`. **Ergänzung FIN-4 (Mahnwesen 8.10):** Kern — Tabelle **`dunning_reminders`**, Konfiguration, Lesepfad/Schreibpfad Mahn-Ereignis — **ADR-0009**; **M4** Vorlagen, Footer, E-Mail (Vorschau, Stub, SMTP 5a) und geplante Orchestrierung Slice **5b** — **ADR-0010** (Abschnitt 5b nach PL). **Inkrement B2-0 → B2-1a (8.4 Schritte 2–6):** **B2-1a (2026-04-22):** optionaler **Skonto**-Aliquot in Basispunkten (`skonto_bps` auf `invoices`, Request `POST /invoices` optional `skontoBps`) — Schritt **8.4(2)** als einfache Prozent-Reduktion auf LV-Netto nach Schritt 1 vor USt; Schritte 3–6 weiterhin Identität in `netCentsAfterStep84_6Mvp` (`src/domain/invoice-calculation.ts`). **Weiterhin nicht** abgedeckt: vollständiger **8.4(2–6)**-Motor (weitere Nachlässe, Einbehalt, konfigurierbare Regeln), Zwischenstatus **GEPRUEFT** / **FREIGEGEBEN** (siehe §8), erweiterte **8.8–8.9**-Zuordnung/Clearing-Produkte und PSP-Anbindung jenseits des dokumentierten Intake-Slices.

## Kontext

`docs/ERP-Systembeschreibung.md` definiert das Finanz-Submodul (u. a. **8.1** Traceability, **8.2** Rechnung, **8.4** Berechnungskette, **8.5** Zahlungsbedingungen inkl. versionierter Konditionen, **8.7–8.9** Zahlungseingang/Zuordnung/Status, **8.10** Mahnwesen, **8.12** Rundungslogik, **8.16** EUR/Steuer-Sonderfälle).  
Parallel existieren **ADR-0004** (Aufmass), **ADR-0005** (LV §9), **ADR-0006** (Offer/OfferVersion-Persistenz) und Audit-Persistenz für einen vertikalen Schnitt.

**FIN-2-Start-Gate** (`docs/tickets/FIN-2-START-GATE.md`) verlangt u. a. **G4** (dieses ADR), **G5** (verbindliche `lvVersionId` für 8.4(1)), **G1–G3** (persistierte LV/Aufmass/Traceability-Kette) **vor** Beginn der **Implementierung** von FIN-2.

## Entscheidung

### 1) Entitätenschnitt und Tabellenräume (Zielbild; FIN-1/FIN-2/FIN-3-Teilmengen umgesetzt — siehe **Status**)

| Fachbereich (v1.3) | Eigenständiger Persistenz-Slice | Beziehung zu bestehenden Tabellen |
|--------------------|----------------------------------|-----------------------------------|
| **Zahlungsbedingungs-Version (8.5)** | Eigene Entität(en) mit **tenant_id** auf allen Zeilen; Versionierung nicht-destruktiv (neue Version, keine Überschreibung fachlicher Konditionen). | Referenziert **Projekt/Kunde** gemäß Spez; **kein** Ersatz für LV/Offer-Texte. |
| **Rechnung (8.2)** | Eigene **invoice**-Entität (Entwurf → gebucht); gebuchte Rechnung **unveränderlich** (nur nachgelagerte fachlich erlaubte Vorgänge laut Spez, nicht Teil FIN-0). | **Traceability-Pflicht** zu **LV-Version** (`lvVersionId` als verbindliche Bezugsgröße für **8.4 Schritt 1**, vgl. Gate **G5**), **Aufmass**, **Angebotsversion** (und Projekt/Kunde über dieselbe Kette wie heute Export/Traceability). **Kein** paralleles „Schatten-LV“ für Buchhaltung: Netto-/Positionsbasis stammt ausschließlich aus der **persistierten** LV-/Aufmass-/Angebots-Kette; Abweichungen nur als explizit modellierte Buchungs-/Korrekturereignisse (spätere Inkremente, nicht FIN-0). |
| **Zahlung (8.7–8.9)** | Eigene Zahlungs- und Zuordnungsaggregate; Status maschinell aus Zuordnung ableitbar wo Spez es verlangt. | Anbindung an **Rechnung** und Audit (**12**); **keine** Vermischung mit `offer_versions` als Buchungsjournal. |
| **Mahnwesen (8.10)** | FIN-4 **Kern** (`dunning_reminders`, `dunning_tenant_stage_config`, Konfig-HTTP) — **ADR-0009**; **M4** Vorlagen/Footer/E-Mail inkl. SMTP — **ADR-0010**; Orchestrierung Slice **5b** — ADR-0010 (Proposed) + PL-Ticket. | Mahngebühr laut Spez **nicht** still in 8.4(1–8) einmischen; eigene Buchungs-/Nebenforderungslinie (v1.3). |
| **Offer / OfferVersion (ADR-0006)** | Unverändert fachlicher Vertriebsschnitt. | Rechnung referenziert **Angebotsversion** (und ggf. Nachtrag) als Traceability-Glied, **nicht** als Ersatz für Rechnungsjournal. |
| **Audit (`audit_events`)** | Fortführung dual-write / Lesepfade laut bestehenden ADRs/Tickets. | FIN-relevante Mutationen werden bei Postgres persistiert **nach** gleicher Tenant-/Least-Privilege-Logik wie heute. |

### 2) Tenant-Isolation

- Alle geplanten Finanz-Tabellen und API-Zugriffe: **`tenant_id` NOT NULL**, FKs wo möglich **zusammengesetzt** `(tenant_id, …)` analog Offer/LV.  
- Jede Lese-/Schreiboperation: Token-Tenant + optional `x-tenant-id` konsistent zu Phase-1/2-Regeln; **kein** Query über Mandantgrenzen hinweg.

### 3) Transaktionsgrenzen

- **Rechnungsentwurf → erste Buchung / „gebucht“:** eine **atomare** fachliche Operation mit Rollback bei Persistenzfehlern (In-Memory + Postgres-Write-Through im implementierten Pfad; keine „halb gebuchte“ Rechnung ohne Kompensation).  
- **8.4 Schritt 1** (Summe aus LV) und Anbindung Aufmass/Angebot: im **FIN-2-Slice** vor Buchung durch `TraceabilityService.assertInvoiceTraceability` abgesichert; persistierende Aggregation ohne nachvollziehbare LV-Basis wird verhindert.  
- **Zahlungseingang (8.7):** eigene fachliche Operation pro Eingang; **Idempotenz** (§4) und Rollback bei fehlgeschlagener Persistenz verhindern Doppelwirkung bei Retry (siehe Code `PaymentIntakeService`).

### 8) Rechnungsstatus: MVP-Buchung vs. spätere Freigabekette (2026-04-22)

- **Umgesetzt (Variante A / MVP):** Direkt **ENTWURF → GEBUCHT_VERSENDET** über `POST /invoices/{invoiceId}/book` nach erfolgreicher `TraceabilityService.assertInvoiceTraceability`; Rechnungsnummer `RE-{UTC-Jahr}-{nnnn}`; bei fehlgeschlagener Postgres-`upsert`-Unique (Kollision) wird der In-Memory-Zustand zurückgesetzt und `INVOICE_NUMBER_CONFLICT` geliefert — kein „halb gebuchter“ Zustand ohne Rollback im Prozess.
- **Bewusst zurückgestellt (Variante B / später):** Zwischenstatus **GEPRUEFT** und **FREIGEGEBEN** vor Buchung (Export-Preflight erlaubt `FREIGEGEBEN` bereits separat). Einfügen späterer Übergänge **vor** `GEBUCHT_VERSENDET` darf gebuchte Rechnungen **nicht** verändern; nur neue API-Pfade und klare Zustandsautomaten ergänzen.

### 4) Idempotenz-Hook Zahlungseingang (8.7)

- API: Header **`Idempotency-Key`** (**UUID**, case-insensitive gelesen) auf `POST /finance/payments/intake` **Pflicht**; siehe `docs/api-contract.yaml` und `docs/contracts/finance-fin0-openapi-mapping.md`.  
- Server: eindeutiger **technischer** Schlüssel `(tenant_id, idempotency_key)` mit **Unique** in **`payment_intakes`**; wiederholter Request mit gleichem Key und gleichem fachlichen Inhalt (`invoiceId`, `amountCents`) liefert **HTTP 200** mit gleichem Erfolgskörper (Replay); abweichender Inhalt → Domain-Code `PAYMENT_INTAKE_IDEMPOTENCY_MISMATCH` (siehe `error-codes.json`).

### 5) Traceability (8.1) und Fail-closed-Fehlerlage

- **Zielzustand:** Gleiche fachliche Kette wie für Export-Preflight: LV-Position → Aufmass → Angebot/Version → Projekt → Kunde; Prüfung **fail-closed** (kein stiller Fallback).  
- **Laufzeit (FIN-2 / FIN-3):** Für **Rechnungsentwurf**, **Buchung** und **Zahlungseingang** gelten Traceability- bzw. Existenzprüfungen mit Domain-Codes aus `docs/contracts/error-codes.json`; Zuordnung HTTP ↔ `code` in `docs/contracts/finance-fin0-openapi-mapping.md`. **Keine** Phantom-Codes ohne Contract-Update.  
- **Historischer Rahmen:** Das FIN-2-Start-Gate (`docs/tickets/FIN-2-START-GATE.md`) verlangte u. a. **G1–G3** (persistierte LV/Aufmass/Offer-Kette) **vor** produktiver Rechnungslogik — diese Voraussetzung ist für die implementierten Buchungs- und Zahlungseingang-Pfade erfüllt (siehe **Status**). Weitere Endpunkte oder künftige Phasen bleiben eigener Abnahme unterliegend.

### 6) Währung und Rundung (8.12 / 8.16)

- v1.3: buchführungsrelevant **nur EUR**; **kein** Mehrwährungsbetrieb.  
- **API / Contracts:** `invoiceCurrencyCode` (oder gleichwertiger Name) ist **vom Client explizit anzugeben**, sobald Request-Schemas produktiv werden — **kein** OpenAPI-`default: EUR` und keine stillen Server-Defaults auf „EUR“, wenn der Client nichts sendet (vermeidet widersprüchliche Interpretation zu 8.12/Explicitness). Wertebereich bis auf Weiteres **nur** `EUR` (Enum), dennoch **required** im Body.  
- **Rundung 8.12:** ausschließlich serverseitig nach dokumentierter Reihenfolge; der **vollständige** 8.4(2–6)-Motor ist am produktiven Pfad noch **nicht** umgesetzt (siehe **Status** / **Non-Goals**).

### 7) In-Memory vs. Postgres (Gate G9)

- **Postgres (`repositoryMode=postgres`):** **Rechnungen** (`invoices`), **Zahlungsbedingungen** (`payment_terms_*`), **Zahlungseingänge** (`payment_intakes`) werden persistiert; Hydrate-/Sync-Pfade spiegeln in den Arbeits-Cache (`InMemoryRepositories`) — siehe `README` („Hinweis zur Persistenz“).  
- **Produktionsreife:** Kein Go-Live ohne klare Betriebsregeln zu Migrationen, Backups und Lesepfaden; **keine** stillen „nur Memory“-Buchungen im Postgres-Modus.  
- **Stubs / noch nicht implementierte Pfade:** weiterhin **fail-closed** mit dokumentierten Domain-Codes (OpenAPI + Mapping), bis ein Slice abgenommen ist.

## Non-Goals (explizit)

- Vollständiger **8.4(2–6)**-Betragsmotor (mehrere unabhängige Abzugsarten, Einbehalt, konfigurierbare Regeln) jenseits **B2-1a** (nur Skonto-BP auf Schritt-1-Netto); **FIN-3**-Erweiterungen jenseits des **Intake-Slices** (z. B. vollständige **8.8–8.9**-Zuordnung, PSP, Mehrfachbelege pro Bankumsatz), **FIN-4** Mahnwesen M4 (Konfiguration, E-Mail, Vorlagen). *(Hinweis: erste **FIN-2-Buchung** ENTWURF → GEBUCHT_VERSENDET ist seit 2026-04-22 im Code; siehe §8. **FIN-3**-Intake mit Persistenz und Status ist im Code; siehe Status-Kopf.)*  
- Neue **DomainError-Codes** nur in einem PR, der `docs/contracts/error-codes.json`, OpenAPI (`docs/api-contract.yaml`), Mapping (`docs/contracts/finance-fin0-openapi-mapping.md`) und die Frontend-Fehlerbehandlung konsistent mitpflegt.  
- Steuer-Sonderfälle **8.16** / FIN-5: nicht Gegenstand; FIN-2 bereitet nur **EUR + konsistente Steuerzeile** laut Gate-Dokument vor.

## Konsequenzen

- **Weiterentwicklung:** Änderungen an Finanz-Domäne, Persistenz oder HTTP-Verhalten bleiben an dieses ADR und die kanonischen Contracts gebunden; Gate-Dokument `docs/tickets/FIN-2-START-GATE.md` bleibt Referenz für verbleibende Kriterien (z. B. **G8** Contract-Abgleich).  
- **Frontend:** Buchung (`POST /invoices/.../book`) und Zahlungseingang (`POST /finance/payments/intake`) sind **implementierte** Pfade — UI soll Erfolgs- und Fehlerfälle gegen OpenAPI + `error-codes.json` binden. Verbleibende reine Contract-Stubs sind in OpenAPI/Mapping ausgewiesen.

## Risiken

- **Semantische Überladung** von `TRACEABILITY_LINK_MISSING` / `EXPORT_PREFLIGHT_FAILED` über Export, Rechnung und ggf. weitere Domänen — Mitigation: bei neuen fachlichen Grenzen **eigene** Domain-Codes ergänzen (wie bei `PAYMENT_*`); Traceability-Codes nur für echte Traceability-/Preflight-Verletzungen.  
- **Drift** zwischen OpenAPI und Code — Mitigation: jeder mergefähige PR mit API-Anpassung pflegt `docs/api-contract.yaml` und `docs/contracts/finance-fin0-openapi-mapping.md` (CI: `validate:api-contract-yaml` u. a.).

## Verweise

- `docs/tickets/FIN-2-START-GATE.md`  
- `docs/ERP-Systembeschreibung.md` (8.x, 12, 15, 16)  
- `docs/adr/0004-measurement-lifecycle-phase2-inc1.md`, `docs/adr/0005-lv-hierarchy-phase2-inc2.md`, `docs/adr/0006-offer-vertical-slice-persistence.md`  
- `docs/contracts/error-codes.json`, `docs/api-contract.yaml`, `docs/contracts/finance-fin0-openapi-mapping.md`
