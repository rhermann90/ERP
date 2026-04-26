# ERP Web (PWA)

Vite + React + TypeScript + `vite-plugin-pwa`. Die UI koppelt Schreibaktionen ausschließlich an `GET /documents/:id/allowed-actions?entityType=…` (Backend-SoT). Fehler-Envelope: **Passthrough** bei konformem Body; sonst Fallback (`x-request-id` / Client-UUID, Code-Tabelle) gemäß [`docs/contracts/error-codes.json`](../docs/contracts/error-codes.json) und [`docs/contracts/decision-log-phase1-frontend.md`](../docs/contracts/decision-log-phase1-frontend.md) (`src/lib/api-error.ts`).

## Darstellung (vier Modi)

In der Shell: **Darstellung** → **Hell**, **Dunkel (warm)**, **Dunkel (neutral)** oder **System** (Standard). Gespeichert unter `localStorage`-Keys **`erp-theme`** und **`erp-dark-palette-last`** (nur Darstellung, **kein** Bearer-Token). **Alle UI-Links:** [`docs/referenz-ui-ux.md`](../docs/referenz-ui-ux.md). Produkt-UI-Leitfaden: [`docs/ui-ux-style-guide.md`](../docs/ui-ux-style-guide.md). Technik, Tokens und PWA-Hinweise: [`docs/web-theming.md`](../docs/web-theming.md).

## Umgebung

| Variable | Bedeutung |
|----------|-----------|
| `VITE_API_BASE_URL` | Backend-Origin, z. B. `http://localhost:3000` (Default im Code, falls unset) |
| `VITE_REPO_DOCS_BASE` | Optional: GitHub-`blob/main`-URL **ohne** trailing slash — klickbare Links auf der Seite **Finanz (Vorbereitung)** (`#/finanz-vorbereitung`) |
| `VITE_EXPECTED_OPENAPI_CONTRACT_VERSION` | Optional: gleicher Wert wie `docs/api-contract.yaml` `info.version` zum PWA-Release — bei Abweichung zu `x-erp-openapi-contract-version` auf FIN-4-Pfaden nur `console.warn` (siehe [`docs/contracts/FIN4-external-client-integration.md`](../docs/contracts/FIN4-external-client-integration.md)) |

Kopiere `apps/web/.env.example` nach `.env` (nur Vite-Variablen). Backend-Umgebung siehe Repo-Root [`.env.example`](../.env.example).

Die PWA dupliziert **keine** Domänenlogik: Berechtigungen und Status kommen aus dem Backend (`allowedActions`, Fehler-Envelope).

## Ersten Eindruck / Demo starten

- **Memory:** Backend mit `ERP_REPOSITORY=memory` *oder* ohne `DATABASE_URL` (sonst Postgres-Modus, sobald die URL gesetzt ist) + `AUTH_TOKEN_SECRET` starten, dann `npm run dev:web` — keine DB, schneller erster Klick.
- **Postgres:** Wie im [Root-`README.md`](../README.md): DB + Migrationen, dann Backend, dann diese PWA.
- **CI-Postgres (für Entwickler: Persistenz wie in der Pipeline):** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) und [`docs/runbook/ci-and-persistence-tests.md`](../docs/runbook/ci-and-persistence-tests.md).

## Lokal gegen Backend — Reihenfolge **DB → Backend → PWA**

Details zu Postgres, `DATABASE_URL` und Prisma: [Root-`README.md`](../README.md). Kurz:

1. **Datenbank** (wenn du nicht bewusst `ERP_REPOSITORY=memory` nutzt): Postgres starten, `DATABASE_URL` setzen, Migrationen wie im Root-README.
2. **Backend:** **`AUTH_TOKEN_SECRET`** (mind. 32 Zeichen empfohlen), z. B. aus Repo-Root `.env.example`; nur Demo: `ERP_ALLOW_INSECURE_DEV_AUTH=1` (niemals produktiv). Alias-Hinweis: kanonisch nur **`AUTH_TOKEN_SECRET`** (kein `AUTH_SECRET`).
3. Backend starten (Port **3000**) mit CORS für die PWA-Origin, z. B.  
   `CORS_ORIGINS=http://localhost:5173 npm run dev`  
   (oder alles über Root-`.env`).
