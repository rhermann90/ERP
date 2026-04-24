import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "../prisma-client.js";
import { DomainError } from "../errors/domain-error.js";
import type { AuditService } from "../services/audit-service.js";
import { PasswordResetService } from "../services/password-reset-service.js";
import { confirmPasswordResetSchema, requestPasswordResetSchema } from "../validation/schemas.js";
import { handleHttpError } from "./http-response.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

type Bucket = { count: number; windowStart: number };

const rateBuckets = new Map<string, Bucket>();

function assertResetRateLimit(clientIp: string): void {
  const now = Date.now();
  let b = rateBuckets.get(clientIp);
  if (!b || now - b.windowStart > WINDOW_MS) {
    b = { count: 0, windowStart: now };
    rateBuckets.set(clientIp, b);
  }
  b.count += 1;
  if (b.count > MAX_ATTEMPTS) {
    throw new DomainError(
      "AUTH_RATE_LIMITED",
      "Zu viele Anfragen. Bitte später erneut versuchen.",
      429,
    );
  }
}

export type RegisterPasswordResetRoutesOptions = {
  getPrisma: () => PrismaClient | null;
  audit: AuditService;
};

const resetRouteRateLimit = {
  max: MAX_ATTEMPTS,
  timeWindow: WINDOW_MS,
};

/**
 * Öffentliche Passwort-Reset-Endpunkte (ohne Bearer).
 */
export function registerPasswordResetRoutes(app: FastifyInstance, opts: RegisterPasswordResetRoutesOptions): void {
  const { getPrisma, audit } = opts;

  app.post(
    "/auth/request-password-reset",
    { config: { rateLimit: resetRouteRateLimit } },
    async (request, reply) => {
      try {
        assertResetRateLimit(request.ip || "unknown");
        const body = requestPasswordResetSchema.parse(request.body);
        const prisma = getPrisma();
        if (!prisma) {
          throw new DomainError(
            "USER_MANAGEMENT_REQUIRES_DB",
            "Passwort-Zurücksetzen ist nur mit Postgres verfügbar.",
            503,
          );
        }
        const service = new PasswordResetService(prisma, audit);
        await service.requestReset(body.tenantId, body.email);
        return reply.status(200).send({
          ok: true as const,
          message: "Wenn zu dieser E-Mail ein Konto existiert, wurde ein Link gesendet.",
        });
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.post(
    "/auth/confirm-password-reset",
    { config: { rateLimit: resetRouteRateLimit } },
    async (request, reply) => {
      try {
        assertResetRateLimit(request.ip || "unknown");
        const body = confirmPasswordResetSchema.parse(request.body);
        const prisma = getPrisma();
        if (!prisma) {
          throw new DomainError(
            "USER_MANAGEMENT_REQUIRES_DB",
            "Passwort-Zurücksetzen ist nur mit Postgres verfügbar.",
            503,
          );
        }
        const service = new PasswordResetService(prisma, audit);
        await service.confirmReset(body.token, body.password);
        return reply.status(200).send({ ok: true as const });
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );
}
