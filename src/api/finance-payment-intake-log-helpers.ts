import { redactExternalReferenceForLog } from "../domain/privacy-log-redaction.js";

/** Extrahiert eine log-sichere Kurzform aus Rohtext-Bodies (POST /finance/payments/intake). */
export function redactedExternalReferenceFromPaymentIntakeBody(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const ref = (body as { externalReference?: unknown }).externalReference;
  if (typeof ref !== "string") return undefined;
  return redactExternalReferenceForLog(ref);
}
