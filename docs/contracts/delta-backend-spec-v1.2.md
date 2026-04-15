# Delta Backend Spec v1.2

## Zweck
1:1-Sync zwischen Backend-SoT (Implementierung + `docs/api-contract.yaml`) und Contract-Artefakten:
- `docs/contracts/action-contracts.json`
- `docs/contracts/error-codes.json`
- `docs/contracts/module-contracts.json`

## Änderungen (Inc1 Sync)

1. **Offer-SoT ergänzt**
- `action-contracts.json` ergänzt um:
  - `OFFER_SET_ANGENOMMEN`
  - `OFFER_SET_ABGELEHNT`
- Begründung: Aktionen sind in Backend-SoT (`AuthorizationService.allowedOfferActionsByStatus`) vorhanden und über `POST /offers/status` ausführbar.

2. **Supplement-Archivierung SoT ≡ API**
- `SUPPLEMENT_SET_ARCHIVIERT.allowedFromStatus`: `ENTWURF|BEAUFTRAGT|ABGELEHNT` (Entwurf direkt archivierbar wie `POST /supplements/status` + `ALLOWED_SUPPLEMENT_TRANSITIONS`).
- Nicht: Zwischenstände ohne Domain-Transition (`IN_FREIGABE` … `VERSENDET`) — dort kein Archiv-Sprung in der aktuellen Policy.

3. **Fehlerpfade vereinheitlicht (keine Phantom-Codes)**
- Für geschützte Offer-/Measurement-/Export-Aktionen wurden fehlende, tatsächlich mögliche Querschnittscodes ergänzt:
  - `TENANT_SCOPE_VIOLATION`
  - `UNAUTHORIZED`
- Quelle: `getAuthContext` + `verifyBearerToken` + `handleError`.

4. **Module-Hinweis konkretisiert**
- `module-contracts.json` präzisiert im Offer-Modul:
  - Bei `ANGENOMMEN` erfolgt Nachtragspfad konkret über
    `OFFER_CREATE_SUPPLEMENT` / `POST /offers/{offerId}/supplements`.

5. **OpenAPI-Textabgleich**
- `docs/api-contract.yaml` Beschreibungen konkretisiert:
  - `/offers/status` nennt jetzt inkl. `ANGENOMMEN|ABGELEHNT`.
  - `/supplements/status` nennt vollständige Nachtrags-Transitions.

## Validierungsstatus
- JSON-Schemas/Dateien syntaktisch valide.
- Keine neuen Phantom-Codes eingeführt.
- SoT-Policy unverändert: UI-Aktionen nur aus `allowedActions`.

## Inc2 — Nachdokumentation (API-Hygiene)

- **`exportPreflightDetailTokens`** in `error-codes.json`: u. a. `LV_VERSION_MISSING` unter Parent `EXPORT_PREFLIGHT_FAILED` (kein eigener top-level `code`).
- **PATCH strict (Zod):** **umgesetzt** — `PATCH /lv/nodes/.../editing-text` und `PATCH /lv/positions/...`: unbekannte Body-Keys → `VALIDATION_FAILED` /400; `systemText` im Body weiterhin → `LV_SYSTEM_TEXT_IMMUTABLE` /409 (`assertSystemTextNotInUpdatePayload` vor `parse`; ADR-0005 D7).

# Delta: Backend / Tests / Contracts vs. `ERP Systembeschreibung v1.2.md`

Stand: 2026-04-14 (aktualisiert nach Phase-2-Increment-2 LV §9). Ziel: fachliche und technische Lücken nach Fortschreibung der Systembeschreibung schließen.

## Kurzfazit

| Bereich | Abgleich v1.2 | Priorität |
| --- | --- | --- |
| `OfferService.createVersion` + `offer-create-version-policy.ts` | Zentrale Policy: `ENTWURF`–`VERSENDET` ja, ab `ANGENOMMEN` `FOLLOWUP_DOCUMENT_REQUIRED` | — **behoben** |
| `AuthorizationService.allowedOfferActionsByStatus` vs. `createVersion` | Gleiche Policy + Rollenfilter; kein Drift mehr | — **behoben** |
| `POST /offers/version` | Ruft `assertOfferCreateVersionForOffer` (identische Regel wie allowed-actions) | — **behoben** |
| `docs/contracts/action-contracts.json` (`OFFER_CREATE_VERSION`) | `allowedFromStatus` aligned; `NEW_VERSION_REQUIRED` entfernt | — **behoben** |
| `module-contracts.json` (Offer) | `immutableLegalAreas` v1.2 präzisiert | — **behoben** |
| Nachtragsdomäne (Entität, API, Traceability) | Minimal-API `POST /offers/{offerId}/supplements` implementiert (Basisversion muss `ANGENOMMEN`) | — **teilweise behoben** |
| Tests | v1.2-Benennung; Negativ `ANGENOMMEN` + `POST /offers/version`; SoT IN_FREIGABE | — **behoben** |
| TICKET-002 Iteration 1 | Supplement-Lifecycle (`IN_FREIGABE`..`BEAUFTRAGT`), SoT `entityType=SUPPLEMENT_VERSION`, Billing-Impact-Gate vor/ab `BEAUFTRAGT` | — **behoben (Iteration 1)** |
| §5.4 Aufmass (Phase 2 Inc1) | Lebenszyklus, Positionen, `MEASUREMENT_CREATE_VERSION` nach Freigabe; SoT `MEASUREMENT_VERSION`; Traceability-Rechnung prüft Measurement-Kopf | — **behoben (Backend-Slice)** |
| §9 LV & Text (Phase 2 Inc2) | Katalog, Version, Strukturknoten, Positionen; SoT `LV_VERSION` / `LV_STRUCTURE_NODE` / `LV_POSITION`; `LvReferenceValidator`; Seed-LV für `lvVersionId` | — **behoben (Backend-Slice)** |

