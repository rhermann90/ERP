# Runbook — Mahnlauf-Automatisierung (Cron, M4 Slice 5b-2)

## Zweck

Optionaler **Hintergrund-Tick** für Mandanten mit persistiertem Modus **`AUTO`** (`dunning_tenant_automation.run_mode`). Pro Mandant und Mahnstufe 1–9 werden — falls Kandidaten existieren — Mahnzeilen wie bei `POST /finance/dunning-reminder-run` mit **`EXECUTE`** gebucht. **Kein** Batch-E-Mail-Versand (Slice **5a** bleibt einzeln).

## Voraussetzungen

1. **Postgres** (`DATABASE_URL`) — der Endpunkt wird nur registriert, wenn Prisma aktiv ist.
2. Umgebungsvariable **`ERP_INTERNAL_DUNNING_CRON_SECRET`** (nicht leer, geheim halten).
3. Mandant hat **`PATCH /finance/dunning-reminder-automation`** auf **`AUTO`** gesetzt (und ggf. `job_hour_utc` 0–23 oder `null`).

## HTTP

- **Methode:** `POST`
- **Pfad:** `/internal/cron/dunning-automation`
- **Header:** `X-Internal-Cron-Secret: <gleicher Wert wie ERP_INTERNAL_DUNNING_CRON_SECRET>`
- **Auth:** kein Bearer — nur das Geheimnis (interner Betrieb).
- **Antwort 200:** `{ data: { asOfDate, hourUtc, tenantsScanned, tenantsProcessed, stageRunsWithCandidates, stageRunsExecuted, errors[] } }`
- **401:** falsches oder fehlendes Geheimnis (`UNAUTHORIZED`).

## `job_hour_utc`

- **`null`:** der Tick verarbeitet den Mandanten bei **jedem** Aufruf (sofern `AUTO`).
- **0–23:** der Mandant wird nur verarbeitet, wenn die **aktuelle UTC-Stunde** mit `job_hour_utc` übereinstimmt.

## Idempotenz pro Cron-Lauf

Pro (`tenantId`, `stageOrdinal`, `asOfDate`) wird eine **stabile UUID** aus einem Hash-Seed abgeleitet und als `Idempotency-Key` für `EXECUTE` verwendet — wiederholter Aufruf am selben Kalendertag liefert **REPLAY** statt Doppelbuchung.

## Beispiel (curl)

```bash
export ERP_INTERNAL_DUNNING_CRON_SECRET='…'   # wie auf dem Server
curl -sS -X POST "http://localhost:3000/internal/cron/dunning-automation" \
  -H "X-Internal-Cron-Secret: $ERP_INTERNAL_DUNNING_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

In **Kubernetes** / **systemd timer**: denselben Aufruf planen (z. B. stündlich); ohne gesetztes Secret ist die Route **nicht** registriert (Defense in Depth).

## Siehe auch

- ADR: [`docs/adr/0010-fin4-m4-dunning-email-and-templates.md`](../adr/0010-fin4-m4-dunning-email-and-templates.md)
- Ticket: [`docs/tickets/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](../tickets/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md)
