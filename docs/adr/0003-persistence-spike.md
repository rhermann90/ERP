# ADR 0003 — Persistence Spike Prisma/Postgres (TICKET-002 Folgephase)

## Status
Proposed (reviewbar). **Umsetzung ersten vertikalen Schnitts:** siehe ADR-0006 (Offer + OfferVersion); vollständige Domänen-Persistenz bleibt ausstehend.

## Kontext
Der aktuelle Backend-Slice nutzt In-Memory-Repositories. Für belastbare Mandantentrennung, Constraints und migrationssichere Versionierung wird eine Prisma/Postgres-Perspektive benötigt, ohne bestehendes Verhalten ungeplant zu brechen.

## Entscheidung 1: `prisma migrate dev` vs `prisma db push`

### Option A — `prisma db push`
- **Vorteile**
  - Sehr schnell für Prototyping/Spikes.
  - Geringer Overhead in frühen lokalen Experimenten.
- **Nachteile**
  - Kein versioniertes SQL-Historienartefakt.
  - Schwächeres Audit/Review für rechtlich sensible Domänenänderungen.
  - Höheres Drift-Risiko zwischen Teamumgebungen.

### Option B — `prisma migrate dev` (empfohlen)
- **Vorteile**
  - Versionierte, reviewbare Migrationen.
  - Besser für Nachvollziehbarkeit, Compliance und reproduzierbare Deployments.
  - Erzwingt saubere, additive Schema-Evolution.
- **Nachteile**
  - Mehr initialer Aufwand.
  - Erfordert strengere Entwicklungsdisziplin (Migrationspflege).

### Gewählt (für Produktivpfad)
`prisma migrate dev` als Standardpfad.  
`db push` nur als lokaler, nicht-verbindlicher Spike-Modus ohne Mergepflicht.

## Entscheidung 2: Tenant-/Unique-Constraints (Zielschema-Skizze)

### Kernprinzipien
- Jede geschäftliche Entität hat `tenant_id NOT NULL`.
- Cross-Tenant-Referenzen werden über zusammengesetzte FKs unterbunden.
- Versionen erhalten tenant-lokale Eindeutigkeit (`(tenant_id, parent_id, version_number)`).
- Historisch relevante Referenzen (`base_offer_version_id`) sind unveränderlich.

### Tabellen (konzeptionell)
- `offers(id, tenant_id, project_id, customer_id, current_version_id, ...)`
- `offer_versions(id, tenant_id, offer_id, version_number, status, ...)`
- `supplement_offers(id, tenant_id, offer_id, base_offer_version_id, ...)`
- `supplement_versions(id, tenant_id, supplement_offer_id, version_number, status, ...)`
- `invoices(id, tenant_id, ..., supplement_offer_id?, supplement_version_id?, ...)`
- `traceability_links(invoice_id, tenant_id, ..., supplement_offer_id?, supplement_version_id?)`

### Constraint-Skizzen
- `UNIQUE (tenant_id, offer_id, version_number)` auf `offer_versions`
- `UNIQUE (tenant_id, supplement_offer_id, version_number)` auf `supplement_versions`
- FK-Beziehungen immer tenant-konsistent (bevorzugt über zusammengesetzte Schlüssel)
- Kein `ON DELETE CASCADE` auf historisch relevante Versionstabellen
- Ergänzende Indizes:
  - `(tenant_id, status)` für Listen/SoT-Abfragen
  - `(tenant_id, created_at)` für Audit-/Timeline-Flows

## Nicht-Ziel in diesem Arbeitspaket
- Keine Breaking-Änderung am laufenden In-Memory-Slice.
- Keine verpflichtende Prisma-Einführung ohne PL-Priorisierung.
- Keine Ausweitung auf vollständige Finanzlogik.

## Konsequenzen
- Dokumentation ist sofort reviewbar und priorisierbar.
- Code-Umstieg kann in separatem Ticket kontrolliert erfolgen (Feature-Flag/Adapter-Ansatz empfohlen).

## Risiken
- Bis zur echten DB-Umstellung bleiben Laufzeit-Constraints nur logisch in Services abgesichert.
- Späterer Umstieg benötigt saubere Migrationsreihenfolge, um Datenkonsistenz zu garantieren.
