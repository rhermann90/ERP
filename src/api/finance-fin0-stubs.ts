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

function parseIdempotencyKey(headers: Record<string, string | string[] | undefined>): string {
  const raw = headers["idempotency-key"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return z.string().uuid().parse(value);
}

/**
 * FIN-0: HTTP-Stubs für docs/api-contract.yaml (Finance-Tag). Keine Persistenz, kein FIN-2 bis Gate.
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
