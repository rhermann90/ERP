# QA Defects – PWA-Increment (Rework-Zyklus)

**Stand:** 2026-04-14 (Update: SEC-01 geschlossen)  
**Gate-Status:** Für Integrationsstand keine offenen P0-Defects. Production-/ERP-Gate bleibt außerhalb dieses Defect-Sets abhängig von **DATA-01 / ADR-0003**.

## Aktive Defects (Release-relevant)

| ID | Severity | Kurzbeschreibung | Reproduktion / Nachweis | Betroffene Regel / Quelle | Risiko | Status |
| --- | --- | --- | --- | --- | --- | --- |
| — | — | *(kein offener P0-Signing-Secret-Defect)* | — | — | — | — |

## Geschlossen / erfüllt in diesem Zyklus (Kurz)

| ID / Thema | Nachweis |
| --- | --- |
| **PWA-SOT-P0-INV-EXPORT** (geschlossen, vorher implizite SoT-Drift-Relevanz) | Kanonische `actionId` **EXPORT_INVOICE** für `entityType=INVOICE` in `getAllowedActions` deckungsgleich mit `assertCanExport` / `POST /exports`; kein Phantom `EXPORT_INVOICE_XRECHNUNG` in SoT. **Tests:** `test/app.test.ts` L337–371. **Fix-Nachweis:** Code `src/services/authorization-service.ts` (Kommentar + Rollenmatrix); kein Git-Commit/PR im Workspace verfügbar — bei nächstem Push Commit-Hash nachtragen. |
| **PWA-SEC-P0-001** (geschlossen) | Kein `DEFAULT_SECRET` mehr; `assertAuthTokenSecretConfiguredAtStartup` in `src/index.ts`; `getAuthTokenSecret()` mit Test-Fallback nur bei `NODE_ENV=test`, Demo nur `ERP_ALLOW_INSECURE_DEV_AUTH=1` (Warnung); `test/auth-token-secret.test.ts`; Repo-`.env.example`; `scripts/print-dev-token.ts` bricht ohne Secret ab. |
| **PWA-QA-P1-003** (erfüllt) | Canonical Secret-Name `AUTH_TOKEN_SECRET` konsistent in Code/Tests; `AUTH_SECRET` nur Alias-Hinweis in QA-Kontext. |
| Kein Bearer in `localStorage` per Default | `apps/web/src/lib/tenant-session.test.ts` |
| SoT-Gating vor Schreib-API | `apps/web/src/lib/action-executor.test.ts` |
| Tenant-keyed doc prefs + Clear bei Wechsel | `tenant-session.test.ts`; `App.tsx` |
| CORS / Security-Header / 400-Envelope | `test/pwa-http.test.ts` |

## Beobachtungen / P1 (nicht gate-blockierend, transparent)

| ID | Severity | Beschreibung | Risiko | Empfehlung |
| --- | --- | --- | --- | --- |
| PWA-QA-P1-001 | P1 | Kein automatisierter Test für **abgelaufenes** Token (`UNAUTHORIZED` + Envelope). | Operativ | `it(...)` in `test/app.test.ts` ergänzen. |
| PWA-QA-P1-002 | P1 | Lighthouse 13 ohne PWA-Kategorie im Standardlauf. | Operativ | Checkliste / alternatives Tooling. |

## P1-Statusklassifikation

| ID | Status |
| --- | --- |
| PWA-QA-P1-001 | bewusst offen |
| PWA-QA-P1-002 | bewusst offen |
| PWA-QA-P1-003 | erfüllt |

## Nächste Schritte (nicht mehr PWA-SEC-P0-001)

1. **Persistenz / GoBD:** ADR-0003 umsetzen oder Release explizit als Demo-Umgebung begrenzen.  
2. **PWA-QA-P1-001:** abgelaufenes Token testen.  
3. **Agent 4:** Re-Review mit Fokus **DATA-01** und ggf. langfristig **httpOnly-Session** statt Bearer im Browser.

## Rework an Agent 4 (Senior Reviewer)

- Re-Entscheidung nach diesem Fix: **SEC-01 geschlossen**; **DATA-01** (Persistenz) bleibt ggf. Release-blockierend.  
- Prüfen, dass keine Phantom-`actionId`s in Contracts existieren (bei Review mitziehen).
