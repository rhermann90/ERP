# Weiterentwicklung — laufender Plan

Zielpriorität (ohne wirtschaftlichen Druck): **Zuverlässigkeit und Sicherheit** zuerst, dann **Nutzerfreundlichkeit** (möglichst viele Kernprozesse in **≈3 Klicks**, Informationen in **≈3 Klicks** erreichbar).

Dieses Dokument wird nach jedem abgeschlossenen Entwicklungsschritt aktualisiert: **erledigt**, **nächster Schritt**, **danach in Aussicht**.

---

## Arbeitsweise

Um **Code und Tests** gegenüber ausufernder Doku zu priorisieren — bei gleichbleibender Einhaltung der Repo- und Go-Live-Erwartungen — siehe [workflow-code-first-ohne-qualitaetsverlust.md](./workflow-code-first-ohne-qualitaetsverlust.md).

---

## Schritt 1 — Technische Basis / CI-Parität (abgeschlossen, Risiken gemindert)

### Ergebnis

- `npm run verify:ci` bleibt die schnelle Mindestkette ohne Live-Postgres.
- **`npm run ensure:local-test-db`** / **`npm run verify:ci:local-db`** (Host **15432**, DB **erp_test**).
- **CI-Strategie:** ein Job **`backend`** als kanonische Merge-Evidence; kein redundanter zweiter Job.

### Offene Punkte

- Keine.

---

## Schritt 2 — Readiness, Header-Härtung (abgeschlossen)

### Ergebnis

- `GET /ready`, CSP, optional HSTS (`ERP_ENABLE_HSTS=1`).

### Offene Punkte

- **Playwright-E2E** „Login → Finanz“: merge-pflichtig (siehe Schritt 4); Traceability-Pfade in Finanz-Vorbereitung sind umgesetzt — weiteres E2E optional nach Bedarf.

---

## Schritt 3 — Rollen × Top-5 / 3-Klick-IA (abgeschlossen, Slice 1+2)

### Ergebnis

- **Schnellzugriff** je API-Rolle + **v1.3-Hinweiszeilen** (`v13DomainRolesForApiRole`) + Link/Mapping-Pfad **`docs/contracts/ui-role-mapping-v1-3.md`** (Tabelle v1.3 §11.1 → `UserRole`, SoD-Hinweis).
- **Finanz-Vorbereitung:** **FIN-3** Zahlungseingang — geführter **3-Klick-Ablauf** (Rechnung laden → offenen Betrag übernehmen → POST mit neuem `Idempotency-Key`); **`recordPaymentIntake`** im `ApiClient` inkl. Header.
- **`docs/contracts/module-contracts.json`:** `POST /finance/payments/intake` ergänzt.

### Offene Punkte

- Keine (für diesen Schritt).

---

## Schritt 4 — Traceability / Rechnung → Zahlung → Audit (begonnen)

### Ergebnis (Slice 1)

- **Finanz-Vorbereitung:** `GET /audit-events` (letzte 15) — Mandanten-Audit nachlesen, z. B. nach FIN-3-Buchung; `ApiClient.getAuditEvents`.

### Ergebnis (Slice 2)

- **Finanz-Vorbereitung:** `GET /documents/:id/allowed-actions?entityType=INVOICE` — SoT für die aktuelle Rechnungs-ID (Traceability / Export-Gates).

### Ergebnis (Slice 3)

- **Finanz-Vorbereitung:** SoT-Explorer — `entityType` wählbar (inkl. `OFFER_VERSION`, `SUPPLEMENT_VERSION`, `MEASUREMENT_VERSION`, `LV_*`, `INVOICE`), Seed-Voreinstellungen und „Rechnungs-ID übernehmen“.

### Noch offen (für Schritt 4)

- **Playwright-Rauchtest** „Login → Finanz“ (`e2e-smoke`): seit **2026-04-25** in GitHub Ruleset **merge-pflichtig** neben **`backend`** (Repo `rhermann90/ERP`, Ruleset „branch protection“). Nachweis und Team-Vorlage: [`docs/runbooks/github-branch-protection-backend.md`](../runbooks/github-branch-protection-backend.md). Lokal vor PR: `npm run test:e2e` bzw. `npx playwright test e2e/login-finance-smoke.spec.ts` — Playwright startet API/PWA auf **13000** / **15173** (kein Konflikt mit `npm run dev` auf 3000/5173); Wiederverwendung fremder Prozesse nur mit `PW_TEST_REUSE_SERVERS=1`, wenn dieselben Ports die E2E-Instanzen sind.

