-- M4 Slice 5b-1: Idempotenz fuer Mahnlauf-EXECUTE (ADR-0010).
CREATE TABLE "dunning_reminder_run_intents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "fingerprint" VARCHAR(128) NOT NULL,
    "response_json" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dunning_reminder_run_intents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dunning_reminder_run_intents_tenant_id_idempotency_key_key"
    ON "dunning_reminder_run_intents"("tenant_id", "idempotency_key");

CREATE INDEX "dunning_reminder_run_intents_tenant_id_idx"
    ON "dunning_reminder_run_intents"("tenant_id");
