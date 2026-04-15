# ADR 0004 — Aufmass-Lebenszyklus (Phase 2 Increment 1, v1.2 §5.4)

**Status:** ACCEPTED (2026-04-14)

## Kontext

`ERP Systembeschreibung v1.2.md` §5.4 definiert Aufmass:  
`Entwurf -> Geprueft -> Freigegeben -> Abgerechnet -> Archiviert` mit der Regel: **nach Freigabe nur Korrektur über neue Aufmassversion**.  
§2/§7 verlangen nachvollziehbare Ketten bis Rechnung/LV/Projekt/Kunde.

## Entscheidungen

### D1 — Aggregat und Versionierung

- **`Measurement`** (Kopf): `tenantId`, `projectId`, `customerId`, `lvVersionId`, `currentVersionId`.
- **`MeasurementVersion`**: `versionNumber`, `status` (§5.4), keine destruktive Änderung historischer Versionen.
- **`MeasurementPosition`**: gehört zu einer `measurementVersionId`; `lvPositionId` als Referenz auf LV-Position (ohne vollständiges LV-Modell in Inc1).

### D2 — Korrekturpfad

- Zentrale Policy `measurement-create-version-policy.ts`: **`MEASUREMENT_CREATE_VERSION`** nur bei aktueller Version in `FREIGEGEBEN` oder `ABGERECHNET`.
- Positionen nur im Status **`ENTWURF`** der **aktuellen** Version änderbar (`measurement-lifecycle-policy.ts`); sonst `MEASUREMENT_POSITION_EDIT_FORBIDDEN`.

### D3 — SoT

- `entityType=MEASUREMENT_VERSION` in `GET /documents/{id}/allowed-actions`.
- Schreibende Endpunkte rufen dieselben `AuthorizationService`-Assertions wie die SoT-Matrix (inkl. `assertMeasurementCreateVersionForMeasurement`).

### D4 — Traceability / Rechnung

- Rechnungs-Export: `TraceabilityService` prüft zusätzlich Existenz und Feld-Konsistenz des **`Measurement`** zu `invoice.measurementId` (Projekt, Kunde, `lvVersionId` ↔ `invoice.lvId`).
- Keine Abschwächung bestehender Supplement-/Link-Prüfungen.

### D5 — Rollen (Projekt-Slice)

- **VERTRIEB**: Anlage, Positionen (ENTWURF), `GEPRUEFT`, neue Version.
- **GESCHAEFTSFUEHRUNG**: `FREIGEGEBEN`, `ARCHIVIERT`, neue Version.
- **BUCHHALTUNG**: `ABGERECHNET`.
- **ADMIN**: vollständig.

## Konsequenzen

- Seed-Daten müssen konsistente `Measurement`-Entitäten für bestehende Rechnungs-Tests enthalten.
- Frontend-Contracts (`action-contracts.json` etc.) sind durch Frontend-Agent nachzuziehen.

## Projektleitung — Entscheidungen (2026-04-14)

### D6 — Leseschnitt GET Measurement (DSGVO / Außendienst)

- **Ja:** `GET /measurements/{measurementVersionId}` soll **perspektivisch** eine **DSGVO-minimierte** Antwortvariante unterstützen (z. B. über Query `view=field` oder separates Endpoint), sobald Rollen-/Feld-Klassifikation aus §11/§13 konkretisiert ist.
- **Inc1:** noch nicht implementiert; nur Planungsanker für Phase 2+.

### D7 — ARCHIVIERT: Version vs. Kopf-Aggregat

- **Ja zu §5.4-konformem Modell:** `ARCHIVIERT` bleibt der **terminale Status der jeweiligen `MeasurementVersion`** (letzter Status **pro Version**).
- **Ja zu späterem Kopf-Aggregat:** Ein **gesondertes „Messungs-Kopf archiviert“** (Aggregatzustand über alle Versionen hinweg) ist **beabsichtigt** für eine spätere Ausbaustufe — **nicht** Teil von Increment 1; eigenes ADR/Ticket, damit Archivierung auf Kopf- und Versionsebene fachlich nicht vermischt wird.

## Offene Punkte

- LV-Hierarchie / editorische Positions-Tiefe (Phase 2 spätere Increments bzw. TICKET-002 Iteration 1b).
- Persistenz: ADR-0003 bis separates GO.
- Umsetzung D6/D7 nach Priorisierung (kein Scope-Creep in Inc1).
