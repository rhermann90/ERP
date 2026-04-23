-- FIN-4 M4 Slice 5a: Idempotenz-Protokoll fuer Mahn-E-Mail-Versand.
CREATE TABLE "dunning_email_sends" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "stage_ordinal" INTEGER NOT NULL,
    "recipient_email" VARCHAR(320) NOT NULL,
    "audit_event_id" UUID NOT NULL,
    "smtp_message_id" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dunning_email_sends_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dunning_email_sends_tenant_id_idempotency_key_key" ON "dunning_email_sends"("tenant_id", "idempotency_key");

CREATE INDEX "dunning_email_sends_tenant_id_invoice_id_idx" ON "dunning_email_sends"("tenant_id", "invoice_id");

ALTER TABLE "dunning_email_sends" ADD CONSTRAINT "dunning_email_sends_tenant_id_invoice_id_fkey" FOREIGN KEY ("tenant_id", "invoice_id") REFERENCES "invoices"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