**Erledigt / präzisiert (Schritt 4 — Shell):** `GET /invoices/{id}` read-only für **INVOICE** in der Haupt-Shell über `ApiClient.getInvoice` — siehe Abschnitt **Nach Merge (optional Schritt 4 — Shell)** und [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx). Optional bleiben: weitere `GET`-Typen (z. B. LV-Version), sobald API klar ist.

### Merge-Evidenz `main` (operativ, 2026-04-25)

- **Pflicht-Checks:** `backend`, `e2e-smoke` (beide grün erforderlich). Kurzmeldung an QA/Team: Abschnitt „Team / QA — Kurzmeldung“ im Runbook [`github-branch-protection-backend.md`](../runbooks/github-branch-protection-backend.md).

### Schritt 4 — Status

- **Abgeschlossen** für die geplanten PWA-Slices (Audit, SoT Rechnung, SoT mehrsprachig in Finanz-Vorbereitung).

### Rollenumbenennung (Nebenänderung)

- API-Wert **`VERTRIEB` → `VERTRIEB_BAULEITUNG`** (Anzeige „Vertrieb / Bauleitung“); Migration `users.role`; Legacy-Token/Request-Body `VERTRIEB` wird weiterhin akzeptiert und normalisiert.

---

## Erledigt im Branch (Wave3 Option A — FIN-4 SEMI / ADR-0011)

