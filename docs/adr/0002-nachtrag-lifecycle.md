# ADR 0002 — Nachtrags-Lebenszyklus, Wirkungsgrenze und Traceability (v1.2)

**Status: ACCEPTED (Iteration 1 umgesetzt, 2026-04-14).**

## Kontext
Die Systembeschreibung v1.2 definiert für das **Nachtragsangebot** einen eigenen Lebenszyklus inkl. **Freigabe** und **Beauftragung** sowie die Regel: **finanzielle/abrechenbare Wirkung erst ab `Beauftragt`**. Zusätzlich müssen Abweichungen im **Aufmass** und in der **Rechnung** nachvollziehbar sein; die **Basis-Angebotsversion** bleibt historisch unverändert.

Nach TICKET-001 existiert nur eine **Minimal-API** (Anlage einer Nachtragsversion im Status `ENTWURF`).

## Entscheidungen (Vorschlag zur Freigabe)

### D1 — Lebenszyklus 1:1 zu §5.3
- Nachtrag folgt: `ENTWURF → IN_FREIGABE → FREIGEGEBEN → VERSENDET → BEAUFTRAGT | ABGELEHNT → ARCHIVIERT` (eigenes Supplement-Statusmodell in der Entität `SupplementVersion`).
- Keine Überschreibung historischer Nachtragsversionen: Änderungen nach „fixierenden“ Übergängen nur über neue Version oder Folgeprozess (analog Hauptangebot, angepasst an Nachtrag).

### D2 — Wirkungsgrenze „Beauftragt“
- Bis ausschließlich vor `BEAUFTRAGT`: keine Erzeugung/Änderung von Entitäten, die **abrechenbare Mengen** im Sinne von §5.3 auslösen (kein „still“ synchronisiertes Aufmass/Rechnungs-Bestand ohne expliziten fachlichen Akt).
- Ab `BEAUFTRAGT`: explizite Kopplung zu **Aufmass** (neue Version / Nachtragsbezug) und Vorbereitung **Rechnung**/Traceability gemäß §7 — **Umfang Iteration 1** durch TICKET-002 Scope festgelegt.

### D3 — Source of Truth für Aktionen
- Umgesetzt als Erweiterung von `GET /documents/{id}/allowed-actions` um **`entityType=SUPPLEMENT_VERSION`**.
- Keine dedizierte parallele SoT-Route; Endpunkte prüfen dieselbe Matrix (`AuthorizationService`).

### D4 — Traceability / Export
- Rechnungs-Export bleibt **fail-closed**; Traceability-Modell wird um **Nachtragsreferenz** erweitert (Feld oder verknüpfte Entität), so dass **Rechnung → … → Nachtrag → Basis-Angebotsversion → Projekt → Kunde** belegbar ist.
- GAEB/XRechnung-Preflight für Nachtrag: eigene Pflichtfeldmatrix oder Reuse mit Erweiterung — **kein** Export rechtswirksamer Artefakte bei Verletzung der Matrix.

### D5 — Persistenz
- Umstellung von In-Memory auf **Prisma/Postgres** mit mandantenharten Constraints und Migrations nur additiv; siehe TICKET-002 „Migration-Perspektive“.

**Umsetzung (Stand 2026-04):** Tabellen `supplement_offers` und `supplement_versions` (Composite-PKs, FKs zu `offers`, `offer_versions`, `lv_versions`), Migration `prisma/migrations/20260419120000_supplement_offers_versions/`, Write-Through und Hydration über `src/persistence/supplement-persistence.ts`, Einbindung in `buildApp` bei `repositoryMode=postgres`. Integrationstests inkl. API-Write-Through, Tenant-Negativfall und Hydration-Smoke (`test/persistence.integration.test.ts`). **`applyBillingImpact`** sowie Rechnungs- und Traceability-Aggregate bleiben bis FIN-2 außerhalb dieser Prisma-Tabellen (siehe `README.md`, Teilpersistenz).

## Konsequenzen
- Höhere Komplexität in `AuthorizationService`, Contracts und Tests.
- Klare Trennung: **Minimal-API (TICKET-001)** bleibt kompatibel oder wird in den vollen Lebenszyklus migriert (Breaking-Change nur mit Gate).

## Offene Punkte (nach Iteration 1)
- Iteration 1b: Nachtrags-Positions-/LV-Struktur vertiefen.
- ~~Iteration 2: Persistenzmigration Prisma/Postgres~~ — **erledigt** für `SupplementOffer` / `SupplementVersion` (siehe D5); Rechnung/Traceability weiter FIN-2-gated.
