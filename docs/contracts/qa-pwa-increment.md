# QA Matrix – PWA-Increment (Shell + API-Basis)

**Fachliche Referenz:** `ERP Systembeschreibung v1.2.md` (Mandantentrennung, Nachvollziehbarkeit, keine Offline-Schreibsimulation ohne Backend-GO).

**Zweck:** Nachweis für PWA-relevante Schicht (Browser-App, CORS, Security-Header, Service Worker, Manifest) und Regression der kritischen Backend-Pfade, die die PWA konsumiert.

| ID | Bereich | Given / When / Then (kurz) | Evidenz (`it("...")` / Artefakt) | Status |
| --- | --- | --- | --- | --- |
| PWA-P0-01 | Mandant / API | Token-Tenant ≠ Header-Tenant → 403 `TENANT_SCOPE_VIOLATION` | `test/app.test.ts` — `rejects tenant scope mismatch against token (negative)` | PASS |
| PWA-P0-02 | AuthN | Ungültige Signatur → 401 | `test/app.test.ts` — `rejects invalid token signature (negative)` | PASS |
| PWA-P0-03 | SoT vs API | Rolle ohne Berechtigung → 403 `AUTH_ROLE_FORBIDDEN` (Stichprobe Export / Version) | `test/app.test.ts` — mehrere `AUTH_ROLE_FORBIDDEN`-Fälle | PASS |
| PWA-P0-04 | Envelope (400) | Zod/Body-Validation → `VALIDATION_FAILED` inkl. `correlationId`, `retryable`, `blocking` | `test/pwa-http.test.ts` — `Fehler-Envelope bleibt Passthrough-kompatibel (Zod)` | PASS |
| PWA-P0-05 | PWA HTTP-Basis | CORS erlaubte Origin (5173), Security-Header, OPTIONS204 | `test/pwa-http.test.ts` — CORS/Security/OPTIONS | PASS |
| PWA-P0-06 | Health | `GET /health` ohne Auth, tenant-neutral | `test/pwa-http.test.ts` — `GET /health ist 200...` | PASS |
| PWA-P0-07 | Build / SW | `vite build` erzeugt `dist/sw.js`, Workbox-Precache inkl. `index.html` | Build-Log; `apps/web/dist/sw.js` (precache + NavigationRoute) | PASS |
| PWA-P0-08 | Manifest | Web App Manifest mit `display: standalone`, `start_url`, Icons | `apps/web/dist/manifest.webmanifest` | PASS |
| PWA-P0-09 | Backend Bootstrap / Signing-Secret | Ohne `AUTH_TOKEN_SECRET` kein Start (`index.ts` + `getAuthTokenSecret`); kein stiller Repo-Default; optional nur `ERP_ALLOW_INSECURE_DEV_AUTH=1` (non-prod, mit Warnung); Vitest: `NODE_ENV=test` → fester Test-Fallback | `test/auth-token-secret.test.ts`; `src/auth/token-auth.ts`; `src/index.ts` (`assertAuthTokenSecretConfiguredAtStartup`) | PASS |
| PWA-P0-10 | Frontend Persistenz | Kein Bearer in `localStorage` per Default; optional nur `sessionStorage` nach explizitem Pfad | `apps/web/src/lib/tenant-session.ts`; `apps/web/src/lib/tenant-session.test.ts` | PASS |
| PWA-P0-11 | Frontend SoT-Gating | Aktion außerhalb `allowedActions` wird clientseitig geblockt, kein API-Call | `apps/web/src/lib/action-executor.test.ts` — `executeActionWithSotGuard` | PASS |
| PWA-P0-12 | Tenant-Wechsel / UI-State | Bei Tenant-Wechsel: Session geleert, tenant-keyed `localStorage`-Keys des alten Mandanten entfernt, SoT-Cache invalidiert | `apps/web/src/App.tsx` (`useEffect` auf `tenantId`); Primitiv: `tenant-session.test.ts` — `clears persisted session and tenant-scoped UI keys` | PASS (Primitiv + Code-Review; kein Playwright) |
| PWA-P0-13 | Invoice-Export SoT ↔ `POST /exports` | `GET .../allowed-actions?entityType=INVOICE` listet kanonisch `EXPORT_INVOICE` (kein Phantom `EXPORT_INVOICE_*`); gleiche Rolle: `POST /exports` **201** wenn SoT enthält, **403** wenn nicht | `test/app.test.ts` L337–353 — `P0 invoice export SoT EXPORT_INVOICE matches POST /exports for BUCHHALTUNG`; L355–371 — `P0 invoice export ohne SoT-Aktion: VIEWER erhält kein EXPORT_INVOICE; POST /exports 403` | PASS |

