import type { FastifyInstance } from "fastify";
import { handleHttpError, parseAuthContext } from "./http-response.js";
import type { AuthorizationService } from "../services/authorization-service.js";
import type { CrmStammdatenService } from "../services/crm-stammdaten-service.js";
import {
  createCrmConstructionSiteSchema,
  createCrmCustomerSchema,
  createCrmProjectContactSchema,
  createCrmProjectSchema,
  patchCrmConstructionSiteSchema,
  patchCrmCustomerSchema,
  patchCrmProjectContactSchema,
  patchCrmProjectSchema,
} from "../validation/schemas.js";

const crmReadRateLimit = { max: 120, timeWindow: "1 minute" as const };
const crmWriteRateLimit = { max: 40, timeWindow: "1 minute" as const };

export function registerCrmStammdatenRoutes(
  app: FastifyInstance,
  deps: { authorizationService: AuthorizationService; crmStammdatenService: CrmStammdatenService },
): void {
  const { authorizationService: authz, crmStammdatenService: crm } = deps;

  app.get(
    "/crm/construction-sites",
    { config: { rateLimit: crmReadRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        authz.assertCanReadCrmStammdaten(auth.role);
        const result = await crm.listConstructionSites(auth.tenantId);
        return reply.status(200).send(result);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.get(
    "/crm/construction-sites/:id",
    { config: { rateLimit: crmReadRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        authz.assertCanReadCrmStammdaten(auth.role);
        const { id } = request.params as { id: string };
        const result = await crm.getConstructionSite(auth.tenantId, id);
        return reply.status(200).send(result);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.post(
    "/crm/construction-sites",
    { config: { rateLimit: crmWriteRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        authz.assertCanWriteCrmStammdaten(auth.role);
        const body = createCrmConstructionSiteSchema.parse(request.body);
        const { reason, ...rest } = body;
        const result = await crm.createConstructionSite({
          tenantId: auth.tenantId,
          actorUserId: auth.userId,
          reason,
          ...rest,
        });
        return reply.status(201).send(result);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.patch(
    "/crm/construction-sites/:id",
    { config: { rateLimit: crmWriteRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        authz.assertCanWriteCrmStammdaten(auth.role);
        const { id } = request.params as { id: string };
        const body = patchCrmConstructionSiteSchema.parse(request.body);
        const { reason, versionNumber, ...patch } = body;
        const result = await crm.patchConstructionSite(
          auth.tenantId,
          id,
          auth.userId,
          reason,
          versionNumber,
          patch,
        );
        return reply.status(200).send(result);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.get("/crm/customers", { config: { rateLimit: crmReadRateLimit } }, async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authz.assertCanReadCrmStammdaten(auth.role);
      const result = await crm.listCustomers(auth.tenantId);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/crm/customers/:id", { config: { rateLimit: crmReadRateLimit } }, async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authz.assertCanReadCrmStammdaten(auth.role);
      const { id } = request.params as { id: string };
      const result = await crm.getCustomer(auth.tenantId, id);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/crm/customers", { config: { rateLimit: crmWriteRateLimit } }, async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authz.assertCanWriteCrmStammdaten(auth.role);
      const body = createCrmCustomerSchema.parse(request.body);
      const { reason, ...rest } = body;
      const result = await crm.createCustomer({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        reason,
        ...rest,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.patch("/crm/customers/:id", { config: { rateLimit: crmWriteRateLimit } }, async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authz.assertCanWriteCrmStammdaten(auth.role);
      const { id } = request.params as { id: string };
      const body = patchCrmCustomerSchema.parse(request.body);
      const { reason, versionNumber, ...patch } = body;
      const result = await crm.patchCustomer(auth.tenantId, id, auth.userId, reason, versionNumber, patch);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/crm/projects", { config: { rateLimit: crmReadRateLimit } }, async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authz.assertCanReadCrmStammdaten(auth.role);
      const result = await crm.listProjects(auth.tenantId);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/crm/projects/:id", { config: { rateLimit: crmReadRateLimit } }, async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authz.assertCanReadCrmStammdaten(auth.role);
      const { id } = request.params as { id: string };
      const result = await crm.getProject(auth.tenantId, id);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/crm/projects", { config: { rateLimit: crmWriteRateLimit } }, async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authz.assertCanWriteCrmStammdaten(auth.role);
      const body = createCrmProjectSchema.parse(request.body);
      const { reason, ...rest } = body;
      const result = await crm.createProject({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        reason,
        ...rest,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.patch("/crm/projects/:id", { config: { rateLimit: crmWriteRateLimit } }, async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authz.assertCanWriteCrmStammdaten(auth.role);
      const { id } = request.params as { id: string };
      const body = patchCrmProjectSchema.parse(request.body);
      const { reason, versionNumber, ...patch } = body;
      const result = await crm.patchProject(auth.tenantId, id, auth.userId, reason, versionNumber, patch);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get(
    "/crm/projects/:projectId/contacts",
    { config: { rateLimit: crmReadRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        authz.assertCanReadCrmStammdaten(auth.role);
        const { projectId } = request.params as { projectId: string };
        const result = await crm.listProjectContacts(auth.tenantId, projectId);
        return reply.status(200).send(result);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.get("/crm/project-contacts/:id", { config: { rateLimit: crmReadRateLimit } }, async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authz.assertCanReadCrmStammdaten(auth.role);
      const { id } = request.params as { id: string };
      const result = await crm.getProjectContact(auth.tenantId, id);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post(
    "/crm/project-contacts",
    { config: { rateLimit: crmWriteRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        authz.assertCanWriteCrmStammdaten(auth.role);
        const body = createCrmProjectContactSchema.parse(request.body);
        const { reason, ...rest } = body;
        const result = await crm.createProjectContact({
          tenantId: auth.tenantId,
          actorUserId: auth.userId,
          reason,
          ...rest,
        });
        return reply.status(201).send(result);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.patch(
    "/crm/project-contacts/:id",
    { config: { rateLimit: crmWriteRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        authz.assertCanWriteCrmStammdaten(auth.role);
        const { id } = request.params as { id: string };
        const body = patchCrmProjectContactSchema.parse(request.body);
        const { reason, versionNumber, ...patch } = body;
        const result = await crm.patchProjectContact(
          auth.tenantId,
          id,
          auth.userId,
          reason,
          versionNumber,
          patch,
        );
        return reply.status(200).send(result);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );
}
