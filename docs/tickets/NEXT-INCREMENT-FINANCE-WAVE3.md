# Nächstes Inkrement — Finanz Welle 3

**Stand (2026-04-27):** **FIN-4 Konfig** vollständig (Slices 3–8): `GET|PUT /finance/dunning-reminder-config`, `PATCH|DELETE …/stages/{stageOrdinal}`, Soft-Delete, Audit+Tx — siehe [`WAVE3-FIN4-PHASE3-DUNNING-CONFIG-READ-2026-04-22.md`](./WAVE3-FIN4-PHASE3-DUNNING-CONFIG-READ-2026-04-22.md); Mahn-`POST` (Pfad B), B2-1a, Stubs/Matrix historisch darunter. PWA: Hash-Kanon + Quick-Nav laut [`FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md`](./FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md) im Umsetzungs-Backlog **erledigt**; optionaler Tab-Umzug „Grundeinstellungen“ bleibt separates UX-Slice nach PL.

## PL-Entscheid — gewählter Strang (Release)

**Gewählt: Pfad A — 8.4 „B2-1“ (eine Teilregel)**  
Default laut Teamplan, weil **8.4**-Schuld ohne SoT-/Status-Umbau reduziert wird. **Umgesetzt in dieser Welle:** **B2-1a** — optionaler **Skonto**-Aliquot in Basispunkten (`skontoBps`) auf LV-Netto nach **8.4(1)** vor USt (**8.4(7–8)** unverändert); Persistenz `invoices.skonto_bps`, API `POST /invoices` + `GET /invoices/{id}`; Domäne `skontoNetReductionCents84_2` / `netCentsAfterStep84_6Mvp` in [`src/domain/invoice-calculation.ts`](../../src/domain/invoice-calculation.ts); ADR-0007 aktualisiert.

**Zurückgestellt (explizit): Pfad C — Zwischenstatus GEPRUEFT / FREIGEGEBEN**  
Nur mit **eigenem ADR/PL-Gate** und Anpassung von `allowedInvoiceActionsByStatus`, `BOOK_INVOICE` und allen Rechnungsflüssen — **nicht** gemischt mit B2-1a in derselben Lieferung.

## PL-Gate — nächster Strang (Koordination)

