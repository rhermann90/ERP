# UAT — Übergabe Staging an Tester (Handoff)

**Zweck:** Vor manuellen Nutzer-Tests (UAT) stellt das Team eine **produktionsnahe Staging-Umgebung** bereit und bestätigt Minimal-Smoke. Dieses Dokument ergänzt [`phase-a-staging-prod-env-checklist.md`](./phase-a-staging-prod-env-checklist.md) um eine **prüfbare Übergabeliste** für Nicht-Entwickler.

**Verwandte Artefakte:**

- Ausfüllvorlage Zugänge/IDs: [`uat-one-pager-template.md`](./uat-one-pager-template.md)
- Manuelle Klickpfade: [`uat-manual-test-script.md`](./uat-manual-test-script.md)
- Testprotokoll / Evidenz: [`uat-evidence-protocol.md`](./uat-evidence-protocol.md)

## Voraussetzungen (Team erledigt vor Übergabe)

Die folgenden Punkte sind konsistent mit Root-[`README.md`](../../README.md) und [`phase-a-staging-prod-env-checklist.md`](./phase-a-staging-prod-env-checklist.md).

| # | Check | Erwartung |
|---|--------|-----------|
| 1 | `DATABASE_URL` gesetzt; Migrationen | Auf Ziel-DB `npx prisma migrate deploy` ausgeführt; keine ausstehenden Drifts für den deployierten Commit |
| 2 | API gebaut/gestartet mit Postgres | Kein reiner `ERP_REPOSITORY=memory`, wenn Persistence wie Produktiv getestet werden soll |
| 3 | Secrets | `AUTH_TOKEN_SECRET` ≥32 Zeichen; **kein** `ERP_ALLOW_INSECURE_DEV_AUTH=1` in Staging |
| 4 | CORS + PWA | `CORS_ORIGINS` enthält die **exakte** Origin der gebauten PWA; PWA mit `VITE_API_BASE_URL` auf die **öffentliche API** gebaut ([`apps/web/README.md`](../../apps/web/README.md)) |
| 5 | Auth | Entweder Seed-Nutzer mit dokumentierten [`ERP_SEED_*`](../authentication-login.md)-Passwörtern **oder** echte User/Migration — siehe [`uat-one-pager-template.md`](./uat-one-pager-template.md) |
| 6 | Optional E-Mail | Nur wenn Passwort-Reset oder Mahn-E-Mail getestet werden: SMTP und `ERP_PUBLIC_APP_BASE_URL` wie in phase-a-Checkliste |

## Smoke unmittelbar nach Deploy (Team oder gemeinsam mit UAT)

| Schritt | Aktion | OK wenn |
|---------|--------|---------|
| A | `GET {API}/health` | HTTP 200 |
| B | `GET {API}/ready` | HTTP **200** und `checks.database: ok` (Postgres-Betrieb) |
| C | PWA im Browser öffnen (HTTPS); Login mit **Staging-Zugang** aus dem Ein-Pager | Session aktiv; keine CORS-Fehler in der Konsole |

Bei **503** auf `/ready`: keinen „Live“-Traffic für UAT freigeben — Datenbank oder Routing klären ([`README.md`](../../README.md)).

## Übergabe an Tester

1. [`uat-one-pager-template.md`](./uat-one-pager-template.md) ausfüllen (URL, Mandanten-ID, Rollen, Referenz-UUIDs für den Mandanten).
2. Datum und Verantwortliche für Handoff dokumentieren (im ausgefüllten Ein-Pager oder Ticket).
3. Tester starten mit [`uat-manual-test-script.md`](./uat-manual-test-script.md) und [`uat-evidence-protocol.md`](./uat-evidence-protocol.md).

**Gate §15 / RC:** Technischer Nachweis für Release-Kandidaten bleibt bei [`qa-fin-mvp-gate-15-abnahme.md`](../contracts/qa-fin-mvp-gate-15-abnahme.md) — UAT ergänzt das fachliche manuelle Verhalten, ersetzt aber keine CI-Kommandos.
