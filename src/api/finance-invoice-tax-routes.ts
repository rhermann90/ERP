import type { FastifyInstance } from "fastify";
import { handleHttpError, parseAuthContext } from "./http-response.js";
import type { AuthorizationService } from "../services/authorization-service.js";
import type { InvoiceTaxSettingsService } from "../services/invoice-tax-settings-service.js";
import {
  deleteProjectInvoiceTaxOverrideSchema,
  patchTenantInvoiceTaxProfileSchema,
  putProjectInvoiceTaxOverrideSchema,
} from "../validation/schemas.js";

export function registerFinanceInvoiceTaxRoutes(
  app: FastifyInstance,
  deps: {
    authorizationService: AuthorizationService;
    invoiceTaxSettingsService: InvoiceTaxSettingsService;
  },
): void {
  app.get("/finance/invoice-tax-profile", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoiceTaxSettings(auth.role);
      const data = deps.invoiceTaxSettingsService.getTenantProfileRead(auth.tenantId);
      return reply.status(200).send(data);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.patch("/finance/invoice-tax-profile", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanManageInvoiceTaxSettings(auth.role);
      const body = patchTenantInvoiceTaxProfileSchema.parse(request.body);
      const result = await deps.invoiceTaxSettingsService.patchTenantProfile({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        defaultInvoiceTaxRegime: body.defaultInvoiceTaxRegime,
        construction13bConfig: body.construction13bConfig,
        reason: body.reason,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/finance/invoice-tax-profile/projects/:projectId", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoiceTaxSettings(auth.role);
      const params = request.params as { projectId: string };
      const data = deps.invoiceTaxSettingsService.getProjectOverrideRead(auth.tenantId, params.projectId);
      return reply.status(200).send(data);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.put("/finance/invoice-tax-profile/projects/:projectId", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanManageInvoiceTaxSettings(auth.role);
      const params = request.params as { projectId: string };
      const body = putProjectInvoiceTaxOverrideSchema.parse(request.body);
      const result = await deps.invoiceTaxSettingsService.putProjectOverride({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        projectId: params.projectId,
        invoiceTaxRegime: body.invoiceTaxRegime,
        taxReasonCode: body.taxReasonCode,
        construction13bConfig: body.construction13bConfig,
        reason: body.reason,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.delete("/finance/invoice-tax-profile/projects/:projectId", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanManageInvoiceTaxSettings(auth.role);
      const params = request.params as { projectId: string };
      const body = deleteProjectInvoiceTaxOverrideSchema.parse(request.body);
      await deps.invoiceTaxSettingsService.deleteProjectOverride({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        projectId: params.projectId,
        reason: body.reason,
      });
      return reply.status(204).send();
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });
}