- **M4 Slice 5c (Massen-E-Mail):** Backend/OpenAPI/PWA im Repo — `POST /finance/dunning-reminder-run/send-emails` (DRY_RUN/EXECUTE, max. 25 Zeilen, 5a-Pipeline pro Zeile); Spec [`M4-BATCH-DUNNING-EMAIL-SPEC.md`](../tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md). **Produktiv-Go** weiter nur mit PL + [`compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) (keine Agent-Compliance-Erklärung).
- **PWA:** Haupt-Tabs in `#/finanz-vorbereitung` (Rechnung, **Grundeinstellungen Mahnlauf**, Mahnwesen, Fortgeschritten); Tab **Grundeinstellungen** mit `FinanceDunningGrundeinstellungenPanel` — Mandanten-Automation **OFF/SEMI**, SEMI-Kontext (IANA-Zeitzone, DE-Bundesland, Kalender/Werktage, Kanal), Kandidaten-GET, Batch **DRY_RUN/EXECUTE**.
- **Backend:** Migration `dunning_remove_auto_and_semi_context` (AUTO→SEMI, neue Spalten), Cron-Pfad entfernt, Kandidaten/Fristlogik mit Mandantenzeit ([ADR-0011](../adr/0011-fin4-semi-dunning-context.md)).
- **Qualität:** `npm run verify:ci` und `npm run verify:ci:local-db` (Compose **15432**); `npx playwright test e2e/login-finance-smoke.spec.ts` lokal grün.

## Nächster Schritt (Empfehlung)

1. **PR-Hygiene:** Thematisch getrennte PRs; je PR `npm run verify:ci`, bei Persistenz `npm run verify:ci:local-db` (Compose-Host **15432**) — siehe [`docs/runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md). Legacy-WIP-Branch `feat/wip-recovery-from-stash-2026-04-21`: **Wave3-13** — Abgleich `origin/main..origin/feat/wip-recovery-from-stash-2026-04-21` ergab **keine** Commits außerhalb von `main`; Branch kann im Remote verworfen oder lokal archiviert werden (kein Split nötig). `main` ist Integrationslinie.
2. **Merge / Remote-Evidenz:** PR mit grünem GitHub-Job **`backend`** und **`e2e-smoke`** zum PR-Head (§5a [`qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md)); Review [`review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md). **`generated/prisma`** nicht committen.
3. **Nächstes PL-Inkrement nach Merge:** weiter laut [`NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) — **Default-Fachstrang: Option A** (M4 / §8.10); **nicht** parallel **8.4(2–6)** oder **Pfad C** ohne Gate; Backlog siehe unten **Danach in Aussicht**.
4. **Plan „Nächste Entwicklungsschritte“ (Repo / Agent):** Vor Merge lokal **`npm run verify:ci`** und **`npx playwright test e2e/login-finance-smoke.spec.ts`**; am PR-Head GitHub **`backend`** + **`e2e-smoke`**. **PL 5c / Mandanten-Go Massen-E-Mail** nur nach Agenda [`m4-slice-5c-pl-mandanten-go.md`](../runbooks/m4-slice-5c-pl-mandanten-go.md) und Checkliste [`compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) — **kein** Repo-Ersatz für StB/DSB/PL (siehe **PL-/Team-Touchpoint** unten). **Optional:** weitere E2E oder Shell-**GET** nur mit klarer OpenAPI in [`api-contract.yaml`](../api-contract.yaml), **eigener PR**, strikt getrennt von Finanz-Schreibpfaden — **Parallele Spur** unten und [`workflow-code-first-ohne-qualitaetsverlust.md`](./workflow-code-first-ohne-qualitaetsverlust.md).

### Nach Merge (optional Schritt 4 — Shell)

- **PL/UI:** nur bei Bedarf (Copy, Massen-E-Mail nach PL); Tab-IA bleibt ein Hash `#/finanz-vorbereitung`.
- **Lesepfade Haupt-Shell:** `INVOICE` read-only über `getInvoice` in [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx); weitere `GET` nur bei klarer API, **ohne** Finanz-Schreibpfade zu mischen.

### PL-Entscheid PWA Finanz-Vorbereitung (2026-04-25)

- **IA:** Tabs innerhalb `#/finanz-vorbereitung` — **keine** Unter-Hash-Routen (`#/finanz-vorbereitung/…`); Begründung: ein Hash für Lesezeichen/E2E, weniger Router-Aufwand.
- **SEMI-Kontext:** Zeitzone / optional Bundesland / Kalender- vs. Werktage / Kanal-Vorgabe in der Automation-PATCH-UI; fachliche und steuerliche Klärung mit PL ([ADR 0010](../adr/0010-fin4-m4-dunning-email-and-templates.md), [ADR 0011](../adr/0011-fin4-semi-dunning-context.md)).

**Kürzlich abgesichert (QA 2026-04-25):** FIN-1 M1-DoD mit Postgres — `it("FIN-1 M1: zwei Zahlungsbedingungs-Versionen; …")` in [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts); Evidenzzeile in [`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Teil 7 (Abschnitt E1).

**Kürzlich abgesichert (PWA 2026-04-26):** Finanz-Vorbereitung — `FinancePreparation.test.tsx`: erfolgreicher Mandanten-Automation-PATCH inkl. Zeitzone/Kalender-Werktage/Kanal/Bundesland; lokale Fehlerpfade ohne API-Call bei zu kurzem Grund oder einstelligem Bundesland. **`generated/prisma`:** nicht versionieren (Root-`.gitignore`); Runbook-Hinweis unter „PR-Checkliste (Persistenz / Schema)“ in [`ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md). **e2e-smoke** ist seit **2026-04-25** als zweiter Pflicht-Statuscheck aktiv ([`github-branch-protection-backend.md`](../runbooks/github-branch-protection-backend.md)).

### Tempo / Sichtbarkeit (Plan „Nächste Schritte Tempo“, 2026-04-27)

- **Kanonische Agent-Tool-Liste (Stand Repo):** **Wave3-12-Tool-Todos** unter *Agent-Abnahme* in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](../tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) — Merge/CI, Nach-Merge-Doku, Fachstrang Option A, Parallellspur, gesperrte Gates; fachlicher Kontext [`NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md). **Wave3-13:** siehe *Agent-Abnahme* **Wave3-13** imselben PL-Ticket (Tool-Todos, Tempo, Schritt-4-GET-Rechnung — konsistent zu Stand auf `main`).
- **Kleine PRs:** thematisch trennen; je PR `npm run verify:ci`, bei Persistenz/OpenAPI-/Finanz-Schema-Touch zusätzlich `npm run verify:ci:local-db` (Host **15432**) — siehe Punkte 1–2 unter **Nächster Schritt (Empfehlung)** oben. **Doku-Budget:** pro Merge meist **eine** Tempo-Zeile + ggf. P1-3/Stand laut [`AGENTS.md`](../../AGENTS.md); keine zusätzlichen *Wave3-nn*-Absätze ohne fachlichen Anlass (Plan „Sichtbare Schritte weniger Doku“).
- **Nach jedem Merge auf `main`:** hier **eine kurze Zeile** ergänzen (*Erledigt + Datum + PR# oder Thema*) **oder** das passende Ticket nachziehen ([`NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md), [`P1-3-DOCS-MILESTONE-WAVE3.md`](../tickets/P1-3-DOCS-MILESTONE-WAVE3.md) bei qualifiziertem Finanz-Merge) — sichtbare Fertigstellung ohne zusätzliches Feature.
- **Erledigt 2026-04-27 (UTC):** PR [#44](https://github.com/rhermann90/ERP/pull/44) auf `main` gemergt (`833785b`) — PWA Finanz-Shell/Theming, Wave3-Doku, E2E 5c-Smoke; GitHub Actions [Run 24979895183](https://github.com/rhermann90/ERP/actions/runs/24979895183) grün (`backend`, `e2e-smoke`); §5a-pre und §5a post-merge als Kommentare im PR.
- **Erledigt 2026-04-27 (UTC, Folge):** PR [#46](https://github.com/rhermann90/ERP/pull/46) auf `main` gemergt (`e5f1830`) — Shell read-only Rechnungs-Listen, Finanz-E2E, 5c-Checklistenpunkt; GitHub Actions [Run 25009668232](https://github.com/rhermann90/ERP/actions/runs/25009668232) grün (`backend`, `e2e-smoke`); P1-3 Zeile 3 in [`P1-3-DOCS-MILESTONE-WAVE3.md`](../tickets/P1-3-DOCS-MILESTONE-WAVE3.md) befüllt; §5a-pre + §5a post-merge als PR-Kommentare.
- **Doku-Nachzug 2026-04-27 (UTC):** PR [#47](https://github.com/rhermann90/ERP/pull/47) auf `main` (`cbacb7b`) — P1-3 Meilenstein Zeile 3 und Tempo-Bullet zu #46 nachgezogen; **kein** App-/OpenAPI-Änderung; qualifizierender Finanz-Merge bleibt #46 (keine neue P1-3-Tabellenzeile **4**).
- **Gemergt 2026-04-27 (UTC):** PR [#51](https://github.com/rhermann90/ERP/pull/51) auf `main` (`da40f57`) — Wave3-14 Doku-Sync (P1-3-Stand nach `main`, Tempo #47, Codemap-Shell-GETs, FOLLOWUP-M4-Stand); GitHub Actions [Run 25012484363](https://github.com/rhermann90/ERP/actions/runs/25012484363) grün (`backend`, `e2e-smoke`); **keine** neue P1-3-Meilenstein-Zeile **4**.
- **Gemergt 2026-04-27 (UTC, Folge):** PR [#52](https://github.com/rhermann90/ERP/pull/52) auf `main` (`3786cfa`) — P1-3 **Stand (Agent)** auf `main`-HEAD + Tempo/Abnahme nach Merge #51; Actions [Run 25012805270](https://github.com/rhermann90/ERP/actions/runs/25012805270) grün (`backend`, `e2e-smoke`); **keine** neue P1-3-Meilenstein-Zeile **4**.
- **Gemergt 2026-04-27 (UTC):** PR [#59](https://github.com/rhermann90/ERP/pull/59) auf `main` (`88e2923`) — E2E Tab **Rechnung & Zahlung** — **GET Rechnung laden** (Kernzahlen); Actions [Run 25015748386](https://github.com/rhermann90/ERP/actions/runs/25015748386) grün (`backend`, `e2e-smoke`); **keine** neue P1-3-Meilenstein-Zeile (**kein** qualifizierender Finanz-Merge).
- **Gemergt 2026-04-27 (UTC):** PR [#58](https://github.com/rhermann90/ERP/pull/58) auf `main` (`b6c16f3`) — P1-3 **Stand** + **Tempo** nach #57; Actions [Run 25015333617](https://github.com/rhermann90/ERP/actions/runs/25015333617) grün (`backend`, `e2e-smoke`); **keine** neue P1-3-Meilenstein-Zeile (**kein** qualifizierender Finanz-Merge).
- **Gemergt 2026-04-27 (UTC):** PR [#57](https://github.com/rhermann90/ERP/pull/57) auf `main` (`f9b8472`) — Nachzug Tempo/P1-3 zu #56 + E2E SoT **LV-Position**; Actions [Run 25014924708](https://github.com/rhermann90/ERP/actions/runs/25014924708) grün (`backend`, `e2e-smoke`); **keine** neue P1-3-Meilenstein-Zeile (**kein** qualifizierender Finanz-Merge).
- **Gemergt 2026-04-27 (UTC):** PR [#56](https://github.com/rhermann90/ERP/pull/56) auf `main` (`ee8521d`) — E2E **GET /audit-events** im Tab Fortgeschritten + P1-3/Tempo/Wave3-13-Nachzug; Actions [Run 25014543338](https://github.com/rhermann90/ERP/actions/runs/25014543338) grün (`backend`, `e2e-smoke`); **keine** neue P1-3-Meilenstein-Zeile (**kein** qualifizierender Finanz-Merge).
- **Gemergt 2026-04-27 (UTC):** PR [#55](https://github.com/rhermann90/ERP/pull/55) auf `main` (`194b33c`) — E2E Finanz-Smoke Tab **Fortgeschritten** (SoT-Preset **Angebotsversion**, **allowed-actions**); Actions [Run 25013895457](https://github.com/rhermann90/ERP/actions/runs/25013895457) grün (`backend`, `e2e-smoke`); **keine** neue P1-3-Meilenstein-Zeile (**kein** qualifizierender Finanz-Merge).
- **Doku-Nachzug 2026-04-27 (UTC, `main` @ `bc391b2`):** P1-3 **Stand (Agent)** + Nachzug-**Agent-Abnahme** + Tempo an HEAD nach Merge-Kette **#51–#53** ([#53](https://github.com/rhermann90/ERP/pull/53) zuletzt); Actions [Run 25013116340](https://github.com/rhermann90/ERP/actions/runs/25013116340) grün (`backend`, `e2e-smoke`); **keine** neue P1-3-Meilenstein-Zeile **4**.
- **Stand / Tempo 2026-04-28 (UTC):** `origin/main` @ [`ef6c16a`](https://github.com/rhermann90/ERP/commit/ef6c16ad2d7179c96e37c3bc9ceea45611fb167e) — Folgemerges [#48](https://github.com/rhermann90/ERP/pull/48) (Wave3-13-Doku), [#50](https://github.com/rhermann90/ERP/pull/50) (E2E Finanz-Smoke erweitert), [#61](https://github.com/rhermann90/ERP/pull/61) (Dependabot dev-deps), zuletzt [#49](https://github.com/rhermann90/ERP/pull/49) (Doku parallel-agent-a); Agent-Session: `npm run verify:ci`, `npm run verify:ci:local-db`, `npx playwright test e2e/login-finance-smoke.spec.ts` Exit **0**; **keine** neue P1-3-Meilenstein-Zeile (**kein** qualifizierender Finanz-Merge).
- **Agent-Abnahme (Plan „Nächste Schritte Finanz“, 2026-04-28 UTC):** `git fetch origin main`; `origin/main` @ [`c4d551e`](https://github.com/rhermann90/ERP/commit/c4d551e20ba2efa59335abf5d2fd7eca0c7b2319); `npm run verify:ci`, `npm run verify:ci:local-db`, `npx playwright test e2e/login-finance-smoke.spec.ts` — jeweils Exit **0**; PR-Head-Grün (`backend`, `e2e-smoke`) am offenen Branch wie üblich per GitHub prüfen; **keine** neue P1-3-Meilenstein-Zeile (**kein** qualifizierender Finanz-Merge in dieser Agent-Session).
- **Agent-Abnahme (Plan „Nächste Entwicklungsschritte“, 2026-04-28 UTC):** Arbeitskopie `main` @ [`c4d551e`](https://github.com/rhermann90/ERP/commit/c4d551e20ba2efa59335abf5d2fd7eca0c7b2319); `npm run verify:ci` Exit **0**; `npx playwright test e2e/login-finance-smoke.spec.ts` Exit **0**; unter **Nächster Schritt** Punkt **4** ergänzt (Verify/e2e-smoke, PL-5c-Anker, optionale Coding-Spur); PR-Head-Grün (`backend`, `e2e-smoke`) wie üblich in GitHub prüfen; **kein** Mandanten-Go-Bescheid durch Agent; **keine** neue P1-3-Meilenstein-Zeile.
- **Agent-Abnahme (Wave3/Option-A-Plan, 2026-04-28 UTC):** `origin/main` — GitHub Actions [Run 25074795490](https://github.com/rhermann90/ERP/actions/runs/25074795490): Jobs **backend** und **e2e-smoke** **success**; lokale Arbeitskopie @ [`c4d551e`](https://github.com/rhermann90/ERP/commit/c4d551e20ba2efa59335abf5d2fd7eca0c7b2319): `npm run verify:ci`, `npm run verify:ci:local-db`, `npx playwright test e2e/login-finance-smoke.spec.ts` — jeweils Exit **0**; **keine** neue P1-3-Meilenstein-Zeile (**kein** qualifizierender Finanz-Merge).
- **Gemergt 2026-05-01 (UTC):** PR [#69](https://github.com/rhermann90/ERP/pull/69), [#70](https://github.com/rhermann90/ERP/pull/70), [#71](https://github.com/rhermann90/ERP/pull/71), [#72](https://github.com/rhermann90/ERP/pull/72) auf `main` ([`4dd46f9`](https://github.com/rhermann90/ERP/commit/4dd46f99c17421611262a783f8167a255be7dadc)) — Cursor-/Agent-Lieferregeln, MVP-Finanz-Doku-Konsolidierung, Checklisten/Prompts, PWA-Verweise; GitHub Actions [Run 25209775783](https://github.com/rhermann90/ERP/actions/runs/25209775783) grün (`backend`, `e2e-smoke`); **keine** neue P1-3-Meilenstein-Zeile (**kein** qualifizierender Finanz-Merge).

- **GitHub-Evidenz am PR-Head:** Jobs **`backend`** und **`e2e-smoke`** grün; §5a [`qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md), Review [`review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md).
- **Agent-Abnahme (Tool, 2026-04-27 — Acht-Schritte-Plan):** `npm run verify:ci` Exit **0**; `npm run verify:ci:local-db` Exit **0** (Postgres **127.0.0.1:15432**); `npx playwright test e2e/login-finance-smoke.spec.ts` Exit **0** — lokale Parität zur GitHub-PR-Head-Evidenz `backend` / `e2e-smoke`; §5a und Finanz-Review weiterhin manuell am PR ([`qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md), [`review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md)).
- **Arbeitspakete (Plan „Nächste Arbeitspakete“, Repo-Umsetzung):** **A** weiterhin je PR/merge wie oben; **B** Massen-E-Mail 5c — Checklistenpunkt in [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) **vorhanden** (Abgleich vor Mandanten-Go mit StB/DSB/PL); **C** Mahn-UX-Follow-up nur nach PL — [`FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md`](../tickets/FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md); **D** E2E-Smoke um Tabs Mahnwesen/Fortgeschritten erweitert; Haupt-Shell bei `entityType` **INVOICE** zusätzlich read-only **GET** `…/payment-intakes` und `…/dunning-reminders` (`apps/web/src/App.tsx`, `ApiClient`); **E** keine Umsetzung bis Gates ([`B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](../tickets/B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md), [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md), Non-Goals in [`NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md)); **F** Phase 2 LV getrennt — [`PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](../tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md)).
- **P1-3 / Merge-Sichtbarkeit:** Tabellenzeile in [`P1-3-DOCS-MILESTONE-WAVE3.md`](../tickets/P1-3-DOCS-MILESTONE-WAVE3.md) **nur** bei **qualifiziertem** Finanz-Merge auf `main` mit **echter** GitHub-PR-URL + UTC — keine Platzhalter-URLs durch Agenten. Ohne solches Merge-Ereignis genügt diese Agent-Nachweiszeile.

### PL-/Team-Touchpoint (ca. 15 Min, Option A)

- **Repo-Anker (Agenda + Checklistenlinks):** [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](../runbooks/m4-slice-5c-pl-mandanten-go.md).
- **Agent (2026-04-28):** [`compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) enthält den Punkt **FIN-4 / Massen-E-Mail (M4 Slice 5c)**; Agenda-Vorschlag unten bleibt kanonisch — **Mandanten-Produktiv-Go** für 5c weiterhin **PL + StB/DSB** (kein Repo-Ersatz).
- **Ziel:** Tempo durch **Entscheidung**, nicht durch parallele Groß-PRs.
- **Agenda-Vorschlag (copy-paste):** (1) **M4 Slice 5c** (Massen-E-Mail) ist im Repo umgesetzt — **Mandanten-Produktiv** ja/nein und SMTP/Idempotenz-Betrieb klären; (2) vor Live-Schaltung **5c** die Checkliste [`compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) mit **StB / DSB / PL**; (3) weiteres Mahn-UX nur nach expliziter PL-Priorität — [`FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md`](../tickets/FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md).
- **Traktanden:** M4-Rest / **Massen-E-Mail (5c)** produktiv ja/nein; optional UX — [`FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md`](../tickets/FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md); Abgleich [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](../tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md); Mandanten-Go mit [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) vor Live-Schaltung.
- **PL-Inbound:** **Team-Entscheid 2026-04-27** — nur **PL-manuell** / PL-Runden bleibt ohne Agent-Eintrag in der Tabelle in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](../tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md); Nachweise außerhalb dieser Zellen. **Agent:** alles andere **weiterhin** erledigen (`verify:ci`, P1-3 bei qual. Merge, E2E, Doku-Nachzug — siehe [`AGENTS.md`](../../AGENTS.md)); **keine** erfundenen URLs.

### Parallele Spur (optional, ohne Finanz-Gate B/C/D/B5/Audit-Verhalten)

- **Playwright:** weitere Journeys (z. B. Traceability/SoT in `#/finanz-vorbereitung`, **GET /audit-events** nur Lesen über bestehenden Button — **keine** Audit-Verhaltensänderung); Ausgangspunkt [`e2e/login-finance-smoke.spec.ts`](../../e2e/login-finance-smoke.spec.ts), Ports **13000** / **15173** (siehe Schritt 4 oben).
- **Haupt-Shell read-only:** weiteres `entityType` nur bei stabiler `GET`-Route + `ApiClient` — vorher [`docs/api-contract.yaml`](../api-contract.yaml); Umsetzung strikt getrennt von Finanz-Schreibpfaden in [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx).
- **Phase 2 (LV §9):** eigener strategischer Strang — [`PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](../tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md); **nicht** mit Finanz-Welle 3 mischen.

## Danach in Aussicht

- Produktionsnahe Mandanten-Policies (Kalkulation/Disposition exakt zuordnen) und erweiterte Rollen, falls das Backend mehr als fünf API-Rollen erhält.

### PWA / Finanz-Backlog (eigene PRs, nicht gemischt)

- **B5 formales Mahn-PDF:** PWA später nur Anzeige/Download/Link — [`docs/tickets/B5-FORMAL-DUNNING-PDF.md`](../tickets/B5-FORMAL-DUNNING-PDF.md); Domänen-Anker `src/domain/dunning-formal-notice-spec.ts`.
- **Audit fail-hard / GoBD-Querschnitt:** [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) — nur mit PL-Eintrag, nicht mit Mahn-UI mischen.
- **Skonto-UI:** optional nach API-First / PL — Non-Goal-Hinweis in [`docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md).
- **Haupt-Shell:** Rechnung read-only (`GET /invoices/…`); optional weitere Typen wie LV-Version, sobald GET verfügbar.
