# Nächstes Inkrement — Finanz Welle 3

**Stand (2026-05-04):** **FIN-4 Konfig** vollständig (Slices 3–8): `GET|PUT /finance/dunning-reminder-config`, `PATCH|DELETE …/stages/{stageOrdinal}`, Soft-Delete, Audit+Tx — siehe [`WAVE3-FIN4-PHASE3-DUNNING-CONFIG-READ-2026-04-22.md`](./WAVE3-FIN4-PHASE3-DUNNING-CONFIG-READ-2026-04-22.md); Mahn-`POST` (Pfad B), B2-1a, Stubs/Matrix historisch darunter. PWA: Hash-Kanon + Quick-Nav laut [`FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md`](./FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md) im Umsetzungs-Backlog **erledigt**; optionaler Tab-Umzug „Grundeinstellungen“ bleibt separates UX-Slice nach Team-Priorität. **Spur A — Shell Lesen:** Haupt-Shell **INVOICE** um **`GET /exports`** (Liste) und **`GET /exports/{exportRunId}`** (Detail) für Export-Preflight-Protokoll ergänzt (`export_runs` in Postgres); siehe [`docs/CODEMAPS/overview.md`](../CODEMAPS/overview.md).

## Gewählter Strang (Release)

**Gewählt: Pfad A — 8.4 „B2-1“ (eine Teilregel)**  
Default im Repo, weil **8.4**-Schuld ohne SoT-/Status-Umbau reduziert wird. **Umgesetzt in dieser Welle:** **B2-1a** — optionaler **Skonto**-Aliquot in Basispunkten (`skontoBps`) auf LV-Netto nach **8.4(1)** vor USt (**8.4(7–8)** unverändert); Persistenz `invoices.skonto_bps`, API `POST /invoices` + `GET /invoices/{id}`; Domäne `skontoNetReductionCents84_2` / `netCentsAfterStep84_6Mvp` in [`src/domain/invoice-calculation.ts`](../../src/domain/invoice-calculation.ts); ADR-0007 aktualisiert.

**Zurückgestellt (explizit): Pfad C — Zwischenstatus GEPRUEFT / FREIGEGEBEN**  
Nur mit **eigenem ADR und dokumentiertem Architektur-Gate** und Anpassung von `allowedInvoiceActionsByStatus`, `BOOK_INVOICE` und allen Rechnungsflüssen — **nicht** gemischt mit B2-1a in derselben Lieferung.

## Nächster Strang (Priorität im Team)

