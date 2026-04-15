# FOLLOWUP — Audit-Events persistieren (DATA-01 / GoBD-Vorbereitung)

**Status:** umgesetzt (Inkrement 2 — Postgres-Pfad; In-Memory unverändert für Tests)  
**Zieltermin-Review:** 2026-04-30 (Indikativ; PL-Gate erforderlich)

## Kontext

Meilenstein ADR-0006 persistiert **Offer + OfferVersion** in Postgres. **`AuditService.append`** schreibt weiterhin in **`repos.auditEvents`** (Arbeits-Cache) und bei **`repositoryMode=postgres`** zusätzlich in **`audit_events`** (Dual-Write; Fehler beim DB-Write werden geloggt, die In-Memory-Kette bleibt konsistent).

## Scope Folge-Ticket

- Prisma-Modell `audit_events` (tenant_id NOT NULL, entity_type, entity_id, action, timestamp, actor_user_id, reason, optionale JSON-Felder für before/after gemäß Datenschutz/Minimierung) — **Migration** `20260215120000_deferrable_offer_fks_and_audit_events`.
- Schreibpfad: bei `repositoryMode=postgres` **Dual-Write** (Memory + DB); siehe `src/services/audit-service.ts`.
- Lesepfad `GET /audit-events`: bei Postgres aus DB mit Pagination; **Antwort** weiterhin ohne `reason` / `beforeState` / `afterState` (DSGVO-Minimierung wie zuvor).
- Migrationen versioniert; keine Phantom-Codes in Contracts.

## Abhängigkeiten

- Vollständige Persistenz anderer Entitäten (ADR-0003 Fortführung) kann Reihenfolge mit Audit beeinflussen.

## Review-Hinweis (Folgearbeit)

- DB-Fehler beim `append`-Dual-Write werden **nicht** nach außen propagiert (nur Log). Semantik **fail-hard vs. Transaktion mit Domänenmutation** / Outbox: siehe **[`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md)** — vor **Produktionslast** schließen oder mit PL dokumentiert akzeptieren.

## Nicht-Ziel

- Keine Änderung der öffentlichen Audit-API ohne Contract-Update und QA-Gate.
