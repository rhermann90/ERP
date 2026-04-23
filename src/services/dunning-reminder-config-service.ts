import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import {
  buildMvpStaticDunningReminderConfig,
  type DunningReminderConfigReadData,
  type DunningStageConfigReadRow,
  isCompleteTenantStageConfig,
} from "../domain/dunning-reminder-config-defaults.js";
import { DomainError } from "../errors/domain-error.js";
import type { AuditEvent, TenantId, UUID } from "../domain/types.js";
import type {
  DunningStageConfigPersistencePort,
  DunningStageConfigPatch,
} from "../persistence/dunning-stage-config-persistence.js";
import { AuditService } from "./audit-service.js";

export type ReplaceDunningTenantStageConfigInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  stages: DunningStageConfigReadRow[];
  reason: string;
};

export type PatchDunningTenantStageInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  stageOrdinal: number;
  patch: { daysAfterDue?: number; feeCents?: number; label?: string };
  reason: string;
};

export type DeleteDunningTenantStageInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  stageOrdinal: number;
  reason: string;
};

export class DunningReminderConfigService {
  constructor(
    private readonly stagePersistence: DunningStageConfigPersistencePort,
    private readonly audit: AuditService,
    private readonly prisma: PrismaClient | null,
  ) {}

  public async getReadModel(tenantId: string): Promise<DunningReminderConfigReadData> {
    const rows = await this.stagePersistence.findStagesByTenant(tenantId);
    if (isCompleteTenantStageConfig(rows)) {
      return { configSource: "TENANT_DATABASE", tenantId, stages: rows };
    }
    return buildMvpStaticDunningReminderConfig(tenantId);
  }

  private assertDbWritable(): void {
    const replaceInTx = this.stagePersistence.replaceTenantStagesInTx;
    if (!this.prisma || !replaceInTx) {
      throw new DomainError(
        "DUNNING_STAGE_CONFIG_NOT_PERSISTABLE",
        "Mahnstufen-Konfiguration ist nur mit Datenbank-Persistenz schreibbar (nicht im In-Memory-Modus).",
        503,
      );
    }
  }

  public async replaceTenantStages(input: ReplaceDunningTenantStageConfigInput): Promise<DunningReminderConfigReadData> {
    this.assertDbWritable();
    const replaceInTx = this.stagePersistence.replaceTenantStagesInTx!;
    const normalized = [...input.stages].sort((a, b) => a.stageOrdinal - b.stageOrdinal);
    const before = await this.stagePersistence.findStagesByTenant(input.tenantId);
    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "DUNNING_TENANT_STAGE_CONFIG",
      entityId: input.tenantId,
      action: "DUNNING_STAGES_REPLACED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {
        hadCompletePersistedConfig: isCompleteTenantStageConfig(before),
        previousStageOrdinals: before.map((r) => r.stageOrdinal),
      },
      afterState: {
        configSource: "TENANT_DATABASE",
        stageOrdinals: normalized.map((r) => r.stageOrdinal),
      },
    };

    await this.prisma!.$transaction(async (tx) => {
      await replaceInTx(tx, input.tenantId, normalized);
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);

    return this.getReadModel(input.tenantId);
  }

  public async patchTenantStage(input: PatchDunningTenantStageInput): Promise<DunningReminderConfigReadData> {
    this.assertDbWritable();
    const updateInTx = this.stagePersistence.updateTenantStageInTx!;
    const patchPayload: DunningStageConfigPatch = {
      ...(input.patch.daysAfterDue !== undefined ? { daysAfterDue: input.patch.daysAfterDue } : {}),
      ...(input.patch.feeCents !== undefined ? { feeCents: input.patch.feeCents } : {}),
      ...(input.patch.label !== undefined ? { label: input.patch.label } : {}),
    };
    const beforeRow = await this.stagePersistence.findStagesByTenant(input.tenantId);
    const prev = beforeRow.find((r) => r.stageOrdinal === input.stageOrdinal);

    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "DUNNING_TENANT_STAGE_CONFIG",
      entityId: input.tenantId,
      action: "DUNNING_STAGE_PATCHED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: prev
        ? {
            stageOrdinal: input.stageOrdinal,
            daysAfterDue: prev.daysAfterDue,
            feeCents: prev.feeCents,
            label: prev.label,
          }
        : { stageOrdinal: input.stageOrdinal, previous: "none" },
      afterState: {},
    };

    await this.prisma!.$transaction(async (tx) => {
      const updated = await updateInTx(tx, input.tenantId, input.stageOrdinal, patchPayload);
      if (!updated) {
        throw new DomainError(
          "DUNNING_STAGE_CONFIG_ROW_NOT_FOUND",
          "Keine persistierte Mahnstufe fuer diesen Mandanten und Ordinal",
          404,
        );
      }
      auditEvent.afterState = {
        stageOrdinal: updated.stageOrdinal,
        daysAfterDue: updated.daysAfterDue,
        feeCents: updated.feeCents,
        label: updated.label,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);

    return this.getReadModel(input.tenantId);
  }

  public async deleteTenantStage(input: DeleteDunningTenantStageInput): Promise<DunningReminderConfigReadData> {
    this.assertDbWritable();
    const softDeleteInTx = this.stagePersistence.softDeleteTenantStageInTx!;

    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "DUNNING_TENANT_STAGE_CONFIG",
      entityId: input.tenantId,
      action: "DUNNING_STAGE_SOFT_DELETED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: { stageOrdinal: input.stageOrdinal },
      afterState: { stageOrdinal: input.stageOrdinal, deleted: true },
    };

    await this.prisma!.$transaction(async (tx) => {
      const ok = await softDeleteInTx(tx, input.tenantId, input.stageOrdinal);
      if (!ok) {
        throw new DomainError(
          "DUNNING_STAGE_CONFIG_ROW_NOT_FOUND",
          "Keine aktive Mahnstufe fuer diesen Mandanten und Ordinal",
          404,
        );
      }
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);

    return this.getReadModel(input.tenantId);
  }
}
