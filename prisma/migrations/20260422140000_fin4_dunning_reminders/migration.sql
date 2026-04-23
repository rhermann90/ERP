-- FIN-4 Mahnwesen: Tabelle für Mahn-Ereignisse je Rechnung (Slice; ADR-0009).

CREATE TABLE "dunning_reminders" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "stage_ordinal" INTEGER NOT NULL,
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dunning_reminders_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE INDEX "dunning_reminders_tenant_id_invoice_id_idx" ON "dunning_reminders"("tenant_id", "invoice_id");

ALTER TABLE "dunning_reminders" ADD CONSTRAINT "dunning_reminders_tenant_id_invoice_id_fkey" FOREIGN KEY ("tenant_id", "invoice_id") REFERENCES "invoices"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
