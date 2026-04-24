# M4 — Mini-Slice 2: Mahn-Vorlage Text patchen (§8.10 Pflichtplatzhalter, ohne Versand)

**Status:** Erledigt (Repo, 2026-04-23) — `verify:ci` + `verify:ci:local-db` grün  
**PL-Entscheid:** Option **Platzhalter-Validierung** als zweiter M4-Mini-Slice nach Vorlagen-Read (Slice 1) — konsistent mit [`M4-MINI-SLICE-1-VORLAGEN-READ-2026-04-23.md`](./M4-MINI-SLICE-1-VORLAGEN-READ-2026-04-23.md); Alternativen E-Mail-Stammdaten / erweitertes Protokoll bleiben zurückgestellt.

## Ableitung aus §8.10

- Jede Vorlage enthält **`{{MahngebuehrEUR}}`**.
- Typen **REMINDER** und **DEMAND_NOTE** zusätzlich **`{{SkontoBetragEUR}}`** und **`{{SkontofristDatum}}`** (Substring-Prüfung im `body`).
- **`templateType`** je Stufe weiterhin wie MVP aus Ordinal abgeleitet (keine freie Typwahl im PATCH).

## HTTP

- **`PATCH /finance/dunning-reminder-templates/stages/{stageOrdinal}/channels/{channel}`**  
  Body: `{ body, reason }` (reason min. 5 Zeichen).  
  Antwort: `200` + `DunningReminderTemplatesReadResponse` (wie GET).

## Persistenz und Transaktion

- **Upsert** in `dunning_tenant_stage_templates` (aktive Zeile, `deleted_at` null).
- **Audit** `DUNNING_TEMPLATE_BODY_PATCHED` in derselben DB-Transaktion wie der Upsert (`entityType` wie Konfig-Pfad: `DUNNING_TENANT_STAGE_CONFIG`, `entityId` = `tenantId`).

## Auth und Fehler

- Schreibrolle: `assertCanManageDunningTenantStageConfig` (wie Mahnstufen-Konfiguration).
- **`DUNNING_TEMPLATE_PLACEHOLDERS_INVALID`** (400) bei fehlenden Pflichtstrings.
- **`DUNNING_TEMPLATE_NOT_PERSISTABLE`** (503) ohne Postgres / ohne `upsertTemplateBodyInTx`.

## Non-Goals

- Versand, Vorschau-Rendering, HTML-Sanitization, E-Mail-Footer-Stammdaten, `PUT` aller 18 Vorlagen in einem Rutsch (eigenes Inkrement).

## Referenzen

- [`docs/adr/0010-fin4-m4-dunning-email-and-templates.md`](../adr/0010-fin4-m4-dunning-email-and-templates.md) — Abschnitt M4 Slice 2  
- [`docs/contracts/review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md)
