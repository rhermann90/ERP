-- ADR-0005 (LV §9) + ADR-0004 (Aufmass): Postgres-Persistenz, tenant-scoped composite keys.
-- Zyklische FKs (Katalog <-> aktuelle Version, Aufmass <-> aktuelle Version) DEFERRABLE wie Offer-Slice.
-- offer_versions.lv_version_id -> lv_versions (FIN-2-Start-Gate G5: verbindliche LV-Bezugsgröße).

CREATE TABLE "lv_catalogs" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "project_id" UUID,
    "name" TEXT NOT NULL,
    "current_version_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    CONSTRAINT "lv_catalogs_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE TABLE "lv_versions" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "lv_catalog_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "header_system_text" TEXT NOT NULL,
    "header_editing_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    CONSTRAINT "lv_versions_pkey" PRIMARY KEY ("tenant_id","id"),
    CONSTRAINT "lv_versions_tenant_lv_catalog_id_fkey"
      FOREIGN KEY ("tenant_id","lv_catalog_id") REFERENCES "lv_catalogs"("tenant_id","id")
      ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX "lv_versions_tenant_id_lv_catalog_id_version_number_key"
  ON "lv_versions"("tenant_id","lv_catalog_id","version_number");

ALTER TABLE "lv_catalogs" ADD CONSTRAINT "lv_catalogs_tenant_current_version_id_fkey"
  FOREIGN KEY ("tenant_id","current_version_id") REFERENCES "lv_versions"("tenant_id","id")
  ON DELETE RESTRICT ON UPDATE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE "lv_structure_nodes" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "lv_version_id" UUID NOT NULL,
    "parent_node_id" UUID,
    "kind" TEXT NOT NULL,
    "sort_ordinal" TEXT NOT NULL,
    "system_text" TEXT NOT NULL,
    "editing_text" TEXT NOT NULL,
    CONSTRAINT "lv_structure_nodes_pkey" PRIMARY KEY ("tenant_id","id"),
    CONSTRAINT "lv_structure_nodes_tenant_lv_version_id_fkey"
      FOREIGN KEY ("tenant_id","lv_version_id") REFERENCES "lv_versions"("tenant_id","id")
      ON DELETE CASCADE ON UPDATE RESTRICT
);

ALTER TABLE "lv_structure_nodes" ADD CONSTRAINT "lv_structure_nodes_tenant_parent_node_id_fkey"
  FOREIGN KEY ("tenant_id","parent_node_id") REFERENCES "lv_structure_nodes"("tenant_id","id")
  ON DELETE RESTRICT ON UPDATE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE "lv_positions" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "lv_version_id" UUID NOT NULL,
    "parent_node_id" UUID NOT NULL,
    "sort_ordinal" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "system_text" TEXT NOT NULL,
    "editing_text" TEXT NOT NULL,
    "stamm_positions_ref" UUID,
    CONSTRAINT "lv_positions_pkey" PRIMARY KEY ("tenant_id","id"),
    CONSTRAINT "lv_positions_tenant_lv_version_id_fkey"
      FOREIGN KEY ("tenant_id","lv_version_id") REFERENCES "lv_versions"("tenant_id","id")
      ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT "lv_positions_tenant_parent_node_id_fkey"
      FOREIGN KEY ("tenant_id","parent_node_id") REFERENCES "lv_structure_nodes"("tenant_id","id")
      ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX "lv_structure_nodes_tenant_lv_version_id_idx" ON "lv_structure_nodes"("tenant_id","lv_version_id");
CREATE INDEX "lv_positions_tenant_lv_version_id_idx" ON "lv_positions"("tenant_id","lv_version_id");

CREATE TABLE "measurements" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "lv_version_id" UUID NOT NULL,
    "current_version_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    CONSTRAINT "measurements_pkey" PRIMARY KEY ("tenant_id","id"),
    CONSTRAINT "measurements_tenant_lv_version_id_fkey"
      FOREIGN KEY ("tenant_id","lv_version_id") REFERENCES "lv_versions"("tenant_id","id")
      ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE "measurement_versions" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "measurement_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,
    CONSTRAINT "measurement_versions_pkey" PRIMARY KEY ("tenant_id","id"),
    CONSTRAINT "measurement_versions_tenant_measurement_id_fkey"
      FOREIGN KEY ("tenant_id","measurement_id") REFERENCES "measurements"("tenant_id","id")
      ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX "measurement_versions_tenant_measurement_version_number_key"
  ON "measurement_versions"("tenant_id","measurement_id","version_number");

ALTER TABLE "measurements" ADD CONSTRAINT "measurements_tenant_current_version_id_fkey"
  FOREIGN KEY ("tenant_id","current_version_id") REFERENCES "measurement_versions"("tenant_id","id")
  ON DELETE RESTRICT ON UPDATE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE "measurement_positions" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "measurement_version_id" UUID NOT NULL,
    "lv_position_id" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "note" TEXT,
    CONSTRAINT "measurement_positions_pkey" PRIMARY KEY ("tenant_id","id"),
    CONSTRAINT "measurement_positions_tenant_measurement_version_id_fkey"
      FOREIGN KEY ("tenant_id","measurement_version_id") REFERENCES "measurement_versions"("tenant_id","id")
      ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT "measurement_positions_tenant_lv_position_id_fkey"
      FOREIGN KEY ("tenant_id","lv_position_id") REFERENCES "lv_positions"("tenant_id","id")
      ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX "measurement_positions_tenant_measurement_version_id_idx"
  ON "measurement_positions"("tenant_id","measurement_version_id");

ALTER TABLE "offer_versions" ADD CONSTRAINT "offer_versions_tenant_lv_version_id_fkey"
  FOREIGN KEY ("tenant_id","lv_version_id") REFERENCES "lv_versions"("tenant_id","id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
