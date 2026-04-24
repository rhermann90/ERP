# ADR 0005 — LV-Hierarchie & Textlogik (Phase 2 Increment 2, v1.2 §9)

**Status:** ACCEPTED (2026-04-14)

## Kontext

`docs/_archiv/systembeschreibung-und-phasen-legacy/ERP Systembeschreibung v1.2.md` §9 verlangt die Hierarchie **Bereich → Titel → Untertitel → Position**, Positionsattribute inkl. Typ (Normal/Alternativ/Eventual), sowie die **verbindliche Texttrennung**: **Systemtext** unveränderlich (export-/buchhaltungsrelevant), **Bearbeitungstext** in erlaubten Fenstern editierbar.

Phase-2-Increment-1 referenziert `lvVersionId` / `lvPositionId` (Aufmass, Angebot, Traceability) ohne validierbare LV-Entitäten.

## Entscheidungen

### D1 — Domänenmodell & Versionierung

- **`LvCatalog`** (Kopf): `tenantId`, optional `projectId`, `name`, `currentVersionId`.
- **`LvVersion`**: `versionNumber`, `status` (`ENTWURF` | `FREIGEGEBEN` | `ARCHIVIERT`), `headerSystemText` / `headerEditingText` (Kopf §9).
- **`LvStructureNode`**: `BEREICH` | `TITEL` | `UNTERTITEL`, Baum mit Eltern-Kind-Regeln §9.
- **`LvPosition`**: unter **`UNTERTITEL`**, `sortOrdinal`, Mengen/Einheit/Preis, `kind`, `systemText`/`editingText`, optional `stammPositionsRef`. **Keine §10-Mietlogik** in Inc2.
- **Nicht-destruktiv:** neue **`LvVersion`** nur von **`FREIGEGEBEN`** (`lv-create-version-policy.ts`); Kopie des Baums inkl. Positionen mit neuen IDs.

### D2 — Text- und Strukturpolitik

- **`lv-text-structure-policy.ts`**: Struktur- und Bearbeitungstext-Änderungen nur bei **`ENTWURF`** der **aktuellen** Version; sonst `LV_STRUCTURE_LOCKED`.
- **Systemtext:** wird nur bei **Anlage** gesetzt; Update-Endpunkte nehmen **kein** `systemText` entgegen — fachliche Unveränderbarkeit §9.

### D3 — Source of Truth (`allowed-actions`)

Drei **`entityType`**-Werte (kein zusammenfassendes „LV“-Dummy):

| entityType | documentId (Pfad-Parameter) | Bedeutung |
|------------|-------------------------------|-----------|
| `LV_VERSION` | `lvVersionId` | Status, neue Version, „darf Struktur erweitern“ |
| `LV_STRUCTURE_NODE` | `nodeId` | Bearbeitungstext Knoten |
| `LV_POSITION` | `lvPositionId` | Metriken + Bearbeitungstext Position |

Schreibende Routen nutzen dieselben `AuthorizationService`-Assertions wie die Matrix.

### D4 — Audit- `VERSION_CREATED` / `STATUS_CHANGED` auf `LV_VERSION`
- `LV_NODE_CREATED`, `LV_POSITION_CREATED`, `BUSINESS_TEXT_UPDATED` auf Knoten/Position (entityType passend)

### D5 — Referenzvalidierung

- **`LvReferenceValidator`**: `OfferService.createVersion`, `SupplementService.createFromAcceptedOffer`, `MeasurementService` (Anlage + Positionsupdate) prüfen Existenz der LV-Version und Positions-Zugehörigkeit.
- **`TraceabilityService`**: zusätzlich Existenz der **`LvVersion`** zu `invoice.lvId`.

### D6 — Seed

- Demo-`lvVersionId` / `lvPositionSeedA` sind **reale** Entitäten im Katalog, damit Traceability und Nachtrags-/Mess-Tests nicht brechen.

## Konsequenzen

- Frontend-Contracts müssen `entityType`-Enum und neue Aktionen spiegeln (Frontend-Agent).
- Persistenz: Abbildung als Bäume + Versionen unter ADR-0003 später.

## Nachträgliche Entscheidungen (Architektur / API-Hygiene)

### D7 — Unbekannte Felder auf PATCH (Zod `strict()`)

- **Frage:** Sollen PATCH-Body-Schemas zusätzlich unbekannte Felder mit **400** (`VALIDATION_FAILED`) ablehnen, statt nur `systemText` gezielt mit **409** (`LV_SYSTEM_TEXT_IMMUTABLE`)?
- **Entscheidung:** **Ja.** **Umgesetzt:** `updateLvNodeEditingSchema` und `patchLvPositionSchema` nutzen `.strict()`; unbekannte Keys → **400** / `VALIDATION_FAILED`. `assertSystemTextNotInUpdatePayload` läuft **vor** `parse` auf den Routen — **`systemText` im Body** → **409** / `LV_SYSTEM_TEXT_IMMUTABLE`. `handleError` mappt `ZodError` konsistent auf `VALIDATION_FAILED`.
- **Begründung:** Weniger stille Ignorierung von Tippfehlern; klare Trennung: Schema-Shape (400) vs. §9-Immutability (409).

### D8 — `LV_VERSION_MISSING` im Fehlerkatalog

- **Frage:** Soll `LV_VERSION_MISSING` (nur in Export-Preflight-`details.validationErrors`) im zentralen Contract stehen?
- **Entscheidung:** **Ja.** In `docs/contracts/error-codes.json` unter `exportPreflightDetailTokens` dokumentiert — **nicht** in `domainErrorCodesEmitted`, da kein eigener HTTP-Body-`code`.

## Offene Punkte

- §10 Mietpositionslogik (eigenes Increment).
- TICKET-002 Iteration 1b (Nachtrags-LV-Tiefe) bleibt separat.
- D7 (strict PATCH): erledigt; weitere PATCH-Routen optional analog bei Bedarf.