**End-to-End-Stichprobe (API-inject, kritische Statuscodes + Envelope):**

| Status | Pfad | `it("...")` | Envelope |
| --- | --- | --- | --- |
| 400 | Zod-Body | `test/pwa-http.test.ts` — `Fehler-Envelope bleibt Passthrough-kompatibel (Zod)` | `code`, `message`, `correlationId`, `retryable`, `blocking` |
| 403 | SoT/API | `test/app.test.ts` — `P0: SoT omits OFFER_CREATE_SUPPLEMENT for VIEWER and BUCHHALTUNG after ANGENOMMEN; POST supplements forbidden` | u. a. `correlationId`, `blocking` |
| 409 | Domäne | `test/app.test.ts` — `blocks POST /offers/version when current version is ABGELEHNT (v1.2, SoT + API)` | `correlationId`, `blocking` |
| 201 | Rechnungsexport | `test/app.test.ts` — `P0 invoice export SoT EXPORT_INVOICE matches POST /exports for BUCHHALTUNG` | Response-Body Export (kein Fehler-Envelope) |

**Bewusste Offline-Grenzen (laut `apps/web/vite.config.ts`):**

- Nur App-Shell + statische Assets im Precache; **keine** API-Responses und **keine** Offline-Schreibsimulation.
- Runtime-Caching für API ist leer (`runtimeCaching: []`); ohne Netzwerk schlagen fachliche Calls fehl (fail-closed aus Sicht der UI, sobald sie den Fehler anzeigt).

**Contract-Stichprobe (kein Vollabgleich):**

- `docs/contracts/error-codes.json` — `backendEnvelope` und `domainErrorCodesEmitted` decken die in Tests abgedeckten Codes ab (`TENANT_SCOPE_VIOLATION`, `AUTH_ROLE_FORBIDDEN`, `VALIDATION_FAILED`, `UNAUTHORIZED`, …).
- `handleError` in `src/api/app.ts` liefert die dokumentierten Pflichtfelder.

## P1-Status (transparent)

| ID | Status | Begründung |
| --- | --- | --- |
| PWA-QA-P1-001 | **bewusst offen** | Expliziter Test für abgelaufenes Token (`UNAUTHORIZED` inkl. vollständigem Envelope) fehlt weiterhin. |
| PWA-QA-P1-002 | **bewusst offen** | Lighthouse 13 ohne dedizierte PWA-Kategorie im Standardlauf; aktuell Manifest/SW-Checks + Build-Evidenz. |
| PWA-QA-P1-003 | **erfüllt** | Canonical Secret-Name ist `AUTH_TOKEN_SECRET`; Env-Dokumentation und Secret-Bootstrap harmonisiert. |
| DATA-01 / ADR-0003 | **verschoben (außer Scope dieses Integrations-Gates)** | Persistenz-/GoBD-Dauerhaftigkeit ist laut ADR 0003 weiterhin `Proposed` und nicht Bestandteil des PWA-Integrationsabschlusses. |

**Hinweis Lighthouse:** Lighthouse 13 liefert in diesem Lauf keine dedizierte „PWA“-Kategorie mehr; stattdessen wurden Performance/Accessibility/Best-Practices/SEO aus `http://127.0.0.1:4173/` nach `vite preview` gemessen. Installierbarkeit und SW wurden zusätzlich an Manifest- und `sw.js`-Inhalt verifiziert (siehe Report).