4. Dev-Token (Repo-Root, gleiches Secret wie Backend): `npm run dev:token` — optional `npm run dev:token -- <tenantUuid> <ROLE>` (`ADMIN` \| `VERTRIEB_BAULEITUNG` \| `GESCHAEFTSFUEHRUNG` \| `BUCHHALTUNG` \| `VIEWER`).
5. **PWA:** Repo-Root `npm run dev:web` oder hier `npm run dev`.
6. In der UI: Token und **X-Tenant-Id** (muss zum Token passen, sonst `TENANT_SCOPE_VIOLATION`), Session-Modus, „Session anwenden“, „Allowed Actions laden“.

**API-Basis / Fehler:** `VITE_API_BASE_URL` zeigt nur auf die öffentliche HTTP-API; aktuell existiert `GET /health` — ein späteres separates **Ready**-Signal wäre reines Backend-Thema, die Shell behandelt weiterhin Verbindungsfehler wie normale Fetch-/CORS-Fälle ohne eigene Domänenheuristik.

**Rechnungsexport (SoT):** Kanonische `actionId` ist **`EXPORT_INVOICE`** (`EXPORT_INVOICE_XRECHNUNG` nicht verwenden); `POST /exports` nutzt für Rechnungen fest **`format: XRECHNUNG`** — siehe `docs/contracts/action-contracts.json`.

**Rechnung buchen FIN-2 (SoT):** In der **Haupt-Shell** (`#/`) nur, wenn **`BOOK_INVOICE`** in `GET /documents/{invoiceId}/allowed-actions?entityType=INVOICE` steht (Status **ENTWURF**, Rollen ADMIN / GESCHAEFTSFUEHRUNG / BUCHHALTUNG); Ausführung über `executeActionWithSotGuard` → `POST /invoices/{invoiceId}/book` mit **`reason`** (mind. 5 Zeichen), optional **`issueDate`** (`yyyy-mm-dd`). Siehe `docs/contracts/action-contracts.json`.

**Zahlungseingang FIN-3 (SoT):** In **Finanz (Vorbereitung)** nur, wenn **`RECORD_PAYMENT_INTAKE`** in den geladenen `allowedActions` steht (nach „GET Rechnung“); Aufruf `POST /finance/payments/intake` mit Header **`Idempotency-Key`** (UUID).

**Zahlungseingänge lesen:** `GET /invoices/{invoiceId}/payment-intakes` — gleiche Leserolle wie Rechnung; Antwortliste **ohne** Idempotency-Key (wird mit „GET Rechnung“ in der Finanz-Vorbereitung mitgeladen).

**Mahn-Ereignisse lesen (FIN-4):** `GET /invoices/{invoiceId}/dunning-reminders` — gleiche Leserolle; typischerweise leere Liste, bis Mahnläufe persistiert werden. ADR **Kern:** `docs/adr/0009-fin4-mahnwesen-slice.md`; **M4** (Vorlagen, Footer, E-Mail): `docs/adr/0010-fin4-m4-dunning-email-and-templates.md`.

Seed-IDs für Schnelltests siehe `src/composition/seed.ts` im Backend (`offerVersionId`, `lvVersionId`, `measurementVersionId`, …).

## Build / Preview

```bash
npm run build    # in apps/web
npm run preview  # statischer Build inkl. Service Worker
npm run test     # Frontend-Unit-Tests (SoT, Session, Envelope, Text-Rendering)
```

## Security-Entscheidungen

- **Token-Storage gehärtet:** Default ist `memory-only` (kein persistentes Token).
- **Persistenz nur Opt-in:** optional `sessionStorage` (Tab-Lebensdauer) nach expliziter Auswahl in der UI; Warnhinweis sichtbar.
- **Kein localStorage für Bearer-Token.**
- **Tenant-Isolation bei Wechsel:** tenant-gebundene UI-Keys werden bereinigt; persistierte Session wird verworfen.
- **SoT-Gate:** Ausführung kritischer Aktionen läuft über Guard (`executeActionWithSotGuard`) und verweigert Aktionen außerhalb der geladenen `allowedActions`.
- **XSS-Risikoreduktion:** kein `dangerouslySetInnerHTML`; Textfelder werden als Plain Text gerendert.

## Offline / PWA

- **In Scope:** App-Shell und statische Assets werden per Workbox precached; Installation als PWA möglich.
- **Nicht in Scope:** Keine Offline-Buchung, kein Schreib-Queue — Geschäftsvorgänge erfordern weiterhin das Backend (kein GO für „Offline-Buchung“).
- **§8.14 (v1.3) / Roadmap:** Für **FIN-4** (Mahnwesen, §8.10) und **FIN-6** (Härtung u.a. §8.14, §12, §15) bleibt vorgesehen: **keine** Offline-**Schreib**pfade für **Zahlung** oder **Mahnung** in der PWA — weiterhin nur serverseitige Buchungslogik nach Backend-GO und Contracts.
- **Kein Produktionsanspruch ohne Release-GO:** Vollständige Betriebs- und Persistenzreife (inkl. Audit-DB, GoBD) ist nicht durch diese Shell allein abgedeckt — siehe Root-README, ADRs und Tickets.

