# FOLLOWUP — Audit-Events persistieren (DATA-01 / GoBD-Vorbereitung)

**Status:** umgesetzt (Inkrement 2 — Postgres-Pfad; In-Memory unverändert für Tests)  
**Zieltermin-Review:** 2026-04-30 (Indikativ; PL-Gate erforderlich)

## Kontext

Meilenstein ADR-0006 persistiert **Offer + OfferVersion** in Postgres. **`AuditService.append`** schreibt bei **`repositoryMode=postgres`** zuerst in **`audit_events`** und erst bei Erfolg in **`repos.auditEvents`** (fail-hard: DB-Fehler → `AUDIT_PERSIST_FAILED` / HTTP 500, kein Eintrag im Arbeitsspeicher). Ohne Prisma bleibt nur der In-Memory-Pfad.

## Scope Folge-Ticket

- Prisma-Modell `audit_events` (tenant_id NOT NULL, entity_type, entity_id, action, timestamp, actor_user_id, reason, optionale JSON-Felder für before/after gemäß Datenschutz/Minimierung) — **Migration** `20260215120000_deferrable_offer_fks_and_audit_events`.
- Schreibpfad: bei `repositoryMode=postgres` **DB zuerst**, dann Memory; siehe `src/services/audit-service.ts`.
- Lesepfad `GET /audit-events`: bei Postgres aus DB mit Pagination; **Antwort** weiterhin ohne `reason` / `beforeState` / `afterState` (DSGVO-Minimierung wie zuvor).
- Migrationen versioniert; keine Phantom-Codes in Contracts.

## Abhängigkeiten

- Vollständige Persistenz anderer Entitäten (ADR-0003 Fortführung) kann Reihenfolge mit Audit beeinflussen.

## Review-Hinweis (Folgearbeit)

- **Fail-hard (Option B)** ist umgesetzt; tiefer gehende **atomare** Transaktion Audit+Domäne / Outbox: weiter **[`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md)** (Historie/ADR-Verweis).

## Nicht-Ziel

- Keine Änderung der öffentlichen Audit-API ohne Contract-Update und QA-Gate.
