# ADR 0007 — Finanz-Persistenz, Rechnungsgrenze (FIN-2) und Traceability-Anbindung

## Status

Accepted (Dokumentation / FIN-0; **keine** produktive FIN-2-Buchungslogik in diesem Schritt).

## Kontext

`ERP Systembeschreibung v1.3.md` definiert das Finanz-Submodul (u. a. **8.1** Traceability, **8.2** Rechnung, **8.4** Berechnungskette, **8.5** Zahlungsbedingungen inkl. versionierter Konditionen, **8.7–8.9** Zahlungseingang/Zuordnung/Status, **8.10** Mahnwesen, **8.12** Rundungslogik, **8.16** EUR/Steuer-Sonderfälle).  
Parallel existieren **ADR-0004** (Aufmass), **ADR-0005** (LV §9), **ADR-0006** (Offer/OfferVersion-Persistenz) und Audit-Persistenz für einen vertikalen Schnitt.

**FIN-2-Start-Gate** (`docs/tickets/FIN-2-START-GATE.md`) verlangt u. a. **G4** (dieses ADR), **G5** (verbindliche `lvVersionId` für 8.4(1)), **G1–G3** (persistierte LV/Aufmass/Traceability-Kette) **vor** Beginn der **Implementierung** von FIN-2.

## Entscheidung

### 1) Entitätenschnitt und Tabellenräume (Zielbild, nicht verbindlich implementiert)

| Fachbereich (v1.3) | Eigenständiger Persistenz-Slice | Beziehung zu bestehenden Tabellen |
|--------------------|----------------------------------|-----------------------------------|
| **Zahlungsbedingungs-Version (8.5)** | Eigene Entität(en) mit **tenant_id** auf allen Zeilen; Versionierung nicht-destruktiv (neue Version, keine Überschreibung fachlicher Konditionen). | Referenziert **Projekt/Kunde** gemäß Spez; **kein** Ersatz für LV/Offer-Texte. |
| **Rechnung (8.2)** | Eigene **invoice**-Entität (Entwurf → gebucht); gebuchte Rechnung **unveränderlich** (nur nachgelagerte fachlich erlaubte Vorgänge laut Spez, nicht Teil FIN-0). | **Traceability-Pflicht** zu **LV-Version** (`lvVersionId` als verbindliche Bezugsgröße für **8.4 Schritt 1**, vgl. Gate **G5**), **Aufmass**, **Angebotsversion** (und Projekt/Kunde über dieselbe Kette wie heute Export/Traceability). **Kein** paralleles „Schatten-LV“ für Buchhaltung: Netto-/Positionsbasis stammt ausschließlich aus der **persistierten** LV-/Aufmass-/Angebots-Kette; Abweichungen nur als explizit modellierte Buchungs-/Korrekturereignisse (spätere Inkremente, nicht FIN-0). |
| **Zahlung (8.7–8.9)** | Eigene Zahlungs- und Zuordnungsaggregate; Status maschinell aus Zuordnung ableitbar wo Spez es verlangt. | Anbindung an **Rechnung** und Audit (**12**); **keine** Vermischung mit `offer_versions` als Buchungsjournal. |
| **Mahnwesen (8.10)** | FIN-4 / separater Meilenstein; **keine** Implementierung in FIN-2-Kern. | Mahngebühr laut Spez **nicht** still in 8.4(1–8) einmischen; eigene Buchungs-/Nebenforderungslinie (v1.3). |
| **Offer / OfferVersion (ADR-0006)** | Unverändert fachlicher Vertriebsschnitt. | Rechnung referenziert **Angebotsversion** (und ggf. Nachtrag) als Traceability-Glied, **nicht** als Ersatz für Rechnungsjournal. |
| **Audit (`audit_events`)** | Fortführung dual-write / Lesepfade laut bestehenden ADRs/Tickets. | FIN-relevante Mutationen werden bei Postgres persistiert **nach** gleicher Tenant-/Least-Privilege-Logik wie heute. |

### 2) Tenant-Isolation

- Alle geplanten Finanz-Tabellen und API-Zugriffe: **`tenant_id` NOT NULL**, FKs wo möglich **zusammengesetzt** `(tenant_id, …)` analog Offer/LV.  
- Jede Lese-/Schreiboperation: Token-Tenant + optional `x-tenant-id` konsistent zu Phase-1/2-Regeln; **kein** Query über Mandantgrenzen hinweg.

### 3) Transaktionsgrenzen

- **Rechnungsentwurf → erste Buchung / „gebucht“**: eine **atomare** Domänentransaktion (DB-Transaktion oder ausdrücklich dokumentierte Saga mit kompensierender Strategie — **Festlegung im FIN-2-Implementierungs-PR**, nicht hier).  
- **8.4 Schritt 1** (Summe aus LV) und Anbindung Aufmass/Angebot: innerhalb derselben Transaktion wie die persistierende Rechnungsaggregat-Erstellung, sobald FIN-2 implementiert ist, um keine halbe Rechnung ohne nachvollziehbare LV-Basis zu schreiben.  
- **Zahlungseingang (8.7)**: eigene Transaktion pro Eingang; **Idempotenz** (siehe unten) verhindert Doppelbuchung bei Retry.

