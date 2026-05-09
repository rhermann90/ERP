import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";
import { DomainError } from "../errors/domain-error.js";
import { handleHttpError, parseAuthContext } from "./http-response.js";
import { parseIdempotencyKeyHeader } from "./idempotency-header.js";
import { redactedExternalReferenceFromPaymentIntakeBody } from "./finance-payment-intake-log-helpers.js";
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
      if (process.env.ERP_LOG_PAYMENT_INTAKE_SUMMARY === "1") {
        request.log.info({
          msg: "finance_payment_intake_recorded",
          correlationId: request.id,
          invoiceId: body.invoiceId,
          amountCents: body.amountCents,
          replay,
          externalReferenceRedacted: redactedExternalReferenceFromPaymentIntakeBody(body),
        });
      }
      return reply.status(replay ? 200 : 201).send(out);
    } catch (error) {
      const logDiagnostic =
        (!(error instanceof DomainError) && !(error instanceof ZodError)) ||
        (error instanceof DomainError && error.statusCode >= 500);
      if (logDiagnostic) {
        const externalReferenceRedacted = redactedExternalReferenceFromPaymentIntakeBody(request.body);
        request.log.warn({
          msg: "finance_payment_intake_failure",
          correlationId: request.id,
          ...(error instanceof DomainError
            ? { code: error.code, statusCode: error.statusCode }
            : { errorName: error instanceof Error ? error.name : "non_error_throwable" }),
          ...(externalReferenceRedacted !== undefined ? { externalReferenceRedacted } : {}),
        });
      }
      return handleHttpError(error, request, reply);
    }
  });
}
