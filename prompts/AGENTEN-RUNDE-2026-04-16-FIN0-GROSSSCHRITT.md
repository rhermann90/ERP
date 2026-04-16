# Agenten-Runde — FIN-0 großer Inkrement (Contract-Stubs + Fail-closed)

**Datum:** 2026-04-16  
**Ziel:** Schnellerer Fortschritt in **wenigen, größeren PRs** — fachlich weiterhin **FIN-2 implementierend gesperrt**, bis `docs/tickets/FIN-2-START-GATE.md` G1–G10 erfüllt sind.

**Hinweis Orchestrierung:** Regulär liefert nur der **Code Reviewer** die „Rückmeldung an Projektleitung“ für die **nächste** Runde (`prompts/AGENTEN-PROMPT-LEITFADEN.md` §0). Diese Runde ist ein **vom PL explizit beauftragter Großschritt** (FIN-0 Contract-Pfad); nach Merge gilt wieder der **normale Reviewer → PL**-Zyklus.

**Verbindlich:** `docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md` · `ERP Systembeschreibung v1.3.md` · `.cursor/rules/erp-multi-agent.mdc` · **keine** Änderungen an `AuditService` / Dual-Write / Transaktionsgrenze Audit ohne vollständigen **PL-Eintrag** in `docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md` · **keine** produktive FIN-2-Buchungslogik / kein **8.4**-Motor am produktiven Pfad.

**Workspace (Beispiel):** `/Users/romanhermann/Projekte/ERP` — jeder Agent: **eigener Team-Clone-Pfad**. Remote: `prompts/README.md`.

---

## PL / System — Vorspann (ein Block, zuerst in die Session)

```text
Workspace: /Users/romanhermann/Projekte/ERP
Remote: git@github.com:rhermann90/ERP.git (siehe prompts/README.md)

PL / System — zuerst:
- Sprint: docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md | Index: docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md
- Diese Runde: prompts/AGENTEN-RUNDE-2026-04-16-FIN0-GROSSSCHRITT.md — FIN-0 großer Inkrement: HTTP-Stubs für Finanz-OpenAPI, fail-closed nach docs/contracts/finance-fin0-openapi-mapping.md; Frontend minimal „Finanz (Vorbereitung)“; QA Evidence-Vorbereitung; Review gegen Gate-Vorlage.
- Domäne: ERP Systembeschreibung v1.3.md | .cursor/rules/erp-multi-agent.mdc
- FIN-2: nur nach docs/tickets/FIN-2-START-GATE.md — kein produktiver Rechnungs-/Zahlungsbuchungsweg.
- Audit-Laufzeit / Dual-Write / OpenAPI-error-codes-Änderung: nur mit separatem Gate bzw. PL-Eintrag FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md
- Preflight: prompts/KOPIERBLOECKE-GIT-REMOTE-UND-PROMPTS.md §0 (git remote -v, git status -sb)

Regeln für Agenten:
- Einstieg: prompts/README.md — nur Team-Clone.
- Merge-Evidence: docs/contracts/qa-fin-0-gate-readiness.md §5a (keine erfundenen Actions-URLs).
- Nach dieser Runde: nächste vier Prompts wieder nur aus Code-Review-Rückmeldung (AGENTEN-PROMPT-LEITFADEN.md §0), sofern nicht erneut explizit PL-gesteuert.
```

---

## 1) Backend — ein PR, großer Umfang (Stubs + Tests)

```text
Rolle: Senior Backend (Node/TypeScript, Fastify, bestehende src/api/app.ts-Patterns).

Ziel (ein zusammenhängender PR, Scope-Zeile im PR deutlich):
1) Implementiere **alle vier** Finance (FIN-0)-Routen aus docs/api-contract.yaml (keine weiteren erfinden):  
   - `POST /finance/payment-terms/versions` — `finPaymentTermsVersionCreate`  
   - `POST /invoices` — `finInvoiceDraftCreate`  
   - `GET /invoices/{invoiceId}` — `finInvoiceGet`  
   - `POST /finance/payments/intake` — `finPaymentIntakeCreate` (Header `Idempotency-Key` wie im OpenAPI-Parameter dokumentiert)
2) **Keine** neuen Prisma-Tabellen für Rechnung/Zahlung; **keine** produktive Buchung. Antworten **fail-closed** gemäß docs/contracts/finance-fin0-openapi-mapping.md mit **ausschließlich** bestehenden Domain-Codes aus docs/contracts/error-codes.json (z. B. TRACEABILITY_LINK_MISSING, EXPORT_PREFLIGHT_FAILED, DOCUMENT_NOT_FOUND, UNAUTHORIZED, TENANT_SCOPE_VIOLATION).
3) Nutze bestehende Auth-/Tenant-Patterns (wie andere Routes); gleiche Error-Envelope wie handleError / DomainError-Ökosystem.
4) **Nicht** ändern: AuditService, Dual-Write-Semantik, OpenAPI-Felder error-codes außerhalb des obigen Abgleichs, prisma/schema für Invoice.
5) Tests: Integrationstests für die neuen Routen (mindestens: authentifizierter Request → erwarteter fail-closed Status + code; Tenant-Violation falls üblich im Repo testbar).
6) Qualität: npm run typecheck && npm test — alles grün.

PR-Beschreibung (Pflicht): „FIN-2 Implementation out of scope; FIN-0 HTTP stubs only; siehe docs/tickets/FIN-2-START-GATE.md und docs/adr/0007-finance-persistence-and-invoice-boundaries.md.“
```

