import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { AuditEvent, TenantId, UUID } from "../domain/types.js";
import type { DunningTenantAutomationRunMode } from "../persistence/dunning-tenant-automation-persistence.js";
import { DomainError } from "../errors/domain-error.js";
import type { DunningTenantAutomationPersistencePort } from "../persistence/dunning-tenant-automation-persistence.js";
import { AuditService } from "./audit-service.js";

export type DunningTenantAutomationReadData = {
  automationSource: "NOT_CONFIGURED" | "TENANT_DATABASE";
  tenantId: string;
  /** Effektiver Modus: ohne DB-Zeile gilt SEMI (UI kann Batch nutzen; kein Cron). */
  runMode: DunningTenantAutomationRunMode;
  jobHourUtc: number | null;
};

export type PatchDunningTenantAutomationInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  reason: string;
  runMode: DunningTenantAutomationRunMode;
  jobHourUtc?: number | null;
};

export class DunningTenantAutomationService {
  constructor(
    private readonly persistence: DunningTenantAutomationPersistencePort,
    private readonly audit: AuditService,
    private readonly prisma: PrismaClient | null,
  ) {}

  public async getReadModel(tenantId: string): Promise<DunningTenantAutomationReadData> {
    const row = await this.persistence.findByTenant(tenantId);
    if (!row) {
      return {
        automationSource: "NOT_CONFIGURED",
        tenantId,
        runMode: "SEMI",
        jobHourUtc: null,
      };
    }
    return {
      automationSource: "TENANT_DATABASE",
      tenantId,
      runMode: row.runMode,
      jobHourUtc: row.jobHourUtc,
    };
  }

  private assertDbWritable(): void {
    const upsert = this.persistence.upsertAutomationInTx;
    if (!this.prisma || !upsert) {
      throw new DomainError(
        "DUNNING_AUTOMATION_NOT_PERSISTABLE",
        "Mandanten-Mahnlauf-Automatisierung ist nur mit Datenbank-Persistenz schreibbar (nicht im In-Memory-Modus).",
        503,
      );
    }
  }

  public async patchTenantAutomation(input: PatchDunningTenantAutomationInput): Promise<DunningTenantAutomationReadData> {
    this.assertDbWritable();
    const upsertInTx = this.persistence.upsertAutomationInTx!;

    const jobHourUtc =
      input.jobHourUtc === undefined
        ? ((await this.persistence.findByTenant(input.tenantId))?.jobHourUtc ?? null)
        : input.jobHourUtc;

    if (jobHourUtc !== null && (jobHourUtc < 0 || jobHourUtc > 23 || !Number.isInteger(jobHourUtc))) {
      throw new DomainError("VALIDATION_FAILED", "jobHourUtc muss null oder eine ganze Zahl 0–23 sein", 400);
    }

    const nextRow = { tenantId: input.tenantId, runMode: input.runMode, jobHourUtc };

    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "DUNNING_TENANT_STAGE_CONFIG",
      entityId: input.tenantId,
      action: "DUNNING_TENANT_AUTOMATION_PATCHED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {},
      afterState: {},
    };

    await this.prisma!.$transaction(async (tx) => {
      const { previous } = await upsertInTx(tx, input.tenantId, nextRow);
      auditEvent.beforeState = {
        automationSource: previous ? "TENANT_DATABASE" : "NOT_CONFIGURED",
        runMode: previous?.runMode ?? "SEMI",
        jobHourUtc: previous?.jobHourUtc ?? null,
      };
      auditEvent.afterState = {
        automationSource: "TENANT_DATABASE",
        runMode: nextRow.runMode,
        jobHourUtc: nextRow.jobHourUtc,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);

    return this.getReadModel(input.tenantId);
  }
}
