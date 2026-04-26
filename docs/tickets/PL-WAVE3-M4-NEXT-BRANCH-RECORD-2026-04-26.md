# PL / Umsetzungs-Reihenfolge — Finanz Welle 3 (M4-Rest nach PWA)

**Zweck:** Nachvollziehbare Entscheidung für den nächsten Code-Strang (Plan „Finanz Welle 3 naechster“). Formales PL-Protokoll kann per Verweis ergänzt werden.

## Gewählter Strang für dieses Inkrement

| Priorität | Thema | Status |
|-----------|--------|--------|
| **1** | **API 1b** — `POST /finance/dunning-reminder-run` fail-closed bei persistiertem Mandanten-`runMode` **OFF** (sowohl **DRY_RUN** als **EXECUTE**); **GET** `/finance/dunning-reminder-candidates` und **GET** Automation bleiben erlaubt | umgesetzt (Code + Verträge + Tests) |
| **2** | Massen-E-Mail (separater Pfad **M4 Slice 5c**, nicht im Mahnlauf-POST) | **Doku-Sync 2026-04-26:** Code + Spec [`M4-BATCH-DUNNING-EMAIL-SPEC.md`](./M4-BATCH-DUNNING-EMAIL-SPEC.md) im Repo; Abgleich PL-Tabelle Zeile 12 in [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](./M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md). **Produktiv-Go** weiter nur mit StB/PL und [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md). |
| **3** | **skontoBps**-UI (nur PWA, optional) | optional geliefert — [`RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md`](./RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md); weiteres UX siehe [`FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md`](./FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md) |

## Scope 1b (eingefroren)

- Blockiert: nur **`POST /finance/dunning-reminder-run`** bei gespeicherter Automation-Zeile mit `runMode: OFF`.
- Nicht blockiert: Einzel-Mahnung `POST /invoices/{id}/dunning-reminders`, E-Mail-Pfade, Konfig/Vorlagen, Kandidaten-Lesen.

## PL-Inbound (von PL auszufüllen; keine Agent-URLs)

**Status-Spalte:** von PL auf **Erledigt (PL)** setzen, sobald URL/Datum für die jeweilige Zeile eingetragen sind.

| Ziel | Was eintragen | Status |
|------|----------------|--------|
| [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](./M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md) | Im Fließtext **Protokoll 2026-04-26**: Platzhalter „Link ersetzen“ durch **echtes** externes Protokoll (URL) + Datum, falls PL den Doku-Sync bestätigt/korrigiert. | Offen (PL) |
| Dieses Ticket (Abschnitt unten) | **Formales PL-Meeting / Freigabe-Link** als URL; **Sitzungsdatum** in Prosa ergänzen, wenn von PL gewünscht. | Offen (PL) |
| [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) | Tabelle **„PL-Protokoll (verbindlich …)“**: Spalten **Sitzungsdatum** und **Verlinktes Protokoll** — nur PL. | Offen (PL) |

### Agent-Abnahme (Repo, ohne PL-URLs)

- Struktur **PL-Inbound** inkl. Status-Spalte geprüft; **keine** erfundenen Protokoll-Links eingetragen.
- **Offen (PL):** echte URLs/Daten in M4-Fließtext, `_Formales PL-Meeting…_` unten und FOLLOWUP **PL-Protokoll**; danach Status-Spalte auf **Erledigt (PL)** setzen.
- **Session-Folge (Agent):** erneute Prüfung — Tabellenzeilen weiterhin **Offen (PL)**; Zellen werden **nicht** mit KI- oder Platzhalter-URLs befüllt (wartet auf echte PL-/Team-Inhalte).
- **Wave3-10-Tool-Todos (Agent, 2026-04-27):** erneuter Abgleich — alle drei **PL-Inbound**-Zeilen weiter **Offen (PL)**; nach Eintrag echter URLs/Daten **Erledigt (PL)** durch PL setzen; [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) *PL-Protokoll*-Tabelle parallel mit derselben Quelle befüllen (keine Doppelpflege mit Fiktion).

_Formales PL-Meeting / Freigabe-Link:_ *(vom Team nachzutragen)*
