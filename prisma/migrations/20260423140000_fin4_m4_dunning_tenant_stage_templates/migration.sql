-- FIN-4 M4 Slice 1: Mahn-Vorlagen je Mandant (Read-Persistenz; §8.10 Kanal E-Mail/Druck).
CREATE TABLE "dunning_tenant_stage_templates" (
    "tenant_id" UUID NOT NULL,
    "stage_ordinal" INTEGER NOT NULL,
    "channel" VARCHAR(10) NOT NULL,
    "template_type" VARCHAR(32) NOT NULL,
    "body" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "dunning_tenant_stage_templates_pkey" PRIMARY KEY ("tenant_id","stage_ordinal","channel")
);

CREATE INDEX "dunning_tenant_stage_templates_tenant_id_deleted_at_idx" ON "dunning_tenant_stage_templates"("tenant_id", "deleted_at");
