import type { FastifyInstance } from "fastify";
import { handleHttpError, parseAuthContext } from "./http-response.js";
import type { AuthorizationService } from "../services/authorization-service.js";
import type { EInvoicePartySettingsService } from "../services/e-invoice-party-settings-service.js";
import {
  deleteEInvoicePartySchema,
  putCustomerEInvoicePartySchema,
  putTenantEInvoicePartySchema,
} from "../validation/schemas.js";

const eInvoicePartyReadRateLimit = {
  max: 60,
  timeWindow: "1 minute" as const,
};

const eInvoicePartyWriteRateLimit = {
  max: 30,
  timeWindow: "1 minute" as const,
};

export function registerFinanceEInvoicePartyRoutes(
  app: FastifyInstance,
  deps: {
    authorizationService: AuthorizationService;
    eInvoicePartySettingsService: EInvoicePartySettingsService;
  },
): void {
  app.get(
    "/finance/e-invoice-parties/tenant",
    { config: { rateLimit: eInvoicePartyReadRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        deps.authorizationService.assertCanReadInvoiceTaxSettings(auth.role);
        const data = deps.eInvoicePartySettingsService.getTenantRead(auth.tenantId);
        return reply.status(200).send(data);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.put(
    "/finance/e-invoice-parties/tenant",
    { config: { rateLimit: eInvoicePartyWriteRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        deps.authorizationService.assertCanManageInvoiceTaxSettings(auth.role);
        const body = putTenantEInvoicePartySchema.parse(request.body);
        const { reason, ...party } = body;
        const result = await deps.eInvoicePartySettingsService.putTenantParty({
          tenantId: auth.tenantId,
          actorUserId: auth.userId,
          reason,
          ...party,
        });
        return reply.status(200).send(result);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.delete(
    "/finance/e-invoice-parties/tenant",
    { config: { rateLimit: eInvoicePartyWriteRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        deps.authorizationService.assertCanManageInvoiceTaxSettings(auth.role);
        const body = deleteEInvoicePartySchema.parse(request.body);
        await deps.eInvoicePartySettingsService.deleteTenantParty({
          tenantId: auth.tenantId,
          actorUserId: auth.userId,
          reason: body.reason,
        });
        return reply.status(204).send();
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.get(
    "/finance/e-invoice-parties/customers",
    { config: { rateLimit: eInvoicePartyReadRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        deps.authorizationService.assertCanReadInvoiceTaxSettings(auth.role);
        const data = deps.eInvoicePartySettingsService.listCustomersRead(auth.tenantId);
        return reply.status(200).send(data);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.get(
    "/finance/e-invoice-parties/customers/:customerId",
    { config: { rateLimit: eInvoicePartyReadRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        deps.authorizationService.assertCanReadInvoiceTaxSettings(auth.role);
        const params = request.params as { customerId: string };
        const data = deps.eInvoicePartySettingsService.getCustomerRead(auth.tenantId, params.customerId);
        return reply.status(200).send(data);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.put(
    "/finance/e-invoice-parties/customers/:customerId",
    { config: { rateLimit: eInvoicePartyWriteRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        deps.authorizationService.assertCanManageInvoiceTaxSettings(auth.role);
        const params = request.params as { customerId: string };
        const body = putCustomerEInvoicePartySchema.parse(request.body);
        const { reason, ...party } = body;
        const result = await deps.eInvoicePartySettingsService.putCustomerParty({
          tenantId: auth.tenantId,
          customerId: params.customerId,
          actorUserId: auth.userId,
          reason,
          ...party,
        });
        return reply.status(200).send(result);
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );

  app.delete(
    "/finance/e-invoice-parties/customers/:customerId",
    { config: { rateLimit: eInvoicePartyWriteRateLimit } },
    async (request, reply) => {
      try {
        const auth = parseAuthContext(request.headers);
        deps.authorizationService.assertCanManageInvoiceTaxSettings(auth.role);
        const params = request.params as { customerId: string };
        const body = deleteEInvoicePartySchema.parse(request.body);
        await deps.eInvoicePartySettingsService.deleteCustomerParty({
          tenantId: auth.tenantId,
          customerId: params.customerId,
          actorUserId: auth.userId,
          reason: body.reason,
        });
        return reply.status(204).send();
      } catch (error) {
        return handleHttpError(error, request, reply);
      }
    },
  );
}
