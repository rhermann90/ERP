# M4 — Mini-Slice 5b: Mahnlauf-Orchestrierung (nach Architekturabstimmung)

> **Hinweis (Entwicklungsphase):** Begriffe wie „PL“, „Projektleitung“, „PL-Gate“ in diesem Ticket sind **historisch**. In der aktuellen Phase steuern **Team / Maintainer:in** über Tickets, ADRs und CI-Gates; verbindlich ist nur die kanonische Policy in [AGENTS.md](../../AGENTS.md) Punkt 6. „PL“ bleibt im Compliance-Ledger als Kürzel für interne Release-/Freigabe-Owner reserviert (relevant erst vor Mandanten-Produktiv-Go).

**Status:** **5b-0** und **5b-1** im Repo umgesetzt; ~~5b-2~~ (Cron/AUTO) **entfernt** 2026-04-25 — [ADR-0011](../adr/0011-fin4-semi-dunning-context.md).  
**Rahmen:** [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md); **kein** Mix mit **8.4(2–6)** (Option B) oder **Pfad C** in derselben Lieferung.

## Architektur-/Sicherheitsabstimmung — vor Umsetzung abstimmen

Team / Review trägt hier **Datum + Entscheid** ein (oder verweist auf Protokoll). **Protokoll 2026-04-23:** Tabelle mit **MVP-Team-Defaults** (5b-0). **Protokoll 2026-04-24 (5b-1):** Zeilen 5–7 für erste **EXECUTE**-Lieferung geschärft — siehe Entscheid-Spalte; ADR-0010 Abschnitt 5b-1 **Accepted**. **Protokoll 2026-04-26 (P1-Wave-3 Phase 0, Doku-Sync):** Zeile **5** bleibt: kein SMTP-Batch **im** Mahnlauf-`POST`; **M4 Slice 5c** als **separater** `POST …/send-emails` erfüllt die Intention „Massen-E-Mail nach separatem Release-/Go-Schritt“ mit [`M4-BATCH-DUNNING-EMAIL-SPEC.md`](./M4-BATCH-DUNNING-EMAIL-SPEC.md) — **Team/Maintainer** bestätigt oder korrigiert schriftlich (Link ersetzen).

**Agent (Wave3-10-Tool-Todos, 2026-04-27):** *historisch* — Ziel war *Link ersetzen* / Inbound-Spiegel; **superseded** durch **Team-Entscheid 2026-04-27:** Inbound-Tabelle in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) *(Dateiname historisch)* wird **nicht** repo-seitig befüllt. Fließtext *Link ersetzen* hier bleibt **optional** nur durch **Team/Maintainer** **direkt** in diesem Ticket, ohne Inbound-Tabelle.

**Agent (Wave3-11-Tool-Todos, 2026-04-27):** vollständige operative Liste siehe **Wave3-11** unter *Agent-Abnahme* in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md); **Inbound** dort **nicht gepflegt** (Team-Entscheid).

**Agent (Wave3-12-Tool-Todos, 2026-04-27):** **Wave3-12** unter *Agent-Abnahme* in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md); **Inbound** nur Team-Runden (kein Agent-Eintrag).

**Inbound (Team) (Team-Entscheid 2026-04-27):** Die Tabelle in PL-WAVE3 wird **nicht** vom Agenten befüllt (nur Team-Runden / außerhalb); Querverweise auf „dieselbe Bestätigung verlinkt“ in Inbound entfallen. [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) (*Audit-/Architektur-Protokoll*) bleibt **eigenständig** (manuell durch Team/Release-Owner). **Agent:** übrige automatisierbare Pflege **weiterhin** erledigen.

