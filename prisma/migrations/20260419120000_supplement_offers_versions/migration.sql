-- ADR-0002 D5: Nachtrag (SupplementOffer + SupplementVersion), tenant-scoped composite keys

CREATE TABLE "supplement_offers" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "base_offer_version_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "supplement_offers_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE TABLE "supplement_versions" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "supplement_offer_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "lv_version_id" UUID NOT NULL,
    "system_text" TEXT NOT NULL,
    "editing_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "supplement_versions_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE UNIQUE INDEX "supplement_versions_tenant_id_supplement_offer_id_version_number_key" ON "supplement_versions"("tenant_id","supplement_offer_id","version_number");

CREATE INDEX "supplement_versions_tenant_id_status_idx" ON "supplement_versions"("tenant_id","status");

ALTER TABLE "supplement_offers" ADD CONSTRAINT "supplement_offers_tenant_id_offer_id_fkey"
 FOREIGN KEY ("tenant_id","offer_id") REFERENCES "offers"("tenant_id","id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "supplement_offers" ADD CONSTRAINT "supplement_offers_tenant_id_base_offer_version_id_fkey"
 FOREIGN KEY ("tenant_id","base_offer_version_id") REFERENCES "offer_versions"("tenant_id","id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "supplement_versions" ADD CONSTRAINT "supplement_versions_tenant_id_supplement_offer_id_fkey"
 FOREIGN KEY ("tenant_id","supplement_offer_id") REFERENCES "supplement_offers"("tenant_id","id")
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE "supplement_versions" ADD CONSTRAINT "supplement_versions_tenant_id_lv_version_id_fkey"
 FOREIGN KEY ("tenant_id","lv_version_id") REFERENCES "lv_versions"("tenant_id","id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
