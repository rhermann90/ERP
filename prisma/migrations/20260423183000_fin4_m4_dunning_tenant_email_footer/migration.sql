-- M4 Slice 3: structured tenant email footer / Impressum (§8.10), ADR-0009
CREATE TABLE "dunning_tenant_email_footer" (
    "tenant_id" UUID NOT NULL,
    "company_legal_name" VARCHAR(300) NOT NULL DEFAULT '',
    "street_line" VARCHAR(300) NOT NULL DEFAULT '',
    "postal_code" VARCHAR(20) NOT NULL DEFAULT '',
    "city" VARCHAR(120) NOT NULL DEFAULT '',
    "country_code" VARCHAR(2) NOT NULL DEFAULT 'DE',
    "public_email" VARCHAR(320) NOT NULL DEFAULT '',
    "public_phone" VARCHAR(80) NOT NULL DEFAULT '',
    "legal_representative" VARCHAR(300) NOT NULL DEFAULT '',
    "register_court" VARCHAR(200) NOT NULL DEFAULT '',
    "register_number" VARCHAR(120) NOT NULL DEFAULT '',
    "vat_id" VARCHAR(32) NOT NULL DEFAULT '',
    "signature_line" VARCHAR(200) NOT NULL DEFAULT '',
    CONSTRAINT "dunning_tenant_email_footer_pkey" PRIMARY KEY ("tenant_id")
);
