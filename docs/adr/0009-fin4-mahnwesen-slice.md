# ADR 0009 — Mahnwesen (FIN-4): erster vertikaler Slice (Lesepfad + Persistenzanker)

## Status

Accepted (Stub-Inkrement 2026-04-22). **Ergänzung Slice 2 (Schreibpfad, 2026-04-22):** `POST /invoices/{invoiceId}/dunning-reminders` + SoT **`RECORD_DUNNING_REMINDER`** — siehe unten. **Slice 3 (Read-Stub Konfig, 2026-04-22):** `GET /finance/dunning-reminder-config` — MVP-Defaults. **Slice 4 (2026-04-22):** Tabelle **`dunning_tenant_stage_config`**; bei **9** vollständigen Stufen (Ordinal 1–9 je einmal) liefert `GET /finance/dunning-reminder-config` `configSource: TENANT_DATABASE`, sonst Fallback `MVP_STATIC_DEFAULTS` (In-Memory-Modus immer MVP). **Slice 5 (2026-04-22):** `PUT /finance/dunning-reminder-config` — volle Ersetzung der 9 Zeilen (Transaktion), Rollen wie Zahlungseingang (`ADMIN` / `GESCHAEFTSFUEHRUNG` / `BUCHHALTUNG`), Audit `DUNNING_TENANT_STAGE_CONFIG` / `DUNNING_STAGES_REPLACED`; ohne Postgres `503` / `DUNNING_STAGE_CONFIG_NOT_PERSISTABLE`. **Slice 6:** `PATCH /finance/dunning-reminder-config/stages/{stageOrdinal}` — Teilfelder + Audit `DUNNING_STAGE_PATCHED`; ohne Zeile `404` / `DUNNING_STAGE_CONFIG_ROW_NOT_FOUND`. **Slice 7:** `deleted_at` + `DELETE` soft + Lesefilter; **Slice 8:** Audit+Konfig in **einer** DB-Transaktion (PUT/PATCH/DELETE).

**M4 E-Mail / Vorlagen / Footer / SMTP (Slices 1–5a, geplant 5b):** ab **2026-04-24** in **[ADR 0010](./0010-fin4-m4-dunning-email-and-templates.md)** ausgelagert (dieser ADR bleibt FIN-4-Kern: Mahnereignis + Mandanten-Stufenkonfiguration).

## Kontext

`docs/ERP-Systembeschreibung.md` **§8.10** beschreibt Mahnwesen inkl. Stufen, Vorlagen, Fristen, Gebühren, Audit und optional E-Mail. **ADR-0007** hatte FIN-4 zunächst als separaten Meilenstein ohne Implementierung geführt.

## Entscheidung

1. **Persistenz-Anker:** Tabelle **`dunning_reminders`** (`tenant_id`, `id`, `invoice_id`, `stage_ordinal`, optional `note`, `created_at`) mit zusammengesetztem FK `(tenant_id, invoice_id) → invoices(tenant_id, id)` — mandanten-isoliert, keine stillen Nebenbuchungen in der **8.4**-Kette.
2. **API (Lesepfad):** `GET /invoices/{invoiceId}/dunning-reminders` — **gleiche Leserolle** wie `GET /invoices/{invoiceId}` (`assertCanReadInvoice`). Antwort `{ data: DunningReminderReadRow[] }`, chronologisch sortiert. Bis zur Befüllung durch echte Mahnläufe typischerweise **leere Liste**.
3. **Non-Goals in diesem Inkrement:** Mahnstufen-Konfiguration, automatische Läufe, E-Mail-Versand, Gebührenbuchung, Mehrsprachigkeit — siehe `docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md` Teil 4 FIN-4 / M4.
4. **Abhängigkeit:** Offene Beträge und Zahlungsstatus bleiben **FIN-2/FIN-3**; Mahnobjekt referenziert nur die Rechnung als fachlichen Anker.

### Slice 2 — Schreibpfad (manuelles Mahn-Ereignis)

1. **API:** `POST /invoices/{invoiceId}/dunning-reminders` mit JSON `stageOrdinal` (1–9), optional `note` (≤500 Zeichen), `reason` (≥5, Audit). Antwort `201` mit `dunningReminderId`, `stageOrdinal`, `createdAt`.
2. **SoT:** Aktion **`RECORD_DUNNING_REMINDER`** in `GET /documents/{invoiceId}/allowed-actions?entityType=INVOICE` nur wenn Rechnungsstatus **GEBUCHT_VERSENDET** oder **TEILBEZAHLT** und Rolle wie Zahlungseingang (**ADMIN**, **BUCHHALTUNG**, **GESCHAEFTSFUEHRUNG**). Route prüft `assertCanRecordDunningReminder`.
3. **Persistenz:** Zeile in `dunning_reminders` + Write-Through In-Memory; bei DB-Fehler Rollback im Speicher (analog FIN-3 Zahlungseingang ohne Idempotenz auf Mahnzeile).
4. **Non-Goals (unverändert):** kein Mahnlauf, keine Vorlagen, kein Versand, keine Gebührenbuchung in **8.4**.

