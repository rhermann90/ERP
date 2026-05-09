-- ADR 0019 Spur B: CRM-Stammdaten (Objekt, Kunde, Projekt, Projektkontakt)

CREATE TABLE "crm_construction_sites" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "street" TEXT,
    "postal_code" TEXT,
    "city" TEXT,
    "country_code" CHAR(2),
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    CONSTRAINT "crm_construction_sites_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE INDEX "crm_construction_sites_tenant_id_label_idx" ON "crm_construction_sites"("tenant_id", "label");

CREATE TABLE "crm_customers" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "street" TEXT,
    "postal_code" TEXT,
    "city" TEXT,
    "country_code" CHAR(2),
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    CONSTRAINT "crm_customers_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE INDEX "crm_customers_tenant_id_legal_name_idx" ON "crm_customers"("tenant_id", "legal_name");

CREATE TABLE "crm_projects" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "primary_customer_id" UUID NOT NULL,
    "construction_site_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIV',
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    CONSTRAINT "crm_projects_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE INDEX "crm_projects_tenant_id_primary_customer_id_idx" ON "crm_projects"("tenant_id", "primary_customer_id");

ALTER TABLE "crm_projects" ADD CONSTRAINT "crm_projects_tenant_id_primary_customer_id_fkey"
 FOREIGN KEY ("tenant_id", "primary_customer_id") REFERENCES "crm_customers"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "crm_projects" ADD CONSTRAINT "crm_projects_tenant_id_construction_site_id_fkey"
 FOREIGN KEY ("tenant_id", "construction_site_id") REFERENCES "crm_construction_sites"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "crm_project_contacts" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "customer_id" UUID,
    "role" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    CONSTRAINT "crm_project_contacts_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE INDEX "crm_project_contacts_tenant_id_project_id_idx" ON "crm_project_contacts"("tenant_id", "project_id");

ALTER TABLE "crm_project_contacts" ADD CONSTRAINT "crm_project_contacts_tenant_id_project_id_fkey"
 FOREIGN KEY ("tenant_id", "project_id") REFERENCES "crm_projects"("tenant_id", "id")
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE "crm_project_contacts" ADD CONSTRAINT "crm_project_contacts_tenant_id_customer_id_fkey"
 FOREIGN KEY ("tenant_id", "customer_id") REFERENCES "crm_customers"("tenant_id", "id")
  ON DELETE SET NULL ON UPDATE RESTRICT;
