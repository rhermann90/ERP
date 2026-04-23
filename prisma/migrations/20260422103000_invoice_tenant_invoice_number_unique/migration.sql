-- Eindeutige Rechnungsnummer je Mandant (Entwuerfe ohne Nummer: invoice_number NULL, mehrfach erlaubt).

CREATE UNIQUE INDEX "invoices_tenant_invoice_number_key" ON "invoices"("tenant_id", "invoice_number");
