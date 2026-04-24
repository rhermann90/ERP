import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { DomainError } from "../errors/domain-error.js";
import { performPasswordLogin } from "../auth/password-login.js";
import { loginRequestSchema } from "../validation/schemas.js";
import { handleHttpError } from "./http-response.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 30;

type Bucket = { count: number; windowStart: number };

const rateBuckets = new Map<string, Bucket>();

/** Nur für Tests — verhindert Reihenfolge-Flakes bei Rate-Limit-Szenarien. */
export function resetAuthLoginRateLimitStateForTests(): void {
  rateBuckets.clear();
}

function pruneRateBuckets(now: number): void {
  if (rateBuckets.size < 5000) return;
  for (const [ip, b] of rateBuckets) {
    if (now - b.windowStart > WINDOW_MS) rateBuckets.delete(ip);
  }
}

function assertLoginRateLimit(clientIp: string): void {
  const now = Date.now();
  pruneRateBuckets(now);
  let b = rateBuckets.get(clientIp);
  if (!b || now - b.windowStart > WINDOW_MS) {
    b = { count: 0, windowStart: now };
    rateBuckets.set(clientIp, b);
  }
  b.count += 1;
  if (b.count > MAX_ATTEMPTS) {
    throw new DomainError(
      "AUTH_RATE_LIMITED",
      "Zu viele Anmeldeversuche. Bitte später erneut versuchen.",
      429,
    );
  }
}

export function registerAuthLoginRoutes(app: FastifyInstance, getPrisma: () => PrismaClient | null): void {
  app.post(
    "/auth/login",
    {
      config: {
        // Hoeher als `assertLoginRateLimit` (MAX_ATTEMPTS), damit der in-App-Limiter zuerst
        // greift und Tests/API den DomainError `AUTH_RATE_LIMITED` erhalten.
        rateLimit: {
          max: 500,
          timeWindow: WINDOW_MS,
        },
      },
    },
    async (request, reply) => {
      try {
        assertLoginRateLimit(request.ip || "unknown");
        const body = loginRequestSchema.parse(request.body);
        const result = await performPasswordLogin(getPrisma(), body.tenantId, body.email, body.password);
        return reply.status(200).send({
          accessToken: result.token,
          tokenType: "Bearer",
          expiresIn: result.expiresIn,
          tenantId: result.tenantId,
          userId: result.userId,
          role: result.role,
        });
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );
}
