-- Vertikaler Domänenschnitt: Offer + OfferVersion (ADR-0003)
-- Tenant-scoped composite keys; kein CASCADE auf Versionstabellen.

CREATE TABLE "offers" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "current_version_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE TABLE "offer_versions" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "lv_version_id" UUID NOT NULL,
    "system_text" TEXT NOT NULL,
    "editing_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    "released_at" TIMESTAMPTZ,

    CONSTRAINT "offer_versions_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE UNIQUE INDEX "offer_versions_tenant_id_offer_id_version_number_key" ON "offer_versions"("tenant_id","offer_id","version_number");

CREATE INDEX "offer_versions_tenant_id_status_idx" ON "offer_versions"("tenant_id","status");

ALTER TABLE "offer_versions" ADD CONSTRAINT "offer_versions_tenant_id_offer_id_fkey"
 FOREIGN KEY ("tenant_id","offer_id") REFERENCES "offers"("tenant_id","id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
