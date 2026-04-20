# Phase A6 — Netzwerk- und Rand-Sicherheit

**Gate:** Security-Checkliste abgehakt; Prod ohne offene Flanke „API naked on Internet“.

## Produktion

- [ ] **TLS** am Ingress / Load-Balancer terminieren; Backend kann HTTP intern sprechen — **kein** Klartext-Port 3000 öffentlich.
- [ ] **Firewall / Security-Group:** Nur Ingress → App-Port; Datenbank **nicht** öffentlich erreichbar.
- [ ] **Listen-Host:** Umgebungsvariable **`ERP_HTTP_HOST`** (Default `0.0.0.0`) — in Containern üblich; für **lokalen Dev** im öffentlichen WLAN ggf. **`127.0.0.1`**. Äußerer Zugriff nur über kontrollierte Published Ports / Firewall.
- [ ] **Docker:** API-Container nicht mit **`127.0.0.1`** binden, wenn der Host den Port mappen soll — siehe Kopfkommentar [`docker-compose.yml`](../../docker-compose.yml).
- [ ] **`CORS_ORIGINS`** explizit gesetzt (siehe A3-Runbook).

## Anwendungsschicht (bereits im Code — bei Änderungen erneut prüfen)

- Rate-Limits **`POST /auth/login`** und Passwort-Reset-Endpunkte (`src/api/auth-login-routes.ts`, `src/api/password-reset-routes.ts`) — Schwellen dokumentieren, wenn sich Traffic-Profil ändert.
- Security-Header (`X-Content-Type-Options`, `X-Frame-Options`, …) via `registerPwaHttpHooks`.

## Später

- **CSRF** — relevant, falls von Bearer auf Cookie-Sessions gewechselt wird; bis dahin dokumentiert offen lassen.
