import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DomainError } from "../errors/domain-error.js";
import { handleHttpError, parseAuthContext } from "./http-response.js";

const FIN0_FAIL_CLOSED_MESSAGE =
  "Finanz-Endpunkt vor Schließen des FIN-2-Start-Gates nicht verfügbar (fail-closed gemäß docs/contracts/finance-fin0-openapi-mapping.md).";

const createPaymentTermsVersionBodySchema = z.object({
  projectId: z.string().uuid(),
  customerId: z.string().uuid(),
  termsLabel: z.string().max(200),
  reason: z.string().min(5),
});

const createInvoiceDraftBodySchema = z.object({
  lvVersionId: z.string().uuid(),
  offerVersionId: z.string().uuid(),
  invoiceCurrencyCode: z.enum(["EUR"]),
  reason: z.string().min(5),
});

const paymentIntakeBodySchema = z.object({
  invoiceId: z.string().uuid(),
  amountCents: z.number().int().min(1),
  externalReference: z.string().max(200),
  reason: z.string().min(5),
});

const invoiceIdParamSchema = z.object({
  invoiceId: z.string().uuid(),
});

function assertFin0MutatingFailClosed(): never {
  throw new DomainError("TRACEABILITY_LINK_MISSING", FIN0_FAIL_CLOSED_MESSAGE, 422);
}

function headerValueInsensitive(
  headers: Record<string, string | string[] | undefined>,
  canonicalName: string,
): string | undefined {
  const want = canonicalName.toLowerCase();
  for (const [key, val] of Object.entries(headers)) {
    if (key.toLowerCase() === want) {
      return Array.isArray(val) ? val[0] : val;
    }
  }
  return undefined;
}

/** OpenAPI-Parameter `Idempotency-Key` (case-insensitive wie HTTP). */
function parseIdempotencyKey(headers: Record<string, string | string[] | undefined>): string {
  const raw = headerValueInsensitive(headers, "Idempotency-Key");
  const trimmed = typeof raw === "string" ? raw.trim() : raw;
  return z.string().uuid().parse(trimmed);
}

/**
 * FIN-0: HTTP-Stubs für `docs/api-contract.yaml` (operationIds `finPaymentTermsVersionCreate`,
 * `finInvoiceDraftCreate`, `finInvoiceGet`, `finPaymentIntakeCreate`).
 *
 * **FIN-2 Implementation out of scope**; FIN-0 HTTP stubs only — siehe `docs/tickets/FIN-2-START-GATE.md`
 * und `docs/adr/0007-finance-persistence-and-invoice-boundaries.md`. Fail-closed:
 * `docs/contracts/finance-fin0-openapi-mapping.md` (nur bestehende Domain-Codes aus `error-codes.json`).
 * Keine Prisma-Rechnung/Zahlung, keine produktive Buchung.
 */
export function registerFinanceFin0Stubs(app: FastifyInstance): void {
  app.post("/finance/payment-terms/versions", async (request, reply) => {
    try {
      parseAuthContext(request.headers);
      createPaymentTermsVersionBodySchema.parse(request.body);
      assertFin0MutatingFailClosed();
    } catch (error) {
      return handleHttpError(error, reply);
    }
  });

  app.post("/invoices", async (request, reply) => {
    try {
      parseAuthContext(request.headers);
      createInvoiceDraftBodySchema.parse(request.body);
      assertFin0MutatingFailClosed();
    } catch (error) {
      return handleHttpError(error, reply);
    }
  });

  app.get("/invoices/:invoiceId", async (request, reply) => {
    try {
      parseAuthContext(request.headers);
      invoiceIdParamSchema.parse(request.params);
      throw new DomainError(
        "DOCUMENT_NOT_FOUND",
        "Rechnung nicht gefunden — FIN-0 Stub, kein SoT bis FIN-2-Start-Gate.",
        404,
      );
    } catch (error) {
      return handleHttpError(error, reply);
    }
  });

  app.post("/finance/payments/intake", async (request, reply) => {
    try {
      parseAuthContext(request.headers);
      parseIdempotencyKey(request.headers as Record<string, string | string[] | undefined>);
      paymentIntakeBodySchema.parse(request.body);
      assertFin0MutatingFailClosed();
    } catch (error) {
      return handleHttpError(error, reply);
    }
  });
}
