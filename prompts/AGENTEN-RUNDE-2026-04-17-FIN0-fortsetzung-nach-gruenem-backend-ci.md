# Agenten-Runde — FIN-0 Fortsetzung (nach grünem Backend-CI)

**Datum:** 2026-04-17  
**Auslöser:** Backend-Job in GitHub Actions **grün**, ohne Auffälligkeiten; Entwicklung soll **weitergeführt** werden.

**Hinweis Orchestrierung:** Regulär plant die PL die nächsten vier Prompts **nur** aus der **„Rückmeldung an Projektleitung“** des **Code Reviewers** (`prompts/AGENTEN-PROMPT-LEITFADEN.md` §0, `prompts/PL-NÄCHSTE-RUNDE-AUS-REVIEW.md`). **Diese Runde** ist ein **vom Auftraggeber explizit gewünschter Fortsetzungsschritt** nach stabiler CI — danach gilt wieder: **nächste** Vier-Prompt-Runde aus der **aktuellen** Reviewer-Rückmeldung (blocking + Pflichtzeilen wortgleich zum GitHub-Review).

**Verbindlich:** `docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md` · `ERP Systembeschreibung v1.3.md` · `.cursor/rules/erp-multi-agent.mdc` · **keine** Audit-Laufzeit / Dual-Write / Transaktionsgrenze ohne vollständigen **PL-Eintrag** in `docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md` · **keine** produktive FIN-2-Buchungslogik / kein **8.4**-Motor am produktiven Pfad · Merge-Evidence: `docs/contracts/qa-fin-0-gate-readiness.md` §5a / §5b · **keine** erfundenen Actions-URLs oder SHAs.

**Bereits im Repo (diese Runde nicht erneut „von null“ bauen):** `src/api/finance-fin0-stubs.ts` (vier FIN-0-Routen, fail-closed), `test/finance-fin0-stubs.test.ts`, `docs/adr/0007-finance-persistence-and-invoice-boundaries.md`, `docs/contracts/finance-fin0-openapi-mapping.md`, `apps/web` read-only **Finanz (Vorbereitung)** inkl. `getInvoice`-Client. Fokus hier: **Konsistenz, Lücken, Merge-Vorbereitung, Review**.

---

## PL / System — Vorspann (ein Block, zuerst in die Session)

```text
Workspace: <absoluter Pfad zum Team-Clone — mit .git und origin>
Remote: git@github.com:rhermann90/ERP.git (siehe prompts/README.md)

PL / System — zuerst:
- Sprint: docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md | Index: docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md
- Diese Runde: prompts/AGENTEN-RUNDE-2026-04-17-FIN0-fortsetzung-nach-gruenem-backend-ci.md — FIN-0 vertiefen nach grünem CI (Contract/OpenAPI-Abgleich, Web/Doku, QA-Evidence/Matrix, Review).
- Domäne: ERP Systembeschreibung v1.3.md | .cursor/rules/erp-multi-agent.mdc
- FIN-2: nur nach docs/tickets/FIN-2-START-GATE.md
- Preflight: prompts/KOPIERBLOECKE-GIT-REMOTE-UND-PROMPTS.md — git remote -v, git status -sb; Branch mit origin/main abgleichen (git fetch; ggf. merge oder rebase nach Team-Regel)

Regeln für Agenten:
- Einstieg: prompts/README.md — nur Team-Clone; keine Secrets im Projektbaum.
- §5a: nur mit echten Run-URL + SHA + einer Zeile Team-Regel Evidence-SHA aus GitHub (QA); niemand erfindet Run-IDs.
- Nach dieser Runde: nächste vier Prompts wieder primär aus Code-Review-Rückmeldung (AGENTEN-PROMPT-LEITFADEN.md §0), sofern nicht erneut explizit anders beauftragt.
```

---

## 1) Backend

