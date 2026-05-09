-- W1: optimistic locking for CRM aggregates (ADR 0019); crm_projects already has version_number.
ALTER TABLE "crm_construction_sites" ADD COLUMN "version_number" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "crm_customers" ADD COLUMN "version_number" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "crm_project_contacts" ADD COLUMN "version_number" INTEGER NOT NULL DEFAULT 1;
