-- Mandanten-Mahnlauf: AUTO entfällt (nur OFF | SEMI). SEMI-Kontext: Zeitzone, Bundesland, Kalender/Werktage, Kanal.
UPDATE "dunning_tenant_automation"
SET "run_mode" = 'SEMI', "job_hour_utc" = NULL
WHERE "run_mode" = 'AUTO';

ALTER TABLE "dunning_tenant_automation"
  ADD COLUMN "iana_timezone" VARCHAR(64) NOT NULL DEFAULT 'Europe/Berlin',
  ADD COLUMN "federal_state_code" VARCHAR(4) NULL,
  ADD COLUMN "payment_term_day_kind" VARCHAR(16) NOT NULL DEFAULT 'CALENDAR',
  ADD COLUMN "preferred_dunning_channel" VARCHAR(10) NOT NULL DEFAULT 'EMAIL';
