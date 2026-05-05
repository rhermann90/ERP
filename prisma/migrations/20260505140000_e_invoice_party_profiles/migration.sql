-- XRechnung: tenant-scoped Seller- und Customer-Stammdaten (UBL Party), ADR-0015-Ergänzung.
CREATE TABLE "tenant_e_invoice_parties" (
    "tenant_id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "street_name" TEXT NOT NULL,
    "city_name" TEXT NOT NULL,
    "postal_zone" TEXT NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "vat_id" TEXT,
    "company_id" TEXT,
    "company_id_scheme_id" TEXT,
    "email" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_e_invoice_parties_pkey" PRIMARY KEY ("tenant_id")
);

CREATE TABLE "customer_e_invoice_parties" (
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "street_name" TEXT NOT NULL,
    "city_name" TEXT NOT NULL,
    "postal_zone" TEXT NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "vat_id" TEXT,
    "company_id" TEXT,
    "company_id_scheme_id" TEXT,
    "email" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_e_invoice_parties_pkey" PRIMARY KEY ("tenant_id", "customer_id")
);
