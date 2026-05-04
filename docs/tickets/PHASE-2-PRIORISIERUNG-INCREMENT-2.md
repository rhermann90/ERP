# Phase 2 — Verbindliche Priorisierung Increment 2

**Entschieden am:** 2026-04-14  
**Entschieden durch:** Projektleiter + Softwarearchitekt

## Increment 2 (verbindlich): **LV-Hierarchie & Textlogik (v1.2 §9)**

**Kurzbezeichnung im Projekt:** **Phase-2 Increment 2 = LV §9**

### Verbindlicher Umfang (v1.2)

Aus `docs/ERP-Systembeschreibung.md` **§9 LV- und Textlogik**:

- Hierarchie: `Bereich -> Titel -> Untertitel -> Position`
- Pro **LV-Position**: hierarchische Ordnungszahl, Menge, Einheit, Preis, Typ (Normal, Alternativ, Eventual), optional Stammpositionsreferenz
- **Texttrennung (verbindlich):**
  - **Systemtext**: unveränderbar, export- und buchhaltungsrelevant
  - **Bearbeitungstext**: editierbar, anzeige- und angebotsrelevant

### Explizit nicht Teil von Increment 2 (eigenes Increment / Ticket)

- **§10 Mietlogik** (Gerüstbau) — gesonderte Ausbaustufe, keine1:1-CRUD-Vereinfachung
- **TICKET-002 Iteration 1b** (Nachtrags-LV-Tiefe gekoppelt an Nachtrag) — separat
- **Produktive Prisma/Postgres-Migration** — nur laut `docs/adr/0003-persistence-spike.md` bis separates GO
- **PWA / UI** — nur Contracts/OpenAPI

### Zielbild technisch (Minimum)

1. Domänenmodell: **LV** (Kopf), **LV-Strukturknoten** (Bereich/Titel/Untertitel), **LV-Position** mit Tenant-Scoping und **LV-Versionierung** (nicht-destruktiv, analog bestehenden Mustern).
2. API zum Lesen/Schreiben der Hierarchie und Positionen unter strikter **AuthZ** und **SoT** (`GET /documents/{id}/allowed-actions` mit passendem `entityType`, z. B. `LV_VERSION` / `LV_POSITION` — endgültige Namen im ADR).
3. **Systemtext** nach Anlage/immutable-Regeln; **Bearbeitungstext** editierbar nur in erlaubten Statusfenstern.
4. **Audit** auf kritischen Änderungen (Freigaben, Sperren, Versionswechsel).
5. Anbindung an bestehende **`lvVersionId`**-Referenzen (Angebot, Aufmass, Traceability) ohne Bruch der Ketten §2/§7.
6. Tests: P0 Tenant, SoT, Text-Invarianten, Negative; Regression **grün**.

### Abhängigkeit

- Phase-2 Increment 1 (Aufmass) liefert bereits `lvPositionId`-Referenzen; Increment 2 soll **validierbare** LV-Positionen und Konsistenzregeln ermöglichen (mindestens Existenz + Tenant + LV-Version).

### Entwicklungs-Vorbereitung (Shell / PWA, ohne Scope-Erweiterung)

Read-only **Haupt-Shell**-Panels für weitere `entityType`-Werte (z. B. `LV_VERSION` nach ADR-Finalnamen) erst nach **stabilen öffentlichen `GET`-Routen** und Client-Methode — siehe [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md), [`docs/CODEMAPS/overview.md`](../CODEMAPS/overview.md); strikt getrennt von Finanz-Welle-3-Schreibpfaden.

### Verweise

- `docs/tickets/PHASE-2-STARTAUFTRAG.md`
- `docs/tickets/PHASE-2-PRIORISIERUNG-INCREMENT-1.md` (Vorgänger)
- `docs/adr/0004-measurement-lifecycle-phase2-inc1.md` (Kontext Aufmass ↔ LV)
- `docs/adr/0013-lv-section9-hierarchy-and-text-separation.md` (§9 Hierarchie-Lesepfade, Texttrennung `editableText`)
