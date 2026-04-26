# ADR 0010 — FIN-4 / M4: Vorlagen, Footer und E-Mail (Vorschau bis SMTP)

## Status

Accepted (Konsolidierung aus ADR-0009, 2026-04-24). **Related:** [ADR 0009 — Mahnwesen FIN-4 Kern](./0009-fin4-mahnwesen-slice.md) (Mahnereignis, Mandanten-Stufenkonfiguration Slices 2–8). M4-Abschnitte wurden aus 0009 hierher verlagert, damit 0009 der **Kern-FIN-4**-ADR bleibt.

## Kontext

`docs/ERP-Systembeschreibung.md` **§8.10** (Mahnwesen) umfasst neben Stufen und Gebühren auch **Vorlagen** und optional **E-Mail**. Die technische Umsetzung erfolgt in vertikalen **M4 Mini-Slices** (Lesepfade zuerst, dann Schreibpfade, dann E-Mail-Pipeline). **Stufenmetadaten** (`days_after_due`, `fee_cents` für Platzhalter „Mahngebühr“) und **Ordinal-Gültigkeit** hängen am Konfig-Read in [ADR 0009](./0009-fin4-mahnwesen-slice.md); diese ADR beschreibt ausschließlich die **M4 E-Mail/Vorlagen-Schicht**.

## Entscheidung (M4 — Slice 1, Vorlagen-Read, ohne Versand)

1. **Persistenz:** Tabelle **`dunning_tenant_stage_templates`** (`tenant_id`, `stage_ordinal`, `channel` `EMAIL`|`PRINT`, `template_type` `REMINDER`|`DEMAND_NOTE`|`DUNNING`, `body` Text, optional `deleted_at`).
2. **Vollständigkeit:** **18** aktive Zeilen (Ordinal **1–9** × beide Kanäle, `deleted_at IS NULL`) → `GET /finance/dunning-reminder-templates` liefert `templateSource: TENANT_DATABASE`; sonst **MVP-Default-Texte** (`MVP_STATIC_DEFAULTS`) mit §8.10-illustrativen Platzhaltern — **ohne** serverseitige Platzhalter-Validierung in diesem Slice.
3. **Auth:** `assertCanReadInvoice` (wie Konfig-Lesepfad).
4. **Non-Goals (Slice 1):** Footer-Stammdaten (Slice 3), Versand, Rendering, HTML-Sanitization — Folge-Slices.

## M4 — Slice 2 (Vorlagen-Text PATCH + Platzhalter-Validierung)

1. **HTTP:** `PATCH /finance/dunning-reminder-templates/stages/{stageOrdinal}/channels/{channel}` mit `{ body, reason }`; Antwort wie GET (Read-Modell).
2. **Validierung:** Server prüft §8.10-Pflichtplatzhalter im `body` vor Persistenz; `templateType` aus Stufe wie MVP (`mvpTemplateTypeForStageOrdinal`).
3. **Transaktion:** Upsert `dunning_tenant_stage_templates` + Insert `audit_events` (`action`: `DUNNING_TEMPLATE_BODY_PATCHED`) in **einer** `prisma.$transaction`.
4. **In-Memory:** Schreibpfad nicht verfügbar (`DUNNING_TEMPLATE_NOT_PERSISTABLE` / 503); Validierungsfehler dennoch 400, sofern Rolle und JSON gültig.

## M4 — Slice 3 (E-Mail-Impressum / Footer-Stammdaten, ohne Versand)

