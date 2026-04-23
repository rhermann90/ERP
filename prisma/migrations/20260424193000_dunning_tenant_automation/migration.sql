-- Mandanten-Mahnlauf-Automatisierung (OFF | SEMI | AUTO), optional Cron-Stunde UTC.
-- Siehe docs/adr/0010-fin4-m4-dunning-email-and-templates.md (Erweiterung Automation).

CREATE TABLE "dunning_tenant_automation" (
    "tenant_id" UUID NOT NULL,
    "run_mode" VARCHAR(12) NOT NULL DEFAULT 'SEMI',
    "job_hour_utc" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dunning_tenant_automation_pkey" PRIMARY KEY ("tenant_id")
);
