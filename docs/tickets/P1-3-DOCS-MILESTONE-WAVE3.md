# P1-3 — Operativer Meilenstein (Dokumentation / Integratoren)

**Zweck:** Messbarer Hinweis, dass die **laufende** P1-3-Disziplin greift — ohne binäres „P1-3 fertig“.

## Kriterium (vorschlag Team)

Nach **drei** aufeinanderfolgenden Finanz-relevanten PRs auf `main`, in denen jeweils erfüllt wurde:

- bei OpenAPI-/`info.version`-Touch: [`FIN4-external-client-integration.md`](../contracts/FIN4-external-client-integration.md) mitgezogen;
- bei kleinen PWA-Releases: [`.github/pull_request_template.md`](../../.github/pull_request_template.md) (Abschnitt „Kleine PWA-/UX-Releases“) + [`review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md) Punkt **5**.

→ Datum und PR-Links hier eintragen (PL/QA optional).

**Team-Entscheid 2026-04-26:** Die **nächsten drei** Finanz-relevanten Merges auf `main` werden hier mit PR-# und GitHub-Link **unmittelbar nach Merge** ausgefüllt (nicht aufschieben). **Pflege:** durch den **Agenten** (KI-Session am Repo), nicht durch PL als Pflicht für Tabellenzeilen.

## Pflege (Agent)

Wann **nach** dem Merge auf `main` ausfüllen (noch in derselben Session oder direkt danach), wenn der PR mindestens eines trifft:

- `docs/api-contract.yaml`, `docs/contracts/error-codes.json`, FIN-4-Mahn-/Dunning-Pfade, `apps/web`-Finanz-Vorbereitung, `prisma/` Finanz-relevant, oder PR-Beschreibung / Review nennt explizit Finanz/SoT.

**Vorgehen:**

1. Nächste Tabellenzeile wählen, deren Spalte **PR / Referenz** noch `—` ist (zuerst 1 → 2 → 3; danach **fortlaufend** 4, 5, … — siehe **Fortschreibung** unten).
2. **Merge-Datum (UTC):** ISO `yyyy-mm-dd` (Merge-Zeitpunkt auf `main`).
3. **PR / Referenz:** `https://github.com/rhermann90/ERP/pull/<n>` (kanonisches Remote laut [`README.md`](../../README.md)); optional PR-Titel in **Notiz**.
4. **Notiz:** kurz `FIN4` / `Punkt5` / `RELEASE-*.md` setzen, was zutrifft; bei Verstoß stattdessen Nachhol-PR verlinken.

**Vor Merge auf `main` (Qualität):** `npm run verify:ci` bzw. grüner GitHub-Job `backend` laut Projektregeln.

**Nicht** vom Agenten ausfüllen: Zelle **„Verlinktes Protokoll“** im PL-Abschnitt von [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) — dort nur **Projektleitung**.

## Einträge

**Stand (Agent):** Zuletzt geprüft gegen `origin/main` @ `ca887dd` (Merge **#42** Wave3 FIN4 Batch/PWA/Theming, **2026-04-26** UTC). Für die **ersten drei** Meilenstein-Zeilen zählen nur qualifizierte Finanz-Merges mit Merge-Datum **nicht vor** Kalendertag **2026-04-26**; Zeile **1** ist mit #42 befüllt — Zeilen 2→3 bei den nächsten qualifizierten Merges.

**Agent-Abnahme (Session 2026-04-26):** erneuter `git fetch`/`git log` auf `origin/main` — kein neuer qualifizierter Finanz-Merge seit letztem Stand; Meilenstein-Zeilen unverändert; Regeln **FIN4** / **Punkt 5** und **`npm run verify:ci`** vor Merge auf `main` weiter verbindlich (siehe **Pflege (Agent)**).

**Agent-Abnahme (Session-Folge 2026-04-26):** erneuter Abgleich `origin/main` (HEAD unverändert @ `7eddd03`); keine neuen Merges; Zeilen 1–3 weiter `—`; in derselben Session **`npm run verify:ci`** erneut ausgeführt (grün).

**Agent-Abnahme (Wave3-10-Tool-Todos, 2026-04-27):** `git fetch origin main`; zu diesem Zeitpunkt HEAD noch @ `7eddd03` — **superseded** durch nachfolgende Abnahme **Merge #42** (Zeile 1 befüllt).

**Agent-Abnahme (Merge #42, 2026-04-27):** PR [#42](https://github.com/rhermann90/ERP/pull/42) auf `main` gemergt (`ca887dd`); Meilenstein **Zeile 1** befüllt. Lokal auf dem PR-Branch **`npm run verify:ci`** grün; Remote-Checks **`backend`** und **`e2e-smoke`** grün.

**Fortschreibung (Team-Entscheid, offene Frage geklärt):** Nach vollständiger Belegung der Zeilen **1–3** gilt **weiterhin Fortschreibung in derselben Tabelle** — unter die bestehende Tabelle **weitere Zeilen** im gleichen Spaltenformat anhängen (# 4, 5, …), solange das für Nachvollziehbarkeit sinnvoll ist. **Nur** wenn Projektleitung / Team ausdrücklich einen Schnitt wünscht (z. B. neues Release-Train): archivierte Kopie des „Einträge“-Blocks plus **neue** leere Tabelle starten; nicht der Default.

| # | Merge-Datum (UTC) | PR / Referenz | Notiz |
|---|-------------------|----------------|-------|
| 1 | 2026-04-26 | https://github.com/rhermann90/ERP/pull/42 | FIN4 OpenAPI 5c + `FIN4-external-client-integration.md`; PWA Finanz-Vorbereitung; PR-Punkt5/RELEASE-Verweise in PR #42 |
| 2 | — | — | wie Zeile 1 |
| 3 | — | — | wie Zeile 1 |


**Agent-Abnahme (Plan-Umsetzung, 2026-04-27):** `npm run verify:ci`, `npm run verify:ci:local-db`, `npx playwright test e2e/login-finance-smoke.spec.ts` — jeweils Exit 0 auf Workspace-HEAD `cab7567`. **Meilenstein-Tabelle:** keine neue Zeile 2/3 — Merge [#43](https://github.com/rhermann90/ERP/pull/43) betraf nur diese P1-3-Doku-Pflege (kein qualifizierender Finanz-Merge laut **Pflege (Agent)**-Kriterien). Nächste qualifizierte Merges trägt das Team wie dort beschrieben ein.

**Agent (Wave3-11-Tool-Todos, 2026-04-27):** Meilenstein-Pflege unverändert laut **Pflege (Agent)**; operative CI/PL/M4/Gate-Liste kanonisch unter **Wave3-11** in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) (*Agent-Abnahme*). **PL-Inbound**-Tabelle dort: **nur PL-Runden** / kein Agent-Eintrag (Team-Entscheid 2026-04-27); **alle** übrigen automatisierbaren Agent-Pflichten **weiterhin** erledigen.

**Agent (Wave3-12-Tool-Todos, 2026-04-27):** **Wave3-12** kanonisch unter *Agent-Abnahme* in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md); **PL-Inbound** nur PL-Runden (kein Agent-Eintrag).
## Verweise

- [`P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md`](./P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md)
