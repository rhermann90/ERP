import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import {
  aggregateTemplateRowsToStages,
  assertMandatoryDunningTemplatePlaceholders,
  buildMvpStaticDunningReminderTemplates,
  isCompleteTenantStageTemplates,
  mvpTemplateTypeForStageOrdinal,
  type DunningReminderTemplatesReadData,
  type DunningTemplateChannel,
} from "../domain/dunning-reminder-template-defaults.js";
import type { AuditEvent, TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { DunningTemplatePersistencePort } from "../persistence/dunning-template-persistence.js";
import { AuditService } from "./audit-service.js";

export type PatchDunningReminderTemplateBodyInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  stageOrdinal: number;
  channel: DunningTemplateChannel;
  body: string;
  reason: string;
};

export class DunningReminderTemplateService {
  constructor(
    private readonly templatePersistence: DunningTemplatePersistencePort,
    private readonly audit: AuditService,
    private readonly prisma: PrismaClient | null,
  ) {}

  public async getReadModel(tenantId: string): Promise<DunningReminderTemplatesReadData> {
    const rows = await this.templatePersistence.findTemplatesByTenant(tenantId);
    if (isCompleteTenantStageTemplates(rows)) {
      return {
        templateSource: "TENANT_DATABASE",
        tenantId,
        stages: aggregateTemplateRowsToStages(rows),
      };
    }
    return buildMvpStaticDunningReminderTemplates(tenantId);
  }

  private assertDbWritable(): void {
    const upsert = this.templatePersistence.upsertTemplateBodyInTx;
    if (!this.prisma || !upsert) {
      throw new DomainError(
        "DUNNING_TEMPLATE_NOT_PERSISTABLE",
        "Mahn-Vorlagen sind nur mit Datenbank-Persistenz schreibbar (nicht im In-Memory-Modus).",
        503,
      );
    }
  }

  public async patchTenantTemplateBody(input: PatchDunningReminderTemplateBodyInput): Promise<DunningReminderTemplatesReadData> {
    const templateType = mvpTemplateTypeForStageOrdinal(input.stageOrdinal);
    assertMandatoryDunningTemplatePlaceholders(input.body, templateType);
    this.assertDbWritable();
    const upsertInTx = this.templatePersistence.upsertTemplateBodyInTx!;

    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "DUNNING_TENANT_STAGE_CONFIG",
      entityId: input.tenantId,
      action: "DUNNING_TEMPLATE_BODY_PATCHED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {
        stageOrdinal: input.stageOrdinal,
        channel: input.channel,
        templateType,
      },
      afterState: {},
    };

    await this.prisma!.$transaction(async (tx) => {
      const { previousBody, previousType } = await upsertInTx(
        tx,
        input.tenantId,
        input.stageOrdinal,
        input.channel,
        templateType,
        input.body,
      );
      auditEvent.beforeState = {
        stageOrdinal: input.stageOrdinal,
        channel: input.channel,
        previousBody,
        previousTemplateType: previousType,
        templateType,
      };
      auditEvent.afterState = {
        stageOrdinal: input.stageOrdinal,
        channel: input.channel,
        body: input.body,
        templateType,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);

    return this.getReadModel(input.tenantId);
  }
}
