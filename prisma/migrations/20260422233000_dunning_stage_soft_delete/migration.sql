-- FIN-4 Slice 7: Soft-Delete pro Mahnstufe (GET zählt nur aktive Zeilen für Vollständigkeit).
ALTER TABLE dunning_tenant_stage_config
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS dunning_tenant_stage_config_tenant_active_idx
  ON dunning_tenant_stage_config (tenant_id)
  WHERE deleted_at IS NULL;
