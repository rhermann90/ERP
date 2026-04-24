# M4 — Mini-Slice 5b: Mahnlauf-Orchestrierung (nach PL)

**Status:** In Umsetzung — **5b-0** erledigt; **5b-1** (`POST` Mahnlauf) in Arbeit; **5b-2** (Job) zurückgestellt.  
**Rahmen:** [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md); **kein** Mix mit **8.4(2–6)** (Option B) oder **Pfad C** in derselben Lieferung.

## PL-Gate — vor Umsetzung abstimmen

Projektleitung / Review trägt hier **Datum + Entscheid** ein (oder verweist auf Protokoll). **Protokoll 2026-04-23:** Tabelle mit **MVP-Team-Defaults** (5b-0). **Protokoll 2026-04-24 (5b-1):** Zeilen 5–7 für erste **EXECUTE**-Lieferung geschärft — siehe Entscheid-Spalte; ADR-0010 Abschnitt 5b-1 **Accepted**.

| # | Thema | Optionen / Frage | Entscheid (PL) |
|---|--------|------------------|----------------|
| 1 | **Umfang erste Lieferung** | Nur **Lesepfad** „Kandidaten“ (fällige Rechnungen je Stufe) vs. sofort **Ausführung** (POST Mahn+E-Mail gebündelt) vs. nur **Dry-Run** | **5b-0:** `GET /finance/dunning-reminder-candidates`. **5b-1:** `POST /finance/dunning-reminder-run` mit `DRY_RUN` und `EXECUTE` (Mahnzeile `dunning_reminders` nur; kein Batch-E-Mail in dieser Lieferung). **5b-2:** Job weiter zurückgestellt. |
| 2 | **Referenzdatum** | `dueDate` + `days_after_due` aus [`dunning_tenant_stage_config`](../adr/0009-fin4-mahnwesen-slice.md) vs. Buchungs-/Leistungsdatum — welches zählt für „fällig“? | **MVP:** Fälligkeitsanker = **`issueDate`** (Rechnungsdatum), da im Datenmodell noch kein separates `dueDate` persistiert wird. Fristende = `issueDate` + `daysAfterDue` der **Zielstufe** (Kalendertage UTC, keine Feiertagslogik). Optionaler Query `asOfDate` (ISO), Default **heute UTC** (`yyyy-mm-dd`). |
| 3 | **Eligibility** | Gleiche Regeln wie manuelles `RECORD_DUNNING_REMINDER` (nur **GEBUCHT_VERSENDET** / **TEILBEZAHLT**, offener Betrag > 0)? Zusätzliche Sperren (Mahnsperre pro Kunde — out of scope MVP)? | **Ja** — dieselben Status wie `RECORD_DUNNING_REMINDER`; offener Betrag wie Zahlungseingang (`totalGrossCents` minus Summe `payment_intakes`). **Keine** Kunden-Mahnsperre im MVP. Rechnungen **ohne** `issueDate` oder **ohne** `totalGrossCents` erscheinen nicht als Kandidaten (still übersprungen). |
| 4 | **Stufenlogik** | Pro Lauf **eine** Zielstufe vs. automatische Eskalation (nächste Stufe nach letztem `dunning_reminders`-Eintrag)? | **Eine Zielstufe** pro Request (`stageOrdinal` Pflicht-Query). Eskalation: Kandidat nur wenn `max(bisherige dunning_reminders.stage_ordinal)` = `stageOrdinal - 1` bzw. **0** bei Stufe **1** (kein übersprungener Mahnschritt). |
| 5 | **E-Mail** | Orchestrierung ruft nur **Slice 5a** (`send-email`) auf vs. Mahn-Ereignis ohne Mail vs. konfigurierbar pro Lauf | **5b-1 MVP:** `EXECUTE` schreibt **nur** `dunning_reminders` (wie `POST /invoices/{id}/dunning-reminders`). **Kein** Aufruf von `…/send-email` im Mahnlauf-POST; Massen-E-Mail bleibt Folge-PL. |
| 6 | **Idempotenz / Wiederholung** | Pro-Lauf-`Idempotency-Key` (ein Key für ganzen Batch) vs. pro Rechnung; Replay-Semantik analog `dunning_email_sends` | **5b-1:** **Ein** `Idempotency-Key` (UUID) pro `EXECUTE`-Request (Header `Idempotency-Key`); Canonical-Fingerprint aus `stageOrdinal`, `asOfDate`, sortierte `invoiceIds` (oder „alle Kandidaten“ wenn weggelassen). Replay: gleicher Key + gleicher Fingerprint → **200** mit `outcome: REPLAY` und gespeichertem Body; gleicher Key + anderer Fingerprint → **400** `DUNNING_RUN_IDEMPOTENCY_MISMATCH`. Persistenz: Tabelle `dunning_reminder_run_intents` (Postgres); In-Memory-Modus: prozesslokaler Store. |
| 7 | **Ausführungsmodell** | Synchroner HTTP-Request (Timeout-Risiko) vs. **Job** + Status-Polling (neue Tabelle?) | **5b-1:** **synchroner** `POST` (kein 202/Job). **5b-2** weiter out of scope bis PL. |
| 8 | **Priorität vs. Wave3** | Option **A** (M4 weiter) bestätigt vs. Wechsel zu **B/C/D** (Abschnitt „PL-Gate“ in [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md)) | **Option A** bestätigt; **B/C/D** nicht parallel zu 5b-0. |
| 9 | **Mandanten-Modus Mahnlauf** | Nur API vs. **teil-automatisiert** (UI Vorschau/Ausführung) vs. **vollautomatisiert** (Hintergrund nach Regeln) | **Technische Vorgabe (Default bis PL-Eintrag):** `OFF` (kein Job; nur manuelle Einzel-Mahnung), `SEMI` (UI nutzt `DRY_RUN`/`EXECUTE` am Batch-Endpunkt), `AUTO` (Cron ruft internen Endpunkt/Script auf; siehe Runbook). **PL:** Modus und UI-Ort („Grundeinstellungen“ vs. erweiterte Finanz-Vorbereitung) im Ticket nachpflegen. |
| 10 | **UI-Ort Grundeinstellungen** | Neue Mandanten-Settings-Seite vs. Erweiterung bestehender Mahn-Oberfläche | **Bis PL:** Erweiterung **Finanz-Vorbereitung** (Schritt 6) + API `GET|PATCH /finance/dunning-reminder-automation` als pragmatischer Einstieg; Umzug in dedizierte „Grundeinstellungen“-Route = späteres UX-Slice. |
| 11 | **AUTO + E-Mail** | Mahnlauf `EXECUTE` ohne Mail vs. optional Batch-`send-email` | **Unverändert 5b-1:** kein Batch-5a in `POST …/dunning-reminder-run`. **AUTO** schreibt nur Mahnzeilen; Massen-E-Mail weiter **Folge-PL** (Zeile 5). |