## MVP Finanz (v1.3) — Frontend-Stand (Ist)

Gelesen: [`docs/ENTWICKLUNGSPHASEN-MVP-V1.3.md`](../docs/ENTWICKLUNGSPHASEN-MVP-V1.3.md), [`docs/tickets/FIN-2-START-GATE.md`](../docs/tickets/FIN-2-START-GATE.md). **Koordination / Gates:** [`docs/contracts/qa-fin-0-gate-readiness.md`](../docs/contracts/qa-fin-0-gate-readiness.md), [`docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md`](../docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md).

**Haupt-Shell (`#/`):** Dokument-ID + `entityType`, dann **„Allowed Actions laden“**. Schreibaktionen nur, wenn die gewählte `actionId` in der zuletzt geladenen Liste steht — Ausführung über **`executeActionWithSotGuard`** (u. a. **BOOK_INVOICE** → Buchung, **EXPORT_INVOICE**, Angebots-/Aufmass-/LV-Aktionen). Keine parallele „versteckte“ Buchung ohne SoT.

**Finanz (Vorbereitung) (`#/finanz-vorbereitung`):** Transparenz-Links (ADR 0007, 0008, **0009**, FIN-2-Gate, OpenAPI-Mapping, Stub-Testmatrix, MVP-Phasen, PL-Snapshot). **Lesend:** Zahlungsbedingungen je Projekt, Rechnungsentwurf, `GET` Rechnung inkl. **Zahlungseingänge** und **Mahn-Ereignisse** (FIN-4 Stub-Liste). **Schreibend:** Zahlungseingang nur mit SoT **`RECORD_PAYMENT_INTAKE`** + `Idempotency-Key`. **API-Client / Fehler:** Envelope wie oben (`api-error.ts`, `error-codes.json`, Decision-Log). **UI (Ist):** Kurze Feature-Matrix, nummerierte Schritte mit SoT-abhängigen Button-Zuständen, Skonto (`skontoBps`) im Entwurf und in der Rechnungsübersicht (nach **GET Rechnung** wird das Skonto-Feld mit dem Serverwert synchronisiert; bei **ENTWURF** optional **Skonto mit POST /invoices neu berechnen** mit derselben LV-/Angebots-Version), Roh-JSON unter einklappbaren Details, Zahlung/Mahnung in eigenen Panels mit lokaler Fehlerzeile. Release-Notiz: [`docs/tickets/RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md`](../docs/tickets/RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md).

**Finanz — Deep-Link und Mandant OFF:** Haupt-Tabs per Query `#/finanz-vorbereitung?tab=rechnung|grundeinstellungen|mahnwesen|fortgeschritten`; Alias `#/finanz-grundeinstellungen` öffnet direkt den Tab „Grundeinstellungen Mahnlauf“. Tab-Wechsel in der UI synchronisiert die Hash-URL (`apps/web/src/lib/hash-route.ts`). Wenn die Mandanten-Automation **`runMode=OFF`** ist, deaktiviert die PWA **Mahnlauf-Batch** (Dry-Run und EXECUTE) sowie **Batch-E-Mail** (Slice 5c, Dry-Run und EXECUTE); **GET Kandidaten** bleibt nutzbar (**Variante 1a**). HTTP **1b:** `POST /finance/dunning-reminder-run` und `POST …/send-emails` liefern bei OFF **409** `DUNNING_REMINDER_RUN_DISABLED`.

**Abgrenzung:** Demo- und Integrations-Slices — **kein** Produktions-Go ohne separates Release, Compliance-Checkliste und erfüllte Gates ([`FIN-2-START-GATE.md`](../docs/tickets/FIN-2-START-GATE.md), [`compliance-rechnung-finanz.md`](../Checklisten/compliance-rechnung-finanz.md)). Vollständiger **8.4(2–6)**-Motor, Mahnläufe/E-Mail (**FIN-4** M4) und **FIN-6** folgen der Phasendokumentation. Offline-**Schreib**pfade für Zahlung/Mahnung: weiterhin ausgeschlossen (Abschnitt **Offline / PWA**).

