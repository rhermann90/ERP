# Phasenarbeitsplan — MVP Finanz (v1.3)

**Stand:** 2026-04-22 (lokaler Abgleich-Commit siehe unten; CI-Evidenz auf `main` erneut per `gh` geprüft)  
**Zielgruppe:** Projektleitung, Entwicklung, Code Review, QA  
**Domänenquelle:** [`docs/ERP-Systembeschreibung.md`](./ERP-Systembeschreibung.md)  
**Phasenüberblick (fachlich):** [`docs/ENTWICKLUNGSPHASEN-MVP-V1.3.md`](./ENTWICKLUNGSPHASEN-MVP-V1.3.md) — **dieses Dokument ersetzt die Phasenbeschreibung nicht**, sondern strukturiert **Ablauf, QA und Review** pro Arbeitspaket.

### Repository-Bezug (Anker für Tabelle D und Evidenz)

| Feld | Wert |
|------|------|
| **Remote (Origin)** | `git@github.com:rhermann90/ERP.git` |
| **Abgleich-Commit (HEAD, lokal)** | [`03ea2676c149a02770d79fc4d6ba2ae3187dd305`](https://github.com/rhermann90/ERP/commit/03ea2676c149a02770d79fc4d6ba2ae3187dd305) |
| **CI-Workflow-Übersicht (GitHub)** | [`.github/workflows/ci.yml` auf `main` — Actions](https://github.com/rhermann90/ERP/actions/workflows/ci.yml) |
| **Letzter grüner `backend`-Run auf `main` (Evidenz §5a)** | [Run 24792922353](https://github.com/rhermann90/ERP/actions/runs/24792922353) — Job [**backend**](https://github.com/rhermann90/ERP/actions/runs/24792922353/job/72555004789) **success** (abgeschlossen UTC **2026-04-22T17:33:15Z**) — Merge-Commit [`900ec2f3408be60ec788724130b1e7436b22bc87`](https://github.com/rhermann90/ERP/commit/900ec2f3408be60ec788724130b1e7436b22bc87) (*Zuletzt geprüft mit `gh run list --workflow=ci.yml --branch=main` und `gh run view 24792922353`; kein neuerer grüner Workflow-Lauf auf `main` zum Prüfzeitpunkt; nach jedem relevanten Merge erneut aktualisieren*) |

**Hinweis:** Lokale grüne Befehle **ersetzen** den grünen GitHub-Actions-Run auf `main` nicht ([`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md)). Nach jedem Merge auf `main`: neuesten grünen Run (Job `backend`) verlinken — Zeile oben und Tabelle **D1** / **E1** anpassen.

---

## So arbeitest du diese Datei ab

1. **Vorbedingung** (Abschnitt B) prüfen — ohne PL-/System-Rahmen keine größeren Architektur-/Finanz-Merges laut [`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md).
2. **Master-Tabelle** (Abschnitt D) aktualisieren, wenn sich der Ist-Stand ändert.
3. Pro **Kapitel FIN-x** (Abschnitt F): nummerierte **Arbeitsschritte** ausführen → **QA** (Vorlage Abschnitt E1) → **Review** (Vorlage E2) → **Evidenz** eintragen → Checkboxen **DoD** setzen.
4. **Kein Mandanten-Go** aus dieser Datei ableiten — fachliche Abnahme: [`Checklisten/compliance-rechnung-finanz.md`](../Checklisten/compliance-rechnung-finanz.md).

---

## A — Metadaten und Definition of Done (kurz)

| Begriff | Bedeutung |
|--------|------------|
| **Arbeitspaket** | Ein abgrenzbares Inkrement (meist ein PR oder eine PR-Kette) innerhalb einer FIN-Phase. |
| **DoD** | Minimalbedingungen aus ENTWICKLUNGSPHASEN §4 (Meilenstein Mx), soweit für das Paket relevant. |
| **Evidenz** | Nachweisbarer QA-Run (idealerweise grüner GitHub Actions-`backend`-Job auf den Merge-SHA). |

---

## B — Globale Vorbedingung: PL / System — zuerst

**Verbindlich** für Merge-Evidence und Architektur-PRs: [`docs/contracts/qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md) §0.

**Checkliste (vor größerer Finanz-Lieferung — mit PL / Review explizit abhaken):**

- [ ] Aktueller **PL-/System-Snapshot** liegt vor (z. B. [`PL-SYSTEM-ZUERST-2026-04-14.md`](./tickets/PL-SYSTEM-ZUERST-2026-04-14.md); Vorlage: [`PL-SYSTEM-ZUERST-VORLAGE.md`](./tickets/PL-SYSTEM-ZUERST-VORLAGE.md)).
- [ ] **Nächstes technisches Inkrement** ist benannt (z. B. [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) oder Nachfolger).
- [ ] Multi-Agent-Regeln bekannt: [`.cursor/rules/erp-multi-agent.mdc`](../.cursor/rules/erp-multi-agent.mdc).

**Technischer Index-Sync (2026-04-23, kein Ersatz für PL-Abhaken oben):** Die verlinkten Artefakte **existieren im Repo** und sind mit [`ENTWICKLUNGSPHASEN-MVP-V1.3.md`](./ENTWICKLUNGSPHASEN-MVP-V1.3.md) §1 (Kurz-Iststand) abzugleichen. [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) führt **Pfad A / B2-1a** (`skontoBps`) als **umgesetzt**; **FIN-4 Mandanten-Stufen-Konfig** (`GET|PUT|PATCH|DELETE`, Soft-Delete, Audit in **DB-Transaktion**, ADR-0009 Slices 5–8) ist **umgesetzt** — Ticket [`WAVE3-FIN4-PHASE3-DUNNING-CONFIG-READ-2026-04-22.md`](./tickets/WAVE3-FIN4-PHASE3-DUNNING-CONFIG-READ-2026-04-22.md). **M4 Slice 1–2** (Vorlagen `GET` + Text-`PATCH`) sind umgesetzt (Tickets [`M4-MINI-SLICE-1-VORLAGEN-READ-2026-04-23.md`](./tickets/M4-MINI-SLICE-1-VORLAGEN-READ-2026-04-23.md), [`M4-MINI-SLICE-2-PLACEHOLDERS-PATCH-2026-04-23.md`](./tickets/M4-MINI-SLICE-2-PLACEHOLDERS-PATCH-2026-04-23.md)). **Nächster Schritt (Default):** M4 Slice 3 — [`M4-MINI-SLICE-3-EMAIL-FOOTER-2026-04-23.md`](./tickets/M4-MINI-SLICE-3-EMAIL-FOOTER-2026-04-23.md); PL-Gate und Alternativen: [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md).

---

## C — Paralleler Strang: Phase 2 (v1.2) LV / Aufmass / Angebot

**Zweck:** Fachliche Eingaben für **8.4(1)** und Traceability (**8.1** / **5.5**) kommen aus dem v1.2-Strang.  
**Referenz:** [`docs/tickets/PHASE-2-STARTAUFTRAG.md`](./tickets/PHASE-2-STARTAUFTRAG.md), Priorisierungs-Inkremente unter `docs/tickets/PHASE-2-*.md`.

**Koordination:** Vor FIN-2-Erweiterungen prüfen, ob LV→Rechnung-Konvergenz laut [`ENTWICKLUNGSPHASEN-MVP-V1.3.md`](./ENTWICKLUNGSPHASEN-MVP-V1.3.md) §6 abgestimmt ist (keine produktiven „Schein-Rechnungen“ ohne dokumentierte Adapterpfade).

---

## D — Master-Tabelle: FIN-Phasen × Ist × Lücke × Nächster Schritt

*Ist-Stand an [`ENTWICKLUNGSPHASEN-MVP-V1.3.md`](./ENTWICKLUNGSPHASEN-MVP-V1.3.md) §1 (Kurz-Iststand) angelehnt; FIN-1-M1-Zeile und DoD zuletzt **2026-04-25**; QA lokal `verify:ci` + `verify:ci:local-db` auf Commit [`b31c1b4`](https://github.com/rhermann90/ERP/commit/b31c1b4693724d1b8394183c7f00b19b9a969ea7). Nach größeren Releases diese Tabelle und den Anker-Commit oben aktualisieren.*

| Phase | Meilenstein | DoD-Kern (Kurz) | Ist (Repo, hochlevel) | Lücke / Risiko | Nächster sinnvoller Schritt |
|-------|-------------|-----------------|------------------------|----------------|----------------------------|
| **FIN-0** | M0 | ADR + OpenAPI + Test-/Gate-Strategie | Verträge, ADRs 0007–0009 (+ **0010** M4 E-Mail/Vorlagen), Stub-Matrix, Gate-Readiness | Phantom-Codes, Drift OpenAPI ↔ Implementierung | Bei jedem API-Change: G8-Bündel + Matrix; §5a-Evidenz im PR |
| **FIN-1** | M1 | Versionierte Konditionen, append-only | `payment_terms_*` in Postgres, APIs; PWA-Demo angebunden; **M1-DoD:** Persistenz-`it` „FIN-1 M1: zwei Zahlungsbedingungs-Versionen …“ in [`test/persistence.integration.test.ts`](../test/persistence.integration.test.ts) (zwei Versionen, Rechnung auf **v1**, Buchung behält **v1**) | Rest optional: UX/Copy in Finanz-Vorbereitung zu PT; §8.5 | Nach PL: nächster Strang laut [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) (Default **A**); kein Mix mit 8.4(2–6)/Pfad C ohne Gate |
| **FIN-2** | M2 | Gebuchte Rechnung, 8.4-Kette, E2E aus LV-Kette | Entwurf, Buchung `BOOK_INVOICE`, 8.4(1)+USt/Brutto, **B2-1a** `skontoBps` (Wave3 Pfad A laut [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md)); PWA Shell + Finanz-Vorbereitung (SoT, Skonto optional API-first) | **8.4(2–6)**-Motor; Pfad GEPRUEFT/FREIGEGEBEN (**Pfad C**, eigenes Gate); belastbarer **LV→Rechnung**-E2E | PL: nach Wave3 **nicht** parallel 8.4-Tiefe + Pfad C mischen; nächste Priorität **FIN-4 Mini-Slice (Phase 3)** *oder* bewusst 8.4(2–6) / Konvergenz — siehe Wave3-Non-Goals |
| **FIN-3** | M3 | Zahlung, Status, Idempotenz 8.7 | Intake POST, Liste GET, SoT, Status TEILBEZAHLT/BEZAHLT; PWA SoT-gekoppelt | Überzahlung / Regeln explizit; Bankfile out of scope, Modell dennoch konsistent | Domainfälle + Tests; Audit bei Zahlungsmutationen |
| **FIN-4** | M4 | Mahnwesen 8.10 inkl. Konfig, Vorlagen, E-Mail | Slice: `dunning_reminders`, `dunning_tenant_stage_config`, `dunning_tenant_stage_templates`, GET/POST Mahn, **`GET|PUT|PATCH|DELETE`** Konfig-Stufen (9× inkl. Soft-Delete), **Audit+Tx** bei Schreiben, SoT **RECORD_DUNNING_REMINDER**, **ADR-0009** (Kern); **`GET|PUT /finance/dunning-reminder-config`** + Stufen-PATCH/DELETE; M4 **Vorlagen** `GET` + `PATCH` Text; M4 **E-Mail-Footer-Stammdaten** `GET|PATCH` [`/finance/dunning-email-footer`](./tickets/M4-MINI-SLICE-3-EMAIL-FOOTER-2026-04-23.md); Vorschau/Stub/SMTP — **ADR-0010** | **M4** (Mahnlauf-Orchestrierung Slice 5b, Rendering, System-Rechtshinweis im Footer) | **Nächster Schritt:** PL laut [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) — Default M4 weiter; kein Mix mit 8.4(2–6) oder Pfad C |
| **FIN-5** | M5 | Steuer-Sonderfall 8.16 oder Fail-Closed | In §1 nicht als erledigt geführt | Entscheidung + ADR/Flag | Ein Sonderfall produktiv **oder** Fail-Closed dokumentieren |
| **FIN-6** | M6 | Härtung 8.14, 12, 15; PWA-Regeln | Audit fail-hard, README zu 8.14/PWA | Feldklassifikation §8.14; Gesamt-QA §15 | [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) mit PL; Compliance-Vorbereitung |

### D1 — Merge-Evidenz GitHub Actions

| Voraussetzung | Link / Wert |
|---------------|----------------|
| Übersicht Workflow `ci.yml` | [Actions — CI workflow](https://github.com/rhermann90/ERP/actions/workflows/ci.yml) |
| **Grüner Run (zuletzt geprüft)** | [Run 24792922353](https://github.com/rhermann90/ERP/actions/runs/24792922353) — Job [**backend**](https://github.com/rhermann90/ERP/actions/runs/24792922353/job/72555004789) **success** — Commit [`900ec2f3…`](https://github.com/rhermann90/ERP/commit/900ec2f3408be60ec788724130b1e7436b22bc87) |

---

## E1 — QA-Vorlage (nach jedem Arbeitspaket ausfüllen)

**Reihenfolge:**

1. **Root:** `npm run typecheck`
2. **Tests:** `npm test` (ohne DB: Skips möglich — siehe [`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md) §3)
3. **Finanz-PR / breite Regression:** `npm run verify:ci` (siehe [`review-checklist-finanz-pr.md`](./contracts/review-checklist-finanz-pr.md))
4. **Postgres + Persistenz:** bei Migrationen/Services: [`docs/runbook/ci-and-persistence-tests.md`](./runbook/ci-and-persistence-tests.md) bzw. `npm run verify:ci:local-db`
5. **Web:** bei `apps/web`-Änderungen: `npm run build -w apps/web && npm run test -w apps/web`
6. **HTTP-Stubs / Finanz-Codes:** Stichprobe [`qa-fin-0-stub-test-matrix.md`](./contracts/qa-fin-0-stub-test-matrix.md) + Mapping [`finance-fin0-openapi-mapping.md`](./contracts/finance-fin0-openapi-mapping.md)
7. **Merge auf `main`:** grüne **GitHub Actions**-Runs (Jobs **`backend`** und **`e2e-smoke`**), **SHA** muss zum Merge passen — **lokal grün ersetzt Remote nicht** (§5a/§5b in `qa-fin-0-gate-readiness.md`; Branch-Protection: [`docs/runbooks/github-branch-protection-backend.md`](./runbooks/github-branch-protection-backend.md)).

**Evidenz-Tabelle (Kopie pro Paket):**

| Datum (UTC) | Was (Befehl / Run) | Ergebnis | Link / SHA |
|---------------|-------------------|----------|-------------|
| 2026-04-22 | `npm run typecheck` (Repo-Root) | Exit 0 | [Commit `03ea2676…`](https://github.com/rhermann90/ERP/commit/03ea2676c149a02770d79fc4d6ba2ae3187dd305) |
| 2026-04-22 | `npm run build -w apps/web && npm run test -w apps/web` | 8 Testdateien, **27** Tests bestanden | [lokaler Commit `03ea2676…`](https://github.com/rhermann90/ERP/commit/03ea2676c149a02770d79fc4d6ba2ae3187dd305) |
| 2026-04-22 | GitHub Actions **workflow `ci.yml`**, Run auf `main` (Job `backend`) | **success** (`gh run list --workflow=ci.yml --branch=main`; Job per `gh run view 24792922353 --json jobs`) | [Run 24792922353](https://github.com/rhermann90/ERP/actions/runs/24792922353), Job [backend](https://github.com/rhermann90/ERP/actions/runs/24792922353/job/72555004789) — Merge-SHA [`900ec2f3…`](https://github.com/rhermann90/ERP/commit/900ec2f3408be60ec788724130b1e7436b22bc87) |
| 2026-04-25 | `npm run verify:ci` + `npm run verify:ci:local-db` (Repo-Root, Compose **15432**) | Exit 0; **257** Tests (Persistenzsuite inkl. FIN-1 M1-`it`) | Historisch: [`b31c1b4…`](https://github.com/rhermann90/ERP/commit/b31c1b4693724d1b8394183c7f00b19b9a969ea7) |
| 2026-04-25 | `npm run verify:ci` + `npm run verify:ci:local-db` + `npx playwright test e2e/login-finance-smoke.spec.ts` (FIN-4 SEMI / ADR-0011) | Exit 0; Root-Suite inkl. Persistenz grün; E2E **1** bestanden | **§5a (PR-Head):** GitHub-Jobs **`backend`** + **`e2e-smoke`** grün prüfen ([`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md)). Branch-Commit: `E1_PR_COMMIT_SHA` |

*Hinweis: Root-`npm test` inkl. Postgres-Persistenz (`PERSISTENCE_DB_TEST_URL`) vor Merge-PR zusätzlich laut [`ci-and-persistence-tests.md`](./runbook/ci-and-persistence-tests.md) / `verify:ci` ausführen — nicht durch die beiden Zeilen oben ersetzt.*

---

## E2 — Review-Vorlage (nach jedem Arbeitspaket ausfüllen)

1. [`docs/contracts/review-checklist-finanz-pr.md`](./contracts/review-checklist-finanz-pr.md) — insb. SoT, `action-contracts.json`, PWA-Executor / API-Client.
2. [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](./tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md) — 8-Punkte-Checkliste, **blocking**-Zeilen, Merge-Kommentar bei Approve.
3. Bei Rechnung / 8.4 / Buchung: relevante **G1–G10** aus [`FIN-2-START-GATE.md`](./tickets/FIN-2-START-GATE.md) benennen und abhaken (G4/G6/G9/G10 haben manuellen Anteil).
4. Bei Eskalation: **Rückmeldung an Projektleitung** exakt nach Schema in [`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md).

**Review-Evidenz:**

| PR | Reviewer | Entscheidung (Approve / Changes / Block) | Datum |
|----|----------|------------------------------------------|-------|
| — (Doku/QA-Session) | — | FIN-1 M1 Persistenznachweis + `verify:ci`/`verify:ci:local-db` laut E1; kein Produkt-PR | 2026-04-25 |
| | | | |

---

## F — Arbeitspakete je FIN-Phase

*Jede Phase: Schritte → QA (E1) → Review (E2) → DoD-Checkboxen.*

### FIN-0 — Architektur und Verträge (M0)

**Ziel:** Vertrags- und Testlandschaft ohne fachliche Lücken zu §8 / §15 (siehe ENTWICKLUNGSPHASEN §4 FIN-0).

**Arbeitsschritte (iterativ):**

1. OpenAPI [`docs/api-contract.yaml`](./api-contract.yaml) und Fehlercodes [`docs/contracts/error-codes.json`](./contracts/error-codes.json) konsistent halten.
2. Mapping-Dokumente pflegen: [`finance-fin0-openapi-mapping.md`](./contracts/finance-fin0-openapi-mapping.md).
3. Stub-/Gate-Matrix: [`qa-fin-0-stub-test-matrix.md`](./contracts/qa-fin-0-stub-test-matrix.md), Gate-Readiness [`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md).

**QA:** Abschnitt E1; bei reinem Doku-PR §5b beachten, wenn gemischt.

**Review:** E2; G8 / keine Phantom-Codes.

**DoD (Checkboxen):**

- [ ] CI/Typecheck/Teststrategie für das Repo nachvollziehbar beschrieben
- [ ] Keine widersprüchlichen HTTP-Codes zwischen Doku und Implementierung (Stichprobe)

---

### FIN-1 — Zahlungsbedingungen (M1)

**Ziel:** Versionierte Konditionen am Projekt, append-only, Referenz aus Rechnung (§8.3, §8.5).

**Arbeitsschritte:**

1. Prisma-Modelle und Migrationen (`payment_terms_heads` / `payment_terms_versions`) — ADR [`0008-payment-terms-fin1.md`](./adr/0008-payment-terms-fin1.md).
2. API Lesen/Schreiben; Mandanten- und Projekt-Konsistenz; Audit wo vorgesehen.
3. Tests: zwei Versionen am selben Projekt; bestehende Rechnung bleibt auf alter `payment_terms_version_id`.

**QA:** E1 + Persistenz-Suite bei DB-Änderungen.

**Review:** E2 + §8.5 (keine destruktive Überschreibung).

**DoD:**

- [x] M1-Szenario aus ENTWICKLUNGSPHASEN §4 FIN-1 in Tests oder dokumentiertem manuellen Nachweis abgedeckt — Persistenz: `it("FIN-1 M1: zwei Zahlungsbedingungs-Versionen; Rechnung bleibt auf alter Version (Postgres); Buchung ändert PT-Referenz nicht", …)` in [`test/persistence.integration.test.ts`](../test/persistence.integration.test.ts)

---

### FIN-2 — Rechnung und Berechnungskette (M2)

**Ziel:** Gebuchte Rechnung unveränderlich; Endbetrag aus definierter 8.4-Kette; E2E aus LV/Aufmass-Kette (langfristig).

**Arbeitsschritte (priorisiert mit PL):**

1. Domäne / Service / API für Entwurf, Lesen, Buchung — ADR [`0007-finance-persistence-and-invoice-boundaries.md`](./adr/0007-finance-persistence-and-invoice-boundaries.md).
2. SoT `BOOK_INVOICE` — [`action-contracts.json`](./contracts/action-contracts.json), Authorization-Service, PWA-Executor.
3. 8.4: aktuell Schritt 1 + USt/Brutto; **Erweiterungen 8.4(2–6)** nur in klar abgegrenzten Inkrementen (siehe [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) Non-Goals).
4. **Pfad C** (GEPRUEFT / FREIGEGEBEN): nicht mit anderen Wellen mischen — eigenes ADR/PL-Gate.
5. Konvergenz LV→Rechnung: ENTWICKLUNGSPHASEN §6 — Adapter/ADR dokumentieren.

**QA:** E1; FIN-2-Gate relevante Gx; Persistenz-Tests für Rechnung/Buchung.

**Review:** E2; FIN-2-Start-Gate; 8-Punkte-Review-Vorlage.

**DoD:**

- [ ] Buchung nur mit erlaubter SoT und korrektem Status
- [ ] Offene 8.4-Lücken im Ticket/ADR sichtbar (kein stiller Partial-Go)

---

### FIN-3 — Zahlungseingang (M3)

**Ziel:** Zuordnung, Idempotenz (§8.7), ableitbarer Zahlungsstatus (§8.8–8.9).

**Arbeitsschritte:**

1. `POST /finance/payments/intake` + Idempotency-Key; Persistenz `payment_intakes`.
2. `GET /invoices/{id}/payment-intakes`; Rollen/SoT `RECORD_PAYMENT_INTAKE`.
3. Tests: Happy Path, Replay mit gleichem Key, Mandanten-Isolation.

**QA:** E1; Stichprobe Idempotenz + Fehlercodes.

**Review:** E2; SoT und Mapping.

**DoD:**

- [ ] Statuswechsel und Überzahlungs-Policy dokumentiert oder als Domainfehler abgebildet

---

### FIN-4 — Mahnwesen (M4)

**Ziel:** Vollständiges Mahnwesen laut §8.10 (Meilenstein M4) — **aktuell nur Slice** (Lesen/Liste, Ereignis POST, SoT).

**Arbeitsschritte:**

1. Slice pflegen: Mahn-Ereignis + Stufen-Konfig — [`0009-fin4-mahnwesen-slice.md`](./adr/0009-fin4-mahnwesen-slice.md); M4 E-Mail/Vorlagen/Footer — [`0010-fin4-m4-dunning-email-and-templates.md`](./adr/0010-fin4-m4-dunning-email-and-templates.md); API GET/POST, ADR-Querschnitt.
2. **Richtung M4:** nur Mini-Inkremente (z. B. Read-Model Konfig-Stub) — laut NEXT-INCREMENT ohne Mix mit 8.4 B2-1 oder Pfad C.
3. PWA: nur wenn UI ausdrücklich Teil des Inkrements (kein E-Mail-Versand ohne M4-Go).

**QA:** E1; keine falschen 2xx bei Persistenzfehlern.

**Review:** E2; ADR-0009 (Kern) / ADR-0010 (M4 E-Mail); kein „M4 vorgetäuscht“.

**DoD:**

- [ ] Slice-Verhalten und M4-Lücke in Doku/Tickets explizit

---

### FIN-5 — Steuern und Sonderfälle (M5)

**Ziel:** §8.11 / §8.16 — ein Sonderfall produktiv **oder** Fail-Closed mit ADR.

**Arbeitsschritte:**

1. Entscheidung dokumentieren (Aktivierung vs. Flag).
2. Export-/Preflight-Muster prüfen, falls Export berührt.

**QA:** E1 + ggf. web build/test.

**Review:** E2; keine stillen Fallbacks.

**DoD:**

- [ ] Entscheidung und Testabdeckung für den gewählten Umfang nachweisbar

---

### FIN-6 — Härtung und Abnahme (M6)

**Ziel:** §8.14, §12, §15; PWA ohne Offline-Schreibpfade Finanz; optionale Export-Skelette.

**Arbeitsschritte:**

1. Audit-/Persistenz-Querschnitt: [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) mit PL.
2. Feldklassifikation / Log-Redaction für Zahlungsdaten (§8.14).
3. Gesamt-QA gegen Quality Gate §15 (mit PL/Reviewer definieren).

**QA:** E1 inkl. `verify:ci:local-db` vor Release-Kandidaten.

**Review:** E2; Compliance-Checkliste fachlich (nicht durch Code ersetzbar).

**DoD:**

- [ ] Abnahmecheckliste §15 mit Referenzen auf Tests/Evidenz
- [ ] Verbleibende Lücken in §16 / Tickets dokumentiert

---

### Querschnitt: PWA / Finanz-UI (`apps/web`)

**Ziel:** Shell und Finanz-Vorbereitung spiegeln SoT und Contracts; kein paralleles „Schatten-SoT“.

**Arbeitsschritte:**

1. Haupt-Shell: `allowedActions`, `executeActionWithSotGuard` — siehe [`apps/web/README.md`](../apps/web/README.md).
2. Finanz-Vorbereitung (Hash-Route): `FinancePreparation`, `api-client`, Fehlerbehandlung.
3. UI-Inkremente nur zusammen mit Contract-/Test-Anpassungen, wo API berührt wird.

**QA:** E1 (inkl. Web-Build/Test).

**Review:** E2 (Finanz-PR-Checkliste).

**DoD:**

- [ ] Keine Schreibpfade ohne SoT; Offline-Schreibpfade ausgeschlossen (README 8.14)

---

## G — Release-, Compliance- und Mandanten-Go (außerhalb reiner Software-QA)

1. **Software:** grüne CI-Evidenz auf `main` (§5a), Review ohne blocking (E2).
2. **Fachlich / Mandant:** [`Checklisten/compliance-rechnung-finanz.md`](../Checklisten/compliance-rechnung-finanz.md) mit StB/DSB/PL — **zusätzlich** zu CI, kein Ersatz für separates Release-GO ([`README.md`](../README.md)).

**Abschluss-Checkbox:**

- [ ] Produktiv-Go bewusst **nicht** allein aus diesem Arbeitsplan abgeleitet

---

## Referenzindex (Links)

| Thema | Dokument |
|-------|-----------|
| Phasen & Meilensteine | [`ENTWICKLUNGSPHASEN-MVP-V1.3.md`](./ENTWICKLUNGSPHASEN-MVP-V1.3.md) |
| FIN-2-Gate G1–G10 | [`FIN-2-START-GATE.md`](./tickets/FIN-2-START-GATE.md) |
| QA Merge-Evidence §5a/§5b | [`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md) |
| GitHub-Review Copy-Paste | [`GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](./tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md) |
| Finanz-PR technisch | [`review-checklist-finanz-pr.md`](./contracts/review-checklist-finanz-pr.md) |
| Nächstes Inkrement (Beispiel) | [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) |
| CI / Persistenz lokal | [`ci-and-persistence-tests.md`](./runbook/ci-and-persistence-tests.md) |
| Multi-Agent | [`.cursor/rules/erp-multi-agent.mdc`](../.cursor/rules/erp-multi-agent.mdc) |
