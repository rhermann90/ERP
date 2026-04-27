# Weiterentwicklung — laufender Plan

Zielpriorität (ohne wirtschaftlichen Druck): **Zuverlässigkeit und Sicherheit** zuerst, dann **Nutzerfreundlichkeit** (möglichst viele Kernprozesse in **≈3 Klicks**, Informationen in **≈3 Klicks** erreichbar).

Dieses Dokument wird nach jedem abgeschlossenen Entwicklungsschritt aktualisiert: **erledigt**, **nächster Schritt**, **danach in Aussicht**.

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
- **Lesepfade Haupt-Shell:** `GET /invoices/{id}` für **INVOICE** ergänzt (read-only, „Detail (GET)“); weiterhin optional: weitere Typen (z. B. LV-Version), sobald API klar ist.

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

1. **PR-Hygiene:** Thematisch getrennte PRs; je PR `npm run verify:ci`, bei Persistenz `npm run verify:ci:local-db` (Compose-Host **15432**) — siehe [`docs/runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md). Legacy-WIP-Branch `feat/wip-recovery-from-stash-2026-04-21` nur noch splitten, falls fachlich offene Commits darauf liegen; `main` ist Integrationslinie.
2. **Merge / Remote-Evidenz:** PR mit grünem GitHub-Job **`backend`** und **`e2e-smoke`** zum PR-Head (§5a [`qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md)); Review [`review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md). **`generated/prisma`** nicht committen.
3. **Nächstes PL-Inkrement nach Merge:** weiter laut [`NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) — **nicht** parallel **8.4(2–6)** oder **Pfad C** ohne Gate; Backlog siehe unten **Danach in Aussicht**.

### Nach Merge (optional Schritt 4 — Shell)

- **PL/UI:** nur bei Bedarf (Copy, Massen-E-Mail nach PL); Tab-IA bleibt ein Hash `#/finanz-vorbereitung`.
- **Lesepfade Haupt-Shell:** `INVOICE` read-only über `getInvoice` in [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx); weitere `GET` nur bei klarer API, **ohne** Finanz-Schreibpfade zu mischen.

### PL-Entscheid PWA Finanz-Vorbereitung (2026-04-25)

- **IA:** Tabs innerhalb `#/finanz-vorbereitung` — **keine** Unter-Hash-Routen (`#/finanz-vorbereitung/…`); Begründung: ein Hash für Lesezeichen/E2E, weniger Router-Aufwand.
- **SEMI-Kontext:** Zeitzone / optional Bundesland / Kalender- vs. Werktage / Kanal-Vorgabe in der Automation-PATCH-UI; fachliche und steuerliche Klärung mit PL ([ADR 0010](../adr/0010-fin4-m4-dunning-email-and-templates.md), [ADR 0011](../adr/0011-fin4-semi-dunning-context.md)).

**Kürzlich abgesichert (QA 2026-04-25):** FIN-1 M1-DoD mit Postgres — `it("FIN-1 M1: zwei Zahlungsbedingungs-Versionen; …")` in [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts); Evidenzzeile in [`docs/PHASENARBEITSPLAN-MVP-V1.3-FINANZ.md`](../PHASENARBEITSPLAN-MVP-V1.3-FINANZ.md) Abschnitt E1.