**Ticket-Kommentar (Vorlage):** „Frontend apps/web: Schreibpfade nur mit Backend-SoT (`GET …/allowed-actions` bzw. explizite SoT-Prüfung in Finanz-Vorbereitung); keine zusätzliche Domänenlogik im Client. Bei neuen Backend-Codes: `error-codes.json` ↔ `api-error.ts` synchron halten. `npm run test -w apps/web` + `npm run build:web` grün.“

**Ticket an Backend — reproduzierbarer FIN-/Export-Fehler für erste Stichprobe (Vorlage):** „Bitte für **Dev/Staging** einen **reproduzierbaren** FIN- oder Export-Fehler bereitstellen: HTTP-Methode + Pfad, Umgebung/Branch, kurze Schritte (Request nur mit **Platzhaltern** — keine echten Tokens, Secrets, PII). Erwartung: Response-Body mit Envelope-Feldern `code`, `message`, `correlationId`, `retryable`, `blocking`, optional `details`; optional Header `x-request-id`. Frontend hängt danach **eine** anonymisierte Stichprobe gemäß Block ‚Stichprobe — Vorlage‘ an PR/Ticket (keine erfundenen Bodies).“

**Sobald das Backend reale FIN-/Export-Fehler-JSONs liefert:** **Eine** anonymisierte Stichprobe pro PR/Ticket (kein neuer Schreibpfad ohne `allowedActions`). Keine produktiven Secrets/PII.

**Stichprobe — Vorlage (ins Ticket/PR kopieren, Werte anonymisieren):**

```text
FIN-/Export-Fehler — Stichprobe (1×)
- Endpoint + Methode: <z. B. POST /exports>
- HTTP-Status: <z. B. 422>
- Body (Passthrough): code=<…>, message=<kurz>, correlationId=<gesetzt|fehlt>, retryable=<bool|fehlt>, blocking=<bool|fehlt>, details=<ja|nein>
- Response-Header: x-request-id=<gesetzt|fehlt> (nur relevant, wenn correlationId im Body fehlt)
- Erwartung Frontend: Passthrough bei konformem Body; sonst Fallback gem. error-codes.json / api-error.ts
- allowedActions: unverändert SoT für Schreibaktionen in der Shell; Finanz-Route nur nach Freigabe erweitern
```

**Neue `domainErrorCodes`:** Zuerst [`docs/contracts/error-codes.json`](../docs/contracts/error-codes.json) im Repo ergänzen (`classes` inkl. `retryable`/`blocking`/`httpStatus` wie Backend). `src/lib/api-error.ts` liest die Tabelle aus dieser Datei — **keine Drift** zwischen Contract und Fallback. Nur wenn Backend einen Code laut `backendEnvelope.retryableDerivation` o. Ä. ausweist, der **noch nicht** in `classes` steht: vorübergehend `buildCodeTable()` in `api-error.ts` ergänzen **und** Ticket an PL/Backend für vollständige Eintragung in `error-codes.json`. Unbekannte Codes ohne Tabellenzeile: weiterhin konservatives Fallback (`retryable: false`, `blocking: true`, außer bekannte Spezialfälle).

**Ticket-Kommentar „kein weiterer UI-Change“ (Vorlage):** „Frontend apps/web: kein UI-Change ohne PL/Contract-Abgleich; neue Schreibflächen nur mit SoT. Shell: `allowedActions` + Guard; Finanz-Route: nur dokumentierte FIN-Slices. Envelope-Logik unverändert; bei neuen Backend-Codes siehe Sync `error-codes.json` ↔ `api-error.ts`. `npm run test -w apps/web` + `npm run build:web` grün. FIN-/Export-Stichprobe: **ausstehend** bis Backend reproduzierbaren Fehler-JSON liefert (siehe Vorlage ‚Ticket an Backend‘).“

**Vor jedem Push/PR:** `npm run test -w apps/web && npm run build:web`

## Technikwahl

- **Vite:** schnelles Dev-Erlebnis, klare ESM-Pipeline, PWA-Plugin verbreitet und gut unterstützt.
- **React:** komponentenbasierte Shell und Formulare für aktionsgebundene Modals ohne Template-Overhead.

## Wartung / Contracts

`ENTITY_TYPES` und Action-Mapping in `src/lib/action-executor.ts` müssen mit `docs/api-contract.yaml` / `action-contracts.json` mitwandern. Optional später: JSON-Import der Contracts oder OpenAPI-Codegen zur Drift-Vermeidung.