## Detail-Deltas

### 1) Angebotslebenszyklus (fachlich)

- **v1.2**: `ENTWURF` … `VERSENDET` (ohne Annahme) → Anpassungen zulässig (nicht-destruktiv, neue Angebotsversion); `ANGENOMMEN` → nur Nachtrag.
- **Code**: `offer-create-version-policy.ts` erlaubt `OFFER_CREATE_VERSION` nur in `ENTWURF|IN_FREIGABE|FREIGEGEBEN|VERSENDET`; sonst `FOLLOWUP_DOCUMENT_REQUIRED`.
- **Stand**: Minimaler Nachtragspfad implementiert (`/offers/{offerId}/supplements`), erweitert in Folgephase um vollständigen Nachtrags-Lifecycle.

### 2) allowedActions vs. API (`Source of Truth`)

- **v1.2 / Architekturziel**: Kritische Aktionen konsistent; UI darf nicht mehr können als API erzwingt.
- **Stand nach Fix**: Eine Policy (`src/domain/offer-create-version-policy.ts`); `POST /offers/version` und `GET /documents/{id}/allowed-actions` sind abgestimmt.

### 3) Frontend-Contracts

- **action-contracts.json** / **module-contracts.json**: an Backend-Policy v1.2 angeglichen (siehe Git-Stand).

### 4) Tests & Kommentare

- Umgesetzt in `test/app.test.ts` (v1.2-Beschreibung, Negativfall `ANGENOMMEN`, SoT IN_FREIGABE).

### 5) Aufmass (Phase 2 Increment 1)

- **v1.2 §5.4**: Statuskette und nicht-destruktive neue Version nach `FREIGEGEBEN` / bei `ABGERECHNET`.
- **Code**: `measurement-lifecycle-policy.ts`, `measurement-create-version-policy.ts`, `MeasurementService`, Endpunkte unter `/measurements/*`, `AuthorizationService` erweitert.
- **Traceability**: `TraceabilityService.assertInvoiceTraceability` lädt `Measurement` und vergleicht Projekt/Kunde/LV mit Rechnung.
- **Contracts**: `action-contracts.json` / `module-contracts.json` / `error-codes.json` im Repo auf Phase-2-Inc1 angeglichen (Review gegen Backend empfohlen).

### 6) LV-Hierarchie (Phase 2 Increment 2, §9)

- **v1.2 §9**: Bereich→Titel→Untertitel→Position; Systemtext vs. Bearbeitungstext; keine §10-Mietlogik in Inc2.
- **Code**: `lv-service.ts`, Policies `lv-version-lifecycle-policy.ts`, `lv-create-version-policy.ts`, `lv-text-structure-policy.ts`, Routen `/lv/*`, `LvReferenceValidator` in Angebot/Nachtrag/Messung, Traceability prüft `LvVersion` zu `invoice.lvId`.
- **ADR**: `docs/adr/0005-lv-hierarchy-phase2-inc2.md`.
- **Contracts**: `action-contracts.json` / `module-contracts.json` / `error-codes.json` auf **1.4.0** (Inc2 LV-Aktionen, `LV_*`-Codes, SoT-`entityType`-Erweiterung); OpenAPI-Query `entityType` bei `GET /documents/{id}/allowed-actions` ≡ `AllowedActionsResponse.entityType`.
- **Tests**: `Phase 2 Inc2 — LV §9` in `test/app.test.ts` (inkl. `LV_SYSTEM_TEXT_IMMUTABLE` bei `systemText` in PATCH-Body).

## Nächster Schritt

1. §10 Mietlogik / TICKET-002 Iteration 1b nach separatem Gate.
2. Prisma/Postgres nach ADR-0003 und separatem GO.