```text
Rolle: Senior Backend (Node/TypeScript, Fastify, bestehende src/api-Patterns).

Kontext: FIN-0-HTTP-Stubs und Tests sind implementiert; Backend-CI ist grün. Diese Runde = Qualität und Contract-Parität, kein neues FIN-2-SoT.

Deine Aufgaben (nummeriert, max. 7):
1) git fetch && Abgleich mit origin/main (merge/rebase nach Team-Regel); Arbeitsbranch für PR klar benennen.
2) Abgleich docs/api-contract.yaml (Finance-operationIds) ↔ src/api/finance-fin0-stubs.ts ↔ docs/contracts/finance-fin0-openapi-mapping.md ↔ docs/contracts/error-codes.json — Abweichungen in **diesem** PR minimal schließen (OpenAPI-Kommentar, Stub, Mapping oder Test; keine neuen Phantom-Codes).
3) Prüfen, ob alle fail-closed-Pfade in test/finance-fin0-stubs.test.ts weiterhin die Matrix in docs/contracts/qa-fin-0-stub-test-matrix.md widerspiegeln; bei Lücken **Test oder Matrix** ergänzen (keine doppelte Assertion-Logik ohne Grund).
4) Sicherstellen: Auth/Tenant/Headers (z. B. Idempotency-Key, Bearer) konsistent zu den bestehenden Tests und zu OpenAPI-Beschreibung (Schreibweise/Required).
5) Kurz prüfen: Error-Envelope / DomainError-Ökosystem unverändert kompatibel zu docs/contracts/error-codes.json.

Out of Scope: Neue Prisma-Tabellen für Rechnung/Zahlung; AuditService-/Dual-Write-Änderungen; produktive FIN-2-Logik; OpenAPI-„Fantasie“-Enums.

Qualität: npm run typecheck && npm test — alles grün vor Push.

Output: PR mit klarer Scope-Zeile („FIN-0: Contract/Test-Parität nach CI; FIN-2 out of scope“) und Verweis auf FIN-2-START-GATE.md + ADR 0007; **keine** erfundenen Actions-URLs im PR-Text.
```

---

## 2) Frontend (apps/web)

```text
Rolle: Senior Frontend apps/web (React, bestehende Shell, allowedActions, Hash-Route FINANCE_PREP_HASH).

Kontext: Read-only Seite „Finanz (Vorbereitung)“ und API-Client getInvoice existieren; Doku-Links inkl. finance-fin0-openapi-mapping sind vorbereitet.

Deine Aufgaben (nummeriert, max. 7):
1) git fetch && Abgleich mit origin/main; Branch für PR.
2) FinancePreparation / Doku-Navigation: fehlende **sinnvolle** Verknüpfung ergänzen — mindestens **Stub-Testmatrix** docs/contracts/qa-fin-0-stub-test-matrix.md als weiteren Link (repoDocHref wie bestehende DOC_LINKS).
3) apps/web/README.md: 2–4 Sätze „Was diese Runde geändert hat“ + Verweis FIN-0 vs FIN-4/FIN-6 (Offline 8.14 nur dokumentieren, nicht implementieren).
4) Optional klein: Lesbarkeit/A11y der Finanz-Vorbereitungsseite (Überschriftenhierarchie, Fokus) — **ohne** neue Schreib-Aktionen an Finanz-APIs (kein POST aus UI für Buchungs-/Zahlungsvorgänge).
5) api-client.ts: nur anfassen, wenn Backend/Contract in derselben Runde eine **benannte** Anpassung erfordert; sonst unverändert lassen.

Out of Scope: Mahn-/Zahlungsbuchungs-UI; Umgehung allowedActions; Tenant-Leaks; FIN-2 produktiv.

Qualität: npm run test -w apps/web && npm run build:web — grün.

Output: PR mit Scope-Zeile „FIN-0 UI/Doku-Vertiefung only; kein FIN-2.“
```

---

## 3) QA (Testing / Evidence)