**Stand 2026-04-26:** FIN-1 M1-DoD ist im Repo per Persistenztest und [`MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) (Teil 7) nachgezogen; **Default für die nächste Umsetzung** bleibt **Option A**. **M4 Cron/AUTO (ehem. 5b-2)** ist **entfernt** (2026-04-25); SEMI-Kontext [ADR-0011](../adr/0011-fin4-semi-dunning-context.md). **PWA-IA / OFF-1a (UI):** umgesetzt — Deep-Link `#/finanz-vorbereitung?tab=…`, Alias `#/finanz-grundeinstellungen`, Tab-Sync; bei Mandant **OFF** blockiert die PWA nur **Dry-Run**/**EXECUTE**; **GET Kandidaten** bleibt; HTTP-API: **1b** umgesetzt — `POST /finance/dunning-reminder-run` fail-closed bei **OFF** (409 `DUNNING_REMINDER_RUN_DISABLED`); PWA OFF-1a ergänzt strukturierte Server-Fehleranzeige. Code: `apps/web/src/lib/hash-route.ts`, `App.tsx`, `FinancePreparation.tsx`, `FinanceDunningGrundeinstellungenPanel.tsx`, `FinanceStructuredApiError.tsx`. **Nächster Umsetzungsschritt:** weiter **Option A** — M4-Rest nach PL (u. a. **Massen-E-Mail**); optional **skontoBps**-UI; **API 1b** (409 bei `runMode` **OFF** für `POST …/dunning-reminder-run`) **umgesetzt** — siehe [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md); keine parallele Option **B/C** ohne Gate.

Die **nächste planbare Umsetzung** bleibt an **Projektleitung** bzw. **Code-Review-Rückmeldung** gebunden ([`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) §0, [`AGENTS.md`](../../AGENTS.md)).

| Option | Inhalt |
|--------|--------|
| **A (Team-Default)** | **M4 weiter:** Mini-Slices Richtung §8.10 (E-Mail-Impressum/Footer-Stammdaten, dann Mahnlauf/Vorschau/Versand). |
| **B** | **8.4(2–6)**-Motor — nur nach explizitem PL-Gate. |
| **C** | **Pfad C** Rechnungs-Zwischenstatus — nur mit eigenem ADR/Gate. |
| **D** | **Audit-/GoBD-Querschnitt** — [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md). |

Ohne abweichende PL-Entscheidung gilt **Option A** als Default für die nächste Umsetzung.

### PL-Gate — M4 Slice 5b (Orchestrierung)

**Historisch 2026-04-24 (obsolet):** Der folgende Absatz beschrieb noch **5b-2**-Cron und **AUTO** als optional umgesetzt — **superseded 2026-04-25:** Cron und Modus **AUTO** sind **entfernt**; SEMI-Kontext und Fälligkeit siehe [ADR-0011](../adr/0011-fin4-semi-dunning-context.md); Runbook [`docs/runbooks/dunning-automation-cron.md`](../runbooks/dunning-automation-cron.md).

**Stand 2026-04-26+:** Tabelle **PL-Gate** im Ticket [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](./M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md); [ADR 0010 — Slice 5b](../adr/0010-fin4-m4-dunning-email-and-templates.md): **5b-0** und **5b-1** umgesetzt; **`GET|PATCH /finance/dunning-reminder-automation`** (nur **OFF**/**SEMI**). PWA Finanz-Vorbereitung: **Batch-Vorschau/Ausführung**, **Automation-PATCH**, **Deep-Link/Alias-Route**, **OFF-1a** (siehe Abschnitt „PL-Gate — nächster Strang“). **Nächster Schritt:** M4-Rest und UX nur nach PL (u. a. Massen-E-Mail); **API 1b** (409 bei OFF für `POST …/dunning-reminder-run`) **erledigt** — **kein** Parallelstart zu Option **B** (8.4(2–6)) oder **C** (Zwischenstatus) ohne explizites PL.

## Non-Goals (diese Welle)

- Vollständiger **8.4(2–6)**-Motor (weitere Nachlassarten, Einbehalt, konfigurierbare Regelketten).
- **FIN-4 Richtung M4** — Kern-Konfig, Vorlagen, E-Mail, Mahnlauf **5b** und Mandanten-Automation sind umgesetzt; verbleibendes **Massen-E-Mail** / UX-Umzug nur nach PL; **nicht** mit B2-1a oder Pfad C in einem Strang verheiraten.
- Änderung der **Audit-fail-hard**-Semantik ohne PL-Eintrag zu [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md).
- **B5** formelles Mahn-PDF: kein Implementierungs-PR ohne PL gemäß **Implementierungs-Gate** in [`B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](./B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md).
- PWA: **kein Pflicht-UI** für `skontoBps` für alle Mandanten; **optionales** Demo-UI ist als kleines Release dokumentiert — [`RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md`](./RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md). **P1 Wave 3:** [`P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md`](./P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md) — P1-1a/P1-2-Wave-3-Pflichtscope und P1-4-Protokoll **Doku-Stand 2026-04-26**; P1-3 laufend + [`P1-3-DOCS-MILESTONE-WAVE3.md`](./P1-3-DOCS-MILESTONE-WAVE3.md).

## PR-Schnitt (G8 / §5b)

- **PR 1 (empfohlen):** Phase 1 — Tests + QA-Matrix + Mockup-Hinweis (FIN-4 POST Härtung).
- **PR 2:** Pfad A — Schema/Migration + Domäne + Service + OpenAPI + Stubs/Persistenz-Assertions.
- Contract-PRs: `docs/api-contract.yaml`, `error-codes.json` nur bei neuen Codes (Skonto ohne neuen Code; Mahnlauf **1b**: `DUNNING_REMINDER_RUN_DISABLED`).

## Phase 3 — FIN-4 Konfig (Slices 3–8) + M4 Einstieg

**Umgesetzt:** `GET /finance/dunning-reminder-config` mit MVP-Fallback **oder** 9 aktive DB-Zeilen (`TENANT_DATABASE`); **`PUT`** volle Ersetzung; **`PATCH`/`DELETE`** je Stufe (Soft-Delete); **Audit** in derselben Transaktion wie Schreiben (Postgres). OpenAPI/Test-Matrix: **FIN-4-Kern** — [ADR 0009](../adr/0009-fin4-mahnwesen-slice.md); **M4** Vorlagen/Footer/E-Mail — [ADR 0010](../adr/0010-fin4-m4-dunning-email-and-templates.md). Persistenz-Suite: [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts). Ticket-Historie: [`WAVE3-FIN4-PHASE3-DUNNING-CONFIG-READ-2026-04-22.md`](./WAVE3-FIN4-PHASE3-DUNNING-CONFIG-READ-2026-04-22.md).

**M4 Slice 1 (erledigt):** [`M4-MINI-SLICE-1-VORLAGEN-READ-2026-04-23.md`](./M4-MINI-SLICE-1-VORLAGEN-READ-2026-04-23.md) — `GET /finance/dunning-reminder-templates`. **M4 Slice 2 (erledigt):** [`M4-MINI-SLICE-2-PLACEHOLDERS-PATCH-2026-04-23.md`](./M4-MINI-SLICE-2-PLACEHOLDERS-PATCH-2026-04-23.md) — `PATCH …/templates/stages/{ordinal}/channels/{channel}` mit §8.10-Pflichtplatzhaltern + Audit in DB-Tx. **M4 Slice 3 (erledigt):** [`M4-MINI-SLICE-3-EMAIL-FOOTER-2026-04-23.md`](./M4-MINI-SLICE-3-EMAIL-FOOTER-2026-04-23.md) — `GET|PATCH /finance/dunning-email-footer` (§8.10 Stammdaten, Audit in DB-Tx). **M4 Slice 4 (erledigt):** [`M4-MINI-SLICE-4-EMAIL-PREVIEW-SEND-STUB-2026-04-24.md`](./M4-MINI-SLICE-4-EMAIL-PREVIEW-SEND-STUB-2026-04-24.md) — `POST …/dunning-reminders/email-preview` + `POST …/send-email-stub` (kein SMTP; Audit `DUNNING_EMAIL_SEND_STUB`). **M4 Slice 5a (erledigt):** [`M4-MINI-SLICE-5-REAL-SMTP-2026-04-24.md`](./M4-MINI-SLICE-5-REAL-SMTP-2026-04-24.md) — `POST …/dunning-reminders/send-email` mit `Idempotency-Key`, explizitem `toEmail`, SMTP (`ERP_SMTP_*`), Idempotenz-Tabelle `dunning_email_sends`, Audit `DUNNING_EMAIL_SENT`; Stub bleibt parallel. **M4 Slice 5b-0 (erledigt):** `GET /finance/dunning-reminder-candidates` — Ticket [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](./M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md); Antwort inkl. `eligibilityContext` und `stageDeadlineIso` (ADR-0011 B3). **M4 Slice 5b-1 (erledigt):** `POST /finance/dunning-reminder-run` (`DRY_RUN` / `EXECUTE`, Idempotenz, Persistenz `dunning_reminder_run_intents`) — ADR-0010 / OpenAPI / Stubs + optional Persistenz-Integrationstest; `DRY_RUN.planned[]` inkl. `stageDeadlineIso`. ~~**M4 Slice 5b-2** (Cron/AUTO)~~ **entfernt** (2026-04-25) — ADR-0011. **PWA IA (2026-04-26):** Hash-Routing, Tab-Sync, Alias `#/finanz-grundeinstellungen`, OFF-1a-Batch-UI — **erledigt** (siehe Zeilen „PL-Gate — nächster Strang“). **Nächster Meilenstein:** weiter **Option A** — M4-Verbleib / PL-gesteuertes UX (u. a. Massen-E-Mail); optional `skontoBps`-UI oder API-**1b** nach PL — **kein** Mix mit 8.4 B2-1 oder Pfad C.

## Team-Checkliste nach Umsetzung M4 Slice 5b-1 (Prozess)

1. **Änderungen committen und per PR einreichen**, CI auf dem Branch prüfen lassen (wie im Team üblich).
2. **Lokal mit echter Test-DB:** `npm run verify:ci:local-db` oder `PERSISTENCE_DB_TEST_URL` + `npm test` / `verify:ci:with-migrate` laut [`docs/runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md) — ohne diese URL werden Postgres-Integrationstests bewusst übersprungen.
3. **Nächster Plan-Schritt laut Roadmap:** PWA-IA/OFF-1a **erledigt** (2026-04-26); weiter **Prozess (Merge)** und PL-gesteuerte M4-Resterweiterungen (siehe Abschnitt „PL-Gate — nächster Strang“). ~~5b-2-Cron~~ entfernt (2026-04-25); kein Hintergrund-Mahnlauf mehr im Produktcode.

**Erinnerung:** Offen ist vor allem **Prozess (Merge)** und **Produktziel (UI / optionaler Cron-Betrieb / Massen-E-Mail nur nach PL)** — nicht zwingend noch eine Lücke in **5b-1** selbst, sobald Code-Review und CI grün sind.

## Stakeholder- / Release-Notizen (kleine PWA-Slices)

- **Skonto am Rechnungsentwurf (optional, Demo):** [`RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md`](./RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md) — Changelog-Niveau für PL/Stakeholder ohne OpenAPI-Diff.
- **Nachgelagerte P1-Priorisierung:** [`P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md`](./P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md).

## Referenzen

- Vorwelle: [`NEXT-INCREMENT-FINANCE-WAVE2.md`](./NEXT-INCREMENT-FINANCE-WAVE2.md)  
- Review: [`docs/contracts/review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md), [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) §5b  
- Audit-Querschnitt: [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) (Abschnitt **Querschnitt Finanz Welle 3**)
