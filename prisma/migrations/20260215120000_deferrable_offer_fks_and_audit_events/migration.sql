-- Inkrement 2: zyklische Offer/OfferVersion-Integrität (current_version_id) + audit_events
-- DEFERRABLE: INSERT-Reihenfolge in einer Transaktion beliebig (siehe offer-persistence).

ALTER TABLE "offer_versions" DROP CONSTRAINT IF EXISTS "offer_versions_tenant_id_offer_id_fkey";

ALTER TABLE "offer_versions" ADD CONSTRAINT "offer_versions_tenant_id_offer_id_fkey"
  FOREIGN KEY ("tenant_id","offer_id") REFERENCES "offers"("tenant_id","id")
  ON DELETE RESTRICT ON UPDATE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "offers" ADD CONSTRAINT "offers_current_version_fkey"
  FOREIGN KEY ("tenant_id","current_version_id") REFERENCES "offer_versions"("tenant_id","id")
  ON DELETE RESTRICT ON UPDATE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "reason" TEXT,
    "before_state" JSONB,
    "after_state" JSONB,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_events_tenant_id_timestamp_idx" ON "audit_events" ("tenant_id", "timestamp");
