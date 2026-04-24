-- B2-1a (Welle 3): optionaler Skonto-Anteil in Basispunkten auf LV-Netto nach 8.4(1), vor USt (8.4(7–8)).
ALTER TABLE "invoices" ADD COLUMN "skonto_bps" INTEGER NOT NULL DEFAULT 0;
