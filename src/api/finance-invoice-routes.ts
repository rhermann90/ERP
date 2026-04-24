import type { FastifyInstance } from "fastify";
import { handleHttpError, parseAuthContext } from "./http-response.js";
import type { AuthorizationService } from "../services/authorization-service.js";
import type { InvoiceService } from "../services/invoice-service.js";
import { createInvoiceDraftSchema } from "../validation/schemas.js";

export function registerInvoiceFinanceRoutes(
  app: FastifyInstance,
  deps: {
    authorizationService: AuthorizationService;
    invoiceService: InvoiceService;
  },
): void {
  app.post("/invoices", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanCreateInvoiceDraft(auth.role);
      const body = createInvoiceDraftSchema.parse(request.body);
      const result = await deps.invoiceService.createDraft({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        lvVersionId: body.lvVersionId,
        offerVersionId: body.offerVersionId,
        invoiceCurrencyCode: body.invoiceCurrencyCode,
        paymentTermsVersionId: body.paymentTermsVersionId,
        reason: body.reason,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/invoices/:invoiceId", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoice(auth.role);
      const params = request.params as { invoiceId: string };
      const result = deps.invoiceService.getInvoice(auth.tenantId, params.invoiceId);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });
}
