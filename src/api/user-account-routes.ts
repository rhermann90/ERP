import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { DomainError } from "../errors/domain-error.js";
import { AuditService } from "../services/audit-service.js";
import { AuthorizationService } from "../services/authorization-service.js";
import { UserAccountService } from "../services/user-account-service.js";
import { createTenantUserSchema, patchTenantUserSchema } from "../validation/schemas.js";
import { handleHttpError, parseAuthContext } from "./http-response.js";

export type RegisterUserAccountRoutesOptions = {
  getPrisma: () => PrismaClient | null;
  audit: AuditService;
  authorizationService: AuthorizationService;
};

const userAccountRouteRateLimit = {
  max: 60,
  timeWindow: "1 minute" as const,
};

const userAccountCreateRateLimit = {
  max: 20,
  timeWindow: "1 minute" as const,
};

export function registerUserAccountRoutes(app: FastifyInstance, opts: RegisterUserAccountRoutesOptions): void {
  const { getPrisma, audit, authorizationService } = opts;

  app.get(
    "/users",
    { config: { rateLimit: userAccountRouteRateLimit } },
    async (request, reply) => {
      try {
        const prisma = getPrisma();
        if (!prisma) {
          throw new DomainError(
            "USER_MANAGEMENT_REQUIRES_DB",
            "Benutzerverwaltung ist nur mit Postgres-Datenbank verfügbar.",
            503,
          );
        }
        const auth = parseAuthContext(request.headers);
        authorizationService.assertCanManageTenantUsers(auth.role);
        const service = new UserAccountService(prisma, audit);
        const result = await service.listUsers(auth.tenantId);
        return reply.status(200).send(result);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.post(
    "/users",
    { config: { rateLimit: userAccountCreateRateLimit } },
    async (request, reply) => {
      try {
        const prisma = getPrisma();
        if (!prisma) {
          throw new DomainError(
            "USER_MANAGEMENT_REQUIRES_DB",
            "Benutzerverwaltung ist nur mit Postgres-Datenbank verfügbar.",
            503,
          );
        }
        const auth = parseAuthContext(request.headers);
        authorizationService.assertCanManageTenantUsers(auth.role);
        const body = createTenantUserSchema.parse(request.body);
        const service = new UserAccountService(prisma, audit);
        const created = await service.createUser(auth.tenantId, auth.userId, {
          emailNorm: body.email,
          passwordPlain: body.password,
          role: body.role,
          reason: body.reason,
        });
        return reply.status(201).send(created);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.patch(
    "/users/:userId",
    { config: { rateLimit: userAccountRouteRateLimit } },
    async (request, reply) => {
      try {
        const prisma = getPrisma();
        if (!prisma) {
          throw new DomainError(
            "USER_MANAGEMENT_REQUIRES_DB",
            "Benutzerverwaltung ist nur mit Postgres-Datenbank verfügbar.",
            503,
          );
        }
        const auth = parseAuthContext(request.headers);
        authorizationService.assertCanManageTenantUsers(auth.role);
        const params = request.params as { userId: string };
        const body = patchTenantUserSchema.parse(request.body);
        const service = new UserAccountService(prisma, audit);
        const updated = await service.patchUser(auth.tenantId, auth.userId, params.userId, {
          role: body.role,
          active: body.active,
          passwordPlain: body.password,
          emailNorm: body.email,
          reason: body.reason,
        });
        return reply.status(200).send(updated);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );
}