**Stand 2026-04-26:** FIN-1 M1-DoD ist im Repo per Persistenztest und [`MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) (Teil 7) nachgezogen; **Default für die nächste Umsetzung** bleibt **Option A**. **M4 Cron/AUTO (ehem. 5b-2)** ist **entfernt** (2026-04-25); SEMI-Kontext [ADR-0011](../adr/0011-fin4-semi-dunning-context.md). **PWA-IA / OFF-1a (UI):** umgesetzt — Deep-Link `#/finanz-vorbereitung?tab=…`, Alias `#/finanz-grundeinstellungen`, Tab-Sync; bei Mandant **OFF** blockiert die PWA nur **Dry-Run**/**EXECUTE**; **GET Kandidaten** bleibt; HTTP-API: **1b** umgesetzt — `POST /finance/dunning-reminder-run` fail-closed bei **OFF** (409 `DUNNING_REMINDER_RUN_DISABLED`); PWA OFF-1a ergänzt strukturierte Server-Fehleranzeige. Code: `apps/web/src/lib/hash-route.ts`, `App.tsx`, `FinancePreparation.tsx`, `FinanceDunningGrundeinstellungenPanel.tsx`, `FinanceStructuredApiError.tsx`. **Nächster Umsetzungsschritt:** weiter **Option A** — nach **Team-Priorität** (kleine M4-/PWA-Follow-ups, optional Shell-read-only-`GET`, siehe [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md) Paket-Tabelle); **Massen-E-Mail 5c** ist **im Repo umgesetzt** (Spec [`M4-BATCH-DUNNING-EMAIL-SPEC.md`](./M4-BATCH-DUNNING-EMAIL-SPEC.md)); **skontoBps**-PWA optional nach [`RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md`](./RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md). **API 1b** (409 bei `runMode` **OFF** für `POST …/dunning-reminder-run`) **umgesetzt** — siehe [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md); keine parallele Option **B/C** ohne dokumentiertes Gate.

Die **nächste planbare Umsetzung** orientiert sich an dieser Datei, an offenen Tickets und an **Code-Review-Rückmeldung** ([`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md), [`AGENTS.md`](../../AGENTS.md)) — ohne separates externes Priorisierungsgremium.

**Repo-Doku Spur-Wahl (Stand 2026-05-01):** Welche Spur (**A–E**) für den nächsten größeren Implementierungs-PR gilt, steht unter [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md) im Abschnitt **„Nächste Produktspur (Teamwahl)“** inkl. **Startbereit**-Checkliste — derzeit **A** (Option A / M4-Rest), mit [`roadmap-fertige-app.md`](../plans/roadmap-fertige-app.md) Phase B abgestimmt.

| Option | Inhalt |
|--------|--------|
| **A (Repo-Default)** | **M4 weiter:** Mini-Slices Richtung §8.10 (E-Mail-Impressum/Footer-Stammdaten, dann Mahnlauf/Vorschau/Versand). |
| **B** | **8.4(2–6)**-Motor — nur nach explizitem Architektur-Gate / ADR. |
| **C** | **Pfad C** Rechnungs-Zwischenstatus — nur mit eigenem ADR/Gate. |
| **D** | **Audit-/GoBD-Querschnitt** — [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md). |

**Hinweis (Lesen):** **Option A–D** in dieser Tabelle sind **Wellen-Alternativen** nur für dieses Ticket — **nicht** identisch mit **Spur A–E** in [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md). Konkret: **Option B** hier = **8.4(2–6)**-Motor; **Spur B** dort = **FIN-5** (Steuern / §8.16 laut MVP Teil 3).

Ohne abweichende Team-Entscheidung gilt **Option A** als Default für die nächste Umsetzung.

### M4 Slice 5b (Orchestrierung)

**Historisch 2026-04-24 (obsolet):** Der folgende Absatz beschrieb noch **5b-2**-Cron und **AUTO** als optional umgesetzt — **superseded 2026-04-25:** Cron und Modus **AUTO** sind **entfernt**; SEMI-Kontext und Fälligkeit siehe [ADR-0011](../adr/0011-fin4-semi-dunning-context.md); Runbook [`docs/runbooks/dunning-automation-cron.md`](../runbooks/dunning-automation-cron.md).

**Stand 2026-04-26+:** Koordinations-Tabelle im Ticket [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](./M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md); [ADR 0010 — Slice 5b](../adr/0010-fin4-m4-dunning-email-and-templates.md): **5b-0** und **5b-1** umgesetzt; **`GET|PATCH /finance/dunning-reminder-automation`** (nur **OFF**/**SEMI**). PWA Finanz-Vorbereitung: **Batch-Vorschau/Ausführung**, **Automation-PATCH**, **Deep-Link/Alias-Route**, **OFF-1a** (siehe Abschnitt „Nächster Strang“). **Nächster Schritt:** optional kleine **M4-/PWA-Rest** oder **Shell-GET**/E2E nach Priorität (**5c** technisch erledigt — Mandanten-Produktiv-Go separat, siehe [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](../runbooks/m4-slice-5c-pl-mandanten-go.md)); **API 1b** (409 bei OFF für `POST …/dunning-reminder-run`) **erledigt** — **kein** Parallelstart zu Option **B** (8.4(2–6)) oder **C** (Zwischenstatus) ohne dokumentiertes Gate. Strategisch nächster MVP-Meilenstein: **FIN-5** ([`MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Teil 3) — in [`nächste-schritte.md`](../plans/nächste-schritte.md) als **Spur B** (nicht **Option B** in der Tabelle oben: das ist der 8.4-Tiefenmotor), sobald **§8.16 vs. Fail-Closed** geklärt ist.

## Non-Goals (diese Welle)

- Vollständiger **8.4(2–6)**-Motor (weitere Nachlassarten, Einbehalt, konfigurierbare Regelketten).
- **FIN-4 Richtung M4** — Kern-Konfig, Vorlagen, E-Mail, Mahnlauf **5b**, Mandanten-Automation und **Slice 5c** (`POST /finance/dunning-reminder-run/send-emails`, [`M4-BATCH-DUNNING-EMAIL-SPEC.md`](./M4-BATCH-DUNNING-EMAIL-SPEC.md)) sind im Repo umgesetzt; optional verbleibend: kleine UX-/Shell-/Copy-Follow-ups nach Ticket-Priorität — **nicht** mit B2-1a oder Pfad C in einem Strang verheiraten.
- Änderung der **Audit-fail-hard**-Semantik: **Audit-Gate**-Eintrag in [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) **empfohlen** vor PR — Entwicklungsphase: **kein** automatischer Merge-Stopper durch leeren Eintrag ([AGENTS.md](../../AGENTS.md) Punkt 6).
- **B5** formelles Mahn-PDF: Implementierungs-PR **empfohlen** mit dokumentiertem Gate gemäß [`B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](./B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md) (kein Zwang in der Entwicklungsphase; [AGENTS.md](../../AGENTS.md) Punkt 6).
- PWA: **kein Pflicht-UI** für `skontoBps` für alle Mandanten; **optionales** Demo-UI ist als kleines Release dokumentiert — [`RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md`](./RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md). **P1 Wave 3:** [`P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md`](./P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md) — P1-1a/P1-2-Wave-3-Pflichtscope und P1-4-Protokoll **Doku-Stand 2026-04-26**; P1-3 laufend + [`P1-3-DOCS-MILESTONE-WAVE3.md`](./P1-3-DOCS-MILESTONE-WAVE3.md).

## PR-Schnitt (G8 / §5b)

- **PR 1 (empfohlen):** Phase 1 — Tests + QA-Matrix + Mockup-Hinweis (FIN-4 POST Härtung).
- **PR 2:** Pfad A — Schema/Migration + Domäne + Service + OpenAPI + Stubs/Persistenz-Assertions.
- Contract-PRs: `docs/api-contract.yaml`, `error-codes.json` nur bei neuen Codes (Skonto ohne neuen Code; Mahnlauf **1b**: `DUNNING_REMINDER_RUN_DISABLED`).

## Phase 3 — FIN-4 Konfig (Slices 3–8) + M4 Einstieg

**Umgesetzt:** `GET /finance/dunning-reminder-config` mit MVP-Fallback **oder** 9 aktive DB-Zeilen (`TENANT_DATABASE`); **`PUT`** volle Ersetzung; **`PATCH`/`DELETE`** je Stufe (Soft-Delete); **Audit** in derselben Transaktion wie Schreiben (Postgres). OpenAPI/Test-Matrix: **FIN-4-Kern** — [ADR 0009](../adr/0009-fin4-mahnwesen-slice.md); **M4** Vorlagen/Footer/E-Mail — [ADR 0010](../adr/0010-fin4-m4-dunning-email-and-templates.md). Persistenz-Suite: [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts). Ticket-Historie: [`WAVE3-FIN4-PHASE3-DUNNING-CONFIG-READ-2026-04-22.md`](./WAVE3-FIN4-PHASE3-DUNNING-CONFIG-READ-2026-04-22.md).

**M4 Slice 1 (erledigt):** [`M4-MINI-SLICE-1-VORLAGEN-READ-2026-04-23.md`](./M4-MINI-SLICE-1-VORLAGEN-READ-2026-04-23.md) — `GET /finance/dunning-reminder-templates`. **M4 Slice 2 (erledigt):** [`M4-MINI-SLICE-2-PLACEHOLDERS-PATCH-2026-04-23.md`](./M4-MINI-SLICE-2-PLACEHOLDERS-PATCH-2026-04-23.md) — `PATCH …/templates/stages/{ordinal}/channels/{channel}` mit §8.10-Pflichtplatzhaltern + Audit in DB-Tx. **M4 Slice 3 (erledigt):** [`M4-MINI-SLICE-3-EMAIL-FOOTER-2026-04-23.md`](./M4-MINI-SLICE-3-EMAIL-FOOTER-2026-04-23.md) — `GET|PATCH /finance/dunning-email-footer` (§8.10 Stammdaten, Audit in DB-Tx). **M4 Slice 4 (erledigt):** [`M4-MINI-SLICE-4-EMAIL-PREVIEW-SEND-STUB-2026-04-24.md`](./M4-MINI-SLICE-4-EMAIL-PREVIEW-SEND-STUB-2026-04-24.md) — `POST …/dunning-reminders/email-preview` + `POST …/send-email-stub` (kein SMTP; Audit `DUNNING_EMAIL_SEND_STUB`). **M4 Slice 5a (erledigt):** [`M4-MINI-SLICE-5-REAL-SMTP-2026-04-24.md`](./M4-MINI-SLICE-5-REAL-SMTP-2026-04-24.md) — `POST …/dunning-reminders/send-email` mit `Idempotency-Key`, explizitem `toEmail`, SMTP (`ERP_SMTP_*`), Idempotenz-Tabelle `dunning_email_sends`, Audit `DUNNING_EMAIL_SENT`; Stub bleibt parallel. **M4 Slice 5b-0 (erledigt):** `GET /finance/dunning-reminder-candidates` — Ticket [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](./M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md); Antwort inkl. `eligibilityContext` und `stageDeadlineIso` (ADR-0011 B3). **M4 Slice 5b-1 (erledigt):** `POST /finance/dunning-reminder-run` (`DRY_RUN` / `EXECUTE`, Idempotenz, Persistenz `dunning_reminder_run_intents`) — ADR-0010 / OpenAPI / Stubs + optional Persistenz-Integrationstest; `DRY_RUN.planned[]` inkl. `stageDeadlineIso`. ~~**M4 Slice 5b-2** (Cron/AUTO)~~ **entfernt** (2026-04-25) — ADR-0011. **PWA IA (2026-04-26):** Hash-Routing, Tab-Sync, Alias `#/finanz-grundeinstellungen`, OFF-1a-Batch-UI — **erledigt** (siehe Abschnitt „Nächster Strang“). **Nächster Meilenstein:** optional kleine **Option-A**-Follow-ups (UX, Shell-`GET`, Copy); **5c** technisch erledigt — Mandanten-Go separat ([`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](../runbooks/m4-slice-5c-pl-mandanten-go.md)); optional `skontoBps`-UI — strategisch **FIN-5** sobald Spur **B** geklärt ([`MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Teil 3) — **kein** Mix mit 8.4 B2-1 oder Pfad C.

## Team-Checkliste nach Umsetzung M4 Slice 5b-1 (Prozess)

1. **Änderungen committen und per PR einreichen**, CI auf dem Branch prüfen lassen (wie im Team üblich).
2. **Lokal mit echter Test-DB:** `npm run verify:ci:local-db` oder `PERSISTENCE_DB_TEST_URL` + `npm test` / `verify:ci:with-migrate` laut [`docs/runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md) — ohne diese URL werden Postgres-Integrationstests bewusst übersprungen.
3. **Nächster Plan-Schritt laut Roadmap:** PWA-IA/OFF-1a **erledigt** (2026-04-26); weiter **Prozess (Merge)** und M4-Resterweiterungen (siehe Abschnitt „Nächster Strang“). ~~5b-2-Cron~~ entfernt (2026-04-25); kein Hintergrund-Mahnlauf mehr im Produktcode.

**Erinnerung:** Offen bleiben **Prozess (Merge/Evidenz)** und — unabhängig vom Repo-Code — **Mandanten-Produktiv-Go** für Massen-E-Mail (**5c**) mit Freigaben ([`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md)); technische **5b-1**-/**5c**-Lücken sind für die dokumentierte Welle geschlossen, sobald CI und Review grün sind.

## Stakeholder- / Release-Notizen (kleine PWA-Slices)

- **Skonto am Rechnungsentwurf (optional, Demo):** [`RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md`](./RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md) — Changelog-Niveau für Stakeholder ohne OpenAPI-Diff.
- **Nachgelagerte P1-Priorisierung:** [`P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md`](./P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md).

## Referenzen

- Vorwelle: [`NEXT-INCREMENT-FINANCE-WAVE2.md`](./NEXT-INCREMENT-FINANCE-WAVE2.md)  
- Review: [`docs/contracts/review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md), [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) §5b  
- Audit-Querschnitt: [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) (Abschnitt **Querschnitt Finanz Welle 3**)
