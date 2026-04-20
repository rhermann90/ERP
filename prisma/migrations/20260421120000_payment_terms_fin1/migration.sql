-- FIN-1: Zahlungsbedingungs-Kopf pro Projekt + append-only Versionen (Spez 8.5)

CREATE TABLE "payment_terms_heads" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "payment_terms_heads_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE UNIQUE INDEX "payment_terms_heads_tenant_id_project_id_key" ON "payment_terms_heads"("tenant_id","project_id");

CREATE TABLE "payment_terms_versions" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "head_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "terms_label" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "payment_terms_versions_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE UNIQUE INDEX "payment_terms_versions_tenant_id_head_id_version_number_key" ON "payment_terms_versions"("tenant_id","head_id","version_number");

CREATE INDEX "payment_terms_versions_tenant_id_head_id_idx" ON "payment_terms_versions"("tenant_id","head_id");

ALTER TABLE "payment_terms_versions" ADD CONSTRAINT "payment_terms_versions_tenant_id_head_id_fkey"
 FOREIGN KEY ("tenant_id","head_id") REFERENCES "payment_terms_heads"("tenant_id","id")
  ON DELETE RESTRICT ON UPDATE RESTRICT;
