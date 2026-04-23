# QA- und Review-Protokoll — Finanz-/Mahn (Session 2026-04-23)

Ausführung des Plans „QA Review Finanz-Mahn“ gegen den Workspace-Stand. Kein Merge-PR-Objekt; dieses Dokument dient als Nachweis für lokale Abnahme und als Vorlage für den PR-Kommentar bei Merge.

---

## 1) Review-Checkliste Finanz-PR (`review-checklist-finanz-pr.md`)

| Punkt | Ergebnis | Nachweis / Anmerkung |
| --- | --- | --- |
| **SoT / Erlaubnisliste** | **OK** | `RECORD_DUNNING_REMINDER` in [`action-contracts.json`](./action-contracts.json) (contractVersion `1.6.0-fin4-dunning-write-sot`); PWA-Schreibpfad POST in [`apps/web/src/lib/action-executor.ts`](../../apps/web/src/lib/action-executor.ts); Lesen/Schreiben Konfig/Vorlagen direkt in [`apps/web/src/lib/api-client.ts`](../../apps/web/src/lib/api-client.ts) und [`FinancePreparation.tsx`](../../apps/web/src/components/FinancePreparation.tsx) — konsistent mit direkten REST-Pfaden ohne zusätzliche SoT-Action-IDs für GET/PUT/PATCH. |
| **G8 Contract-Bündel** | **OK (Stichprobe)** | Mahn-Codes (`DUNNING_*`) in [`error-codes.json`](./error-codes.json); Pfade in [`api-contract.yaml`](../api-contract.yaml); Zeilen in [`finance-fin0-openapi-mapping.md`](./finance-fin0-openapi-mapping.md) zu FIN-4/M4. |
| **Mandanten-FK** | **OK** | [`prisma/schema.prisma`](../../prisma/schema.prisma): `DunningTenantStageConfig` `@@id([tenantId, stageOrdinal])`, `DunningTenantStageTemplate` `@@id([tenantId, stageOrdinal, channel])`, `DunningReminder` mit FK auf `Invoice` über `[tenantId, invoiceId]`. |
| **Tests** | **OK** | `npm run verify:ci` und `npm run verify:ci:local-db` am 2026-04-23 erfolgreich (siehe Abschnitt 3). |
| **Misch-PR / Gate** | **Hinweis** | Enthält der spätere Merge-PR Doku und `src/`/`prisma/` ohne klare Trennung, Abschnitt 5b in [`qa-fin-0-gate-readiness.md`](./qa-fin-0-gate-readiness.md) und PL-Rückmeldung einplanen. |
| **GoBD / Audit-Querschnitt** | **Nicht Gegenstand** | Für größere Releases weiterhin [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) mit PL. |

---

## 2) Stub-Matrix vs. Tests (`qa-fin-0-stub-test-matrix.md`)

Die in der Matrix genannten Mahn-Endpunkte und Negative (503 In-Memory, 403 VIEWER/Tenant, 400 Validierung, POST-Fälle) sind in folgenden Suites abgedeckt:

| Suite | Abdeckung (Auszug) |
| --- | --- |
| [`test/finance-fin0-stubs.test.ts`](../../test/finance-fin0-stubs.test.ts) | GET/PUT/PATCH/DELETE Konfig, GET/PATCH Vorlagen, GET/POST Rechnungs-Mahn, VIEWER/Tenant/503/400 |
| [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts) | Postgres: PUT/PATCH/DELETE Konfig, GET `TENANT_DATABASE`, Vorlagen 18 Zeilen, PATCH Vorlage + Audit, POST Mahn + GET-Liste |
| [`apps/web/src/components/FinancePreparation.test.tsx`](../../apps/web/src/components/FinancePreparation.test.tsx) | Mount lädt GET Konfig+Vorlagen; Lesepfad-Fehler + „Mahn-Lesepfade erneut laden“; PUT-Fehler strukturiert; PATCH Stufe |

**PWA-Fehlerpfad Lesepfad:** Automatisiert durch Test „shows API error when Mahn-Lesepfad GET fehlschlägt …“.

---

## 3) Automatisierte Evidence

| Kommando | Ergebnis | Zeitpunkt (lokal) |
| --- | --- | --- |
| `npm run verify:ci` | Exit 0 | 2026-04-23 |
| `npm run verify:ci:local-db` | Exit 0; `prisma migrate deploy` ohne pending; Root-Tests **16/16** Dateien, **204/204** Tests (keine Skips) | 2026-04-23 |

**Workspace-Commit (lokal):** `03ea2676c149a02770d79fc4d6ba2ae3187dd305`

---

## 4) Manuelle PWA-Stichprobe (Operator)

Automatisierte Stellvertreter sind grün (Abschnitt 2–3). Für Browser-Abnahme empfohlen:

1. **Happy path:** Finanz-Vorbereitung öffnen — Mahn-Panel zeigt Hinweise; nach Backend-Start GET-Konfig und GET-Vorlagen in den Ausklappfeldern.
2. **Lesepfad-Fehler:** Backend ohne Postgres oder Lesepfad 503 simulieren — `role="alert"` (strukturiert oder Text), leere JSON-Felder, Button „Mahn-Lesepfade erneut laden“ mit `aria-label` gleichlautend; nach erfolgreichem Reload Fehler verschwindet.
3. **PUT-Fehler:** PUT Konfig mit ungültigem Body oder VIEWER — eine konsistente Fehlerzone unter den Hinweisen.
4. **PATCH:** PATCH Stufe wie in UI — erwartete Fehler/OK je Rolle und Persistenz.

**Komponenten-Review (ohne Browser):** [`FinancePreparationDunningPanel.tsx`](../../apps/web/src/components/finance/FinancePreparationDunningPanel.tsx) — Fehler direkt unter Hinweisen; Reload nur bei `readLoadFailed`; `FinanceStructuredApiError` mit `role="alert"`.

---

## 5) Merge-Evidence (GitHub Actions, Abschnitt 5a/5b)

- **Kanonisch für Merge auf `main`:** grüner GitHub-Actions-Run mit Run-URL und nachweisbarem SHA laut [`qa-fin-0-gate-readiness.md`](./qa-fin-0-gate-readiness.md) — lokaler Erfolg ersetzt den Remote-Run nicht.
- **Letzte erfolgreiche Runs (Beispiel, nicht zwingend = obiger Commit):** Repository `rhermann90/ERP`, z. B. CI-Run `24793059104` (PR-Workflow, Stand Abfrage 2026-04-23). Vor Merge: Run gegen Merge-Commit SHA verifizieren.
- **Abschnitt 5b:** bei rot/fehlendem Link/unklarer SHA-Zuordnung nicht mergen; wörtliches Log aus Actions dokumentieren.

---

## 6) Rückmeldung an Projektleitung

**Nicht erforderlich** für diese reine Workspace-Abnahme (kein offener Merge-Blocker, keine Eskalation). Bei PR mit Misch-Doku/Code oder fehlender Actions-Evidence das Format aus `qa-fin-0-gate-readiness.md` („Rückmeldung an Projektleitung“) verwenden.

---

## Fazit

Finanz-PR-Checkliste und Matrix-Regression für den Mahn-/PWA-Strang sind mit lokaler Evidence erfüllt; G8 stichprobenartig konsistent; Mandanten-FK im Schema plausibel. **Merge-Empfehlung** erst nach separatem PR-Review plus grünem Actions-Run für den Ziel-Commit.
