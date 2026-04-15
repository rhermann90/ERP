# ADR 0006 — Vertikaler Persistenz-Meilenstein: Offer + OfferVersion (Postgres)

**Repo-Erweiterung (Phase 2):** derselbe Runtime-Ansatz gilt für **LV §9 + Aufmass** (`PrismaLvMeasurementPersistence`, Migration `20260414120000_lv_measurement_phase2_persistence`). ADR-Titel bleibt historisch; verbindliche Beschreibung der **Teilpersistenz** siehe unten.

## Status

Accepted (Implementierung im Repo; weitere Entitäten folgen kontrolliert, jeweils nach PL-Priorität / Ticket).

## Kontext

ADR-0003 definiert Prisma `migrate dev` als Standard und tenant-sichere Constraints. Dieser Inkrement liefert den ersten **vertikalen Schnitt** ohne Monorepo-weite Big-Bang-Migration.

## Entscheidung

1. **Domänenschnitt:** `Offer` und `OfferVersion` mit zusammengesetzten Schlüsseln `(tenant_id, id)` und FK `offer_versions(tenant_id, offer_id) → offers(tenant_id, id)` ohne `ON DELETE CASCADE` auf Versionen.
2. **Eindeutigkeit:** `UNIQUE (tenant_id, offer_id, version_number)` auf `offer_versions`.
3. **Runtime:** `InMemoryRepositories` bleibt der **Arbeits-Cache** für alle Entitäten. Bei `repositoryMode=postgres` **Write-Through** nach Postgres für:
   - **Offers:** nach `createVersion`, `transitionStatus` (Upsert Offer-Subgraph);
   - **LV §9 + Aufmass:** nach den mutierenden Methoden von `LvService` / `MeasurementService` (Upsert Katalog-Subgraph bzw. Aufmass-Subgraph).
   Startup (`buildApp`): bei Postgres zuerst **`syncAllFromMemory` für LV+Aufmass**, danach **Offers** — damit `offer_versions.lv_version_id` (FK → `lv_versions`, Gate **G5**) nie „vorne“ liegt.
   Bei `seedDemoData=true` werden die genannten Subgraphen aus dem Seed-Speicher persistiert.
4. **Tests / Demos:** `buildApp({ repositoryMode: "memory" })` erzwingt explizit keinen DB-Zugriff (Vitest).
5. **Fail-closed:** `NODE_ENV=production` oder `ERP_DEPLOYMENT=integration` ohne `DATABASE_URL` → Prozessstart abgebrochen (siehe `repository-mode.ts` + `index.ts`).
6. **Audit:** In-Memory bleibt Quelle im Prozess (`repos.auditEvents`). Bei **`repositoryMode=postgres`** zusätzlich persistiertes **`audit_events`** (Dual-Write); Lesepfad `GET /audit-events` DSGVO-minimiert. Tickets: `docs/tickets/FOLLOWUP-AUDIT-PERSISTENCE.md`, Review offen: `docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md` (DB-Fehler werden nicht propagiert).

## Konsequenzen

- Öffentliche API und Domänenlogik unverändert; keine Vereinfachung von SoT oder Traceability-Regeln.
- **Teilpersistenz (explizit, Repo-Stand):**

| Bereich | Postgres | Nur In-Memory (`InMemoryRepositories`) |
|--------|----------|------------------------------------------|
| LV Katalog / Version / Knoten / Positionen | ja (`lv_*`) | — |
| Aufmass / Version / Positionen | ja (`measurement_*`) | — |
| Offer / OfferVersion | ja | — |
| Audit (Lesepfad API minimiert) | ja (`audit_events`, Dual-Write) | — |
| Nachtrag (SupplementOffer / SupplementVersion) | **nein** | ja |
| Rechnung (`Invoice`) | **nein** | ja |
| Traceability-Link-Map (`traceabilityLinks`) | **nein** | ja |
| Exportläufe (`exportRuns`) | **nein** | ja |

- **FIN-2** (gebuchte Rechnung, **8.4**-Motor) und **FIN-1** (Zahlungsbedingungen) bleiben bis **schriftlichem Auftrag** bzw. erfülltem [`FIN-2-START-GATE.md`](../tickets/FIN-2-START-GATE.md) **out of scope**; siehe ADR-0007.
- **LV löschen / RESTRICT:** kein stiller CASCADE-Fix bei hängenden `offer_versions` — Ticket [`FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md`](../tickets/FOLLOWUP-LV-DELETE-WITH-DEPENDENT-OFFERS.md).

## Risiken

- Betrieb mit `seedDemoData=false` und Postgres lädt aus der DB nur **LV-, Aufmass- und Offer-**Subgraphen; **Nachtrag, Rechnung, Traceability-Links** bleiben leer, bis Hydratisierung/Seeds oder Folge-Inkremente — nur für kontrollierte Deployments.
