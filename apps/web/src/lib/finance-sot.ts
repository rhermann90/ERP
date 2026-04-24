/**
 * SoT actionId für FIN-3 Zahlungseingang — nur ausführen, wenn in
 * `GET /documents/{invoiceId}/allowed-actions?entityType=INVOICE` enthalten.
 * @see docs/contracts/action-contracts.json → RECORD_PAYMENT_INTAKE
 */
export const RECORD_PAYMENT_INTAKE_ACTION_ID = "RECORD_PAYMENT_INTAKE" as const;

/**
 * @see docs/contracts/action-contracts.json → RECORD_DUNNING_REMINDER
 */
export const RECORD_DUNNING_REMINDER_ACTION_ID = "RECORD_DUNNING_REMINDER" as const;

/**
 * SoT actionId für FIN-2 Rechnungsbuchung — nur ausführen, wenn in
 * `GET /documents/{invoiceId}/allowed-actions?entityType=INVOICE` enthalten (Status ENTWURF).
 * @see docs/contracts/action-contracts.json → BOOK_INVOICE
 */
export const BOOK_INVOICE_ACTION_ID = "BOOK_INVOICE" as const;
