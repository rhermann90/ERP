-- FIN-2: Rechnung (Entwurf → gebucht); optionale payment_terms_version_id (FIN-1)

CREATE TABLE "invoices" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "measurement_id" UUID NOT NULL,
    "lv_id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "offer_version_id" UUID,
    "status" TEXT NOT NULL,
    "immutable_from_status" TEXT NOT NULL,
    "invoice_number" TEXT,
    "issue_date" TEXT,
    "total_gross_cents" INTEGER,
    "supplement_offer_id" UUID,
    "supplement_version_id" UUID,
    "payment_terms_version_id" UUID,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE INDEX "invoices_tenant_id_project_id_idx" ON "invoices"("tenant_id","project_id");
