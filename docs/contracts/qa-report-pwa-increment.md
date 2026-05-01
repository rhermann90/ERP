# QA Report – PWA-Increment (formaler Integrationsabschluss)

**Datum:** 2026-04-14  
**Commit:** nicht ermittelbar (Workspace ohne Git am Prüfpfad; Evidenz: lokaler Lauf unter `/Users/romanhermann/Projekte/ERP`).

## Phase-Ziel

Verifizieren, dass NO_GO-Blocker aus **Security** (signing secret / unsicherer Default-Start), **Persistenz** (kein stiller Bearer in `localStorage`) und **Frontend-SoT** (`allowedActions`-Gating, Mandantenwechsel) für eine PWA-Releaseentscheidung geschlossen sind — im Einklang mit `docs/ERP-Systembeschreibung.md` und Multi-Agent-Core-Rules (Mandantentrennung, keine Domänenvereinfachung).

## Ausführung (Evidenz)

| Prüfung | Befehl / Aktion | Ergebnis |
| --- | --- | --- |
| API-Regression (Backend-Root) | `npm test` | **71/71** grün (`test/app.test.ts`, `test/pwa-http.test.ts`, `test/auth-token-secret.test.ts`) |
| Typecheck Backend | `npm run typecheck` | grün |
| Web-Build | `npm run build:web` | grün (PWA: `dist/sw.js`, `manifest.webmanifest`, Precache) |
| Frontend-Tests | `npm test -w apps/web` | **9/9** grün (`tenant-session`, `action-executor` SoT-Guard, `api-error`, `DocumentTextPanels`) |

## Testauftrag – Abgleich

| # | Anforderung | Ergebnis |
| --- | --- | --- |
| 1 | Backend: fehlendes Signing-Secret → erwartetes Fail (kein stiller unsicherer Start) | **Erfüllt:** `getAuthTokenSecret()` ohne Secret/`NODE_ENV=test` nur Test-Fallback; Dev ohne Secret → Throw; `index.ts` ruft `assertAuthTokenSecretConfiguredAtStartup()` auf → `process.exit(1)`; Demo nur `ERP_ALLOW_INSECURE_DEV_AUTH=1` (Warnung). Tests: `test/auth-token-secret.test.ts`. **PWA-SEC-P0-001 geschlossen.** |
| 2 | Envelope / Security / CORS Regression | **Erfüllt:** `test/pwa-http.test.ts` (400-Envelope, Security-Header, CORS, OPTIONS). |
| 3 | Frontend: kein persistenter Bearer in `localStorage` per Default | **Erfüllt:** Memory-first, optional `sessionStorage`; Tests in `tenant-session.test.ts`. |
| 4 | `allowedActions`-Gating testbar wirksam | **Erfüllt:** `executeActionWithSotGuard` in `action-executor.test.ts`. |
| 5 | Tenant-Wechsel isoliert dokumentbezogene Zustände | **Erfüllt:** `App.tsx` leert Session/SoT-Caches und ruft `clearDocumentScopedKeys(prevTenant)` auf; Primitiv getestet. |
| 6 | E2E-Stichprobe 400/403/409 inkl. Envelope | **Erfüllt:** siehe Tabelle in `qa-pwa-increment.md` (inject-basiert, kein Playwright). |
| 7 | Auflage: **Invoice-Export** — `allowedActions` spiegelt `POST /exports` (`EXPORT_INVOICE`) | **Erfüllt:** `test/app.test.ts` — `P0 invoice export SoT EXPORT_INVOICE matches POST /exports for BUCHHALTUNG` (201 nach SoT); `P0 invoice export ohne SoT-Aktion: VIEWER erhält kein EXPORT_INVOICE; POST /exports 403`. Matrix: **PWA-P0-13**. |

## Contract-Drift (Stichprobe)

Unverändert konsistent mit den ausgeführten Tests; siehe vorheriger Report-Abschnitt und `docs/contracts/error-codes.json`.

## Quality Gate A — Phase Integration / Dev-Abnahme

| Kriterium | Erfüllt |
| --- | --- |
| Alle **P0**-Zeilen in `qa-pwa-increment.md` | **Ja** (inkl. PWA-P0-09 SEC-01, **PWA-P0-13** Invoice-Export SoT) |
| `typecheck` / `test` / `build` Backend + Web | Ja |
| Keine offenen **P0**-Security-Blocker *Signier-Geheimnis / stiller Default* | **Ja** |

**Gate-Wort (Gate A): GO**

Definition: Integrationsstand API + PWA-Basis + SEC-01 (Signing-Secret-Fail-Closed) ist abgenommen.

## Quality Gate B — Produktions-ERP / GoBD-Dauerhaftigkeit

**Gate-Wort (Gate B): OUT_OF_SCOPE (gleichbedeutend mit NO_GO für Production, solange unverändert)**

Definition: Produktionsfreigabe mit dauerhaft auditierbarer Persistenz und GoBD-konformer Historisierung.

- `docs/adr/0003-persistence-spike.md` steht weiter auf `Proposed`.
- Laufzeit nutzt weiter In-Memory-Repositories (`src/index.ts` weist explizit auf Integrationsstand hin).

**Einschätzung:** Übergabe an Agent 4 ist für Integrationsstand möglich (Gate A = GO). Produktions-ERP bleibt bis DATA-01/ADR-0003 bewusst außerhalb des Gates.

## Result

Der Integrationsstand ist formal freigegeben: **SEC-01 geschlossen**, Mandantentrennung, SoT-Gating, Envelope/CORS und PWA-Basis sind belegt. Für Produktions-ERP bleibt Persistenz/GoBD separat offen.

## Rationale

- **Fail-closed** für Tokens bleibt zur Laufzeit implementiert (Signatur, Tenant-Mismatch, Rollen).  
- **Fail-closed für Betrieb:** ohne konfiguriertes Secret startet der Prozess nicht; kein stiller Repo-Default mehr.

## Risiken

- **Legal / Compliance:** Gate A ohne offene P0; Gate B bleibt ohne persistente Audit-Historie (DATA-01) nicht releasefähig.  
- **Datenkonsistenz:** Tenant-seitig geschützt; keine offenen P0-Drifts im Integrationsumfang.  
- **Wartbarkeit:** Canonical-Name `AUTH_TOKEN_SECRET` und Startup-Assert sind umgesetzt; P1-Restpunkte dokumentiert.  
- **PWA-Readiness:** PWA-Basis ist integrationsreif (Build/SW/Manifest/CORS/Envelope grün).

## Offene Fragen

1. Soll DATA-01/ADR-0003 als eigenes Production-Gate-Ticket mit terminierter Umsetzung priorisiert werden?  
2. Soll P1-001 (abgelaufenes Token + Envelope) vor Senior-Review noch in denselben Sprint gezogen werden?

## Impact (Pflicht)

| Dimension | Kurz |
| --- | --- |
| Legal / Compliance | Gate A: SEC-01 geschlossen; Gate B: GoBD-Dauerhaftigkeit weiter offen (DATA-01 / ADR-0003). |
| Datenkonsistenz | Integrationspfade für Mandant/SoT/Envelope sind grün. |
| Wartbarkeit | Secret-Bootstrap ist fail-closed; Rest als P1 dokumentiert. |
| PWA-Readiness | Integrations-/Dev-Abnahme: GO. Produktions-ERP: separater Entscheid nach Persistenzpfad. |
