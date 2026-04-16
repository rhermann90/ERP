import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { verifyBearerToken, type AuthContext } from "../auth/token-auth.js";
import { DomainError } from "../errors/domain-error.js";
import { authHeaderSchema } from "../validation/schemas.js";

export function parseAuthContext(rawHeaders: unknown): AuthContext {
  const headers = authHeaderSchema.parse(rawHeaders);
  const auth = verifyBearerToken(headers.authorization);
  if (headers["x-tenant-id"] && headers["x-tenant-id"] !== auth.tenantId) {
    throw new DomainError("TENANT_SCOPE_VIOLATION", "Tenant-Scope passt nicht zum Auth-Token", 403);
  }
  return auth;
}

type ErrorReply = { status: (code: number) => { send: (body: unknown) => unknown } };

export function handleHttpError(error: unknown, reply: ErrorReply) {
  const correlationId = randomUUID();
  if (error instanceof DomainError) {
    const isRetryable = new Set(["AUTH_SESSION_EXPIRED", "VALIDATION_FAILED", "EXPORT_CHANNEL_UNAVAILABLE"]).has(
      error.code,
    );
    return reply
      .status(error.statusCode)
      .send({
        code: error.code,
        message: error.message,
        correlationId,
        retryable: isRetryable,
        blocking: !isRetryable,
        details: error.details ?? undefined,
      });
  }
  if (error instanceof ZodError) {
    const first = error.issues[0];
    const message = first
      ? `${first.path.length ? `${first.path.join(".")}: ` : ""}${first.message}`
      : "Validierung fehlgeschlagen";
    return reply.status(400).send({
      code: "VALIDATION_FAILED",
      message,
      correlationId,
      retryable: true,
      blocking: false,
    });
  }
  return reply.status(400).send({
    code: "VALIDATION_FAILED",
    message: String(error),
    correlationId,
    retryable: true,
    blocking: false,
  });
}
