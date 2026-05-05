-- Mandantenweite PWA-Anzeige (Expertenmodus).
CREATE TABLE "tenant_pwa_display_settings" (
    "tenant_id" UUID NOT NULL,
    "pwa_expert_mode_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_pwa_display_settings_pkey" PRIMARY KEY ("tenant_id")
);

