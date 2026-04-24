# Phase A7 — Kritische Pfade: Test-Matrix (Repo-Stand)

**Gate:** Kein Merge geschäftskritischer **Schreib**pfade ohne bestehenden oder neuen **Persistenz-/Integrationstest** (wo Postgres vorgesehen).

| Bereich | Risiko | Automatisierte Abdeckung (Stichwort) | Datei / Suite |
|---------|--------|----------------------------------------|----------------|
| Mandant / Token / Bootstrap | Token-Leak, falsches Secret | AUTH_TOKEN_SECRET, Fail-Closed | `test/auth-token-secret.test.ts` |
| Login | Brute-Force, Rate-Limit | POST `/auth/login` | `test/auth-login.test.ts` |
| Passwort-Reset | Missbrauch, Rate-Limit | Memory-Routen | `test/password-reset-routes.test.ts` |
| User-Admin | Privilege Escalation | Memory-Routen | `test/user-account-routes.test.ts` |
| Domäne Angebot / LV / Aufmass / Tenant | Traceability, Status | Breite API-Szenarien | `test/app.test.ts` |
| Postgres Persistenz | Tenant-Leck, FK, Audit | `buildApp({ repositoryMode: "postgres" })`; u. a. Negativ **LV-Strukturknoten** fremder `tenant_id` → FK `P2003` | `test/persistence.integration.test.ts` (**erfordert** `PERSISTENCE_DB_TEST_URL`, in CI gesetzt) |
| Repository-Modus | Prod ohne DB | Fail-closed Policy | `test/repository-mode.test.ts` |
| PWA / CORS / Header | XSS, CORS-Missbrauch | Hooks + Fehler-Envelope; **`x-correlation-id`** = Body `correlationId` | `test/pwa-http.test.ts` |
| HTTP Listen (A3/A6) | Unerwünschte LAN-Exposition | `ERP_HTTP_HOST` / Default | `test/http-listen.test.ts` |
| FIN-0 Stubs | Phantom-Codes | Contract-Tests | `test/finance-fin0-stubs.test.ts` |
| Web Client Fehler | correlationId | Unit | `apps/web/src/lib/api-error.test.ts` |

## Lücken / manuelle Ergänzung

- **E-Mail-Versand in Prod:** SMTP-Integrationstest bewusst nicht im Repo (externe Infrastruktur) — Staging-Smoke laut A3.
- Weitere P0-Detailmatrizen: `docs/contracts/qa-p0-*.md`.

**Merge-Regel:** Neue Postgres-Schreibpfade → mindestens ein Assert in `persistence.integration.test.ts` oder dedizierte Suite mit gleicher CI-Voraussetzung.
