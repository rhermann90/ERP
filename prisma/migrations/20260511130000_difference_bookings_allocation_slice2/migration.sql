-- Slice 2 ADR-0022: Zuordnung zu Rechnungsentwurf + Settlement
ALTER TABLE "difference_bookings" ADD COLUMN "allocated_invoice_id" UUID;
ALTER TABLE "difference_bookings" ADD COLUMN "allocated_at" TIMESTAMP(3);
ALTER TABLE "difference_bookings" ADD COLUMN "settled_at" TIMESTAMP(3);

ALTER TABLE "difference_bookings" ADD CONSTRAINT "difference_bookings_allocated_invoice_fk"
  FOREIGN KEY ("tenant_id", "allocated_invoice_id") REFERENCES "invoices"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "difference_bookings_tenant_allocated_invoice_idx" ON "difference_bookings"("tenant_id", "allocated_invoice_id");
