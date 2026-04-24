import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { handleHttpError, parseAuthContext } from "./http-response.js";
import { parseIdempotencyKeyHeader } from "./idempotency-header.js";
import type { AuthorizationService } from "../services/authorization-service.js";
import type { PaymentIntakeService } from "../services/payment-intake-service.js";

const bodySchema = z.object({
  invoiceId: z.string().uuid(),
  amountCents: z.number().int().min(1),
  externalReference: z.string().max(200),
  reason: z.string().min(5),
});

export function registerPaymentIntakeRoutes(
  app: FastifyInstance,
  deps: {
    authorizationService: AuthorizationService;
    paymentIntakeService: PaymentIntakeService;
  },
): void {
  app.post("/finance/payments/intake", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanRecordPaymentIntake(auth.role);
      const idempotencyKey = parseIdempotencyKeyHeader(request.headers as Record<string, string | string[] | undefined>);
      const body = bodySchema.parse(request.body);
      const result = await deps.paymentIntakeService.record({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        invoiceId: body.invoiceId,
        idempotencyKey,
        amountCents: body.amountCents,
        externalReference: body.externalReference,
        reason: body.reason,
      });
      const { replay, ...out } = result;
      return reply.status(replay ? 200 : 201).send(out);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });
}
