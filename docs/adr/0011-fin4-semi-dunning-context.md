# ADR-0011 — FIN-4: SEMI-Mahnkontext (Zeitzone, Fristlogik, Kanal)

## Status

Accepted (2026-04-25)

## Kontext

Mandanten-Mahnlauf-Automatisierung soll **ohne Cron/AUTO** auskommen (Betrieb, Compliance, keine stillen Massen-E-Mails). SEMI bleibt: UI-gestützte Vorschau und Ausführung. Für fachlich nachvollziehbare **Fälligkeit** braucht das System Mandantenzeit, optional regionale Feiertage (DE-Bundesland), und eine Regel ob `daysAfterDue` gegenüber dem Rechnungsdatum als **Kalender-** oder **Werktage** (Mo–Fr, DE-Feiertage) zählt.

## Entscheidung

- `run_mode` nur noch **OFF** und **SEMI**; historische **AUTO**-Zeilen werden bei Migration auf **SEMI** normalisiert; `job_hour_utc` entfällt (immer null).
- Persistenz/API: `iana_timezone` (Default `Europe/Berlin`), `federal_state_code` (nullable, DE-Ländercode), `payment_term_day_kind` (`CALENDAR` | `BUSINESS`), `preferred_dunning_channel` (`EMAIL` | `PRINT`).
- Mahn-Kandidaten (`GET …/dunning-reminder-candidates`) und Batch nutzen „heute“ bzw. `asOfDate` in der Mandanten-Zeitzone und die gewählte Fristlogik (Kalender vs. Werktage inkl. Feiertage über Bibliothek `date-holidays`).

## Konsequenzen

- Positiv: kein versteckter Cron-Pfad; nachvollziehbare Fälligkeit; Kanal-Vorgabe für spätere Druck-/E-Mail-UX.
- Risiko: Feiertagsdaten und Werktagsdefinition sind softwareseitig; Abweichungen von StB/Vertragspraxis müssen mit Mandant/StB geklärt werden (kein Rechtsrat).
- Offen (bewusst nicht abschließend): **B3** eine Quelle für Rechnungstext/PDF vs. Eligibility; **B5** formales Mahn-PDF, Archiv, Versand-/Drucknachweis — siehe Tickets und Checklisten vor Produktiv-Go.

### Umsetzungs-Tracking (Code)

- **B3 (Traceability):** Kandidaten-API soll explizit die **berechnete Stufenfrist** (`stageDeadlineIso`) und den verwendeten **Eligibility-Kontext** (Zeitzone, `payment_term_day_kind`, …) ausliefern, damit UI/PDF dieselbe Frist sehen wie die Engine (`deadlineAfterIssueDate` in `src/domain/dunning-due-date.ts`). OpenAPI + Tests anpassen.
- **B5:** Ticket [`docs/tickets/B5-FORMAL-DUNNING-PDF.md`](../tickets/B5-FORMAL-DUNNING-PDF.md); Domänenmodul `src/domain/dunning-formal-notice-spec.ts` (nach Agent-Modus-Freigabe) als Pflichtfeld-Anker für den späteren PDF-Generator.

### Serverseitige Sperre bei OFF (API 1b)

- Wenn die Mandantenzeile `dunning_tenant_automation.run_mode` **OFF** ist, lehnt `POST /finance/dunning-reminder-run` sowohl **DRY_RUN** als auch **EXECUTE** mit **409** und Code **`DUNNING_REMINDER_RUN_DISABLED`** ab (Lesepfade `GET …/dunning-reminder-candidates` und Automation-Read bleiben erlaubt; PWA OFF-1a und HTTP-1b konsistent).

## Bezug

- Präzisiert/supersediert in ADR-0010 beschriebene **AUTO**- und **5b-2**-Cron-Pfade (entfernt).
- OpenAPI: `docs/api-contract.yaml` (Automation-Read/PATCH, Kandidaten-`asOfDate`).