### 4) Idempotenz-Hook Zahlungseingang (8.7)

- API: Header **`Idempotency-Key`** (UUID oder mandantenweit vereinbartes Format im FIN-3/FIN-2-Kick-off) auf `POST` Zahlungseingang **erforderlich** sobald Endpunkt produktiv wird.  
- Server: eindeutiger **technischer** Schlüssel `(tenant_id, idempotency_key)` mit **unique constraint**; wiederholter Request mit gleichem Key liefert **dieselbe fachliche Antwort** (HTTP-Semantik im Implementierungs-PR festlegen; kein stiller zweiter Buchungssatz).  
- FIN-0: nur ADR + OpenAPI-Skizze; **keine** persistierte Tabelle für Idempotenz ohne FIN-2-Start-Gate.

### 5) Traceability (8.1) und Gap bis Phase-2-/FIN-Gate fertig

- **Zielzustand:** Gleiche fachliche Kette wie für Export-Preflight: LV-Position → Aufmass → Angebot/Version → Projekt → Kunde; Prüfung **fail-closed** (kein stiller Fallback).  
- **Bis G1–G3 des FIN-2-Start-Gates erfüllt sind:** Keine produktive Rechnungsstellung oder Zahlungsbuchung. Stubs (OpenAPI) und spätere Implementierung antworten **fail-closed** mit **bestehenden** Domain-Codes aus `docs/contracts/error-codes.json` — empfohlene Zuordnung siehe `docs/contracts/finance-fin0-openapi-mapping.md` (z. B. **`TRACEABILITY_LINK_MISSING`** / **`EXPORT_PREFLIGHT_FAILED`** / **`DOCUMENT_NOT_FOUND`**, **keine** neuen Phantom-Codes).  
- Verweis Gate: **`docs/tickets/FIN-2-START-GATE.md`**.

### 6) Währung und Rundung (8.12 / 8.16)

- v1.3: buchführungsrelevant **nur EUR**; **kein** Mehrwährungsbetrieb.  
- **API / Contracts:** `invoiceCurrencyCode` (oder gleichwertiger Name) ist **vom Client explizit anzugeben**, sobald Request-Schemas produktiv werden — **kein** OpenAPI-`default: EUR` und keine stillen Server-Defaults auf „EUR“, wenn der Client nichts sendet (vermeidet widersprüchliche Interpretation zu 8.12/Explicitness). Wertebereich bis auf Weiteres **nur** `EUR` (Enum), dennoch **required** im Body.  
- **Rundung 8.12:** ausschließlich serverseitig nach dokumentierter Reihenfolge; FIN-0 definiert **keine** Rechenimplementierung.

### 7) In-Memory vs. Postgres (Gate G9)

- **FIN-2:** Ziel ist **Postgres** für Rechnung, Zahlungsbedingungs-Versionen und Zahlungsaggregate mit versionierten Migrationen und Audit-Linie; **kein** produktives Go-Live-Ziel ohne klare Persistenz- und Lesepfade.  
- **Bis Gate:** Keine stillen „teilweise in Memory“-Buchungen; Stubs lehnen ab (fail-closed).

## Non-Goals (explizit)

- Produktive **FIN-2-Rechnungsbuchung**, Motor **8.4** am produktiven Pfad, **FIN-3** Zahlungsfluss, **FIN-4** Mahnwesen (außer rein dokumentierte Schnittstellen / OpenAPI ohne implementierte Buchung).  
- Neue **DomainError-Codes** nur in einem PR, der `docs/contracts/error-codes.json` und Frontend-Matrix mitpflegt — **nicht** Teil dieses FIN-0-Dokuments.  
- Steuer-Sonderfälle **8.16** / FIN-5: nicht Gegenstand; FIN-2 bereitet nur **EUR + konsistente Steuerzeile** laut Gate-Dokument vor.

## Konsequenzen

- Implementierungsreihenfolge: **FIN-2-Start-Gate erfüllen** → dann Domäne + Persistenz + API gemäß diesem ADR und OpenAPI.  
- Frontend darf Stubs **nicht** als „grün“ interpretieren, solange Gate offen; Fehlercodes sind bewusst aus dem bestehenden Traceability-/Export-Vokabular gewählt.

## Risiken

- **Semantische Überladung** von `TRACEABILITY_LINK_MISSING` / `EXPORT_PREFLIGHT_FAILED` für „Gate nicht offen“ — akzeptiert in FIN-0, bis dedizierte Codes in einem Contract-Update eingeführt werden (mit Frontend-Abgleich).  
- **Drift** zwischen OpenAPI-Stubs und erster Implementierung — Mitigation: FIN-2-Kick-off-PR muss Pfade und Statuscodes gegen dieses ADR prüfen.

## Verweise

- `docs/tickets/FIN-2-START-GATE.md`  
- `ERP Systembeschreibung v1.3.md` (8.x, 12, 15, 16)  
- `docs/adr/0004-measurement-lifecycle-phase2-inc1.md`, `docs/adr/0005-lv-hierarchy-phase2-inc2.md`, `docs/adr/0006-offer-vertical-slice-persistence.md`  
- `docs/contracts/error-codes.json`, `docs/api-contract.yaml`
