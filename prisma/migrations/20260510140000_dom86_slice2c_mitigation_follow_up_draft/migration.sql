-- ADR-0024: Idempotenz für automatischen Folge-Entwurf nach Schlussrechnungs-Mitigation (Plus).
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "mitigation_follow_up_source_invoice_id" UUID;
