# Phase A5 — Observability und Incident-Drill

**Gate:** Beispiel-Incident von Alarm bis Root-Cause **durchspielbar** (Protokoll).

## Korrelation

- **Pro Request** vergibt Fastify eine **`request.id`** (`genReqId` in `src/api/app.ts`): gültiger eingehender Header **`x-request-id`** (begrenzte Länge, erlaubte Zeichen) wird übernommen, sonst neue UUID.
- Jede Antwort enthält den Header **`x-correlation-id`** = `request.id` (`onSend` in `src/http/pwa-http-layer.ts`); JSON-Fehler-Envelopes nutzen dieselbe ID im Feld **`correlationId`** (`src/api/http-response.ts`). CORS: **`Access-Control-Expose-Headers`** für Browser-Lesbarkeit bei konfigurierter Origin.
- PWA: `apps/web/src/lib/api-error.ts` — Body bleibt führend; Header ergänzen die Kette.
- Backend-Logs serialisieren Requests **ohne** `Authorization` / Cookies (`buildFastifyLoggerOptions` in `src/http/pwa-http-layer.ts`).

## Log-Policy (verifizieren)

- [ ] In Staging absichtlich 4xx/5xx auslösen und prüfen: Logs enthalten **keine** Bearer-Tokens und **keine** Klartext-Passwörter.
- [ ] Passwort-Reset-Mail-Inhalte nicht in App-Logs (nur „versendet“ / Fehlercode).

## Alarme (Betrieb)

- Schwellen für **5xx-Rate** und Latenz am Ingress definieren (Platzhalter bis Monitoring-Stack steht).
- Postgres-Alarm siehe `phase-a-database-backup-restore.md`.

## Incident-Drill (Template)

| Schritt | Inhalt | Erledigt (Datum) |
|---------|--------|------------------|
| 1 | Symptom + `correlationId` aus UI/API gesammelt | |
| 2 | Logs/APM mit gleicher ID gefunden | |
| 3 | Root Cause (Konfiguration, Migration, Bug, Fremdsystem) | |
| 4 | Fix / Rollback / Kommunikation | |
| 5 | Post-Mortem-Lerneintrag (Ticket-Link) | |
