import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { handleHttpError, parseAuthContext } from "./http-response.js";
import type { DunningEmailFooterFields } from "../domain/dunning-email-footer.js";
import type { AuthorizationService } from "../services/authorization-service.js";
import type { DunningEmailFooterService } from "../services/dunning-email-footer-service.js";
import type { DunningReminderCandidatesService } from "../services/dunning-reminder-candidates-service.js";
import type { DunningReminderConfigService } from "../services/dunning-reminder-config-service.js";
import type { DunningReminderRunService } from "../services/dunning-reminder-run-service.js";
import type { DunningReminderTemplateService } from "../services/dunning-reminder-template-service.js";
import type { DunningTenantAutomationService } from "../services/dunning-tenant-automation-service.js";
import { parseIdempotencyKeyHeader } from "./idempotency-header.js";
import {
  deleteDunningReminderStageSchema,
  dunningReminderCandidatesQuerySchema,
  dunningReminderRunBodySchema,
  patchDunningEmailFooterSchema,
  patchDunningReminderStageSchema,
  patchDunningReminderTemplateBodySchema,
  patchDunningTenantAutomationSchema,
  putDunningReminderConfigSchema,
} from "../validation/schemas.js";

const stageOrdinalPathSchema = z.object({
  stageOrdinal: z.coerce.number().int().min(1).max(9),
});

const templateChannelPathSchema = z.object({
  stageOrdinal: z.coerce.number().int().min(1).max(9),
  channel: z.enum(["EMAIL", "PRINT"]),
});

const FOOTER_PATCH_KEYS: (keyof DunningEmailFooterFields)[] = [
  "companyLegalName",
  "streetLine",
  "postalCode",
  "city",
  "countryCode",
  "publicEmail",
  "publicPhone",
  "legalRepresentative",
  "registerCourt",
  "registerNumber",
  "vatId",
  "signatureLine",
];

function toFooterPatch(body: z.infer<typeof patchDunningEmailFooterSchema>): Partial<DunningEmailFooterFields> {
  const patch: Partial<DunningEmailFooterFields> = {};
  for (const k of FOOTER_PATCH_KEYS) {
    const v = body[k];
    if (v !== undefined) {
      patch[k] = v;
    }
  }
  return patch;
}

export function registerDunningReminderConfigRoutes(
  app: FastifyInstance,
  deps: {
    authorizationService: AuthorizationService;
    dunningReminderConfigService: DunningReminderConfigService;
    dunningReminderTemplateService: DunningReminderTemplateService;
    dunningEmailFooterService: DunningEmailFooterService;
    dunningReminderCandidatesService: DunningReminderCandidatesService;
    dunningReminderRunService: DunningReminderRunService;
    dunningTenantAutomationService: DunningTenantAutomationService;
  },
): void {
  app.get("/finance/dunning-reminder-templates", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoice(auth.role);
      const data = await deps.dunningReminderTemplateService.getReadModel(auth.tenantId);
      return reply.status(200).send({ data });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/finance/dunning-reminder-candidates", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoice(auth.role);
      const query = dunningReminderCandidatesQuerySchema.parse(request.query);
      const result = await deps.dunningReminderCandidatesService.listCandidates({
        tenantId: auth.tenantId,
        stageOrdinal: query.stageOrdinal,
        asOfDate: query.asOfDate,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/finance/dunning-reminder-automation", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoice(auth.role);
      const data = await deps.dunningTenantAutomationService.getReadModel(auth.tenantId);
      return reply.status(200).send({ data });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.patch("/finance/dunning-reminder-automation", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanManageDunningTenantStageConfig(auth.role);
      const body = patchDunningTenantAutomationSchema.parse(request.body);
      const data = await deps.dunningTenantAutomationService.patchTenantAutomation({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        reason: body.reason,
        runMode: body.runMode,
        ianaTimezone: body.ianaTimezone,
        federalStateCode: body.federalStateCode,
        paymentTermDayKind: body.paymentTermDayKind,
        preferredDunningChannel: body.preferredDunningChannel,
      });
      return reply.status(200).send({ data });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/finance/dunning-reminder-run", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const body = dunningReminderRunBodySchema.parse(request.body);
      if (body.mode === "DRY_RUN") {
        deps.authorizationService.assertCanReadInvoice(auth.role);
        const payload = await deps.dunningReminderRunService.run({
          tenantId: auth.tenantId,
          actorUserId: auth.userId,
          stageOrdinal: body.stageOrdinal,
          reason: body.reason,
          mode: "DRY_RUN",
          asOfDate: body.asOfDate,
          invoiceIds: body.invoiceIds,
          note: body.note,
        });
        return reply.status(200).send(payload);
      }
      deps.authorizationService.assertCanRecordDunningReminder(auth.role);
      const idempotencyKey = parseIdempotencyKeyHeader(request.headers);
      const payload = await deps.dunningReminderRunService.run({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        stageOrdinal: body.stageOrdinal,
        reason: body.reason,
        mode: "EXECUTE",
        asOfDate: body.asOfDate,
        invoiceIds: body.invoiceIds,
        note: body.note,
        idempotencyKey,
      });
      return reply.status(200).send(payload);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.patch("/finance/dunning-reminder-templates/stages/:stageOrdinal/channels/:channel", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanManageDunningTenantStageConfig(auth.role);
      const { stageOrdinal, channel } = templateChannelPathSchema.parse(request.params);
      const body = patchDunningReminderTemplateBodySchema.parse(request.body);
      const data = await deps.dunningReminderTemplateService.patchTenantTemplateBody({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        stageOrdinal,
        channel,
        body: body.body,
        reason: body.reason,
      });
      return reply.status(200).send({ data });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/finance/dunning-email-footer", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoice(auth.role);
      const data = await deps.dunningEmailFooterService.getReadModel(auth.tenantId);
      return reply.status(200).send({ data });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.patch("/finance/dunning-email-footer", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanManageDunningTenantStageConfig(auth.role);
      const body = patchDunningEmailFooterSchema.parse(request.body);
      const data = await deps.dunningEmailFooterService.patchTenantFooter({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        reason: body.reason,
        patch: toFooterPatch(body),
      });
      return reply.status(200).send({ data });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/finance/dunning-reminder-config", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoice(auth.role);
      const data = await deps.dunningReminderConfigService.getReadModel(auth.tenantId);
      return reply.status(200).send({ data });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.patch("/finance/dunning-reminder-config/stages/:stageOrdinal", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanManageDunningTenantStageConfig(auth.role);
      const { stageOrdinal } = stageOrdinalPathSchema.parse(request.params);
      const body = patchDunningReminderStageSchema.parse(request.body);
      const { reason, ...patch } = body;
      const data = await deps.dunningReminderConfigService.patchTenantStage({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        stageOrdinal,
        patch,
        reason,
      });
      return reply.status(200).send({ data });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.delete("/finance/dunning-reminder-config/stages/:stageOrdinal", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanManageDunningTenantStageConfig(auth.role);
      const { stageOrdinal } = stageOrdinalPathSchema.parse(request.params);
      const body = deleteDunningReminderStageSchema.parse(request.body);
      const data = await deps.dunningReminderConfigService.deleteTenantStage({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        stageOrdinal,
        reason: body.reason,
      });
      return reply.status(200).send({ data });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.put("/finance/dunning-reminder-config", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanManageDunningTenantStageConfig(auth.role);
      const body = putDunningReminderConfigSchema.parse(request.body);
      const data = await deps.dunningReminderConfigService.replaceTenantStages({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        stages: body.stages,
        reason: body.reason,
      });
      return reply.status(200).send({ data });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });
}
