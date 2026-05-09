# UAT — Manuelles Testskript (PWA)

**Ziel:** Wiederholbare Klickpfade für **Nicht-Entwickler** auf Staging, parallel zum automatisierten Smoke ([`e2e/login-finance-smoke.spec.ts`](../../e2e/login-finance-smoke.spec.ts)). Vor jedem Lauf: ausgefüllter [`uat-one-pager-template.md`](./uat-one-pager-template.md).

**Nicht verwenden:** CI-spezifische Zugänge wie `e2e-ops@example.com` aus Playwright — nur die **vom Team genannten** Staging-Konten.

## Gemeinsame Vorbereitung

1. Browser (aktueller Chrome/Edge/Firefox), bei Bedarf privates Fenster.
2. Ein-Pager bereitlegen: PWA-URL, `tenantId`, E-Mail/Passwort je Rolle.
3. Hash-Routen (ohne React Router): siehe [`apps/web/src/lib/hash-route.ts`](../../apps/web/src/lib/hash-route.ts).

## Session 1 — Infrastruktur und Login

| Schritt | Aktion | Erwartung |
|---------|--------|-----------|
| 1.1 | *(Team oder Tester mit curl/Browser)* `GET {API}/health` | 200 |
| 1.2 | `GET {API}/ready` | 200, `checks.database: ok` |
| 1.3 | PWA öffnen → `#/login` | Login-Formular sichtbar |
| 1.4 | Anmelden mit Mandanten-ID + Admin aus Ein-Pager | Weiterleitung weg von `#/login`; Session aktiv |
| 1.5 | Abmelden (falls vorhanden) oder privates Fenster; Login als **Viewer** (falls bereitgestellt) | Vergleich: sichtbare Menüs/Aktionen können eingeschränkt sein ([`ui-role-mapping-v1-3.md`](../contracts/ui-role-mapping-v1-3.md)) |

## Session 2 — Pilot: Geschäftsprozess und LV

| Schritt | Aktion | Erwartung |
|---------|--------|-----------|
| 2.1 | Nach Login: `#/geschaeftsprozess` | [`GeschaeftsprozessWizard`](../../apps/web/src/components/geschaeftsprozess/GeschaeftsprozessWizard.tsx) lädt ohne harte Fehler |
| 2.2 | Geführten Flow durchklicken (LV → Angebot → Rechnungsentwurf), soweit Rolle erlaubt | Konsistent mit Pilot-Charter ([`PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md`](../tickets/PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md)) |
| 2.3 | `#/lv-bearbeiten` | LV-Lesepfad / Sprung zur Shell wie implementiert ([`LvBearbeitenPage`](../../apps/web/src/components/lv-workbench/LvBearbeitenPage.tsx)) |

## Session 3 — Finanz-Vorbereitung

| Schritt | Aktion | Erwartung |
|---------|--------|-----------|
| 3.1 | `#/finanz-vorbereitung` | Haupttabs erreichbar ([`resolveFinancePrepInitialMainTab`](../../apps/web/src/lib/hash-route.ts)) |
| 3.2 | Tab „Rechnung“ / „Grundeinstellungen“ / „Mahnwesen“ / „Fortgeschritten“ nacheinander öffnen | Kein durchgehender leerer Screen ohne Fehlermeldung |
| 3.3 | `#/finanz-grundeinstellungen` | Tab „Grundeinstellungen“ entspricht kanonischem Hash |

## Session 4 — Haupt-Shell (Schnellzugriff, Dokumenttypen)

Nach Login Standardroute mit **Schnellzugriff** / Dokument-Panel ([`App.tsx`](../../apps/web/src/App.tsx)):

| Schritt | Aktion | Erwartung |
|---------|--------|-----------|
| 4.1 | Entity **LV_VERSION**, ID aus Ein-Pager (Seed: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001`) → Detail laden | Detailbereich sichtbar (`lv-shell-detail` / Inhalt mit Strukturhinweis) |
| 4.2 | Entity **OFFER_VERSION**, ID `33333333-3333-4333-8333-333333333333` | Offer-Shell-Inhalt |
| 4.3 | Entity **INVOICE**, ID `44444444-4444-4444-8444-444444444444` | Invoice read-only Shell |
| 4.4 | Optional: **INVOICE** ENTWURF `57575757-5757-4575-8575-575757575757` | FIN-5 Pflicht-Hinweis-Kontext |
| 4.5 | Optional: **MEASUREMENT_VERSION** `cccccccc-cccc-4ccc-8ccc-cccccccc0001`, **SUPPLEMENT_VERSION** `91919191-9191-4191-8191-919191919191` | Entsprechende Panels |

Wo Buttons „GET“ / „Fetch“ für Diagnose existieren: nach Klick JSON-Antwort prüfen (HTTP-Fehler → [`uat-evidence-protocol.md`](./uat-evidence-protocol.md)).

## Session 5 — Randfälle

| Schritt | Aktion | Erwartung |
|---------|--------|-----------|
| 5.1 | Ungültige Dokument-ID eingeben und laden | Verständliche Fehlermeldung, keine weiße Seite |
| 5.2 | Tab schließen / neu öffnen; Session persistiert oder erneuter Login gemäß Konfiguration | |
| 5.3 | `#/password-reset` nur wenn SMTP laut Ein-Pager aktiv | |

## Referenz

- Demo-UUIDs zentral: [`apps/web/src/lib/demo-seed-ids.ts`](../../apps/web/src/lib/demo-seed-ids.ts)
- Erlaubte Aktionen vs. UI: [`docs/contracts/ui-action-executor-coverage.md`](../contracts/ui-action-executor-coverage.md)
