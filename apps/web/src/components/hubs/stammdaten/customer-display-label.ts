import type { CustomerEInvoicePartyListRow } from "../../../lib/api-client.js";

/** Kurzlabel für Buttons (Liste bekannt → Name + Präfix der UUID). */
export function customerJumpButtonLabel(
  customerId: string,
  customers: CustomerEInvoicePartyListRow[] | null,
): string {
  const row = customers?.find((c) => c.customerId === customerId);
  if (row?.legalName?.trim()) {
    const short = `${customerId.slice(0, 8)}…`;
    return `Kunde anzeigen: ${row.legalName.trim()} (${short})`;
  }
  return `Kunde anzeigen (${customerId.slice(0, 8)}…)`;
}