## Ziel (Slice 5b, fachlich)

Aus Mandanten-Stufenkonfiguration und Rechnungs-/Zahlungsdaten **ermitteln**, welche Rechnungen für welche Mahnstufe **anstehen**, optional **ausführen**: `dunning_reminders`-Zeile(n) + ggf. E-Mail-Versand (Wiederverwendung [Slice 5a](./M4-MINI-SLICE-5-REAL-SMTP-2026-04-24.md)), mit Audit und ohne stillen Bruch der **8.4**-Kette ([ADR 0007](../adr/0007-finance-persistence-and-invoice-boundaries.md)).

## Akzeptanzkriterien (nach Freigabe — Zielbild)

- Mandantenscope und Auth konsistent mit bestehenden FIN-4/M4-Endpunkten (`assertCanReadInvoice` / `assertCanRecordDunningReminder` je nach Schreib/Lese-Pfad).
- Deterministische Eligibility; dokumentierte Fehlercodes für „nicht fällig“, „Stufe ungültig“, „Konfig unvollständig“.
- Keine doppelte Eskalation innerhalb desselben Laufs (Idempotenz oder Klärung in PL).
- OpenAPI, `error-codes.json`, `finance-fin0-openapi-mapping.md`, Persistenz-`it` bei neuen DB-Objekten.
- `npm run verify:ci` (bzw. `verify:ci:local-db` wenn Migration).

## Out-of-Scope (Standard, bis PL erweitert)

- Vollständiger **8.4(2–6)**-Motor; **Pfad C** Rechnungsstatus.
- **Massenversand** ohne explizites PL (Rate-Limits, SMTP-Policy).
- **Cron** in Produktion ohne Betriebskonzept (kann später an Slice 5b anbinden).
- Automatischer **Empfänger** aus Kundenstamm (bleibt explizit wie 5a, sofern nicht PL-gewünscht).

## Referenzen

- **M4 E-Mail / Vorlagen / SMTP:** [ADR 0010](../adr/0010-fin4-m4-dunning-email-and-templates.md) (Slices 1–5a; Abschnitt **5b**).  
- **Mahn-Ereignis + Stufen-Konfig:** [ADR 0009](../adr/0009-fin4-mahnwesen-slice.md).  
- Vorläufer: [M4-MINI-SLICE-5-REAL-SMTP-2026-04-24.md](./M4-MINI-SLICE-5-REAL-SMTP-2026-04-24.md).

## Implementierungs-Checkliste (nach PL + ADR Accepted)

1. Prisma/OpenAPI/Fehlercodes gemäß ADR-0010 Abschnitt 5b (final).  
2. Service-Schicht: Eligibility + optional Aufruf `dunning-reminder-service` / `dunning-reminder-email-service`.  
3. Route-Datei (neu oder Erweiterung `finance-dunning-config-routes.ts` / `finance-invoice-routes.ts` — wie ADR).  
4. `test/*.test.ts` + ggf. `test/persistence.integration.test.ts`.  
5. PWA **optional** (Finanz-Vorbereitung): nur wenn PL UI verlangt; sonst API-first.  
6. **5b-1** (`POST` DRY_RUN/EXECUTE): umgesetzt nach ADR-0010 Abschnitt 5b-1 Accepted. **5b-2** (Job): Folge-PR.
