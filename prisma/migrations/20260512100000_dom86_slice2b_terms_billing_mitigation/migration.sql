-- DOM-8-6 Slice 2b: Rechnungs-Aggregationskontext (Schlussrechnung-Markierung); Konditions-Differenz-Zeilen (nullable Aufmassversionspaar)
ALTER TABLE "invoices" ADD COLUMN "billing_kind" VARCHAR(32) NOT NULL DEFAULT 'REGULAR';

DROP INDEX IF EXISTS "difference_bookings_tenant_subsequent_key";

ALTER TABLE "difference_bookings" ALTER COLUMN "predecessor_measurement_version_id" DROP NOT NULL;
ALTER TABLE "difference_bookings" ALTER COLUMN "subsequent_measurement_version_id" DROP NOT NULL;

ALTER TABLE "difference_bookings" ADD COLUMN "predecessor_payment_terms_version_id" UUID;
ALTER TABLE "difference_bookings" ADD COLUMN "subsequent_payment_terms_version_id" UUID;

ALTER TABLE "difference_bookings" ADD CONSTRAINT "difference_bookings_pred_ptv_fk"
  FOREIGN KEY ("tenant_id", "predecessor_payment_terms_version_id") REFERENCES "payment_terms_versions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "difference_bookings" ADD CONSTRAINT "difference_bookings_sub_ptv_fk"
  FOREIGN KEY ("tenant_id", "subsequent_payment_terms_version_id") REFERENCES "payment_terms_versions"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "difference_bookings_tenant_subsequent_mv_idx"
  ON "difference_bookings" ("tenant_id", "subsequent_measurement_version_id")
  WHERE "subsequent_measurement_version_id" IS NOT NULL;

CREATE UNIQUE INDEX "difference_bookings_tenant_terms_transition_ref_idx"
  ON "difference_bookings" ("tenant_id", "predecessor_payment_terms_version_id", "subsequent_payment_terms_version_id", "reference_invoice_id")
  WHERE "predecessor_payment_terms_version_id" IS NOT NULL
    AND "subsequent_payment_terms_version_id" IS NOT NULL
    AND "reference_invoice_id" IS NOT NULL;