**Kürzlich abgesichert (PWA 2026-04-26):** Finanz-Vorbereitung — `FinancePreparation.test.tsx`: erfolgreicher Mandanten-Automation-PATCH inkl. Zeitzone/Kalender-Werktage/Kanal/Bundesland; lokale Fehlerpfade ohne API-Call bei zu kurzem Grund oder einstelligem Bundesland. **`generated/prisma`:** nicht versionieren (Root-`.gitignore`); Runbook-Hinweis unter „PR-Checkliste (Persistenz / Schema)“ in [`ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md). **e2e-smoke** ist seit **2026-04-25** als zweiter Pflicht-Statuscheck aktiv ([`github-branch-protection-backend.md`](../runbooks/github-branch-protection-backend.md)).

### Tempo / Sichtbarkeit (Plan „Nächste Schritte Tempo“, 2026-04-27)

- **Kanonische Agent-Tool-Liste (Stand Repo):** **Wave3-12-Tool-Todos** unter *Agent-Abnahme* in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](../tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) — Merge/CI, Nach-Merge-Doku, Fachstrang Option A, Parallellspur, gesperrte Gates; fachlicher Kontext [`NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md).
- **Kleine PRs:** thematisch trennen; je PR `npm run verify:ci`, bei Persistenz/OpenAPI-/Finanz-Schema-Touch zusätzlich `npm run verify:ci:local-db` (Host **15432**) — siehe Punkte 1–2 unter **Nächster Schritt (Empfehlung)** oben.
- **Nach jedem Merge auf `main`:** hier **eine kurze Zeile** ergänzen (*Erledigt + Datum + PR# oder Thema*) **oder** das passende Ticket nachziehen ([`NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md), [`P1-3-DOCS-MILESTONE-WAVE3.md`](../tickets/P1-3-DOCS-MILESTONE-WAVE3.md) bei qualifiziertem Finanz-Merge) — sichtbare Fertigstellung ohne zusätzliches Feature.
- **GitHub-Evidenz am PR-Head:** Jobs **`backend`** und **`e2e-smoke`** grün; §5a [`qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md), Review [`review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md).
- **Agent-Abnahme (Tool, 2026-04-27 — Acht-Schritte-Plan):** `npm run verify:ci` Exit **0**; `npm run verify:ci:local-db` Exit **0** (Postgres **127.0.0.1:15432**); `npx playwright test e2e/login-finance-smoke.spec.ts` Exit **0** — lokale Parität zur GitHub-PR-Head-Evidenz `backend` / `e2e-smoke`; §5a und Finanz-Review weiterhin manuell am PR ([`qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md), [`review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md)).
- **P1-3 / Merge-Sichtbarkeit:** Tabellenzeile in [`P1-3-DOCS-MILESTONE-WAVE3.md`](../tickets/P1-3-DOCS-MILESTONE-WAVE3.md) **nur** bei **qualifiziertem** Finanz-Merge auf `main` mit **echter** GitHub-PR-URL + UTC — keine Platzhalter-URLs durch Agenten. Ohne solches Merge-Ereignis genügt diese Agent-Nachweiszeile.

### PL-/Team-Touchpoint (ca. 15 Min, Option A)

- **Ziel:** Tempo durch **Entscheidung**, nicht durch parallele Groß-PRs.
- **Agenda-Vorschlag (copy-paste):** (1) **M4 Slice 5c** (Massen-E-Mail) ist im Repo umgesetzt — **Mandanten-Produktiv** ja/nein und SMTP/Idempotenz-Betrieb klären; (2) vor Live-Schaltung **5c** die Checkliste [`compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) mit **StB / DSB / PL**; (3) weiteres Mahn-UX nur nach expliziter PL-Priorität — [`FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md`](../tickets/FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md).
- **Traktanden:** M4-Rest / **Massen-E-Mail (5c)** produktiv ja/nein; optional UX — [`FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md`](../tickets/FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md); Abgleich [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](../tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md); Mandanten-Go mit [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) vor Live-Schaltung.
- **PL-Inbound:** **Team-Entscheid 2026-04-27** — nur **PL-manuell** / PL-Runden bleibt ohne Agent-Eintrag in der Tabelle in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](../tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md); Nachweise außerhalb dieser Zellen. **Agent:** alles andere **weiterhin** erledigen (`verify:ci`, P1-3 bei qual. Merge, E2E, Doku-Nachzug — siehe [`AGENTS.md`](../../AGENTS.md)); **keine** erfundenen URLs.

### Parallele Spur (optional, ohne Finanz-Gate B/C/D/B5/Audit-Verhalten)

- **Playwright:** weitere Journeys (z. B. Traceability/SoT in `#/finanz-vorbereitung`); Ausgangspunkt [`e2e/login-finance-smoke.spec.ts`](../../e2e/login-finance-smoke.spec.ts), Ports **13000** / **15173** (siehe Schritt 4 oben).
- **Haupt-Shell read-only:** weiteres `entityType` nur bei stabiler `GET`-Route + `ApiClient` — vorher [`docs/api-contract.yaml`](../api-contract.yaml); Umsetzung strikt getrennt von Finanz-Schreibpfaden in [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx).
- **Phase 2 (LV §9):** eigener strategischer Strang — [`PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](../tickets/PHASE-2-PRIORISIERUNG-INCREMENT-2.md); **nicht** mit Finanz-Welle 3 mischen.

## Danach in Aussicht

- Produktionsnahe Mandanten-Policies (Kalkulation/Disposition exakt zuordnen) und erweiterte Rollen, falls das Backend mehr als fünf API-Rollen erhält.

### PWA / Finanz-Backlog (eigene PRs, nicht gemischt)

- **B5 formales Mahn-PDF:** PWA später nur Anzeige/Download/Link — [`docs/tickets/B5-FORMAL-DUNNING-PDF.md`](../tickets/B5-FORMAL-DUNNING-PDF.md); Domänen-Anker `src/domain/dunning-formal-notice-spec.ts`.
- **Audit fail-hard / GoBD-Querschnitt:** [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) — nur mit PL-Eintrag, nicht mit Mahn-UI mischen.
- **Skonto-UI:** optional nach API-First / PL — Non-Goal-Hinweis in [`docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md).
- **Haupt-Shell:** Rechnung read-only (`GET /invoices/…`); optional weitere Typen wie LV-Version, sobald GET verfügbar.
