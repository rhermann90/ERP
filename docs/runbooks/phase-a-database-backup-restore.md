# Phase A4 — Datenbank: Backup, Restore, Migrationen

**Gate:** Dokumentierter **Restore** in Staging innerhalb der vereinbarten **RTO/RPO** (Zahlen hier von PL/Betrieb eintragen).

## Backup (Betrieb)

- Tägliche / transaktionslogische Backups gemäß Cloud-Provider oder selbst gehostetes Postgres (`pg_dump` / WAL — **nicht** im Anwendungscontainer persistieren).
- **Geheimnisse:** Backup-Credentials getrennt von `DATABASE_URL` der App.

## Restore-Übung (Staging)

1. Leeres Staging-Schema oder neue Staging-DB anlegen.
2. Letztes **validiertes** Backup einspielen (Provider-spezifisch).
3. `npx prisma migrate deploy` gegen **restore**-Ziel ausführen (nur wenn Schema-Stand nach Restore bekannt; bei „nur Daten“-Restore Schema vorher angleichen).
4. Smoke: `GET /health`, ein Login-Test, **eine** lesende Domänenabfrage mit Tenant-Scope.
5. **Nachweis:** Datum, Executor, Backup-ID, Dauer (Minuten) in Ticket/Confluence verlinken.

### Übungsnachweis — Textvorlage für Ticket / Tracker

*Kopieren und mit echten Werten ausfüllen; **keine** Produktions-`DATABASE_URL` oder Secrets im Klartext.*

```text
Phase-A4 Restore-Übung (Staging)

RTO-Ziel (Minuten): <von PL/Betrieb>
RPO-Ziel: <von PL/Betrieb>
Backup-ID / Quelle: <Provider-Referenz>
Restore-Ziel (Instanz/DB-Name): <Staging>
Executor (Name/Rolle): <…>
Start / Ende (UTC): <…> / <…>
Dauer gesamt (Minuten): <…>

Schritte (ja/nein):
[ ] Leeres Ziel oder frisches Staging-Schema
[ ] Backup eingespielt (Methode: pg_restore / Provider-UI / …)
[ ] npx prisma migrate deploy gegen Restore-Ziel (falls zutreffend)
[ ] Smoke: GET /health, Login, eine lesende tenant-scoped Abfrage
[ ] Keine Produktions-URL in Logs/Ticket

Link zu Monitoring/Alarm-Check (optional): <…>
```

**Surrogat ohne Staging-DB (nur Entwicklung):** Lokale CI-Parität mit Postgres — `DATABASE_URL` und `PERSISTENCE_DB_TEST_URL` setzen, dann `npm run verify:ci:with-migrate` (siehe `package.json`). Das **ersetzt** keine echte Restore-Übung gegen ein Backup; es dient nur als technischer Smoke vor/nach Schema-Änderungen.

### Stand Team / Betrieb (Nachweis)

| Feld | Stand |
|------|--------|
| **Restore-Übung Staging (Phase A4)** | **Ausstehend.** Aus diesem Workspace keine Ausführung gegen euer Staging/Backup möglich (keine `DATABASE_URL` für Staging, kein Cloud-Provider-Zugriff). |
| **Nächster Schritt** | Übung nach **„Übungsnachweis“** oben im Tracker dokumentieren; optional Verweis hier oder in `docs/tickets/FIN-2-START-GATE.md` Bemerkung (Abschnitt 4) ergänzen, sobald erledigt. |
| **RTO/RPO** | Weiterhin von Team/Betrieb in dieses Dokument oder Ticket eintragen. |

**Wie der Agent (oder ein externes Tool) Zugang bekommen könnte — nur falls ihr Automatisierung wollt:** GitHub **Environments** mit Secret `STAGING_DATABASE_URL` (read-only für Smoke) + Workflow, der nur manuell (`workflow_dispatch`) einen Restore-Check ausführt; oder Zugriff auf euren Postgres-Provider über **IAM** / VPN — das ist eine Organisationsentscheidung, nicht Pflicht für die manuelle Übung.

### Staging-Minimalablauf (Postgres-Beispiel — Platzhalter)

**Vorbedingung:** Staging-Instanz, getrennte Credentials, **keine** Produktions-`DATABASE_URL` im Klartext im Ticket.

```bash
# 1) Backup (auf dem Staging-/Jump-Host; Zeitstempel anpassen)
# pg_dump "$DATABASE_URL" -Fc -f erp-staging-$(date +%Y%m%d).dump

# 2) Leere Ziel-DB (einmalig) — nur mit freigegebenem Staging-Admin
# createdb erp_restore_test  # vereinfachtes Beispiel

# 3) Restore (Format je nach Dump)
# pg_restore -d "$RESTORE_URL" --clean --if-exists erp-staging-YYYYMMDD.dump

# 4) Migrationen gegen Restore-Ziel
# DATABASE_URL="$RESTORE_URL" npx prisma migrate deploy

# 5) Smoke (App zeigt auf RESTORE_URL)
# curl -sS "$APP/health"
```

Anpassung an euren Provider (RDS, Cloud SQL, …) ist **Pflicht**; Befehle nicht blind kopieren. **RTO/RPO** und **Executor** im Nachweis eintragen.

## Migrationen

- Nur über **`prisma migrate`** mit PR-Review; keine handeditierten Produktions-Schema-Drifts ohne Migration.
- CI-Nachweis: `.github/workflows/ci.yml` führt `prisma migrate deploy` auf leerer Test-DB aus.

## Monitoring

- Alarm auf Postgres-Ausfall / Replikations-Lag (Betrieb; hier nur Gate-Hinweis).