```text
Rolle: QA Engineer (Testing, Regression, Merge-Evidence).

Kontext: Backend-CI grün; Stub-Matrix und Gate-Doku existieren. Evidence nur mit **echten** GitHub-Werten.

Deine Aufgaben (nummeriert, max. 7):
1) Pflichtlektüre: docs/contracts/qa-fin-0-gate-readiness.md (§5a-pre / §5a / §5b, §3b), docs/contracts/qa-fin-0-stub-test-matrix.md, .github/workflows/ci.yml (Job backend).
2) Matrix ↔ test/finance-fin0-stubs.test.ts: Tabellenzeilen und Vitest-Beschreibungen konsistent halten; bei Backend-/Contract-Änderungen der anderen Rollen Matrix **nachziehen** (keine erfundenen Codes).
3) **Merge-Evidence:** Wenn ein PR auf main gemerged werden soll: nach **grünem** Lauf für den **PR-Head** im **selben** PR **5a-pre)** bzw. §5a vollständig eintragen — **HTTPS**-Run-URL, **Commit-SHA** des Runs, **eine** Zeile Team-Regel Evidence-SHA (Standardzeile unter „PL-Bestätigung“ in qa-fin-0-gate-readiness.md, sofern PL nichts Abweichendes schriftlich vorgibt). **Keine** Platzhalter-URLs.
4) FIN-2-START-GATE.md: nur **Lesen** / Testbarkeits-Feedback im PR-Kommentar — **keine** G1–G10 auf „erfüllt“ setzen (PL/Prozess).
5) Optional: kurze Notiz im PR, welche manuellen Stichproben (lokal oder UI) sinnvoll sind, ohne lokale Grün-Parität als Ersatz für Actions zu deklarieren.

Out of Scope: Gate-Spalten ohne PL; erfundene Tracker- oder Issue-URLs.

Qualität: Wenn du Tests oder Doku änderst: relevante npm test / CI-parallele Befehle lokal grün halten; Doku-only-PR klar kennzeichnen (§3b).

Output: PR-Kommentar(e) mit nachvollziehbarer Evidence **oder** klarer Hinweis „kein Merge-Ziel in dieser Runde“ — nie erfundene Run-IDs.
```

---

## 4) Senior Code Review

```text
Rolle: Senior Code Review (FIN-0 / FIN-2-Gate sensibel, GoBD-/Security-Bewusstsein).

Kontext: Nach Umsetzung der anderen drei Rollen liegen ein oder mehrere PRs vor; Backend-CI war zuletzt grün — **jeder neue Push** erneut prüfen.

Deine Aufgaben (nummeriert, max. 7):
1) git fetch; für jeden PR: docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md — Files changed, Tenant/Traceability, keine Phantom-error-codes, kein Audit ohne PL-Eintrag.
2) OpenAPI ↔ Backend ↔ finance-fin0-openapi-mapping.md ↔ error-codes.json — bei Berührung explizit abhaken.
3) Frontend: keine versteckten Schreibpfade an Finanz-POSTs; Links/Copy FIN-0-konform.
4) QA: §5a / 5a-pre nur **Szenario B** akzeptieren, wenn Run-URL + SHA + Team-Regelzeile **vollständig und plausibel** zum Merge-Commit stehen; sonst **Szenario A** (AGENTEN-PROMPT-LEITFADEN.md §5).
5) blocking im GitHub-Review **explizit** setzen (eine Zeile oder „kein blocking“) — wortgleich zur späteren PL-Rückmeldung.

Out of Scope: FIN-2 produktiv freigeben; Audit-Tabelle im FOLLOWUP-Ticket ausfüllen (nur PL).

Qualität: Review-Kommentar mit kurzer Checkliste (abgehakte Punkte).

Output: GitHub-Review(s) + **verbindlich** „Rückmeldung an Projektleitung“ nach prompts/FIN-0-rollenprompts.md (Pflichtzeilen inkl. Actions-Link ja/nein, Merge blockiert ja/nein, **blocking** wortgleich GitHub) — **einziger** strukturierter Eingang für die **nächste** planbare Vier-Prompt-Runde (PL-NÄCHSTE-RUNDE-AUS-REVIEW.md §1).
```

---

## Ergebnis / Rationale / Risiken / Offene Fragen

| Aspekt | Kurz |
|--------|------|
| **Ergebnis** | Vier kopierfertige Prompts + Vorspann; Fortsetzung nach grünem CI ohne Doppelarbeit an den Stubs. |
| **Rationale** | Orchestrierungsregel bleibt dokumentiert; Inhalt orientiert sich am **Ist-Stand** im Repo (Stubs/Web/Matrix vorhanden). |
| **Risiken** | Parallele PRs ohne Abstimmung können Matrix/Client kurz auseinanderlaufen — mit Abgleich-Punkt in Backend/QA minimiert. |
| **Offene Fragen** | Welcher PR ist **das** Merge-Ziel auf `main` (ein Bundle vs. getrennte PRs)? — im Team-Channel/PR-Beschreibung festhalten. |

**Recht / Daten / Wartbarkeit / PWA:** Keine neue fachliche Buchhaltungslogik; Tenant- und Evidence-Disziplin bleiben zentral; PWA bleibt read-only auf Finanz-Vorbereitung — keine Offline-Schreibpfade für Zahlung/Mahnung.