### Slice 3 — Mandantenweiser Konfig-Lesepfad (MVP-Defaults)

1. **API:** `GET /finance/dunning-reminder-config` — Antwort `{ data: { configSource, tenantId, stages[] } }` mit neun Stufen (Ordinal 1–9); bei fehlender vollständiger DB-Konfig: `configSource: "MVP_STATIC_DEFAULTS"`.
2. **Auth:** `assertCanReadInvoice` (wie Mahn-Liste je Rechnung).

### Slice 4 — Persistierte Mandanten-Stufen (Lesepfad)

1. **Persistenz:** Tabelle **`dunning_tenant_stage_config`** (`tenant_id`, `stage_ordinal`, `days_after_due`, `fee_cents`, `label`, PK `(tenant_id, stage_ordinal)`).
2. **Vollständigkeit:** Genau **9** Zeilen mit Ordinal **1–9** je einmal → `configSource: "TENANT_DATABASE"`; jede andere Kombination (0 Zeilen, Lücken, Duplikate) → Fallback wie Slice 3.
3. **Folge-Inkremente:** Versionierung optional, Konsistenz mit `dunning_reminders.stage_ordinal`, Vorlagen/E-Mail (M4).

### Slice 5 — Mandanten-Stufen schreiben (`PUT`)

1. **API:** `PUT /finance/dunning-reminder-config` mit JSON `{ stages: DunningStageConfigReadRow[9], reason }` — Ordinal **1–9** je einmal; `label` ≤ 200 Zeichen.
2. **Auth:** `assertCanManageDunningTenantStageConfig` — gleiche Rollenmatrix wie `POST /finance/payments/intake`.
3. **Persistenz:** `DELETE` alle Zeilen des Mandanten + `INSERT` 9 Zeilen in einer Transaktion.
4. **Audit:** `entityType: DUNNING_TENANT_STAGE_CONFIG`, `entityId: tenantId`, `action: DUNNING_STAGES_REPLACED`, `beforeState` / `afterState` kompakt (keine Volltext-Duplikate der Labels).
5. **Non-Goals:** keine Prüfung gegen bereits protokollierte `dunning_reminders` (Operations-Disziplin).

### Slice 6 — PATCH einzelner Stufe

1. **API:** `PATCH …/stages/{stageOrdinal}` mit optional `daysAfterDue`, `feeCents`, `label` (mindestens eines) + `reason`.
2. **Auth:** wie Slice 5.
3. **Fehler:** Keine DB-Zeile für Ordinal → `404` / `DUNNING_STAGE_CONFIG_ROW_NOT_FOUND`.

### Slice 7 — Soft-Delete Zeile

1. **Spalte** `deleted_at` (nullable); `GET` zählt nur aktive Zeilen für Vollständigkeit → sonst MVP.
2. **API:** `DELETE …/stages/{stageOrdinal}` mit `{ reason }` setzt `deleted_at`.
3. **PUT:** `deleteMany` pro Mandant entfernt alle Zeilen inkl. Tombstones, dann 9 neue aktive Zeilen.

### Slice 8 — Audit in DB-Transaktion

Konfig-Schreibzugriffe und `audit_events`-Insert laufen in **einer** `prisma.$transaction`; In-Memory-Audit-Liste wird nach Commit aktualisiert.

## M4 (Vorlagen, Footer, E-Mail)

Spezifikation und Nicht-Ziele für **M4 Slices 1–5a** sowie Platzhalter **Slice 5b**: **[ADR 0010 — FIN-4 / M4: Vorlagen, Footer und E-Mail](./0010-fin4-m4-dunning-email-and-templates.md)**.

## Konsequenzen

- Postgres-Migrationen **`dunning_reminders`**, **`dunning_tenant_stage_config`** (dieser ADR); Hydrate **Mahn-Ereignisse** in den **In-Memory-Repos** beim App-Start (analog `payment_intakes`).
- Tabellen **`dunning_tenant_stage_templates`**, **`dunning_tenant_email_footer`**, **`dunning_email_sends`** existieren im gleichen Schema und hängen fachlich an §8.10 — **beschrieben in ADR 0010**; App-Start hydratisiert deren Zeilen wie in 0010 dokumentiert.
- PWA **Finanz (Vorbereitung)** lädt Mahn-Liste mit „GET Rechnung“ mit; Schreibpfad Mahn-Ereignis über denselben Screen (SoT) bzw. Haupt-Shell mit `executeActionWithSotGuard`.
- Folge-Inkremente (Kern vs. M4): automatische Mahnläufe / Orchestrierung siehe **ADR 0010** Abschnitt Slice 5b und Roadmap `docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`.
