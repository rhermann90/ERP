-- 8.4: LV-Netto + USt-Spalten; FIN-3: Zahlungseingang

ALTER TABLE "invoices" ADD COLUMN "lv_net_cents" INTEGER,
ADD COLUMN "vat_cents" INTEGER;

CREATE TABLE "payment_intakes" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "external_reference" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_intakes_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE UNIQUE INDEX "payment_intakes_tenant_id_idempotency_key_key" ON "payment_intakes"("tenant_id", "idempotency_key");

CREATE INDEX "payment_intakes_tenant_id_invoice_id_idx" ON "payment_intakes"("tenant_id", "invoice_id");

ALTER TABLE "payment_intakes" ADD CONSTRAINT "payment_intakes_tenant_id_invoice_id_fkey" FOREIGN KEY ("tenant_id", "invoice_id") REFERENCES "invoices"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
