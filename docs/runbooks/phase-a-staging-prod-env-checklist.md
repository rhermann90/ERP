# Phase A3 — Staging / Produktion: Umgebungs-Checkliste

**Gate:** Deploy aus **frischem** Clone nur mit dokumentierten Variablen reproduzierbar (siehe auch Root-`.env.example`).

## Release-Kandidat — Software-Evidenz (vor Erst-Deploy / vor Traffic)

Auf dem **deployierten Commit** (oder dem PR davor) die Pflichtkette aus [`docs/contracts/qa-fin-mvp-gate-15-abnahme.md`](../contracts/qa-fin-mvp-gate-15-abnahme.md) dokumentieren (lokal oder CI). Für Merge auf `main`: Jobs **`backend`** und **`e2e-smoke`** grün — [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md).

**Reihenfolge zum Produktiv-Schema:** Build/Install mit `npm install` / `prisma generate`, dann auf der Ziel-DB **`npx prisma migrate deploy`** (siehe Root-[`README.md`](../../README.md) „Mandanten-Produktivsystem“).

## Vor dem ersten Deploy

- [ ] **`NODE_ENV=production`**
- [ ] **`DATABASE_URL`** — Postgres inkl. Schema; Credentials aus Secret-Store, nicht im Git.
- [ ] **`AUTH_TOKEN_SECRET`** — kryptographisch stark, **mindestens 32 Zeichen**; Rotation per Runbook geplant.
- [ ] **`ERP_ALLOW_INSECURE_DEV_AUTH`** — **nicht** gesetzt (bzw. nicht `1`) in Staging/Prod.
- [ ] **`CORS_ORIGINS`** — kommagetrennte **exakte** Origins der PWA (kein `*` mit Credentials).
- [ ] **`ERP_HTTP_PORT`** — nur relevant hinter Reverse-Proxy; öffentlich nur **443/TLS** am Ingress.
- [ ] **`ERP_HTTP_HOST`** — in Kubernetes/Docker oft `0.0.0.0` (alle Interfaces); absichern über **NetworkPolicy** / Security-Group, nicht durch exponierte DB-Ports.
- [ ] **Passwort-Reset (falls genutzt):** `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`/`SMTP_PASS` (falls Provider nötig), `ERP_MAIL_FROM`, **`ERP_PUBLIC_APP_BASE_URL`** (ohne trailing slash).
- [ ] Optional: **`ERP_DEPLOYMENT=integration`** — erzwingt Postgres-Modus laut `src/config/repository-mode.ts` (nur wenn fachlich gewünscht).

## Smoke nach Deploy

- [ ] `GET /health` → 200.
- [ ] `GET /ready` → **200** mit `checks.database: ok` im Postgres-Betrieb (bei **503** keinen produktiven Traffic schalten — Root-[`README.md`](../../README.md)).
- [ ] Login- und geschützte Routen mit gültigem Bearer + `X-Tenant-Id` (falls genutzt) wie in `docs/authentication-login.md`.
- [ ] Keine Bearer- oder Klartext-Passwörter in zentralen Logs (Stichprobe).

## Referenzen

- `docs/authentication-login.md`
- [`docs/contracts/qa-fin-mvp-gate-15-abnahme.md`](../contracts/qa-fin-mvp-gate-15-abnahme.md) — Gate §15 / RC-Kommandos
- Root-[`README.md`](../../README.md) — Mandanten-Produktivsystem (Persistenz, `/ready`, Qualität vor Release)
- `docker-compose.yml` (nur **Entwicklung**, nicht 1:1 für Prod übernehmen)
