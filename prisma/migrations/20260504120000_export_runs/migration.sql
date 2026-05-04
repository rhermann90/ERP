-- Export-Preflight-Läufe (POST /exports); Mandanten-isolierte Composite-PK wie andere Aggregate.

CREATE TABLE "export_runs" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "validation_errors" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "export_runs_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE INDEX "export_runs_tenant_id_created_at_idx" ON "export_runs"("tenant_id", "created_at");