1. **Persistenz:** Tabelle **`dunning_tenant_email_footer`** — eine Zeile pro Mandant (`tenant_id` PK): strukturierte Pflichtfelder für späteren **System-Footer** (§8.10: Impressum aus Stammdaten; optional **Signaturzeile** separates Feld, kein HTML).
2. **HTTP:** `GET /finance/dunning-email-footer` (Lesemodell inkl. `footerSource` `NOT_CONFIGURED` | `TENANT_DATABASE`, `readyForEmailFooter`, `missingMandatoryFields`, `impressumComplianceTier`, `impressumGaps`); `PATCH /finance/dunning-email-footer` mit Teilfeldern + `reason` (mindestens ein Feld ändern).
3. **Auth:** GET wie Vorlagen-Read (`assertCanReadInvoice`); PATCH wie Konfig-Schreiben (`assertCanManageDunningTenantStageConfig`).
4. **Transaktion:** Upsert Footer + `audit_events` (`action`: `DUNNING_EMAIL_FOOTER_PATCHED`, `entityType`: `DUNNING_TENANT_STAGE_CONFIG`, `entityId`: `tenantId`) in **einer** `prisma.$transaction`.
5. **In-Memory:** PATCH nicht verfügbar (`DUNNING_EMAIL_FOOTER_NOT_PERSISTABLE` / 503); GET liefert `NOT_CONFIGURED` mit leeren Feldern.
6. **Non-Goals:** E-Mail-Versand, SMTP, Rendering der Mahnvorlage, fest codierter **Rechtshinweis**-Block (System) — Folge-Slices.
7. **Rechtliches vs. technisches Signal (Risikoabbau):** `readyForEmailFooter` und `missingMandatoryFields` bezeichnen nur die **vom Produkt definierte Mindestbefüllung** (Kontakt/Adresse) für einen späteren technischen Versand-Gate — **kein** Ersatz für eine externe oder steuerliche Prüfung, ob das Impressum zur **Rechtsform** des Mandanten vollständig ist. Zusätzlich liefert die API **`impressumComplianceTier`** (`MINIMAL` \| `EXTENDED`) und **`impressumGaps`** (stabile Hinweis-Codes, keine Rechtsberatung): `EXTENDED` nur wenn Mindestbefüllung erfüllt ist und keine der implementierten Heuristiken greift (z. B. unvollständiges Handelsregister-Paar, fehlende Vertretung, fehlende/ungültige DE-USt-Id). Mandanten-Go bleibt an StB/DSB/PL gebunden ([`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md)).

## M4 — Slice 4 (E-Mail-Vorschau + Versand-Stub, kein SMTP)

1. **HTTP:** `POST /invoices/{invoiceId}/dunning-reminders/email-preview` mit `{ stageOrdinal, reason }` — Antwort `{ data: { …, fullPlainText, readyForEmailFooter, warnings[] } }` (Plain-Text: Vorlage **EMAIL** mit Platzhalterersetzung + System-Footer-Block). **Leserolle** wie `GET` Rechnung / Mahn-Liste (`assertCanReadInvoice`).
2. **HTTP:** `POST /invoices/{invoiceId}/dunning-reminders/send-email-stub` — gleicher Input; prüft `readyForEmailFooter`; **kein** SMTP; schreibt `audit_events` mit `action: DUNNING_EMAIL_SEND_STUB`, `entityType: INVOICE`, `entityId: invoiceId`. **Schreibrolle** wie `RECORD_DUNNING_REMINDER` (`assertCanRecordDunningReminder`).
3. **Fehler:** u. a. `DUNNING_EMAIL_FOOTER_NOT_READY` (400) am Stub, `DUNNING_EMAIL_TEMPLATE_NOT_FOUND` / `DUNNING_EMAIL_STAGE_CONFIG_NOT_FOUND` (404), `DUNNING_EMAIL_STAGE_INVALID` (400), `DOCUMENT_NOT_FOUND` (404).
4. **Non-Goals:** Produktiver SMTP-Versand, Massenversand, HTML-Rendering, vollständiger Rechtshinweis-Block — Folge-Inkremente.

## M4 — Slice 5a (Echter E-Mail-Versand, einzeln, SMTP)

1. **HTTP:** `POST /invoices/{invoiceId}/dunning-reminders/send-email` mit Header **`Idempotency-Key`** (UUID) und Body `{ stageOrdinal, reason, toEmail }` — Plain-Text wie Vorschau (Vorlage **EMAIL** + System-Footer); **Schreibrolle** wie Stub (`assertCanRecordDunningReminder`).
2. **Gates:** `readyForEmailFooter` wie Slice 4; zusätzlich muss der injizierte bzw. aus `ERP_SMTP_*` gebaute **Mail-Transport** konfiguriert sein, sonst **503** `DUNNING_EMAIL_SMTP_NOT_CONFIGURED`.
3. **Idempotenz:** Persistenz `dunning_email_sends` mit Unique `(tenant_id, idempotency_key)`; bei erneutem Request mit gleichem Key und gleichen fachlichen Parametern Antwort **`outcome: REPLAY`** (ohne zweiten SMTP-Versand); bei abweichenden Parametern **400** `DUNNING_EMAIL_IDEMPOTENCY_MISMATCH`.
4. **Audit:** `DUNNING_EMAIL_SENT` (`entityType: INVOICE`, `entityId: invoiceId`) nach erfolgreichem SMTP-Versand.
5. **Fehler:** **502** `DUNNING_EMAIL_SMTP_ERROR` bei Transport-/Relay-Fehlern.
6. **Non-Goals:** Massenversand, Cron/Job-Orchestrierung, automatischer Empfänger aus Kundenstamm — Folge-Slices.

## M4 — Slice 5b (Mahnlauf-Orchestrierung)

**Status dieses Abschnitts:** **Accepted** für **Phase 5b-0** (2026-04-23) und **Phase 5b-1** (2026-04-24). PL-Entscheide: Ticket [`docs/tickets/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](../tickets/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md). ~~**5b-2** (Hintergrund-Cron)~~ — **superseded 2026-04-25:** Cron und Modus **AUTO** entfernt; SEMI-Kontext und Fälligkeit siehe **[ADR-0011](./0011-fin4-semi-dunning-context.md)**.

### Zielbild

Aus **`dunning_tenant_stage_config`** bzw. dem gleichen **Konfig-Lesemodell** wie `GET /finance/dunning-reminder-config` ([ADR 0009](./0009-fin4-mahnwesen-slice.md) — inkl. `MVP_STATIC_DEFAULTS` mit 9 Stufen) und dem Rechnungs-/Zahlungsbild **Kandidaten-Rechnungen** für **eine** gewählte Mahnstufe ermitteln. **5b-0:** ausschließlich Lesen; **keine** Mutation, **kein** SMTP. Spätere Phasen: optional `dunning_reminders` protokollieren und/oder **Slice 5a** `POST /invoices/{invoiceId}/dunning-reminders/send-email` — ohne Mahngebühr still in **8.4** einzumischen ([ADR 0007](./0007-finance-persistence-and-invoice-boundaries.md)).

### Phasierung (Accepted vs. geplant)

| Phase | HTTP | Rolle / Semantik |
|-------|------------------|------------------|
| **5b-0** (Accepted) | `GET /finance/dunning-reminder-candidates?stageOrdinal={1–9}&asOfDate={yyyy-mm-dd optional}` | `assertCanReadInvoice` (wie Vorlagen/Footer). **Keine** Mutation. Antwort-Envelope `{ data: { configSource, asOfDate, stageOrdinal, daysAfterDueForStage, eligibilityContext, candidates[] } }` — `eligibilityContext` = für Frist und Default-`asOfDate` verwendeter Mandanten-Kontext (Zeitzone, optional DE-Bundesland, Kalender-/Werktage, Kanal; ADR-0011 **B3**). `asOfDate` = **Kalendertag in der Mandanten-Zeitzone** (Default „heute“). Jedes Listenelement: `invoiceId`, `dueDate` (MVP = `issueDate`), **`stageDeadlineIso`** (berechnetes Ende der Stufenfrist, gleiche Engine wie Eligibility), `openAmountCents`, optional `lastDunningStageOrdinal` (fehlt = noch kein Mahn-Ereignis). |
| **5b-1** (Accepted) | `POST /finance/dunning-reminder-run` mit JSON-Body `{ stageOrdinal, reason, mode: "DRY_RUN" \| "EXECUTE", asOfDate?: yyyy-mm-dd, invoiceIds?: uuid[], note?: string }` | **`DRY_RUN`:** `assertCanReadInvoice`; **keine** Mutation; Antwort mit `planned[]` je Zielrechnung inkl. **`stageDeadlineIso`** (wie 5b-0-Kandidatenzeile; gleiche Eligibility). **`EXECUTE`:** `assertCanRecordDunningReminder`; Header **`Idempotency-Key`** (UUID, Pflicht); schreibt pro Rechnung ein Mahn-Ereignis wie `POST /invoices/{invoiceId}/dunning-reminders` (**kein** Batch-Aufruf von Slice **5a** `send-email` in dieser Lieferung). Optionaler Body `asOfDate` wie 5b-0 (Default **heute** in Mandanten-IANA-Zeitzone, siehe ADR-0011). `invoiceIds` optional: Teilmenge der Kandidaten; wenn weggelassen → alle Kandidaten dieser Stufe. Sortierung deterministisch nach `invoiceId`. |
| ~~**5b-2**~~ | ~~Cron `POST /internal/cron/dunning-automation`~~ | **Entfernt** (2026-04-25) — siehe ADR-0011. |

### Mandanten-Automation (Modus, persistiert)

1. **Tabelle** `dunning_tenant_automation` (`tenant_id` PK, `run_mode` **OFF** \| **SEMI**, `job_hour_utc` historisch immer null, `iana_timezone`, `federal_state_code`, `payment_term_day_kind`, `preferred_dunning_channel`, `updated_at`) — Details **[ADR-0011](./0011-fin4-semi-dunning-context.md)**.
2. **HTTP:** `GET /finance/dunning-reminder-automation` — `assertCanReadInvoice`; Antwort inkl. SEMI-Kontextfeldern — ohne Zeile: `NOT_CONFIGURED` und effektiv **SEMI**.
3. **HTTP:** `PATCH /finance/dunning-reminder-automation` — `assertCanManageDunningTenantStageConfig`; Body `{ reason, runMode, … }` mit optionalen SEMI-Feldern; nur Postgres (`503` `DUNNING_AUTOMATION_NOT_PERSISTABLE` im In-Memory-Modus); Audit **`DUNNING_TENANT_AUTOMATION_PATCHED`** (`entityType` `DUNNING_TENANT_STAGE_CONFIG`, `entityId` = `tenantId`).
4. **PL:** UI-Ort „Grundeinstellungen“ vs. Finanz-Vorbereitung — Ticket [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](../tickets/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md); technischer Default bis PL: Erweiterung Finanz-Vorbereitung + diese API.

### Eligibility (5b-0, an FIN-4-Kern gebunden)

- Rechnungsstatus **GEBUCHT_VERSENDET** oder **TEILBEZAHLT** (analog `RECORD_DUNNING_REMINDER`).
- Offener Betrag **> 0**: `totalGrossCents` minus Summe gebuchter `payment_intakes` (wie Zahlungseingang). Rechnungen ohne `totalGrossCents` werden **nicht** gelistet.
- **Fälligkeitsanker (MVP):** Es existiert im Domain-Modell noch **kein** persistiertes `dueDate`. **Referenzdatum für „fällig“** = `issueDate` (**ISO `yyyy-mm-dd`**, Rechnungsdatum). Mahnfristende = `issueDate` + **`daysAfterDue`** der **Zielstufe** als Kalender- oder Werktage gemäß Mandanten-Automation (**ADR-0011**). Bedingung: Fristende **≤** `asOfDate` (Kalendertag in Mandanten-Zeitzone; Default „heute“).
- **Eskalation:** Pro Request genau **eine** `stageOrdinal`. Kandidat nur, wenn `max(bisherige dunning_reminders.stage_ordinal)` = `stageOrdinal - 1`, bzw. **0** wenn `stageOrdinal === 1` (kein übersprungener Schritt).
- Rechnungen **ohne** `issueDate` werden nicht gelistet (kein stiller Fehler auf Einzelobjekt-Ebene).

### Fehlercodes (5b-0, in `error-codes.json`)

| Code | HTTP | Bedeutung |
|------|------|-----------|
| `DUNNING_RUN_STAGE_INVALID` | 400 | `stageOrdinal` fehlt, liegt außerhalb 1–9 oder hat keine Stufenmetadaten im Read-Modell |
| `DUNNING_RUN_CONFIG_INCOMPLETE` | 409 | Gelieferte Stufenliste unvollständig (weniger als 9 eindeutige Ordinal 1–9) — defensiv; normale Mandanten liefern über `getReadModel` immer 9 Stufen |
| `VALIDATION_FAILED` | 400 | Ungültiges `asOfDate`-Format (nicht `yyyy-mm-dd`) |

**Hinweis:** Leere Kandidatenliste ist **HTTP 200** mit `candidates: []` (kein eigener `DUNNING_RUN_NOTHING_TO_DO`-Code in 5b-0).

### Fehlercodes (5b-1, in `error-codes.json`)

| Code | HTTP | Bedeutung |
|------|------|-----------|
| `DUNNING_RUN_IDEMPOTENCY_MISMATCH` | 400 | Gleicher `Idempotency-Key`, anderer Canonical-Fingerprint (andere Stufe/Datum/invoiceIds). |
| `DUNNING_RUN_INVOICES_INVALID` | 400 | `invoiceIds` enthält UUIDs, die **nicht** in der aktuellen Kandidatenmenge (5b-0-Logik) sind. |

**Idempotenz / Replay (5b-1 `EXECUTE`):** Canonical **Fingerprint** = stabil serialisiert aus `stageOrdinal`, `asOfDate` (aufgelöster Default), sortierter `invoiceIds`-Liste (oder Marker „all“ wenn Parameter fehlt). Speicherung unter `(tenant_id, idempotency_key)` in Tabelle **`dunning_reminder_run_intents`** (Postgres); In-Memory-Modus: prozesslokaler Store. Wiederholung mit gleichem Key + gleichem Fingerprint → **200** und `outcome: REPLAY` mit gespeichertem Response-`data`-JSON (analog Slice 5a `REPLAY`).

### Audit (5b-0)

- **Kein** Audit-Event (Lesepfad).

### Audit (5b-1)

- **`EXECUTE`:** pro erfolgreich gebuchter Rechnung bestehende Mahn-Audit-Kette über `DunningReminderService.record` (wie Einzel-`POST`). Kein zusätzliches Sammel-Audit-Event in dieser Lieferung.

### Konsequenzen (5b-0 / 5b-1)

- **5b-0:** OpenAPI + Mapping + Tests; **keine** Migration.
- **5b-1:** Migration **`dunning_reminder_run_intents`** (Idempotenz), OpenAPI + Mapping + Tests.
- PWA: optionaler Block „Mahnlauf“ weiterhin erst nach separater PL-UI-Entscheid.

## Konsequenzen

- Postgres-Migrationen / Tabellen unter dieser ADR: **`dunning_tenant_stage_templates`**, **`dunning_tenant_email_footer`**, **`dunning_email_sends`**, **`dunning_tenant_automation`**; zugehörige Hydrate/Persistenz-Pfade und E-Mail-Services (`dunning-reminder-email-service`, `dunning-email-compose`, SMTP-Transport).
- PWA **Finanz (Vorbereitung)** bindet Vorlagen/Footer/E-Mail-Preview/Stub/SMTP-Versand ein; SoT für Schreibaktionen wie in Slice 4/5a beschrieben.
- **Hinweis:** `dunning_reminders` und **`dunning_tenant_stage_config`** bleiben fachlich und dokumentarisch in **ADR-0009**; Schema und FKs bleiben ein gemeinsames Postgres-Modell.
- **Slice 5b:** **5b-0** und **5b-1** sind **Accepted** und ticketgebunden — [`docs/tickets/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](../tickets/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md). ~~Cron **5b-2**~~ entfernt (2026-04-25); SEMI-Kontext siehe **[ADR-0011](./0011-fin4-semi-dunning-context.md)**; Runbook-Cron-Datei nur noch Archiv-Hinweis.

## M4 — Slice 5c (Batch-E-Mail nach 5a)

Details und Compliance: [`docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md`](../tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md).

- **HTTP:** `POST /finance/dunning-reminder-run/send-emails` (`DRY_RUN` \| `EXECUTE`); `EXECUTE` mit `confirmBatchSend: true`; pro Zeile `invoiceId`, `toEmail`, eigener `Idempotency-Key`; Wiederverwendung `DunningReminderEmailService.sendEmail`; bei **OFF** 409 wie 5b-1.
- **Non-Goals:** automatischer Empfaenger aus Stammdaten; paralleles SMTP ohne Reihenfolge.
