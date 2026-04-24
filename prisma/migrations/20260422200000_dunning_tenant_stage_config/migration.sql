-- FIN-4: Mandantenspezifische Mahnstufen-Konfiguration (Lesepfad; ADR-0009 Slice 4).
CREATE TABLE "dunning_tenant_stage_config" (
    "tenant_id" UUID NOT NULL,
    "stage_ordinal" INTEGER NOT NULL,
    "days_after_due" INTEGER NOT NULL,
    "fee_cents" INTEGER NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    CONSTRAINT "dunning_tenant_stage_config_pkey" PRIMARY KEY ("tenant_id", "stage_ordinal")
);

-- Demo-Mandant (vgl. `src/composition/seed.ts` SEED_IDS.tenantId): volle 9 Stufen für Integrationstests / lokale Demos.
INSERT INTO "dunning_tenant_stage_config" ("tenant_id", "stage_ordinal", "days_after_due", "fee_cents", "label") VALUES
    ('11111111-1111-4111-8111-111111111111', 1, 14, 0, 'Mahnstufe 1 (Demo-Mandant)'),
    ('11111111-1111-4111-8111-111111111111', 2, 28, 0, 'Mahnstufe 2 (Demo-Mandant)'),
    ('11111111-1111-4111-8111-111111111111', 3, 42, 0, 'Mahnstufe 3 (Demo-Mandant)'),
    ('11111111-1111-4111-8111-111111111111', 4, 56, 0, 'Mahnstufe 4 (Demo-Mandant)'),
    ('11111111-1111-4111-8111-111111111111', 5, 70, 0, 'Mahnstufe 5 (Demo-Mandant)'),
    ('11111111-1111-4111-8111-111111111111', 6, 84, 0, 'Mahnstufe 6 (Demo-Mandant)'),
    ('11111111-1111-4111-8111-111111111111', 7, 98, 0, 'Mahnstufe 7 (Demo-Mandant)'),
    ('11111111-1111-4111-8111-111111111111', 8, 112, 0, 'Mahnstufe 8 (Demo-Mandant)'),
    ('11111111-1111-4111-8111-111111111111', 9, 126, 0, 'Mahnstufe 9 (Demo-Mandant)');
