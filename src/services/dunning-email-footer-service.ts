import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import {
  emptyDunningEmailFooterFields,
  mergeDunningEmailFooterFields,
  toReadModel,
  validateDunningEmailFooterFields,
  type DunningEmailFooterFields,
  type DunningEmailFooterReadData,
} from "../domain/dunning-email-footer.js";
import type { AuditEvent, TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { DunningEmailFooterPersistencePort } from "../persistence/dunning-email-footer-persistence.js";
import { AuditService } from "./audit-service.js";

export type PatchDunningEmailFooterInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  reason: string;
  patch: Partial<DunningEmailFooterFields>;
};

export class DunningEmailFooterService {
  constructor(
    private readonly footerPersistence: DunningEmailFooterPersistencePort,
    private readonly audit: AuditService,
    private readonly prisma: PrismaClient | null,
  ) {}

  public async getReadModel(tenantId: string): Promise<DunningEmailFooterReadData> {
    const row = await this.footerPersistence.findByTenant(tenantId);
    if (!row) {
      return toReadModel(tenantId, "NOT_CONFIGURED", emptyDunningEmailFooterFields());
    }
    return toReadModel(tenantId, "TENANT_DATABASE", row);
  }

  private assertDbWritable(): void {
    const upsert = this.footerPersistence.upsertFooterInTx;
    if (!this.prisma || !upsert) {
      throw new DomainError(
        "DUNNING_EMAIL_FOOTER_NOT_PERSISTABLE",
        "E-Mail-Footer-Stammdaten sind nur mit Datenbank-Persistenz schreibbar (nicht im In-Memory-Modus).",
        503,
      );
    }
  }

  public async patchTenantFooter(input: PatchDunningEmailFooterInput): Promise<DunningEmailFooterReadData> {
    this.assertDbWritable();
    const upsertInTx = this.footerPersistence.upsertFooterInTx!;

    const existing = await this.footerPersistence.findByTenant(input.tenantId);
    const base = existing ?? emptyDunningEmailFooterFields();
    const merged = mergeDunningEmailFooterFields(base, input.patch);
    validateDunningEmailFooterFields(merged);

    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "DUNNING_TENANT_STAGE_CONFIG",
      entityId: input.tenantId,
      action: "DUNNING_EMAIL_FOOTER_PATCHED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {},
      afterState: {},
    };

    await this.prisma!.$transaction(async (tx) => {
      const { hadRow, previous } = await upsertInTx(tx, input.tenantId, merged);
      auditEvent.beforeState = {
        footerSource: hadRow ? "TENANT_DATABASE" : "NOT_CONFIGURED",
        ...previous,
      };
      auditEvent.afterState = {
        footerSource: "TENANT_DATABASE",
        ...merged,
      };
      await this.audit.appendAuditEventTx(tx, auditEvent);
    });
    this.audit.appendInMemoryOnly(auditEvent);

    return this.getReadModel(input.tenantId);
  }
}
