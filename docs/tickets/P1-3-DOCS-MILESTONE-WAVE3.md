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

**Stand (Agent):** Zuletzt verifiziert auf Workspace-HEAD dieses Commits (**2026-04-27** UTC; Parent `origin/main` @ `194b33c`, Merge [#55](https://github.com/rhermann90/ERP/pull/55)). Zeile **1** = Merge [#42](https://github.com/rhermann90/ERP/pull/42) (**2026-04-26**); Zeile **2** = Merge [#44](https://github.com/rhermann90/ERP/pull/44) (**2026-04-27**); Zeile **3** = Merge [#46](https://github.com/rhermann90/ERP/pull/46) (**2026-04-27**). PR [#51](https://github.com/rhermann90/ERP/pull/51) / [#52](https://github.com/rhermann90/ERP/pull/52) / [#53](https://github.com/rhermann90/ERP/pull/53): Wave3-14 Doku und P1-3/Tempo-Nachzüge — **keine** neue Meilenstein-Zeile **4** (kein qualifizierender Finanz-Merge). PR [#55](https://github.com/rhermann90/ERP/pull/55) (`194b33c`): E2E Finanz-Smoke Tab Fortgeschritten (SoT Preset **Angebotsversion** + **allowed-actions**) — **keine** neue Meilenstein-Zeile (**kein** qualifizierender Finanz-Merge). PR [#47](https://github.com/rhermann90/ERP/pull/47) bleibt historischer Doku-Nachzug zu #46. Qualifizierte Finanz-Merges nur mit Merge-Datum **nicht vor** **2026-04-26** (Team-Entscheid).

**Agent-Abnahme (Merge `main` #51, 2026-04-27 UTC):** PR [#51](https://github.com/rhermann90/ERP/pull/51) auf `main` gemergt (`da40f57`); nur `docs/` (P1-3, Codemap, `nächste-schritte`, FOLLOWUP-M4); Meilenstein **Zeilen 1–3** unverändert. Remote nach Merge auf `main`: Actions [Run 25012484363](https://github.com/rhermann90/ERP/actions/runs/25012484363) — Jobs [`backend`](https://github.com/rhermann90/ERP/actions/runs/25012484363/job/73251590858) und [`e2e-smoke`](https://github.com/rhermann90/ERP/actions/runs/25012484363/job/73251818272) grün.

**Agent-Abnahme (Merge `main` #52, 2026-04-27 UTC):** PR [#52](https://github.com/rhermann90/ERP/pull/52) auf `main` gemergt (`3786cfa`); nur [`P1-3-DOCS-MILESTONE-WAVE3.md`](./P1-3-DOCS-MILESTONE-WAVE3.md) + [`nächste-schritte.md`](../plans/nächste-schritte.md) (Stand-HEAD + Tempo nach #51); Meilenstein **Zeilen 1–3** unverändert. Remote nach Merge auf `main`: Actions [Run 25012805270](https://github.com/rhermann90/ERP/actions/runs/25012805270) — Jobs [`backend`](https://github.com/rhermann90/ERP/actions/runs/25012805270/job/73252730010) und [`e2e-smoke`](https://github.com/rhermann90/ERP/actions/runs/25012805270/job/73252950317) grün.

**Agent-Abnahme (Plan „Nächste Entwicklungsschritte“, 2026-04-27 UTC):** E2E Finanz-Smoke um **GET /audit-events** (Button „Audit-Ereignisse laden“ im Tab Fortgeschritten) erweitert; P1-3 **Stand** + Merge-**Abnahme** #55, **Tempo**-Bullet #55, PL-WAVE3 **Wave3-13**; `npm run verify:ci` und `npx playwright test e2e/login-finance-smoke.spec.ts` Exit **0** auf demselben Workspace-HEAD. Meilenstein **Zeilen 1–3** unverändert (**keine** Zeile 4).

**Agent-Abnahme (Merge `main` #55, 2026-04-27 UTC):** PR [#55](https://github.com/rhermann90/ERP/pull/55) auf `main` gemergt (`194b33c`); nur [`e2e/login-finance-smoke.spec.ts`](../../e2e/login-finance-smoke.spec.ts) (SoT Fortgeschritten); Meilenstein **Zeilen 1–3** unverändert. Remote nach Merge auf `main`: Actions [Run 25013895457](https://github.com/rhermann90/ERP/actions/runs/25013895457) — Jobs [`backend`](https://github.com/rhermann90/ERP/actions/runs/25013895457/job/73256527879) und [`e2e-smoke`](https://github.com/rhermann90/ERP/actions/runs/25013895457/job/73256759032) grün.

**Agent-Abnahme (2026-04-27 UTC, Nachzug `main` @ `bc391b2`):** Nach Merge [#53](https://github.com/rhermann90/ERP/pull/53): `Stand (Agent)` und Tempo an tatsächlichen `origin/main`-HEAD (`bc391b2`) angeglichen; Meilenstein **Zeilen 1–3** unverändert. Remote nach Push von #53 auf `main`: Actions [Run 25013116340](https://github.com/rhermann90/ERP/actions/runs/25013116340) — Jobs [`backend`](https://github.com/rhermann90/ERP/actions/runs/25013116340/job/73253826039) und [`e2e-smoke`](https://github.com/rhermann90/ERP/actions/runs/25013116340/job/73254054563) grün.

**Agent-Abnahme (Agent-A Doku-Welle Wave3-14, 2026-04-27 UTC):** `git fetch origin main`; Abgleich vor Merge #51: `origin/main` @ `cbacb7b`; Merge [#47](https://github.com/rhermann90/ERP/pull/47) nur [`P1-3-DOCS-MILESTONE-WAVE3.md`](./P1-3-DOCS-MILESTONE-WAVE3.md) + [`nächste-schritte.md`](../plans/nächste-schritte.md) (§5a-/Tempo-Evidenz zu #46); Tabelle **Zeilen 1–3** unverändert.

**Agent-Abnahme (Session 2026-04-26):** erneuter `git fetch`/`git log` auf `origin/main` — kein neuer qualifizierter Finanz-Merge seit letztem Stand; Meilenstein-Zeilen unverändert; Regeln **FIN4** / **Punkt 5** und **`npm run verify:ci`** vor Merge auf `main` weiter verbindlich (siehe **Pflege (Agent)**).

**Agent-Abnahme (Session-Folge 2026-04-26):** erneuter Abgleich `origin/main` (HEAD unverändert @ `7eddd03`); keine neuen Merges; Zeilen 1–3 weiter `—`; in derselben Session **`npm run verify:ci`** erneut ausgeführt (grün).

**Agent-Abnahme (Wave3-10-Tool-Todos, 2026-04-27):** `git fetch origin main`; zu diesem Zeitpunkt HEAD noch @ `7eddd03` — **superseded** durch nachfolgende Abnahme **Merge #42** (Zeile 1 befüllt).

**Agent-Abnahme (Merge #42, 2026-04-27):** PR [#42](https://github.com/rhermann90/ERP/pull/42) auf `main` gemergt (`ca887dd`); Meilenstein **Zeile 1** befüllt. Lokal auf dem PR-Branch **`npm run verify:ci`** grün; Remote-Checks **`backend`** und **`e2e-smoke`** grün.

**Fortschreibung (Team-Entscheid, offene Frage geklärt):** Nach vollständiger Belegung der Zeilen **1–3** gilt **weiterhin Fortschreibung in derselben Tabelle** — unter die bestehende Tabelle **weitere Zeilen** im gleichen Spaltenformat anhängen (# 4, 5, …), solange das für Nachvollziehbarkeit sinnvoll ist. **Nur** wenn Projektleitung / Team ausdrücklich einen Schnitt wünscht (z. B. neues Release-Train): archivierte Kopie des „Einträge“-Blocks plus **neue** leere Tabelle starten; nicht der Default.

| # | Merge-Datum (UTC) | PR / Referenz | Notiz |
|---|-------------------|----------------|-------|
| 1 | 2026-04-26 | https://github.com/rhermann90/ERP/pull/42 | FIN4 OpenAPI 5c + `FIN4-external-client-integration.md`; PWA Finanz-Vorbereitung; PR-Punkt5/RELEASE-Verweise in PR #42 |
| 2 | 2026-04-27 | https://github.com/rhermann90/ERP/pull/44 | PWA `apps/web` Finanz-Vorbereitung/Theming; Wave3-Doku/Tickets; E2E 5c-Smoke; `review-checklist-finanz-pr.md` Punkt 5 |
| 3 | 2026-04-27 | https://github.com/rhermann90/ERP/pull/46 | PWA `apps/web` Haupt-Shell: read-only GET `…/payment-intakes` + `…/dunning-reminders`; E2E Finanz-Tabs Mahnwesen/Fortgeschritten; Checkliste 5c-Punkt; `review-checklist-finanz-pr.md` Punkt 5 |

**Agent-Abnahme (Merge auf `main` #46, 2026-04-27 UTC):** PR [#46](https://github.com/rhermann90/ERP/pull/46) squash-gemergt (`e5f1830`); Meilenstein **Zeile 3** befüllt. Remote nach Push auf `main`: Actions [Run 25009668232](https://github.com/rhermann90/ERP/actions/runs/25009668232) — Jobs [`backend`](https://github.com/rhermann90/ERP/actions/runs/25009668232/job/73241784596) und [`e2e-smoke`](https://github.com/rhermann90/ERP/actions/runs/25009668232/job/73242024943) grün; Merge-Commit-SHA = `e5f183084667211491a41d42d06496bb2714e84a`. §5a-pre im PR vor Merge; §5a post-merge als zusätzlicher PR-Kommentar nach grünem `main`-Lauf.

**Agent-Abnahme (Plan-Umsetzung, 2026-04-27):** `npm run verify:ci`, `npm run verify:ci:local-db`, `npx playwright test e2e/login-finance-smoke.spec.ts` — jeweils Exit 0 auf Workspace-HEAD `cab7567`. **Meilenstein-Tabelle:** keine neue Zeile 2/3 — Merge [#43](https://github.com/rhermann90/ERP/pull/43) betraf nur diese P1-3-Doku-Pflege (kein qualifizierender Finanz-Merge laut **Pflege (Agent)**-Kriterien). Nächste qualifizierte Merges trägt das Team wie dort beschrieben ein.

**Agent (Wave3-11-Tool-Todos, 2026-04-27):** Meilenstein-Pflege unverändert laut **Pflege (Agent)**; operative CI/PL/M4/Gate-Liste kanonisch unter **Wave3-11** in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) (*Agent-Abnahme*). **PL-Inbound**-Tabelle dort: **nur PL-Runden** / kein Agent-Eintrag (Team-Entscheid 2026-04-27); **alle** übrigen automatisierbaren Agent-Pflichten **weiterhin** erledigen.

**Agent (Wave3-12-Tool-Todos, 2026-04-27):** **Wave3-12** kanonisch unter *Agent-Abnahme* in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md); **PL-Inbound** nur PL-Runden (kein Agent-Eintrag).

**Agent-Abnahme (Merge auf `main` #44, 2026-04-27 UTC):** PR [#44](https://github.com/rhermann90/ERP/pull/44) gemergt (`833785b`); Meilenstein **Zeile 2** befüllt. Remote: Actions [Run 24979895183](https://github.com/rhermann90/ERP/actions/runs/24979895183) — Jobs `backend` und `e2e-smoke` grün; §5a-pre und §5a post-merge als PR-Kommentare.
## Verweise

- [`P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md`](./P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md)
