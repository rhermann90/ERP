import type { FastifyInstance } from "fastify";
import { handleHttpError, parseAuthContext } from "./http-response.js";
import type { AuthorizationService } from "../services/authorization-service.js";
import type { TenantPwaDisplaySettingsService } from "../services/tenant-pwa-display-settings-service.js";
import { patchTenantPwaDisplaySettingsSchema } from "../validation/schemas.js";

const tenantPwaDisplaySettingsReadRateLimit = {
  max: 60,
  timeWindow: "1 minute" as const,
};

const tenantPwaDisplaySettingsWriteRateLimit = {
  max: 20,
  timeWindow: "1 minute" as const,
};

export function registerTenantPwaDisplaySettingsRoutes(
  app: FastifyInstance,
  deps: {
    authorizationService: AuthorizationService;
    tenantPwaDisplaySettingsService: TenantPwaDisplaySettingsService;
  },
): void {
  app.get(
    "/tenant/pwa-display-settings",
    { config: { rateLimit: tenantPwaDisplaySettingsReadRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        deps.authorizationService.assertCanReadInvoice(auth.role);
        const data = await deps.tenantPwaDisplaySettingsService.getReadModel(auth.tenantId);
        return reply.status(200).send({ data });
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.patch(
    "/tenant/pwa-display-settings",
    { config: { rateLimit: tenantPwaDisplaySettingsWriteRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        deps.authorizationService.assertCanManageInvoiceTaxSettings(auth.role);
        const body = patchTenantPwaDisplaySettingsSchema.parse(request.body);
        const data = await deps.tenantPwaDisplaySettingsService.patchExpertMode({
          tenantId: auth.tenantId,
          actorUserId: auth.userId,
          reason: body.reason,
          pwaExpertModeEnabled: body.pwaExpertModeEnabled,
        });
        return reply.status(200).send({ data });
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );
}
