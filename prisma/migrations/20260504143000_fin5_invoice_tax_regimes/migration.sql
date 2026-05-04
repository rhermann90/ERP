-- FIN-5 / §8.16: Mandanten-Default, Projekt-Override, Rechnungs-Snapshot-Spalten

CREATE TABLE "tenant_invoice_tax_profiles" (
    "tenant_id" UUID NOT NULL,
    "default_invoice_tax_regime" VARCHAR(64) NOT NULL DEFAULT 'STANDARD_VAT_19',
    "construction_13b_config_json" JSONB,
    CONSTRAINT "tenant_invoice_tax_profiles_pkey" PRIMARY KEY ("tenant_id")
);

CREATE TABLE "project_invoice_tax_overrides" (
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "invoice_tax_regime" VARCHAR(64) NOT NULL,
    "tax_reason_code" VARCHAR(128),
    "construction_13b_config_json" JSONB,
    CONSTRAINT "project_invoice_tax_overrides_pkey" PRIMARY KEY ("tenant_id","project_id")
);

ALTER TABLE "invoices" ADD COLUMN "invoice_tax_regime" VARCHAR(64) NOT NULL DEFAULT 'STANDARD_VAT_19';
ALTER TABLE "invoices" ADD COLUMN "vat_rate_bps_effective" INTEGER NOT NULL DEFAULT 1900;
ALTER TABLE "invoices" ADD COLUMN "tax_reason_code" VARCHAR(128);