---

## 2) Frontend — ein PR, sichtbarer größerer Schritt (Vorbereitung + Client)

```text
Rolle: Senior Frontend apps/web.

Ziel (ein PR):
1) Neue Route oder Seite **„Finanz (Vorbereitung)“** (read-only): kurzer Text + Links zu docs/adr/0007-finance-persistence-and-invoice-boundaries.md, docs/tickets/FIN-2-START-GATE.md, docs/contracts/finance-fin0-openapi-mapping.md (über Repo-Roh-URL oder lokale Doku-Navigation wie im Rest der App üblich).
2) Optional aber empfohlen in diesem Großschritt: API-Client-Hilfen oder Typen für die neuen Stub-Endpunkte, **sofern** das Repo dafür ein etabliertes Muster hat (kein Parallel-Stack erfinden).
3) **Keine** UI für Buchung, Zahlung, Mahnung; keine Umgehung von allowedActions / Tenant.
4) apps/web/README.md: Abschnitt „Finanz“ um 3–5 Sätze ergänzen (FIN-0 vs FIN-4/FIN-6, Offline laut Spez 8.14 — nur dokumentieren, nicht implementieren).
5) Qualität: npm run test -w apps/web && npm run build:web (oder projektübliches Web-Build-Skript) — grün.

PR: Scope-Zeile „FIN-0 UI-Vorbereitung only; kein FIN-2.“
```

---

## 3) QA — Testmatrix + Evidence-Vorbereitung (größerer Dokument- oder Test-PR)

```text
Rolle: QA Engineer.

Ziel (ein PR — Doku und/oder Tests, §3b qa-fin-0-gate-readiness beachten):
1) Erweitere oder lege eine knappe **FIN-0-Stub-Testmatrix** an (Happy / Edge / Negative): Aufruf der neuen Finanz-Routen, erwartete HTTP-Codes und Domain-codes laut finance-fin0-openapi-mapping.md; Tenant-Isolation-Stichprobe falls im Backend-PR abgedeckt, hier verlinken statt duplizieren.
2) Trage in docs/contracts/qa-fin-0-gate-readiness.md oder einem verlinkten QA-Artefakt ein, **welche** §5a-Felder nach Merge des Backend-PRs auszufüllen sind (Platzhalter RUN_ID/SHA — nicht ausdenken).
3) Prüfe: Keine erfundenen GitHub-Issue-URLs; für Tracker nur echte Links aus eurem System.
4) Qualität: Falls nur Doku: klar im PR deklarieren; falls Tests hinzugefügt: npm test relevante Workspaces grün halten.

Keine Gate-Spalten in docs/tickets/FIN-2-START-GATE.md auf „ja“ setzen — das bleibt PL/Prozess.
```

---

## 4) Code Review — ein Review über alle drei PRs (oder kumuliert)

```text
Rolle: Senior Code Review (FIN-0 / FIN-2-Gate sensibel).

Vorgehen:
1) docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md — für jeden PR: Files changed, Tenant/Traceability, keine Audit-Semantik verletzt, keine Phantom-error-codes.
2) OpenAPI ↔ Backend ↔ finance-fin0-openapi-mapping.md ↔ error-codes.json — konsistent?
3) Frontend: keine versteckten Schreibaktionen; Links/Copy ok.
4) QA: Matrix nachvollziehbar; §5a-Vorbereitung ohne erfundene URLs.

Nach Review: **Rückmeldung an Projektleitung** nach prompts/FIN-0-rollenprompts.md inkl. Pflichtzeilen (Actions-Link ja/nein mit echter URL nach grünem Lauf auf main, Merge blockiert ja/nein, blocking wortgleich zum GitHub-Review).

Wenn PRs nacheinander gemergt werden: pro Merge §5a wie in qa-fin-0-gate-readiness.md; bei mehreren offenen PRs klären, welcher Run den Merge auf main belegt.
```

---

## Merge-Reihenfolge (Empfehlung PL)

1. **Backend** zuerst (Stubs + Tests) — CI grün.  
2. **Frontend** danach (kann API-Typen an gebundene Contracts anpassen).  
3. **QA** parallel möglich, aber finale Matrix nach Backend-Stub-Verhalten abstimmen.  
4. **Code Review** wenn die betroffenen PRs **review-fähig** sind (ein Review mit drei Teilabschnitten ist ok, sofern GitHub das abbildet — sonst drei Reviews mit einheitlicher PL-Rückmeldung nur aus dem letzten relevanten Review).

---

## Ergebnis / Risiko / Rückfrage (kurz)

- **Ergebnis:** Eine kopierfertige Großschritt-Runde mit klaren Out-of-Scope-Linien.  
- **Risiko:** Zu breiter Backend-PR ohne klare Scope-Zeile erhöht Reviewzeit — im PR explizit auflisten, **welche** `operationId`s umgesetzt sind.  
- **Offen:** Ob ihr **einen** kombinierten Monorepo-PR (Backend+Frontend+QA) wollt — diese Prompts gehen von **getrennten** PRs aus (bessere §5a-Zuordnung).
