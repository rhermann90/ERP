import type { FastifyInstance } from "fastify";
import { handleHttpError, parseAuthContext } from "./http-response.js";
import type { AuthorizationService } from "../services/authorization-service.js";
import type { PaymentTermsService } from "../services/payment-terms-service.js";
import { createPaymentTermsVersionSchema, paymentTermsListQuerySchema } from "../validation/schemas.js";

export function registerPaymentTermsRoutes(
  app: FastifyInstance,
  deps: {
    authorizationService: AuthorizationService;
    paymentTermsService: PaymentTermsService;
  },
): void {
  app.get("/finance/payment-terms", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadPaymentTerms(auth.role);
      const query = paymentTermsListQuerySchema.parse(request.query);
      const result = deps.paymentTermsService.listForProject(auth.tenantId, query.projectId);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/finance/payment-terms/versions", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanManagePaymentTerms(auth.role);
      const body = createPaymentTermsVersionSchema.parse(request.body);
      const result = await deps.paymentTermsService.createVersion({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        projectId: body.projectId,
        customerId: body.customerId,
        termsLabel: body.termsLabel,
        reason: body.reason,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });
}