| # | Thema | Optionen / Frage | Entscheid (Team) |
|---|--------|------------------|----------------|
| 1 | **Umfang erste Lieferung** | Nur **Lesepfad** „Kandidaten“ vs. **Dry-Run** vs. **Ausführung** | **5b-0:** `GET /finance/dunning-reminder-candidates`. **5b-1:** `POST /finance/dunning-reminder-run` mit `DRY_RUN` und `EXECUTE` (nur `dunning_reminders`; kein Batch-E-Mail). ~~5b-2 Cron~~ **entfernt** (2026-04-25). |
| 2 | **Referenzdatum** | `dueDate` vs. Buchungsdatum vs. `issueDate` | **MVP:** Anker = **`issueDate`**. Fristende Stufe = `issueDate` + `daysAfterDue` der **Zielstufe**; **Kalender- oder Werktage** + Mandantenzeitzone gemäß **ADR-0011** / Automation `payment_term_day_kind`. Query `asOfDate` (ISO), Default **heute** in Mandanten-**IANA-Zeitzone**. |
| 3 | **Eligibility** | Gleiche Regeln wie `RECORD_DUNNING_REMINDER`? | **Ja** — Status **GEBUCHT_VERSENDET** / **TEILBEZAHLT**, offener Betrag > 0 wie Zahlungseingang. Keine Kunden-Mahnsperre MVP. Ohne `issueDate` / `totalGrossCents`: kein Kandidat. |
| 4 | **Stufenlogik** | Eine Zielstufe vs. Auto-Eskalation | **Eine Zielstufe** pro Request (`stageOrdinal` Pflicht). Eskalation: `max(bisherige dunning_reminders.stage_ordinal)` = `stageOrdinal - 1` bzw. **0** bei Stufe **1**. |
| 5 | **E-Mail** | Batch-`send-email` im Mahnlauf? | **5b-1 MVP:** **Kein** Aufruf von `…/send-email` im Mahnlauf-POST; Massen-E-Mail nur nach **separatem Release-/Go-Schritt** (Slice 5c / Spec). |
| 6 | **Idempotenz** | Pro-Lauf-Key vs. pro Rechnung | **5b-1:** Header **`Idempotency-Key`** (UUID); Fingerprint aus `stageOrdinal`, `asOfDate`, sortierte `invoiceIds` bzw. „alle“. Replay/Mismatch wie ADR-0010; Tabelle `dunning_reminder_run_intents` (Postgres). |
| 7 | **Ausführungsmodell** | Sync HTTP vs. Job | **5b-1:** synchroner `POST` (kein 202/Job). ~~Cron-Tick~~ entfällt. |
| 8 | **Priorität vs. Wave3** | Option A vs. B/C/D | **Option A** bestätigt; **B/C/D** nicht parallel zu 5b-0 ohne Gate. |
| 9 | **Mandanten-Modus Mahnlauf** | OFF / SEMI / ~~AUTO~~ | **Nur `OFF` und `SEMI`** (Persistenz + `GET|PATCH /finance/dunning-reminder-automation`). **SEMI:** UI/Batch `DRY_RUN`/`EXECUTE`. **AUTO** und Hintergrund-Cron **entfernt** (ADR-0011). |
| 10 | **UI-Ort** | Grundeinstellungen vs. Finanz-Vorbereitung | **Bis Team-Priorität:** Finanz-Vorbereitung + API; Umzug „Grundeinstellungen“ = späteres UX-Slice. |
| 11 | **E-Mail + Mahnlauf** | `EXECUTE` ohne Mail | Unverändert: kein Batch-5a in `POST …/dunning-reminder-run`. |
| 12 | **M4 Slice 5c (Batch-E-Mail, separater Pfad)** | Neuer Endpoint vs. Zeile 5/11 | **Doku-Sync 2026-04-26:** `POST /finance/dunning-reminder-run/send-emails` ist **zulässig** und **getrennt** von `POST …/dunning-reminder-run`; weiterhin **kein** SMTP-Batch **innerhalb** des Mahnlauf-POST. Spec + Vertrag: [`M4-BATCH-DUNNING-EMAIL-SPEC.md`](./M4-BATCH-DUNNING-EMAIL-SPEC.md), ADR-0010; **Compliance-Produktiv-Go** (vor Mandanten-Live, nicht Merge): [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) mit StB/DSB/Release-Owner. |

## Ziel (Slice 5b, fachlich)

Aus Mandanten-Stufenkonfiguration und Rechnungs-/Zahlungsdaten **ermitteln**, welche Rechnungen für welche Mahnstufe **anstehen**, optional **ausführen**: `dunning_reminders`-Zeile(n) + ggf. E-Mail-Versand (Wiederverwendung [Slice 5a](./M4-MINI-SLICE-5-REAL-SMTP-2026-04-24.md)), mit Audit und ohne stillen Bruch der **8.4**-Kette ([ADR 0007](../adr/0007-finance-persistence-and-invoice-boundaries.md)).

## Akzeptanzkriterien (nach Freigabe — Zielbild)

- Mandantenscope und Auth konsistent mit bestehenden FIN-4/M4-Endpunkten (`assertCanReadInvoice` / `assertCanRecordDunningReminder` je nach Schreib/Lese-Pfad).
- Deterministische Eligibility; dokumentierte Fehlercodes für „nicht fällig“, „Stufe ungültig“, „Konfig unvollständig“.
- Keine doppelte Eskalation innerhalb desselben Laufs (Idempotenz oder Klärung im Team).
- OpenAPI, `error-codes.json`, `finance-fin0-openapi-mapping.md`, Persistenz-`it` bei neuen DB-Objekten.
- `npm run verify:ci` (bzw. `verify:ci:local-db` wenn Migration).

## Out-of-Scope (Standard, bis Team erweitert)

- Vollständiger **8.4(2–6)**-Motor; **Pfad C** Rechnungsstatus.
- **Massenversand** ohne explizites Architektur-/Go-Dokument (Rate-Limits, SMTP-Policy) — **Ausnahme dokumentiert 2026-04-26:** Slice **5c** ist der explizit spezifizierte Batch-Pfad (Zeile 12); **Mandanten-Produktiv-Go** weiterhin nur mit StB/DSB/Release-Owner und Checkliste (nicht Merge-Gate).
- ~~**Cron** in Produktion~~ (entfernt).
- Automatischer **Empfänger** aus Kundenstamm (bleibt explizit wie 5a, sofern nicht team-gewünscht).

## Referenzen

- **M4 E-Mail / Vorlagen / SMTP:** [ADR 0010](../adr/0010-fin4-m4-dunning-email-and-templates.md) (Slices 1–5a; Abschnitt **5b**).  
- **Mahn-Ereignis + Stufen-Konfig:** [ADR 0009](../adr/0009-fin4-mahnwesen-slice.md).  
- **SEMI-Kontext / Fälligkeit:** [ADR 0011](../adr/0011-fin4-semi-dunning-context.md).  
- Vorläufer: [M4-MINI-SLICE-5-REAL-SMTP-2026-04-24.md](./M4-MINI-SLICE-5-REAL-SMTP-2026-04-24.md).

## Implementierungs-Checkliste (nach Architekturabstimmung + ADR Accepted)

1. Prisma/OpenAPI/Fehlercodes gemäß ADR-0010 / 0011.  
2. Service-Schicht: Eligibility + Aufruf `dunning-reminder-service` / ggf. E-Mail separat.  
3. Routen in `finance-dunning-config-routes.ts` / `finance-invoice-routes.ts` wie ADR.  
4. `test/*.test.ts` + `test/persistence.integration.test.ts`.  
5. PWA Finanz-Vorbereitung: SEMI-Kontext und Batch wie in Spec/Tickets dokumentiert.  
6. **5b-1** umgesetzt. ~~5b-2~~ entfernt; keine `runDunningAutomationCronTick`-Integration mehr.
