-- §5.4 / §8.6: Differenzbuchungen (Aufmassversionspaar, LV-Netto-Delta); ADR-0020
CREATE TABLE "difference_bookings" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "measurement_id" UUID NOT NULL,
    "predecessor_measurement_version_id" UUID NOT NULL,
    "subsequent_measurement_version_id" UUID NOT NULL,
    "kind" VARCHAR(64) NOT NULL,
    "amount_net_cents" INTEGER NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "reference_invoice_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID NOT NULL,
    CONSTRAINT "difference_bookings_pkey" PRIMARY KEY ("tenant_id","id")
);

CREATE UNIQUE INDEX "difference_bookings_tenant_subsequent_key" ON "difference_bookings"("tenant_id", "subsequent_measurement_version_id");

CREATE INDEX "difference_bookings_tenant_project_idx" ON "difference_bookings"("tenant_id", "project_id");
